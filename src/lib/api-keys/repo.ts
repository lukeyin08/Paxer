import { and, desc, eq, isNull } from 'drizzle-orm';
import { db } from '@/lib/db';
import { apiKeys, users, type ApiKey, type User } from '@/lib/db/schema';
import { generateApiKey, hashApiKey, looksLikeApiKey } from './keys';

/** Create a key for a user. Returns the record plus the plaintext (shown once). */
export async function createApiKey(
  userId: string,
  name: string,
): Promise<{ record: ApiKey; plaintext: string }> {
  const { plaintext, prefix, hash } = generateApiKey();
  const [record] = await db
    .insert(apiKeys)
    .values({ userId, name: name.trim() || 'API key', keyPrefix: prefix, keyHash: hash })
    .returning();
  return { record: record!, plaintext };
}

/** All of a user's keys, newest first (includes revoked, for the audit trail). */
export async function listApiKeys(userId: string): Promise<ApiKey[]> {
  return db
    .select()
    .from(apiKeys)
    .where(eq(apiKeys.userId, userId))
    .orderBy(desc(apiKeys.createdAt));
}

/** Revoke a key the user owns. Returns true if a row was updated. */
export async function revokeApiKey(userId: string, id: string): Promise<boolean> {
  const rows = await db
    .update(apiKeys)
    .set({ revokedAt: new Date() })
    .where(and(eq(apiKeys.id, id), eq(apiKeys.userId, userId), isNull(apiKeys.revokedAt)))
    .returning({ id: apiKeys.id });
  return rows.length > 0;
}

/**
 * Authenticate a presented plaintext key: look up by hash, reject revoked keys
 * and soft-deleted owners, bump last_used_at, and return the owning user.
 */
export async function authenticateApiKey(plaintext: string): Promise<User | null> {
  if (!looksLikeApiKey(plaintext)) return null;
  const hash = hashApiKey(plaintext);
  const [row] = await db
    .select({ key: apiKeys, user: users })
    .from(apiKeys)
    .innerJoin(users, eq(apiKeys.userId, users.id))
    .where(and(eq(apiKeys.keyHash, hash), isNull(apiKeys.revokedAt), isNull(users.deletedAt)))
    .limit(1);
  if (!row) return null;
  // Best-effort usage timestamp; never block the request on it.
  void db.update(apiKeys).set({ lastUsedAt: new Date() }).where(eq(apiKeys.id, row.key.id));
  return row.user;
}
