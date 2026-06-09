import { z } from 'zod';

/**
 * Server-side environment validation. Never import this from a client component.
 * Most values are optional so the app can boot for local UI work without every
 * integration configured; features that need a value fail loudly at call time.
 */

/**
 * An optional string var where a present-but-blank value ("") is treated the
 * same as unset. Without this, a variable that exists with an empty value (e.g.
 * a key left blank in the Vercel dashboard) parses as '' — which is falsy in
 * `!env.X` guards yet slips PAST `env.X ?? fallback` (?? only catches
 * null/undefined). That mismatch silently disabled magic-link email and would
 * have sent `from: ''` to Resend. Coercing '' -> undefined makes blank and
 * unset behave identically so both checks agree.
 */
const optionalString = (schema: z.ZodString = z.string()) =>
  z.preprocess((v) => (v === '' ? undefined : v), schema.optional());

const envSchema = z.object({
  DATABASE_URL: optionalString(z.string().min(1)),
  POSTGRES_URL: optionalString(z.string().min(1)),
  BLOB_READ_WRITE_TOKEN: optionalString(),
  ANTHROPIC_API_KEY: optionalString(),
  AUTH_SECRET: optionalString(),
  AUTH_URL: optionalString(),
  RESEND_API_KEY: optionalString(),
  RESEND_FROM: optionalString(),
  CRON_SECRET: optionalString(),
  // Stripe (Audit API billing). Server-side only; never sent PHI. The billing
  // code stays dormant until these are set, so the app runs fine without them.
  STRIPE_SECRET_KEY: optionalString(),
  STRIPE_WEBHOOK_SECRET: optionalString(),
  STRIPE_PRICE_PRO: optionalString(), // price_… for the $49/mo Pro plan
  STRIPE_PRICE_SCALE: optionalString(), // price_… for the $299/mo Scale plan
  STRIPE_PRICE_CONSUMER: optionalString(), // price_… for the Paxer Plus consumer subscription
  STRIPE_PORTAL_RETURN_URL: optionalString(), // defaults to AUTH_URL/app/settings
  PAXER_CONSUMER_PRICE_LABEL: optionalString(), // display label, default '$12/mo'
  // Stays 0 — Paxer never takes a contingency/success cut of patient recoveries
  // (consumer revenue is the flat Paxer Plus subscription, not a fee). The fee
  // plumbing is retained for a possible future B2B / shared-savings tier.
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
  // Free consumer audits before Paxer Plus is required (the first audit is free;
  // re-running an already-audited case doesn't consume another).
  PAXER_FREE_AUDIT_LIMIT: z.preprocess(
    (v) => (v === '' || v === undefined ? undefined : v),
    z.coerce.number().int().min(0).default(1),
  ),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
});

export const env = envSchema.parse(process.env);

/**
 * Default transactional-email sender. Must be an address on a domain VERIFIED in
 * Resend (paxer.app). The old `onboarding@resend.dev` sandbox sender could only
 * deliver to the Resend account owner's own address — every other recipient was
 * silently dropped. RESEND_FROM overrides this per environment.
 */
export const DEFAULT_EMAIL_FROM = 'Paxer <noreply@paxer.app>';

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
