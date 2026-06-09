import { DEMO_EMAIL, DEMO_ENABLED } from '@/lib/auth/demo';

/**
 * Pure consumer-entitlement logic — no DB/Stripe imports, so it's unit-testable.
 * `consumer.ts` wraps these with the DB query + env.
 */

// Subscription statuses that still grant access. `past_due` is kept as a grace
// state so a transient failed payment doesn't lock someone out mid-flow.
export const ACTIVE_STATUSES = new Set(['active', 'trialing', 'past_due']);

export function isActiveStatus(status: string | null | undefined): boolean {
  return !!status && ACTIVE_STATUSES.has(status);
}

export interface ConsumerEntitlement {
  plan: string; // 'free' | 'plus'
  status: string | null;
  hasActiveSub: boolean;
  isDemo: boolean;
  /** The gate: may this user generate a dispute draft? */
  canGenerateDraft: boolean;
}

export function computeConsumerEntitlement(row: {
  email: string | null;
  plan: string | null;
  status: string | null;
}): ConsumerEntitlement {
  const plan = row.plan ?? 'free';
  const status = row.status ?? null;
  const hasActiveSub = plan === 'plus' && isActiveStatus(status);
  const isDemo = DEMO_ENABLED && !!row.email && row.email === DEMO_EMAIL;
  return { plan, status, hasActiveSub, isDemo, canGenerateDraft: isDemo || hasActiveSub };
}

/** Pure price-id match the webhook uses to route consumer vs API subscriptions. */
export function isConsumerPriceId(
  priceId: string | null | undefined,
  configured: string | null | undefined,
): boolean {
  return !!priceId && !!configured && priceId === configured;
}
