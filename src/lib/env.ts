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
  PAXER_FEE_RATE: z.coerce.number().min(0).max(1).default(0.25),
  PAXER_DAILY_AI_BUDGET_USD: z.coerce.number().min(0).default(10),
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
