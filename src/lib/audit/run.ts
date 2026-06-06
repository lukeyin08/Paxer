import { and, eq, inArray, isNull, ne } from 'drizzle-orm';
import { db } from '@/lib/db';
import { cases, findings, lineItems, planBenefits, benchmarks, users } from '@/lib/db/schema';
import { runRuleDetectors } from './detectors';
import type { AuditContext, DetectorFinding } from './types';
import { runAiAuditPass } from '@/lib/ai/audit';
import { aiConfigured } from '@/lib/ai/client';
import { writeAuditLog } from '@/lib/audit-log';

export interface AuditOutcome {
  findingCount: number;
  estimatedRecoverable: number;
  usedAi: boolean;
}

/**
 * Run the full audit for a case (Section 7.6): deterministic detectors first,
 * then an optional AI explanation/upcoding pass, then persist findings and roll
 * up the estimated recoverable. Ownership is enforced. Re-running replaces OPEN
 * findings but leaves user-actioned ones (DISMISSED / DISPUTING / RECOVERED).
 */
export async function runAudit(userId: string, caseId: string): Promise<AuditOutcome> {
  const [caseRow] = await db
    .select()
    .from(cases)
    .where(and(eq(cases.id, caseId), eq(cases.userId, userId), isNull(cases.deletedAt)))
    .limit(1);
  if (!caseRow) throw new Error('Case not found.');

  const [items, [plan], [user]] = await Promise.all([
    db.select().from(lineItems).where(and(eq(lineItems.caseId, caseId), isNull(lineItems.deletedAt))),
    db.select().from(planBenefits).where(eq(planBenefits.caseId, caseId)).limit(1),
    db.select().from(users).where(eq(users.id, userId)).limit(1),
  ]);

  if (items.length === 0) {
    throw new Error('No line items to audit. Add or extract line items first.');
  }

  const region = user?.state ?? null;

  // Benchmarks for the region (fall back to national 'US').
  const allBench = await db.select().from(benchmarks);
  const bench = allBench.filter((b) => b.region === region || b.region === 'US');

  // Cross-provider: other non-deleted line items belonging to the user's other cases.
  const userCases = await db
    .select({ id: cases.id, provider: cases.providerName })
    .from(cases)
    .where(and(eq(cases.userId, userId), isNull(cases.deletedAt), ne(cases.id, caseId)));
  const otherCaseLineItems: AuditContext['otherCaseLineItems'] = [];
  if (userCases.length > 0) {
    const otherItems = await db
      .select()
      .from(lineItems)
      .where(
        and(
          inArray(
            lineItems.caseId,
            userCases.map((c) => c.id),
          ),
          isNull(lineItems.deletedAt),
        ),
      );
    const providerByCase = new Map(userCases.map((c) => [c.id, c.provider]));
    for (const li of otherItems) {
      otherCaseLineItems.push({
        lineItem: li,
        caseId: li.caseId,
        providerName: providerByCase.get(li.caseId) ?? null,
      });
    }
  }

  const ctx: AuditContext = {
    case: caseRow,
    lineItems: items,
    planBenefits: plan ?? null,
    otherCaseLineItems,
    benchmarks: bench,
    region,
  };

  let detectorFindings: DetectorFinding[] = runRuleDetectors(ctx);
  let modelId: string | null = null;
  let promptVersion: string | null = null;
  let usedAi = false;

  if (aiConfigured()) {
    try {
      const ai = await runAiAuditPass({ lineItems: items, ruleFindings: detectorFindings });
      detectorFindings = ai.findings;
      modelId = ai.modelId;
      promptVersion = ai.promptVersion;
      usedAi = true;
    } catch (err) {
      // AI is enhancement; deterministic findings stand on their own (Section 4).
      console.error('[audit] AI pass failed, using rule findings only:', err);
    }
  }

  // Replace prior OPEN findings; keep user-actioned ones.
  await db
    .delete(findings)
    .where(and(eq(findings.caseId, caseId), eq(findings.status, 'OPEN')));

  if (detectorFindings.length > 0) {
    await db.insert(findings).values(
      detectorFindings.map((f) => ({
        caseId,
        lineItemId: f.lineItemId,
        type: f.type,
        severity: f.severity,
        title: f.title,
        explanationPlain: f.explanationPlain,
        evidenceJson: {
          ...f.evidence,
          recommendedNextStep: f.recommendedNextStep ?? null,
        },
        estimatedRecovery: f.estimatedRecovery === null ? null : f.estimatedRecovery.toFixed(2),
        confidence: f.confidence,
        detector: f.detector,
        status: 'OPEN' as const,
        modelId: f.detector === 'RULE' ? null : modelId,
        promptVersion: f.detector === 'RULE' ? null : promptVersion,
      })),
    );
  }

  // Roll up estimated recoverable from all OPEN findings, capped at what the
  // patient was actually charged. Multiple findings can flag the same dollars
  // (e.g. a cost-share error and a surprise bill on one line); summing them
  // unchecked would overstate recovery, which the honesty rules forbid (Section 9).
  const openFindings = await db
    .select()
    .from(findings)
    .where(and(eq(findings.caseId, caseId), eq(findings.status, 'OPEN')));
  const rawSum = openFindings.reduce((s, f) => s + Number(f.estimatedRecovery ?? 0), 0);
  const totalPatient = items.reduce((s, li) => s + (Number(li.patientResponsibility) || 0), 0);
  const totalBilled = items.reduce((s, li) => s + (Number(li.chargeAmount) || 0), 0);
  const cap = totalPatient > 0 ? totalPatient : totalBilled;
  const estimatedRecoverable = cap > 0 ? Math.min(rawSum, cap) : rawSum;

  await db
    .update(cases)
    .set({
      status: 'AUDITED',
      estimatedRecoverable: estimatedRecoverable.toFixed(2),
      updatedAt: new Date(),
    })
    .where(eq(cases.id, caseId));

  await writeAuditLog({
    userId,
    entity: 'case',
    entityId: caseId,
    action: 'case.audited',
    diff: { findingCount: detectorFindings.length, estimatedRecoverable, usedAi },
  });

  return { findingCount: detectorFindings.length, estimatedRecoverable, usedAi };
}
