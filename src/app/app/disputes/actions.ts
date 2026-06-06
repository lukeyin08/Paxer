'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { and, eq, inArray } from 'drizzle-orm';
import { db } from '@/lib/db';
import { cases, disputes, findings } from '@/lib/db/schema';
import { requireUser } from '@/lib/auth/session';
import { generateDraft } from '@/lib/disputes/generate';
import { sanitizeLetterHtml } from '@/lib/disputes/sanitize';
import { createDispute, getDisputeForUser, addDisputeEvent } from '@/lib/disputes/repo';
import { recomputeEstimatedRecoverable } from '@/lib/cases/repo';
import { writeAuditLog } from '@/lib/audit-log';
import type { Dispute } from '@/lib/db/schema';

const RESPONSE_WINDOW_DAYS = 30;

/** Generate a draft for selected findings and create the dispute, then open it. */
export async function generateDisputeAction(input: {
  caseId: string;
  findingIds: string[];
  target?: Dispute['target'];
}): Promise<{ ok: false; error: string } | never> {
  const user = await requireUser();
  let disputeId: string;
  try {
    const draft = await generateDraft({
      userId: user.id,
      caseId: input.caseId,
      findingIds: input.findingIds,
      target: input.target,
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
  await authorize(user.id, disputeId);
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
  await authorize(user.id, disputeId);
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

/** Simulated send — NEVER contacts a real party (Section 2, Section 9). */
export async function simulatedSendAction(disputeId: string): Promise<{ ok: boolean }> {
  const user = await requireUser();
  await authorize(user.id, disputeId);
  const deadline = new Date();
  deadline.setDate(deadline.getDate() + RESPONSE_WINDOW_DAYS);
  await db
    .update(disputes)
    .set({ status: 'SIMULATED_SENT', deadlineAt: deadline, updatedAt: new Date() })
    .where(eq(disputes.id, disputeId));
  await addDisputeEvent(disputeId, 'SIMULATED_SENT', { simulated: true, deadlineAt: deadline });
  await writeAuditLog({
    userId: user.id,
    entity: 'dispute',
    entityId: disputeId,
    action: 'dispute.simulated_sent',
  });
  revalidatePath(`/app/disputes/${disputeId}`);
  return { ok: true };
}

const RESPONSE_LOGGABLE = new Set<Dispute['status']>(['SIMULATED_SENT', 'RESPONSE_RECEIVED']);

export async function logResponseAction(
  disputeId: string,
  outcome: 'WON' | 'PARTIAL' | 'DENIED',
): Promise<{ ok: boolean }> {
  const user = await requireUser();
  const dispute = await authorize(user.id, disputeId);
  // Guard: only a sent/received dispute can have a response logged.
  if (!RESPONSE_LOGGABLE.has(dispute.status)) return { ok: false };

  await db
    .update(disputes)
    .set({ status: outcome, updatedAt: new Date() })
    .where(eq(disputes.id, disputeId));
  await addDisputeEvent(disputeId, 'RESPONSE_LOGGED', { outcome });

  // A denial returns the findings to OPEN so they re-enter the recoverable total
  // and can be re-disputed, dismissed, or escalated — they must not stay stuck
  // in DISPUTING forever.
  if (outcome === 'DENIED' && dispute.findingIds.length > 0) {
    await db
      .update(findings)
      .set({ status: 'OPEN' })
      .where(
        and(
          eq(findings.caseId, dispute.caseId),
          inArray(findings.id, dispute.findingIds),
          eq(findings.status, 'DISPUTING'),
        ),
      );
    // The case has actionable findings again.
    await db
      .update(cases)
      .set({ status: 'AUDITED', updatedAt: new Date() })
      .where(and(eq(cases.id, dispute.caseId), eq(cases.status, 'IN_DISPUTE')));
    await recomputeEstimatedRecoverable(dispute.caseId);
  }

  revalidatePath(`/app/disputes/${disputeId}`);
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
