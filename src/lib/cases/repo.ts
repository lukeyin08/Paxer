import { and, desc, eq, isNull } from 'drizzle-orm';
import { db } from '@/lib/db';
import {
  cases,
  documents,
  findings,
  lineItems,
  planBenefits,
  type Case,
  type Document,
  type Finding,
  type LineItem,
  type PlanBenefit,
} from '@/lib/db/schema';
import type { LineItemInput, PlanBenefitsInput } from '@/lib/domain/line-item';

/** All non-deleted cases for a user, newest first. */
export async function getCasesForUser(userId: string): Promise<Case[]> {
  return db
    .select()
    .from(cases)
    .where(and(eq(cases.userId, userId), isNull(cases.deletedAt)))
    .orderBy(desc(cases.createdAt));
}

export interface CaseDetail {
  case: Case;
  documents: Document[];
  lineItems: LineItem[];
  planBenefits: PlanBenefit | null;
  findings: Finding[];
}

// Sort order for findings: highest severity first.
const SEVERITY_RANK: Record<Finding['severity'], number> = { HIGH: 0, MED: 1, LOW: 2 };

/** A single case with its documents, line items, and plan benefits — ownership enforced. */
export async function getCaseForUser(
  userId: string,
  caseId: string,
): Promise<CaseDetail | null> {
  const [row] = await db
    .select()
    .from(cases)
    .where(and(eq(cases.id, caseId), eq(cases.userId, userId), isNull(cases.deletedAt)))
    .limit(1);
  if (!row) return null;

  const [docs, items, [benefit], caseFindings] = await Promise.all([
    db
      .select()
      .from(documents)
      .where(and(eq(documents.caseId, caseId), isNull(documents.deletedAt)))
      .orderBy(desc(documents.createdAt)),
    db
      .select()
      .from(lineItems)
      .where(and(eq(lineItems.caseId, caseId), isNull(lineItems.deletedAt)))
      .orderBy(lineItems.createdAt),
    db.select().from(planBenefits).where(eq(planBenefits.caseId, caseId)).limit(1),
    db
      .select()
      .from(findings)
      .where(and(eq(findings.caseId, caseId), isNull(findings.deletedAt))),
  ]);

  caseFindings.sort((a, b) => SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity]);

  return {
    case: row,
    documents: docs,
    lineItems: items,
    planBenefits: benefit ?? null,
    findings: caseFindings,
  };
}

export async function createCase(input: {
  userId: string;
  title: string;
  providerName?: string | null;
  payerName?: string | null;
  dateOfService?: string | null;
  status?: Case['status'];
  notes?: string | null;
}): Promise<Case> {
  const [row] = await db
    .insert(cases)
    .values({
      userId: input.userId,
      title: input.title,
      providerName: input.providerName ?? null,
      payerName: input.payerName ?? null,
      dateOfService: input.dateOfService ? new Date(input.dateOfService) : null,
      status: input.status ?? 'DRAFT',
      notes: input.notes ?? null,
    })
    .returning();
  return row!;
}

export async function addDocument(input: {
  caseId: string;
  kind: Document['kind'];
  blobUrl?: string | null;
  fileName?: string | null;
  mimeType?: string | null;
  ingestStatus?: Document['ingestStatus'];
  pageCount?: number | null;
}): Promise<Document> {
  const [row] = await db
    .insert(documents)
    .values({
      caseId: input.caseId,
      kind: input.kind,
      blobUrl: input.blobUrl ?? null,
      fileName: input.fileName ?? null,
      mimeType: input.mimeType ?? null,
      ingestStatus: input.ingestStatus ?? 'PENDING',
      pageCount: input.pageCount ?? null,
    })
    .returning();
  return row!;
}

const toMoney = (n: number | null | undefined): string | null =>
  n === null || n === undefined ? null : n.toFixed(2);

/** Persist a batch of line items for a case (optionally tied to a document). */
export async function addLineItems(
  caseId: string,
  items: LineItemInput[],
  documentId?: string | null,
): Promise<LineItem[]> {
  if (items.length === 0) return [];
  const values = items.map((it) => ({
    caseId,
    documentId: documentId ?? null,
    description: it.description,
    cptHcpcsCode: it.cptHcpcsCode ?? null,
    revenueCode: it.revenueCode ?? null,
    units: it.units ?? 1,
    chargeAmount: toMoney(it.chargeAmount),
    allowedAmount: toMoney(it.allowedAmount),
    planPaid: toMoney(it.planPaid),
    patientResponsibility: toMoney(it.patientResponsibility),
    dateOfService: it.dateOfService ? new Date(it.dateOfService) : null,
    sourceConfidence: it.sourceConfidence ?? 1,
  }));
  return db.insert(lineItems).values(values).returning();
}

export async function upsertPlanBenefits(
  caseId: string,
  input: PlanBenefitsInput,
  sourceDocId?: string | null,
): Promise<void> {
  const [existing] = await db
    .select()
    .from(planBenefits)
    .where(eq(planBenefits.caseId, caseId))
    .limit(1);
  const values = {
    caseId,
    deductible: toMoney(input.deductible),
    deductibleMet: toMoney(input.deductibleMet),
    coinsuranceRate: input.coinsuranceRate ?? null,
    copay: toMoney(input.copay),
    oopMax: toMoney(input.oopMax),
    oopMet: toMoney(input.oopMet),
    inNetwork: input.inNetwork,
    sourceDocId: sourceDocId ?? null,
  };
  if (existing) {
    await db.update(planBenefits).set(values).where(eq(planBenefits.id, existing.id));
  } else {
    await db.insert(planBenefits).values(values);
  }
}

/** Recompute case roll-up totals from its line items. */
export async function recomputeCaseTotals(caseId: string): Promise<void> {
  const items = await db
    .select()
    .from(lineItems)
    .where(and(eq(lineItems.caseId, caseId), isNull(lineItems.deletedAt)));
  const totalBilled = items.reduce((s, i) => s + Number(i.chargeAmount ?? 0), 0);
  const totalPr = items.reduce((s, i) => s + Number(i.patientResponsibility ?? 0), 0);
  await db
    .update(cases)
    .set({
      totalBilled: totalBilled.toFixed(2),
      totalPatientResponsibility: totalPr.toFixed(2),
      updatedAt: new Date(),
    })
    .where(eq(cases.id, caseId));
}

export async function softDeleteCase(userId: string, caseId: string): Promise<boolean> {
  const result = await db
    .update(cases)
    .set({ deletedAt: new Date() })
    .where(and(eq(cases.id, caseId), eq(cases.userId, userId)))
    .returning({ id: cases.id });
  return result.length > 0;
}
