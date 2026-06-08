import { z } from 'zod';

/**
 * Server-side environment validation. Never import this from a client component.
 * Most values are optional so the app can boot for local UI work without every
 * integration configured; features that need a value fail loudly at call time.
 */
const envSchema = z.object({
  DATABASE_URL: z.string().min(1).optional(),
  POSTGRES_URL: z.string().min(1).optional(),
  BLOB_READ_WRITE_TOKEN: z.string().optional(),
  ANTHROPIC_API_KEY: z.string().optional(),
  AUTH_SECRET: z.string().optional(),
  AUTH_URL: z.string().optional(),
  RESEND_API_KEY: z.string().optional(),
  RESEND_FROM: z.string().optional(),
  CRON_SECRET: z.string().optional(),
  // Consumer product is FREE for individuals (fee rate 0). The fee plumbing is
  // retained so a future B2B / shared-savings tier can set a non-zero rate.
  // Treat an empty string as unset so the default applies.
  PAXER_FEE_RATE: z.preprocess(
    (v) => (v === '' || v === undefined ? undefined : v),
    z.coerce.number().min(0).max(1).default(0),
  ),
  PAXER_DAILY_AI_BUDGET_USD: z.preprocess(
    (v) => (v === '' || v === undefined ? undefined : v),
    z.coerce.number().min(0).default(10),
  ),
  // Per-user daily AI spend ceiling so one account can't exhaust the global
  // budget and deny service to everyone (cost-runaway abuse protection).
  PAXER_USER_DAILY_AI_BUDGET_USD: z.preprocess(
    (v) => (v === '' || v === undefined ? undefined : v),
    z.coerce.number().min(0).default(3),
  ),
  // Audit-API free-tier monthly call quota; over this, free keys get 402.
  PAXER_FREE_API_QUOTA: z.preprocess(
    (v) => (v === '' || v === undefined ? undefined : v),
    z.coerce.number().int().min(1).default(100),
  ),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
});

export const env = envSchema.parse(process.env);

/** The Postgres connection string, preferring DATABASE_URL then POSTGRES_URL. */
export function databaseUrl(): string {
  const url = env.DATABASE_URL ?? env.POSTGRES_URL;
  if (!url) {
    throw new Error(
      'No database connection string. Set DATABASE_URL (or POSTGRES_URL) in your environment.',
    );
  }
  return url;
}
