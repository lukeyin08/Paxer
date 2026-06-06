'use server';

import { revalidatePath } from 'next/cache';
import { and, eq } from 'drizzle-orm';
import { isNull } from 'drizzle-orm';
import { db } from '@/lib/db';
import { cases, findings, lineItems } from '@/lib/db/schema';
import { requireUser } from '@/lib/auth/session';
import { runAudit } from '@/lib/audit/run';
import { writeAuditLog } from '@/lib/audit-log';

/** Run (or re-run) the audit engine on a case. */
export async function runAuditAction(
  caseId: string,
): Promise<{ ok: boolean; message: string }> {
  const user = await requireUser();
  try {
    const result = await runAudit(user.id, caseId);
    revalidatePath(`/app/cases/${caseId}`);
    return {
      ok: true,
      message: `Audit complete: ${result.findingCount} finding(s)${result.usedAi ? '' : ' (rules only — set ANTHROPIC_API_KEY for AI explanations)'}.`,
    };
  } catch (err) {
    return { ok: false, message: err instanceof Error ? err.message : 'Audit failed.' };
  }
}

/** Recompute a case's estimated recoverable from OPEN findings, capped at charges. */
async function recomputeEstimated(caseId: string) {
  const open = await db
    .select({ amt: findings.estimatedRecovery })
    .from(findings)
    .where(and(eq(findings.caseId, caseId), eq(findings.status, 'OPEN')));
  const items = await db
    .select({ pr: lineItems.patientResponsibility, charge: lineItems.chargeAmount })
    .from(lineItems)
    .where(and(eq(lineItems.caseId, caseId), isNull(lineItems.deletedAt)));
  const rawSum = open.reduce((s, f) => s + Number(f.amt ?? 0), 0);
  const totalPatient = items.reduce((s, i) => s + (Number(i.pr) || 0), 0);
  const totalBilled = items.reduce((s, i) => s + (Number(i.charge) || 0), 0);
  const cap = totalPatient > 0 ? totalPatient : totalBilled;
  const total = cap > 0 ? Math.min(rawSum, cap) : rawSum;
  await db.update(cases).set({ estimatedRecoverable: total.toFixed(2) }).where(eq(cases.id, caseId));
}

/** Dismiss a finding (user decided it isn't worth pursuing). */
export async function dismissFindingAction(findingId: string): Promise<{ ok: boolean }> {
  const user = await requireUser();
  const [f] = await db.select().from(findings).where(eq(findings.id, findingId)).limit(1);
  if (!f) return { ok: false };
  const [caseRow] = await db
    .select()
    .from(cases)
    .where(and(eq(cases.id, f.caseId), eq(cases.userId, user.id)))
    .limit(1);
  if (!caseRow) return { ok: false };

  await db.update(findings).set({ status: 'DISMISSED' }).where(eq(findings.id, findingId));
  await recomputeEstimated(f.caseId);
  await writeAuditLog({
    userId: user.id,
    entity: 'finding',
    entityId: findingId,
    action: 'finding.dismissed',
  });
  revalidatePath(`/app/cases/${f.caseId}`);
  return { ok: true };
}
