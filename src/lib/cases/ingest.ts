import { and, eq, isNull } from 'drizzle-orm';
import { db } from '@/lib/db';
import { cases, documents } from '@/lib/db/schema';
import { ingestDocument, needsReview } from '@/lib/ai/ingest';
import { addLineItems, recomputeCaseTotals, upsertPlanBenefits } from './repo';
import { writeAuditLog } from '@/lib/audit-log';
import { enforceRateLimit } from '@/lib/rate-limit';
import type { LineItemInput, PlanBenefitsInput } from '@/lib/domain/line-item';

/**
 * Run AI extraction on a single document, persist the resulting line items and
 * plan benefits, and update statuses (Section 7.5). Ownership is enforced via the
 * case. Low-confidence results set ingest_status = NEEDS_REVIEW so the user is
 * asked to confirm rather than the system guessing (Section 9).
 */
export async function processDocumentIngestion(
  userId: string,
  documentId: string,
): Promise<{ ok: boolean; needsReview: boolean; lineItemCount: number }> {
  // Load the document and verify ownership through the case.
  const [doc] = await db
    .select()
    .from(documents)
    .where(and(eq(documents.id, documentId), isNull(documents.deletedAt)))
    .limit(1);
  if (!doc) throw new Error('Document not found.');

  const [caseRow] = await db
    .select()
    .from(cases)
    .where(and(eq(cases.id, doc.caseId), eq(cases.userId, userId), isNull(cases.deletedAt)))
    .limit(1);
  if (!caseRow) throw new Error('Not authorized for this document.');
  if (!doc.blobUrl || !doc.mimeType) throw new Error('Document has no stored file to extract.');

  // Throttle AI extraction per user (abuse + cost protection): 20 / hour.
  await enforceRateLimit(`ingest:${userId}`, 20, 3600, 'extractions');

  await db.update(documents).set({ ingestStatus: 'PROCESSING' }).where(eq(documents.id, doc.id));

  try {
    const { extraction, modelId, promptVersion } = await ingestDocument({
      blobUrl: doc.blobUrl,
      mimeType: doc.mimeType,
      userId,
    });

    const items: LineItemInput[] = extraction.lineItems.map((li) => ({
      description: li.description,
      cptHcpcsCode: li.cptHcpcsCode,
      revenueCode: li.revenueCode,
      units: li.units,
      chargeAmount: li.chargeAmount,
      allowedAmount: li.allowedAmount,
      planPaid: li.planPaid,
      patientResponsibility: li.patientResponsibility,
      dateOfService: li.dateOfService,
      adjustmentCodes: li.adjustmentCodes ?? null,
      sourceConfidence: li.confidence,
    }));

    await addLineItems(doc.caseId, items, doc.id);

    if (extraction.planBenefits) {
      const pb: PlanBenefitsInput = {
        deductible: extraction.planBenefits.deductible,
        deductibleMet: extraction.planBenefits.deductibleMet,
        coinsuranceRate: extraction.planBenefits.coinsuranceRate,
        copay: extraction.planBenefits.copay,
        oopMax: extraction.planBenefits.oopMax,
        oopMet: extraction.planBenefits.oopMet,
        inNetwork: extraction.planBenefits.inNetwork ?? true,
      };
      await upsertPlanBenefits(doc.caseId, pb, doc.id);
    }

    const review = needsReview(extraction);

    await db
      .update(documents)
      .set({
        kind: extraction.documentKind,
        ingestStatus: review ? 'NEEDS_REVIEW' : 'DONE',
        rawExtractJson: { ...extraction, _meta: { modelId, promptVersion } },
        pageCount: doc.pageCount ?? null,
      })
      .where(eq(documents.id, doc.id));

    // Capture provider/payer/date on the case if missing.
    await db
      .update(cases)
      .set({
        providerName: caseRow.providerName ?? extraction.providerName ?? null,
        payerName: caseRow.payerName ?? extraction.payerName ?? null,
        dateOfService:
          caseRow.dateOfService ??
          (extraction.dateOfService ? new Date(extraction.dateOfService) : null),
        // A low-confidence extraction isn't trustworthy yet — keep the case in
        // INGESTING until the user confirms the values, rather than presenting
        // an unreviewed extraction as audited.
        status: review ? 'INGESTING' : 'AUDITED',
      })
      .where(eq(cases.id, doc.caseId));

    await recomputeCaseTotals(doc.caseId);

    await writeAuditLog({
      userId,
      entity: 'document',
      entityId: doc.id,
      action: 'document.ingested',
      diff: { lineItems: items.length, needsReview: review, modelId, promptVersion },
    });

    return { ok: true, needsReview: review, lineItemCount: items.length };
  } catch (err) {
    await db.update(documents).set({ ingestStatus: 'FAILED' }).where(eq(documents.id, doc.id));
    throw err;
  }
}
