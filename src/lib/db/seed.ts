import { config } from 'dotenv';
import { and, eq } from 'drizzle-orm';

config({ path: '.env' });

import { db } from './index';
import { users, cases, benchmarks } from './schema';
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
} from '@/lib/cases/repo';
import { runAudit } from '@/lib/audit/run';

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
  // Idempotent: clear seeded rows for the region, then reinsert.
  await db
    .delete(benchmarks)
    .where(and(eq(benchmarks.region, BENCHMARK_REGION), eq(benchmarks.source, 'SEED')));
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
