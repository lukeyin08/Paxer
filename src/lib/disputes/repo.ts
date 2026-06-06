import { and, desc, eq, inArray, isNull } from 'drizzle-orm';
import { db } from '@/lib/db';
import {
  cases,
  disputes,
  disputeEvents,
  findings,
  type Dispute,
  type DisputeEvent,
  type Finding,
} from '@/lib/db/schema';

/** Suggest whether a dispute over these findings should target the provider or insurer. */
const INSURER_TYPES = new Set<Finding['type']>([
  'COST_SHARE_ERROR',
  'BALANCE_BILLING_NSA',
  'OOP_MAX_OVERRUN',
  'NON_COVERED_BILLED_TO_PATIENT',
]);

export function suggestTarget(types: Finding['type'][]): 'PROVIDER' | 'INSURER' {
  const insurer = types.filter((t) => INSURER_TYPES.has(t)).length;
  const provider = types.length - insurer;
  return insurer > provider ? 'INSURER' : 'PROVIDER';
}

export async function getFindingsByIds(caseId: string, ids: string[]): Promise<Finding[]> {
  if (ids.length === 0) return [];
  return db
    .select()
    .from(findings)
    .where(and(eq(findings.caseId, caseId), inArray(findings.id, ids), isNull(findings.deletedAt)));
}

export async function createDispute(input: {
  caseId: string;
  findingIds: string[];
  target: Dispute['target'];
  letterHtml: string;
  modelId?: string | null;
  promptVersion?: string | null;
}): Promise<Dispute> {
  const [row] = await db
    .insert(disputes)
    .values({
      caseId: input.caseId,
      findingIds: input.findingIds,
      target: input.target,
      channel: 'MAIL',
      letterHtml: input.letterHtml,
      status: 'DRAFT',
      modelId: input.modelId ?? null,
      promptVersion: input.promptVersion ?? null,
    })
    .returning();
  await db.insert(disputeEvents).values({
    disputeId: row!.id,
    type: 'CREATED',
    payloadJson: { findingIds: input.findingIds, target: input.target },
  });
  // Mark the findings as DISPUTING.
  if (input.findingIds.length > 0) {
    await db
      .update(findings)
      .set({ status: 'DISPUTING' })
      .where(inArray(findings.id, input.findingIds));
  }
  return row!;
}

export async function getDisputeForUser(
  userId: string,
  disputeId: string,
): Promise<{ dispute: Dispute; events: DisputeEvent[]; findings: Finding[] } | null> {
  const [row] = await db
    .select()
    .from(disputes)
    .where(and(eq(disputes.id, disputeId), isNull(disputes.deletedAt)))
    .limit(1);
  if (!row) return null;
  const [caseRow] = await db
    .select()
    .from(cases)
    .where(and(eq(cases.id, row.caseId), eq(cases.userId, userId)))
    .limit(1);
  if (!caseRow) return null;

  const [events, dfindings] = await Promise.all([
    db
      .select()
      .from(disputeEvents)
      .where(eq(disputeEvents.disputeId, disputeId))
      .orderBy(disputeEvents.occurredAt),
    getFindingsByIds(row.caseId, row.findingIds),
  ]);
  return { dispute: row, events, findings: dfindings };
}

/** All disputes for a user, with their case title. */
export async function getDisputesForUser(userId: string) {
  const rows = await db
    .select({
      dispute: disputes,
      caseTitle: cases.title,
    })
    .from(disputes)
    .innerJoin(cases, eq(cases.id, disputes.caseId))
    .where(and(eq(cases.userId, userId), isNull(disputes.deletedAt), isNull(cases.deletedAt)))
    .orderBy(desc(disputes.createdAt));
  return rows;
}

export async function addDisputeEvent(
  disputeId: string,
  type: DisputeEvent['type'],
  payload?: unknown,
): Promise<void> {
  await db.insert(disputeEvents).values({ disputeId, type, payloadJson: payload ?? null });
}
