import { config } from 'dotenv';
import { and, eq, inArray, isNull } from 'drizzle-orm';

config({ path: '.env' });

import { db } from './index';
import { users, cases, benchmarks, findings, disputes } from './schema';
import { hashPassword } from '@/lib/auth/password';
import { DEMO_EMAIL, DEMO_NAME, DEMO_PASSWORD } from '@/lib/auth/demo';
import { SCENARIOS } from '@/lib/synthetic/scenarios';
import { BENCHMARK_SEEDS, BENCHMARK_REGION } from '@/lib/synthetic/benchmarks';
import {
  createCase,
  addDocument,
  addLineItems,
  upsertPlanBenefits,
  recomputeCaseTotals,
  recomputeEstimatedRecoverable,
} from '@/lib/cases/repo';
import { runAudit } from '@/lib/audit/run';
import { generateDraft } from '@/lib/disputes/generate';
import { createDispute, addDisputeEvent } from '@/lib/disputes/repo';
import { recordRecovery } from '@/lib/recoveries/repo';

const RESET = process.argv.includes('--reset');

async function seedDemoUser(): Promise<string> {
  const passwordHash = await hashPassword(DEMO_PASSWORD);
  const [existing] = await db.select().from(users).where(eq(users.email, DEMO_EMAIL)).limit(1);
  if (existing) {
    await db
      .update(users)
      .set({
        name: DEMO_NAME,
        passwordHash,
        state: existing.state ?? BENCHMARK_REGION,
        consentAt: existing.consentAt ?? new Date(),
        deletedAt: null,
      })
      .where(eq(users.id, existing.id));
    console.log(`✓ Demo user updated: ${DEMO_EMAIL}`);
    return existing.id;
  }
  const [created] = await db
    .insert(users)
    .values({
      email: DEMO_EMAIL,
      name: DEMO_NAME,
      role: 'PATIENT',
      state: BENCHMARK_REGION,
      passwordHash,
      consentAt: new Date(),
      emailVerified: new Date(),
    })
    .returning();
  console.log(`✓ Demo user created: ${DEMO_EMAIL}`);
  return created!.id;
}

async function seedBenchmarks(): Promise<void> {
  // Idempotent: clear ALL rows for the region (SEED and any AGGREGATE produced
  // by an earlier recompute), then reinsert the SEED baseline.
  await db.delete(benchmarks).where(eq(benchmarks.region, BENCHMARK_REGION));
  await db.insert(benchmarks).values(
    BENCHMARK_SEEDS.map((b) => ({
      cptHcpcsCode: b.code,
      region: BENCHMARK_REGION,
      sampleSize: b.sampleSize,
      medianCharge: b.median.toFixed(2),
      p25: b.p25.toFixed(2),
      p75: b.p75.toFixed(2),
      source: 'SEED' as const,
    })),
  );
  console.log(`✓ Seeded ${BENCHMARK_SEEDS.length} benchmarks (region ${BENCHMARK_REGION})`);
}

async function seedScenarioCases(userId: string): Promise<void> {
  for (const scenario of SCENARIOS) {
    const created = await createCase({
      userId,
      title: scenario.title,
      providerName: scenario.providerName,
      payerName: scenario.payerName,
      dateOfService: scenario.dateOfService,
      status: 'AUDITED',
      notes: 'Synthetic demo case.',
    });
    for (const doc of scenario.documents) {
      const document = await addDocument({
        caseId: created.id,
        kind: doc.kind,
        fileName: doc.fileName,
        ingestStatus: 'DONE',
      });
      await addLineItems(created.id, doc.lineItems, document.id);
    }
    await upsertPlanBenefits(created.id, scenario.planBenefits);
    await recomputeCaseTotals(created.id);
    const outcome = await runAudit(userId, created.id);
    console.log(
      `✓ Case "${scenario.title}" — ${outcome.findingCount} findings, ~$${outcome.estimatedRecoverable.toFixed(0)} est. recoverable`,
    );
  }
}

/**
 * Pre-generate disputes + a recovery so the deployed demo is immediately rich
 * (Section 10): one DRAFT, one SIMULATED_SENT (with a live deadline), and one
 * WON dispute with a recorded recovery.
 */
async function seedDisputes(userId: string): Promise<void> {
  const all = await db.select().from(cases).where(eq(cases.userId, userId));
  const pick = (s: string) => all.find((c) => c.title.includes(s));
  const openFindings = (caseId: string) =>
    db
      .select()
      .from(findings)
      .where(and(eq(findings.caseId, caseId), eq(findings.status, 'OPEN')));

  // 1) DRAFT dispute on the ER duplicate/unbundling case.
  const er = pick('Emergency room');
  if (er) {
    const f = (await openFindings(er.id))
      .filter((x) => x.type === 'DUPLICATE_CHARGE' || x.type === 'UNBUNDLING_NCCI')
      .slice(0, 2);
    if (f.length) {
      const draft = await generateDraft({ userId, caseId: er.id, findingIds: f.map((x) => x.id) });
      await createDispute({
        caseId: er.id,
        findingIds: draft.findingIds,
        target: draft.target,
        letterHtml: draft.letterHtml,
        modelId: draft.modelId,
        promptVersion: draft.promptVersion,
      });
      console.log('✓ Draft dispute created (ER case)');
    }
  }

  // 2) SIMULATED_SENT dispute with a live deadline on the cost-share case.
  const mri = pick('MRI');
  if (mri) {
    const f = (await openFindings(mri.id)).filter((x) => x.type === 'COST_SHARE_ERROR');
    if (f.length) {
      const draft = await generateDraft({ userId, caseId: mri.id, findingIds: f.map((x) => x.id) });
      const d = await createDispute({
        caseId: mri.id,
        findingIds: draft.findingIds,
        target: draft.target,
        letterHtml: draft.letterHtml,
        modelId: draft.modelId,
        promptVersion: draft.promptVersion,
      });
      const deadline = new Date();
      deadline.setDate(deadline.getDate() + 20);
      await db.update(disputes).set({ status: 'SIMULATED_SENT', deadlineAt: deadline }).where(eq(disputes.id, d.id));
      await addDisputeEvent(d.id, 'APPROVED');
      await addDisputeEvent(d.id, 'SIMULATED_SENT', { simulated: true, deadlineAt: deadline });
      console.log('✓ Simulated-sent dispute created (MRI case, deadline in 20 days)');
    }
  }

  // 3) WON dispute + recorded recovery on the denial case.
  const denial = pick('denied');
  if (denial) {
    const f = await openFindings(denial.id);
    if (f.length) {
      const draft = await generateDraft({ userId, caseId: denial.id, findingIds: f.map((x) => x.id) });
      const d = await createDispute({
        caseId: denial.id,
        findingIds: draft.findingIds,
        target: draft.target,
        letterHtml: draft.letterHtml,
        modelId: draft.modelId,
        promptVersion: draft.promptVersion,
      });
      await db.update(disputes).set({ status: 'WON' }).where(eq(disputes.id, d.id));
      await addDisputeEvent(d.id, 'SIMULATED_SENT', { simulated: true });
      await addDisputeEvent(d.id, 'RESPONSE_LOGGED', { outcome: 'WON' });
      // Resolve findings + case the way logResponseAction(WON) would — the seed
      // sets the dispute status directly, so it must mirror that resolution to
      // avoid leaving findings DISPUTING / the case IN_DISPUTE.
      await db
        .update(findings)
        .set({ status: 'RECOVERED' })
        .where(and(eq(findings.caseId, denial.id), inArray(findings.id, draft.findingIds)));
      const amount = Number(f[0]!.estimatedRecovery ?? 0) || 540;
      await recordRecovery({
        userId,
        caseId: denial.id,
        disputeId: d.id,
        amount,
        kind: 'CLAIM_PAID',
        notes: 'Appeal approved on first level (synthetic).',
      });
      await recomputeEstimatedRecoverable(denial.id);
      const stillInPlay = await db
        .select({ id: findings.id })
        .from(findings)
        .where(
          and(
            eq(findings.caseId, denial.id),
            inArray(findings.status, ['OPEN', 'DISPUTING']),
            isNull(findings.deletedAt),
          ),
        );
      if (stillInPlay.length === 0) {
        await db.update(cases).set({ status: 'RESOLVED' }).where(eq(cases.id, denial.id));
      }
      console.log(`✓ Won dispute + recovery recorded ($${amount})`);
    }
  }
}

async function seed() {
  if (RESET && process.env.NODE_ENV === 'production') {
    throw new Error('seed:reset is disabled in production.');
  }

  const userId = await seedDemoUser();
  await seedBenchmarks();

  const existingCases = await db.select({ id: cases.id }).from(cases).where(eq(cases.userId, userId));
  if (RESET && existingCases.length > 0) {
    await db.delete(cases).where(eq(cases.userId, userId));
    console.log(`✓ Reset: cleared ${existingCases.length} existing case(s)`);
  }
  const fresh = await db.select({ id: cases.id }).from(cases).where(eq(cases.userId, userId));
  if (fresh.length === 0) {
    await seedScenarioCases(userId);
    await seedDisputes(userId);
  } else {
    console.log(`• Demo already has ${fresh.length} case(s); skipping (use --reset to rebuild).`);
  }

  console.log(`\nDemo login: ${DEMO_EMAIL} / ${DEMO_PASSWORD}`);
  console.log('Seed complete.');
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
