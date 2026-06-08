import { sql } from 'drizzle-orm';
import { db } from '@/lib/db';

export interface RateLimitResult {
  ok: boolean;
  /** Requests left in the current window (0 when blocked). */
  remaining: number;
  /** Seconds until the window resets (only meaningful when blocked). */
  retryAfterSec: number;
}

/**
 * Fixed-window rate limiter backed by Postgres — no Redis dependency, which
 * keeps the serverless deploy single-provider. The INSERT … ON CONFLICT is a
 * single atomic statement, so concurrent invocations on different Lambdas can't
 * slip past the limit (this is also what closes the AI-budget race: bursts of
 * parallel calls are counted, not just point-in-time spend).
 *
 * `key` should namespace the subject, e.g. `ingest:<userId>` or
 * `magic-link:<email>`. Counting is per-key, per-window.
 */
export async function checkRateLimit(
  key: string,
  limit: number,
  windowSeconds: number,
): Promise<RateLimitResult> {
  const rows = (await db.execute(sql`
    INSERT INTO rate_limits ("key", window_start, count)
    VALUES (${key}, now(), 1)
    ON CONFLICT ("key") DO UPDATE SET
      count = CASE
        WHEN rate_limits.window_start < now() - make_interval(secs => ${windowSeconds})
        THEN 1 ELSE rate_limits.count + 1 END,
      window_start = CASE
        WHEN rate_limits.window_start < now() - make_interval(secs => ${windowSeconds})
        THEN now() ELSE rate_limits.window_start END
    RETURNING count, window_start
  `)) as unknown as Array<{ count: number | string; window_start: string | Date }>;

  const row = rows[0];
  const count = Number(row?.count ?? 1);
  const windowStart = row?.window_start ? new Date(row.window_start) : new Date();
  const ok = count <= limit;
  const elapsedSec = (Date.now() - windowStart.getTime()) / 1000;
  const retryAfterSec = ok ? 0 : Math.max(1, Math.ceil(windowSeconds - elapsedSec));
  return { ok, remaining: Math.max(0, limit - count), retryAfterSec };
}

/** Thrown when a rate limit is exceeded; carries a user-facing message. */
export class RateLimitError extends Error {
  retryAfterSec: number;
  constructor(message: string, retryAfterSec: number) {
    super(message);
    this.name = 'RateLimitError';
    this.retryAfterSec = retryAfterSec;
  }
}

/**
 * Enforce a rate limit, throwing RateLimitError when exceeded. Convenience
 * wrapper for the common "block on limit" path in actions and routes.
 */
export async function enforceRateLimit(
  key: string,
  limit: number,
  windowSeconds: number,
  label = 'requests',
): Promise<void> {
  const res = await checkRateLimit(key, limit, windowSeconds);
  if (!res.ok) {
    const mins = Math.ceil(res.retryAfterSec / 60);
    const wait = res.retryAfterSec < 90 ? `${res.retryAfterSec}s` : `${mins} min`;
    throw new RateLimitError(
      `Too many ${label}. Please wait ${wait} and try again.`,
      res.retryAfterSec,
    );
  }
}
