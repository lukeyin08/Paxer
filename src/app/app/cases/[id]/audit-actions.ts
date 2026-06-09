'use server';

import { revalidatePath } from 'next/cache';
import { and, eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { cases, findings } from '@/lib/db/schema';
import { requireUser } from '@/lib/auth/session';
import { runAudit } from '@/lib/audit/run';
import { getAuditEntitlement } from '@/lib/billing/consumer';
import { recomputeEstimatedRecoverable } from '@/lib/cases/repo';
import { writeAuditLog } from '@/lib/audit-log';

/** Run (or re-run) the audit engine on a case. */
export async function runAuditAction(
  caseId: string,
): Promise<{ ok: boolean; message: string; code?: 'subscription_required' }> {
  const user = await requireUser();
  // Free tier gets 1 free audit; auditing additional cases requires Paxer Plus
  // (re-running an already-audited case is free; demo bypasses). Enforced
  // server-side before any AI spend.
  const entitlement = await getAuditEntitlement(user.id, caseId);
  if (!entitlement.canAudit) {
    return {
      ok: false,
      code: 'subscription_required',
      message: 'You’ve used your free audit — subscribe to Paxer Plus for unlimited audits.',
    };
  }
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

/** Dismiss a finding (user decided it isn't worth pursuing). Only OPEN findings
 * can be dismissed — a finding already in a dispute must be resolved through the
 * dispute, not silently dropped out from under it. */
export async function dismissFindingAction(findingId: string): Promise<{ ok: boolean }> {
  const user = await requireUser();
  const [f] = await db.select().from(findings).where(eq(findings.id, findingId)).limit(1);
  if (!f) return { ok: false };
  if (f.status !== 'OPEN') return { ok: false };
  const [caseRow] = await db
    .select()
    .from(cases)
    .where(and(eq(cases.id, f.caseId), eq(cases.userId, user.id)))
    .limit(1);
  if (!caseRow) return { ok: false };

  await db.update(findings).set({ status: 'DISMISSED' }).where(eq(findings.id, findingId));
  await recomputeEstimatedRecoverable(f.caseId);
  await writeAuditLog({
    userId: user.id,
    entity: 'finding',
    entityId: findingId,
    action: 'finding.dismissed',
  });
  revalidatePath(`/app/cases/${f.caseId}`);
  return { ok: true };
}
