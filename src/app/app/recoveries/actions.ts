'use server';

import { redirect } from 'next/navigation';
import { z } from 'zod';
import { requireUser } from '@/lib/auth/session';
import { recordRecovery, type RecoveryKind } from '@/lib/recoveries/repo';
import { writeAuditLog } from '@/lib/audit-log';

const schema = z.object({
  caseId: z.string().uuid(),
  disputeId: z.string().uuid().nullable().optional(),
  amount: z.coerce.number().finite().min(0.01, 'Enter the recovered amount.').max(10_000_000),
  kind: z.enum(['BILL_REDUCTION', 'REFUND', 'CLAIM_PAID']),
  notes: z.string().optional(),
});

export async function recordRecoveryAction(
  raw: z.input<typeof schema>,
): Promise<{ ok: false; error: string } | never> {
  const user = await requireUser();
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid input.' };
  }
  const data = parsed.data;
  try {
    const recovery = await recordRecovery({
      userId: user.id,
      caseId: data.caseId,
      disputeId: data.disputeId ?? null,
      amount: data.amount,
      kind: data.kind as RecoveryKind,
      notes: data.notes ?? null,
    });
    await writeAuditLog({
      userId: user.id,
      entity: 'recovery',
      entityId: recovery.id,
      action: 'recovery.recorded',
      diff: { amount: data.amount, kind: data.kind, feeAmount: recovery.feeAmount },
    });
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Could not record recovery.' };
  }
  redirect('/app/recoveries');
}
