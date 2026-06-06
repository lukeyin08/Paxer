'use server';

import { revalidatePath } from 'next/cache';
import { and, eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { cases, documents, lineItems } from '@/lib/db/schema';
import { requireUser } from '@/lib/auth/session';
import { processDocumentIngestion } from '@/lib/cases/ingest';
import { writeAuditLog } from '@/lib/audit-log';

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
