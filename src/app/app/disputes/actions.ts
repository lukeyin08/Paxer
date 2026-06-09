'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { and, eq, inArray, isNull } from 'drizzle-orm';
import { db } from '@/lib/db';
import { cases, disputes, findings } from '@/lib/db/schema';
import { requireUser } from '@/lib/auth/session';
import { generateDraft } from '@/lib/disputes/generate';
import { getConsumerEntitlement } from '@/lib/billing/consumer';
import { sanitizeLetterHtml } from '@/lib/disputes/sanitize';
import { createDispute, getDisputeForUser, addDisputeEvent } from '@/lib/disputes/repo';
import { recomputeEstimatedRecoverable } from '@/lib/cases/repo';
import { writeAuditLog } from '@/lib/audit-log';
import type { LetterDetailsInput } from '@/lib/disputes/letter-context';
import type { Dispute } from '@/lib/db/schema';

// Fields that must be present for a finished, placeholder-free letter. The rest
// (recipient mailing address, member ID, claim number) are optional and simply
// omitted from the letter when blank.
const REQUIRED_DETAILS: (keyof LetterDetailsInput)[] = [
  'senderName',
  'senderAddress',
  'senderCityStateZip',
  'senderPhone',
  'senderEmail',
  'recipientName',
];

const RESPONSE_WINDOW_DAYS = 30;

/** Generate a draft for selected findings and create the dispute, then open it. */
export async function generateDisputeAction(input: {
  caseId: string;
  findingIds: string[];
  target?: Dispute['target'];
  details?: LetterDetailsInput;
}): Promise<{ ok: false; error: string; code?: 'subscription_required' } | never> {
  const user = await requireUser();
  // Paywall: generating a dispute draft requires Paxer Plus (the first audit is
  // free; further audits are gated separately in runAuditAction). Enforced here,
  // server-side, before any AI spend. The demo account bypasses.
  const entitlement = await getConsumerEntitlement(user.id);
  if (!entitlement.canGenerateDraft) {
    return {
      ok: false,
      code: 'subscription_required',
      error: 'A Paxer Plus subscription is required to generate dispute letters.',
    };
  }
  // Validate the supplied details server-side (the action is a public endpoint).
  if (input.details) {
    const missing = REQUIRED_DETAILS.filter((k) => !input.details![k]?.trim());
    if (missing.length > 0) {
      return { ok: false, error: 'Please complete your contact details and the recipient name.' };
    }
  }
  let disputeId: string;
  try {
    const draft = await generateDraft({
      userId: user.id,
      caseId: input.caseId,
      findingIds: input.findingIds,
      target: input.target,
      details: input.details ?? null,
    });
    const dispute = await createDispute({
      caseId: input.caseId,
      findingIds: draft.findingIds,
      target: draft.target,
      letterHtml: draft.letterHtml,
      modelId: draft.modelId,
      promptVersion: draft.promptVersion,
    });
    disputeId = dispute.id;
    await writeAuditLog({
      userId: user.id,
      entity: 'dispute',
      entityId: dispute.id,
      action: 'dispute.created',
      diff: { target: draft.target, findings: draft.findingIds.length, modelId: draft.modelId },
    });
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Could not generate draft.' };
  }
  redirect(`/app/disputes/${disputeId}`);
}

async function authorize(userId: string, disputeId: string) {
  const detail = await getDisputeForUser(userId, disputeId);
  if (!detail) throw new Error('Dispute not found.');
  return detail.dispute;
}

export async function saveLetterAction(
  disputeId: string,
  letterHtml: string,
): Promise<{ ok: boolean }> {
  const user = await requireUser();
  const dispute = await authorize(user.id, disputeId);
  // The letter is only editable before it's approved/sent. Guard the action
  // itself (not just the UI) — server actions are public POST endpoints.
  if (dispute.status !== 'DRAFT') return { ok: false };
  const clean = sanitizeLetterHtml(letterHtml);
  await db
    .update(disputes)
    .set({ letterHtml: clean, updatedAt: new Date() })
    .where(eq(disputes.id, disputeId));
  await addDisputeEvent(disputeId, 'EDITED');
  revalidatePath(`/app/disputes/${disputeId}`);
  return { ok: true };
}

export async function approveDisputeAction(disputeId: string): Promise<{ ok: boolean }> {
  const user = await requireUser();
  const dispute = await authorize(user.id, disputeId);
  // Approval only moves a DRAFT forward — never resurrects a sent/resolved one.
  if (dispute.status !== 'DRAFT') return { ok: false };
  await db
    .update(disputes)
    .set({ status: 'AWAITING_USER_APPROVAL', updatedAt: new Date() })
    .where(eq(disputes.id, disputeId));
  await addDisputeEvent(disputeId, 'APPROVED');
  revalidatePath(`/app/disputes/${disputeId}`);
  return { ok: true };
}

/** Return an awaiting-approval dispute to DRAFT so the letter is editable again. */
export async function reopenDraftAction(disputeId: string): Promise<{ ok: boolean }> {
  const user = await requireUser();
  const dispute = await authorize(user.id, disputeId);
  // Only meaningful before a (simulated) send.
  if (dispute.status !== 'AWAITING_USER_APPROVAL' && dispute.status !== 'DRAFT') {
    return { ok: false };
  }
  await db
    .update(disputes)
    .set({ status: 'DRAFT', updatedAt: new Date() })
    .where(eq(disputes.id, disputeId));
  await addDisputeEvent(disputeId, 'EDITED', { reopened: true });
  revalidatePath(`/app/disputes/${disputeId}`);
  return { ok: true };
}

/**
 * Mark a dispute as sent by the patient. Paxer does not transmit the letter on
 * the patient's behalf in v1 — the patient downloads the PDF and sends it to
 * their provider/insurer, then records it here so we can track the response
 * deadline. (The SIMULATED_SENT status value is retained internally to mean
 * "sent, awaiting response".)
 */
export async function markAsSentAction(disputeId: string): Promise<{ ok: boolean }> {
  const user = await requireUser();
  const dispute = await authorize(user.id, disputeId);
  // Can only be sent from the approved state — prevents re-arming the response
  // deadline / reminder cron on an already-sent or resolved dispute.
  if (dispute.status !== 'AWAITING_USER_APPROVAL') return { ok: false };
  const deadline = new Date();
  deadline.setDate(deadline.getDate() + RESPONSE_WINDOW_DAYS);
  await db
    .update(disputes)
    .set({ status: 'SIMULATED_SENT', deadlineAt: deadline, updatedAt: new Date() })
    .where(eq(disputes.id, disputeId));
  await addDisputeEvent(disputeId, 'SIMULATED_SENT', { sentByPatient: true, deadlineAt: deadline });
  await writeAuditLog({
    userId: user.id,
    entity: 'dispute',
    entityId: disputeId,
    action: 'dispute.marked_sent',
  });
  revalidatePath(`/app/disputes/${disputeId}`);
  return { ok: true };
}

const RESPONSE_LOGGABLE = new Set<Dispute['status']>(['SIMULATED_SENT', 'RESPONSE_RECEIVED']);

export async function logResponseAction(
  disputeId: string,
  outcome: 'WON' | 'PARTIAL' | 'DENIED',
  recoveredFindingIds?: string[],
): Promise<{ ok: boolean }> {
  const user = await requireUser();
  const dispute = await authorize(user.id, disputeId);
  // Guard: only a sent/received dispute can have a response logged.
  if (!RESPONSE_LOGGABLE.has(dispute.status)) return { ok: false };

  // Resolve each finding's status at response time (not at recovery time), so a
  // dispute never leaves its findings stuck in DISPUTING:
  //   WON      → all findings RECOVERED
  //   PARTIAL  → the selected findings RECOVERED, the rest back to OPEN
  //   DENIED   → all findings back to OPEN (re-disputable / dismissable)
  const all = dispute.findingIds;
  const selected = new Set(recoveredFindingIds ?? []);
  const recoveredIds =
    outcome === 'WON' ? all : outcome === 'PARTIAL' ? all.filter((id) => selected.has(id)) : [];
  const reopenedIds = all.filter((id) => !recoveredIds.includes(id));

  // Resolve findings AND reconcile case status in a single transaction so the
  // dispute outcome, finding statuses, and case status can never commit out of
  // sync (a crash mid-way would otherwise strand the case in IN_DISPUTE).
  await db.transaction(async (tx) => {
    await tx
      .update(disputes)
      .set({ status: outcome, updatedAt: new Date() })
      .where(eq(disputes.id, disputeId));
    if (recoveredIds.length > 0) {
      // Scope to DISPUTING so we don't clobber a finding another live dispute
      // already resolved (a finding can be attached to more than one dispute).
      await tx
        .update(findings)
        .set({ status: 'RECOVERED' })
        .where(
          and(
            eq(findings.caseId, dispute.caseId),
            inArray(findings.id, recoveredIds),
            eq(findings.status, 'DISPUTING'),
          ),
        );
    }
    if (reopenedIds.length > 0) {
      await tx
        .update(findings)
        .set({ status: 'OPEN' })
        .where(
          and(
            eq(findings.caseId, dispute.caseId),
            inArray(findings.id, reopenedIds),
            eq(findings.status, 'DISPUTING'),
          ),
        );
    }

    // Reconcile the case: RESOLVED when nothing is OPEN/DISPUTING anymore,
    // otherwise return an IN_DISPUTE case to AUDITED (actionable findings again).
    const remaining = await tx
      .select({ id: findings.id })
      .from(findings)
      .where(
        and(
          eq(findings.caseId, dispute.caseId),
          inArray(findings.status, ['OPEN', 'DISPUTING']),
          isNull(findings.deletedAt),
        ),
      );
    if (remaining.length === 0) {
      await tx
        .update(cases)
        .set({ status: 'RESOLVED', updatedAt: new Date() })
        .where(eq(cases.id, dispute.caseId));
    } else {
      await tx
        .update(cases)
        .set({ status: 'AUDITED', updatedAt: new Date() })
        .where(and(eq(cases.id, dispute.caseId), eq(cases.status, 'IN_DISPUTE')));
    }
  });

  await addDisputeEvent(disputeId, 'RESPONSE_LOGGED', { outcome, recovered: recoveredIds.length });
  // Idempotent — safe to run after the transaction; any later recompute is correct.
  await recomputeEstimatedRecoverable(dispute.caseId);

  revalidatePath(`/app/disputes/${disputeId}`);
  revalidatePath(`/app/cases/${dispute.caseId}`);
  return { ok: true };
}

const ESCALATABLE = new Set<Dispute['status']>(['SIMULATED_SENT', 'RESPONSE_RECEIVED', 'DENIED']);

export async function escalateDisputeAction(disputeId: string): Promise<{ ok: boolean }> {
  const user = await requireUser();
  const dispute = await authorize(user.id, disputeId);
  if (!ESCALATABLE.has(dispute.status)) return { ok: false };
  await db
    .update(disputes)
    .set({ status: 'ESCALATED', updatedAt: new Date() })
    .where(eq(disputes.id, disputeId));
  await addDisputeEvent(disputeId, 'ESCALATED');
  revalidatePath(`/app/disputes/${disputeId}`);
  return { ok: true };
}
