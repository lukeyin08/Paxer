import { and, desc, eq, isNull } from 'drizzle-orm';
import { db } from '@/lib/db';
import { cases, disputes, recoveries, type Recovery } from '@/lib/db/schema';

export type RecoveryKind = Recovery['kind'];

/** Record a recovery and update linked records. */
export async function recordRecovery(input: {
  userId: string;
  caseId: string;
  disputeId?: string | null;
  findingId?: string | null;
  amount: number;
  kind: RecoveryKind;
  notes?: string | null;
}): Promise<Recovery> {
  // Ownership.
  const [caseRow] = await db
    .select()
    .from(cases)
    .where(and(eq(cases.id, input.caseId), eq(cases.userId, input.userId), isNull(cases.deletedAt)))
    .limit(1);
  if (!caseRow) throw new Error('Case not found.');

  // Only link a disputeId that actually belongs to this (owned) case — never
  // trust a client-supplied id, even though it's currently write-only.
  let disputeId: string | null = null;
  if (input.disputeId) {
    const [d] = await db
      .select({ id: disputes.id })
      .from(disputes)
      .where(and(eq(disputes.id, input.disputeId), eq(disputes.caseId, input.caseId)))
      .limit(1);
    disputeId = d?.id ?? null;
  }

  // A recovery is purely the money record. Finding statuses, the
  // dispute outcome, AND the case's RESOLVED status are all owned by
  // logResponseAction (WON/PARTIAL/DENIED) — recording money does not change
  // case state, so an unrelated recovery row can't side-effect a case to
  // RESOLVED. (Previously this marked ALL of a dispute's findings RECOVERED even
  // on a partial outcome, dropping still-owed dollars.)
  const [created] = await db
    .insert(recoveries)
    .values({
      caseId: input.caseId,
      findingId: input.findingId ?? null,
      disputeId,
      amount: input.amount.toFixed(2),
      kind: input.kind,
      // Paxer never takes a contingency — these legacy columns stay 0.
      feeRate: 0,
      feeAmount: '0.00',
      notes: input.notes ?? null,
    })
    .returning();
  return created!;
}

export interface RecoveryRow {
  recovery: Recovery;
  caseTitle: string;
}

export async function getRecoveriesForUser(userId: string): Promise<RecoveryRow[]> {
  const rows = await db
    .select({ recovery: recoveries, caseTitle: cases.title })
    .from(recoveries)
    .innerJoin(cases, eq(cases.id, recoveries.caseId))
    .where(and(eq(cases.userId, userId), isNull(cases.deletedAt)))
    .orderBy(desc(recoveries.recoveredAt));
  return rows;
}

export interface RecoveryTotals {
  totalRecovered: number;
  netToPatient: number; // == totalRecovered (Paxer never takes a contingency)
  count: number;
}

export function sumRecoveries(rows: RecoveryRow[]): RecoveryTotals {
  const totalRecovered = rows.reduce((s, r) => s + Number(r.recovery.amount), 0);
  return {
    totalRecovered,
    netToPatient: totalRecovered,
    count: rows.length,
  };
}
