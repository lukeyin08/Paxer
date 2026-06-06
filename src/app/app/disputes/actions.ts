'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { disputes } from '@/lib/db/schema';
import { requireUser } from '@/lib/auth/session';
import { generateDraft } from '@/lib/disputes/generate';
import { createDispute, getDisputeForUser, addDisputeEvent } from '@/lib/disputes/repo';
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
  await db.update(disputes).set({ letterHtml, updatedAt: new Date() }).where(eq(disputes.id, disputeId));
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

export async function logResponseAction(
  disputeId: string,
  outcome: 'WON' | 'PARTIAL' | 'DENIED',
): Promise<{ ok: boolean }> {
  const user = await requireUser();
  await authorize(user.id, disputeId);
  await db
    .update(disputes)
    .set({ status: outcome, updatedAt: new Date() })
    .where(eq(disputes.id, disputeId));
  await addDisputeEvent(disputeId, 'RESPONSE_LOGGED', { outcome });
  revalidatePath(`/app/disputes/${disputeId}`);
  return { ok: true };
}

export async function escalateDisputeAction(disputeId: string): Promise<{ ok: boolean }> {
  const user = await requireUser();
  await authorize(user.id, disputeId);
  await db
    .update(disputes)
    .set({ status: 'ESCALATED', updatedAt: new Date() })
    .where(eq(disputes.id, disputeId));
  await addDisputeEvent(disputeId, 'ESCALATED');
  revalidatePath(`/app/disputes/${disputeId}`);
  return { ok: true };
}
