'use server';

import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/auth/session';
import { recomputeBenchmarks } from '@/lib/benchmarks/recompute';
import { writeAuditLog } from '@/lib/audit-log';

export async function recomputeBenchmarksAction(): Promise<{ ok: boolean; message: string }> {
  // Operational action over global, cross-user data — admin only.
  const user = await requireAdmin();
  const res = await recomputeBenchmarks();
  await writeAuditLog({
    userId: user.id,
    entity: 'benchmarks',
    action: 'benchmarks.recomputed',
    diff: res,
  });
  revalidatePath('/app/benchmarks');
  return {
    ok: true,
    message: `Recomputed ${res.codesUpdated} code/region aggregates from ${res.lineItemsUsed} anonymized line items.`,
  };
}
