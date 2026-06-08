import { env } from '@/lib/env';

export type ApiPlan = 'free' | 'pro';

export interface PlanDef {
  id: ApiPlan;
  label: string;
  /** Audit-API calls allowed per calendar month. */
  monthlyQuota: number;
  priceLabel: string;
}

/** Audit-API billing tiers. Free quota is env-tunable; Pro is the paid tier. */
export const API_PLANS: Record<ApiPlan, PlanDef> = {
  free: { id: 'free', label: 'Free', monthlyQuota: env.PAXER_FREE_API_QUOTA, priceLabel: '$0' },
  pro: { id: 'pro', label: 'Pro', monthlyQuota: 5000, priceLabel: '$49/mo' },
};

export function planFor(plan: string | null | undefined): PlanDef {
  return plan === 'pro' ? API_PLANS.pro : API_PLANS.free;
}

/** Current billing period key, e.g. "2026-06". */
export function currentPeriod(): string {
  return new Date().toISOString().slice(0, 7);
}
