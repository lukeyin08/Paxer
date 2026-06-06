import { randomBytes, scrypt as scryptCb, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const scrypt = promisify(scryptCb);

/**
 * Password hashing for the seeded demo credentials account only (Section 7.1).
 * Uses Node's built-in scrypt so we add no dependency. Format: `scrypt$salt$hash`.
 * Real production auth uses magic links; this exists purely for easy demo review.
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString('hex');
  const derived = (await scrypt(password, salt, 64)) as Buffer;
  return `scrypt$${salt}$${derived.toString('hex')}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const parts = stored.split('$');
  if (parts.length !== 3 || parts[0] !== 'scrypt') return false;
  const [, salt, hashHex] = parts;
  const derived = (await scrypt(password, salt!, 64)) as Buffer;
  const expected = Buffer.from(hashHex!, 'hex');
  if (expected.length !== derived.length) return false;
  return timingSafeEqual(expected, derived);
}
