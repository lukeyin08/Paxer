import { env } from '@/lib/env';

export type ApiPlan = 'free' | 'pro' | 'scale' | 'enterprise';

export interface PlanDef {
  id: ApiPlan;
  label: string;
  /** Audit-API calls allowed per calendar month. */
  monthlyQuota: number;
  priceLabel: string;
  /**
   * Stripe Price id for self-serve checkout. Present ⇒ the plan can be subscribed
   * to with a card. Undefined ⇒ not self-serve (free, or enterprise = contact).
   * Read from env so the prices live in Stripe, not the codebase.
   */
  stripePriceId?: string;
}

/**
 * Audit-API billing tiers. Free quota is env-tunable; Pro/Scale are the paid,
 * self-serve tiers (Stripe); Enterprise is contact-only. Numbers are the
 * founder's call — change them here. Over quota → HTTP 402 (hard cap, no overage).
 */
export const API_PLANS: Record<ApiPlan, PlanDef> = {
  free: { id: 'free', label: 'Free', monthlyQuota: env.PAXER_FREE_API_QUOTA, priceLabel: '$0' },
  pro: {
    id: 'pro',
    label: 'Pro',
    monthlyQuota: 5000,
    priceLabel: '$49/mo',
    stripePriceId: env.STRIPE_PRICE_PRO,
  },
  scale: {
    id: 'scale',
    label: 'Scale',
    monthlyQuota: 50000,
    priceLabel: '$299/mo',
    stripePriceId: env.STRIPE_PRICE_SCALE,
  },
  // Custom / contact — not self-serve. The high quota just means an enterprise
  // account is never quota-blocked; real limits are contract-defined.
  enterprise: { id: 'enterprise', label: 'Enterprise', monthlyQuota: 1_000_000, priceLabel: 'Custom' },
};

export function planFor(plan: string | null | undefined): PlanDef {
  if (plan && plan in API_PLANS) return API_PLANS[plan as ApiPlan];
  return API_PLANS.free;
}

/** Map a Stripe Price id back to our plan — used by the webhook. */
export function planForStripePrice(priceId: string | null | undefined): PlanDef | null {
  if (!priceId) return null;
  return Object.values(API_PLANS).find((p) => p.stripePriceId === priceId) ?? null;
}

/** The paid plans a customer can self-serve subscribe to (those with a Stripe price). */
export function checkoutPlans(): PlanDef[] {
  return [API_PLANS.pro, API_PLANS.scale].filter((p) => !!p.stripePriceId);
}

/** Whether self-serve Stripe billing is wired up (prices configured). */
export function billingConfigured(): boolean {
  return checkoutPlans().length > 0;
}

/** Current billing period key, e.g. "2026-06". */
export function currentPeriod(): string {
  return new Date().toISOString().slice(0, 7);
}
