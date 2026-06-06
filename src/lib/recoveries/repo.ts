import { and, desc, eq, inArray, isNull } from 'drizzle-orm';
import { db } from '@/lib/db';
import { cases, disputes, findings, recoveries, type Recovery } from '@/lib/db/schema';
import { computeFee, defaultFeeRate } from '@/lib/audit/fees';
import { recomputeEstimatedRecoverable } from '@/lib/cases/repo';

export type RecoveryKind = Recovery['kind'];

/** Record a recovery, compute the success fee, and update linked records. */
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

  const feeRate = defaultFeeRate();
  const feeAmount = computeFee(input.amount, feeRate);

  const row = await db.transaction(async (tx) => {
    const [created] = await tx
      .insert(recoveries)
      .values({
        caseId: input.caseId,
        findingId: input.findingId ?? null,
        amount: input.amount.toFixed(2),
        kind: input.kind,
        feeRate,
        feeAmount: feeAmount.toFixed(2),
        notes: input.notes ?? null,
      })
      .returning();

    // Mark the dispute's findings RECOVERED — but only for a dispute on THIS case
    // (already ownership-verified), preventing cross-tenant tampering.
    if (input.disputeId) {
      const [d] = await tx
        .select()
        .from(disputes)
        .where(and(eq(disputes.id, input.disputeId), eq(disputes.caseId, input.caseId)))
        .limit(1);
      if (d && d.findingIds.length > 0) {
        await tx
          .update(findings)
          .set({ status: 'RECOVERED' })
          .where(and(inArray(findings.id, d.findingIds), eq(findings.caseId, input.caseId)));
      }
    } else if (input.findingId) {
      await tx
        .update(findings)
        .set({ status: 'RECOVERED' })
        .where(and(eq(findings.id, input.findingId), eq(findings.caseId, input.caseId)));
    }

    // Mark the case RESOLVED only when nothing is still OPEN *or* DISPUTING —
    // an active dispute on another finding must not flip the case to resolved.
    const remaining = await tx
      .select({ id: findings.id })
      .from(findings)
      .where(
        and(
          eq(findings.caseId, input.caseId),
          inArray(findings.status, ['OPEN', 'DISPUTING']),
          isNull(findings.deletedAt),
        ),
      );
    if (remaining.length === 0) {
      await tx.update(cases).set({ status: 'RESOLVED', updatedAt: new Date() }).where(eq(cases.id, input.caseId));
    }
    return created!;
  });

  // Recovered dollars leave the "in play" set, so the estimate must drop
  // (prevents the dashboard double-counting recovered money — Section 9).
  await recomputeEstimatedRecoverable(input.caseId);
  return row;
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
  totalFees: number;
  netToPatient: number;
  count: number;
}

export function sumRecoveries(rows: RecoveryRow[]): RecoveryTotals {
  const totalRecovered = rows.reduce((s, r) => s + Number(r.recovery.amount), 0);
  const totalFees = rows.reduce((s, r) => s + Number(r.recovery.feeAmount), 0);
  return {
    totalRecovered,
    totalFees,
    netToPatient: totalRecovered - totalFees,
    count: rows.length,
  };
}
