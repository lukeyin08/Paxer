import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';

/**
 * API key format: `pax_live_<43-char base64url random>`. We store only the
 * SHA-256 hash; the plaintext is shown to the user once at creation.
 */
const KEY_PREFIX = 'pax_live_';
const DISPLAY_PREFIX_LEN = KEY_PREFIX.length + 6; // "pax_live_" + 6 chars

export interface GeneratedApiKey {
  plaintext: string;
  prefix: string; // safe to display/store: e.g. "pax_live_a1b2c3"
  hash: string; // sha256 hex of the full plaintext
}

export function hashApiKey(plaintext: string): string {
  return createHash('sha256').update(plaintext, 'utf8').digest('hex');
}

export function generateApiKey(): GeneratedApiKey {
  const secret = randomBytes(32).toString('base64url');
  const plaintext = `${KEY_PREFIX}${secret}`;
  return {
    plaintext,
    prefix: plaintext.slice(0, DISPLAY_PREFIX_LEN),
    hash: hashApiKey(plaintext),
  };
}

/** Pull a presented key from an `Authorization: Bearer` or `x-api-key` header. */
export function extractApiKey(headers: Headers): string | null {
  const auth = headers.get('authorization');
  if (auth?.startsWith('Bearer ')) return auth.slice(7).trim() || null;
  const x = headers.get('x-api-key');
  return x?.trim() || null;
}

/** Shape check before hitting the database — cheap rejection of junk. */
export function looksLikeApiKey(value: string): boolean {
  return value.startsWith(KEY_PREFIX) && value.length >= KEY_PREFIX.length + 20;
}

/** Constant-time compare of two hex digests of equal length. */
export function hashesEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  return timingSafeEqual(Buffer.from(a), Buffer.from(b));
}
