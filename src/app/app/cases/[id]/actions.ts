'use server';

import { revalidatePath } from 'next/cache';
import { and, eq, isNull } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/lib/db';
import { cases, documents, lineItems } from '@/lib/db/schema';
import { requireUser } from '@/lib/auth/session';
import { processDocumentIngestion } from '@/lib/cases/ingest';
import { addLineItems, recomputeCaseTotals } from '@/lib/cases/repo';
import { lineItemInputSchema } from '@/lib/domain/line-item';
import { writeAuditLog } from '@/lib/audit-log';

/**
 * Add line items to an EXISTING case by hand. This is the manual path for an
 * uploaded case when AI extraction isn't available (or to correct/add to it) —
 * without it, an uploaded document with a disabled "Extract" button is a dead
 * end. Ownership is enforced; totals are recomputed so the audit can run.
 */
export async function addLineItemsToCaseAction(
  caseId: string,
  rawItems: unknown,
): Promise<{ ok: boolean; error?: string; count?: number }> {
  const user = await requireUser();
  const [caseRow] = await db
    .select()
    .from(cases)
    .where(and(eq(cases.id, caseId), eq(cases.userId, user.id), isNull(cases.deletedAt)))
    .limit(1);
  if (!caseRow) return { ok: false, error: 'Case not found.' };

  const parsed = z.array(lineItemInputSchema).safeParse(rawItems);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid line items.' };
  }
  const items = parsed.data.filter((it) => it.description.trim());
  if (items.length === 0) {
    return { ok: false, error: 'Add at least one line item with a description.' };
  }

  await addLineItems(caseId, items);
  await recomputeCaseTotals(caseId);
  await writeAuditLog({
    userId: user.id,
    entity: 'case',
    entityId: caseId,
    action: 'line_items.added_manual',
    diff: { count: items.length },
  });
  revalidatePath(`/app/cases/${caseId}`);
  return { ok: true, count: items.length };
}

/** Run AI extraction on a single document and persist line items (Section 7.5). */
export async function ingestDocumentAction(
  documentId: string,
): Promise<{ ok: boolean; message: string; needsReview?: boolean }> {
  const user = await requireUser();
  try {
    const res = await processDocumentIngestion(user.id, documentId);
    const [doc] = await db.select().from(documents).where(eq(documents.id, documentId)).limit(1);
    if (doc) revalidatePath(`/app/cases/${doc.caseId}`);
    return {
      ok: true,
      needsReview: res.needsReview,
      message: res.needsReview
        ? `Extracted ${res.lineItemCount} line items. Some values are low-confidence, please confirm them.`
        : `Extracted ${res.lineItemCount} line items.`,
    };
  } catch (err) {
    return { ok: false, message: err instanceof Error ? err.message : 'Extraction failed.' };
  }
}

/**
 * Confirm the extracted values of a document the user has reviewed: marks the
 * document DONE and treats its line items as user-verified (Section 9, HITL).
 */
export async function confirmExtractionAction(documentId: string): Promise<{ ok: boolean }> {
  const user = await requireUser();
  const [doc] = await db.select().from(documents).where(eq(documents.id, documentId)).limit(1);
  if (!doc) return { ok: false };
  const [caseRow] = await db
    .select()
    .from(cases)
    .where(and(eq(cases.id, doc.caseId), eq(cases.userId, user.id)))
    .limit(1);
  if (!caseRow) return { ok: false };
  // Only a document that's actually awaiting review can be confirmed — don't let
  // a raw request mark a PENDING/FAILED/PROCESSING doc as verified.
  if (doc.ingestStatus !== 'NEEDS_REVIEW') return { ok: false };

  await db.update(documents).set({ ingestStatus: 'DONE' }).where(eq(documents.id, doc.id));
  await db
    .update(lineItems)
    .set({ sourceConfidence: 1 })
    .where(eq(lineItems.documentId, doc.id));

  await writeAuditLog({
    userId: user.id,
    entity: 'document',
    entityId: doc.id,
    action: 'document.extraction_confirmed',
  });
  revalidatePath(`/app/cases/${doc.caseId}`);
  return { ok: true };
}
