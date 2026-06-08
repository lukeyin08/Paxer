'use server';

import { revalidatePath } from 'next/cache';
import { and, eq, inArray } from 'drizzle-orm';
import { db } from '@/lib/db';
import { cases, documents, users } from '@/lib/db/schema';
import { requireUser } from '@/lib/auth/session';
import { signOut } from '@/lib/auth/config';
import { deleteFile } from '@/lib/storage';
import { writeAuditLog } from '@/lib/audit-log';
import { createApiKey, revokeApiKey } from '@/lib/api-keys/repo';

/** Create an API key for the embedded audit API. Returns the plaintext ONCE. */
export async function createApiKeyAction(
  name: string,
): Promise<{ ok: boolean; plaintext?: string; error?: string }> {
  const user = await requireUser();
  const clean = name.trim().slice(0, 60);
  if (!clean) return { ok: false, error: 'Give the key a name.' };
  const { record, plaintext } = await createApiKey(user.id, clean);
  await writeAuditLog({
    userId: user.id,
    entity: 'user',
    entityId: user.id,
    action: 'api_key.created',
    diff: { id: record.id, name: clean },
  });
  revalidatePath('/app/settings');
  return { ok: true, plaintext };
}

export async function revokeApiKeyAction(id: string): Promise<{ ok: boolean }> {
  const user = await requireUser();
  const ok = await revokeApiKey(user.id, id);
  if (ok) {
    await writeAuditLog({ userId: user.id, entity: 'user', entityId: user.id, action: 'api_key.revoked', diff: { id } });
    revalidatePath('/app/settings');
  }
  return { ok };
}

export async function updateStateAction(state: string): Promise<{ ok: boolean }> {
  const user = await requireUser();
  await db
    .update(users)
    .set({ state: state.trim().toUpperCase().slice(0, 2) || null })
    .where(eq(users.id, user.id));
  revalidatePath('/app/settings');
  return { ok: true };
}

/** Delete all stored blob objects for a set of cases (best-effort). */
async function purgeBlobs(caseIds: string[]) {
  if (caseIds.length === 0) return;
  const docs = await db
    .select({ blobUrl: documents.blobUrl })
    .from(documents)
    .where(inArray(documents.caseId, caseIds));
  await Promise.all(docs.filter((d) => d.blobUrl).map((d) => deleteFile(d.blobUrl!)));
}

/** Hard-delete a case and its files (Section 9, data control). */
export async function deleteCaseAction(caseId: string): Promise<{ ok: boolean }> {
  const user = await requireUser();
  const [c] = await db
    .select()
    .from(cases)
    .where(and(eq(cases.id, caseId), eq(cases.userId, user.id)))
    .limit(1);
  if (!c) return { ok: false };

  await purgeBlobs([caseId]);
  await db.delete(cases).where(eq(cases.id, caseId)); // cascades to children
  await writeAuditLog({
    userId: user.id,
    entity: 'case',
    entityId: caseId,
    action: 'case.hard_deleted',
  });
  revalidatePath('/app/settings');
  revalidatePath('/app');
  return { ok: true };
}

/** Hard-delete the user's account, all their data, and stored files (Section 9). */
export async function deleteAccountAction(): Promise<void> {
  const user = await requireUser();
  const myCases = await db.select({ id: cases.id }).from(cases).where(eq(cases.userId, user.id));
  await purgeBlobs(myCases.map((c) => c.id));
  await writeAuditLog({
    userId: user.id,
    entity: 'user',
    entityId: user.id,
    action: 'account.hard_deleted',
    diff: { cases: myCases.length },
  });
  await db.delete(users).where(eq(users.id, user.id)); // cascades to cases/accounts/sessions
  await signOut({ redirectTo: '/' });
}
