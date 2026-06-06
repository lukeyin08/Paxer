import { db } from '@/lib/db';
import { auditLog } from '@/lib/db/schema';

/**
 * Append an entry to the audit_log (Section 4, Section 9). Every meaningful
 * state change should call this. Best-effort: logging failures never block the
 * primary mutation.
 */
export async function writeAuditLog(input: {
  userId?: string | null;
  entity: string;
  entityId?: string | null;
  action: string;
  diff?: unknown;
}): Promise<void> {
  try {
    await db.insert(auditLog).values({
      userId: input.userId ?? null,
      entity: input.entity,
      entityId: input.entityId ?? null,
      action: input.action,
      diffJson: input.diff ?? null,
    });
  } catch (err) {
    console.error('[audit-log] failed to write entry', err);
  }
}
