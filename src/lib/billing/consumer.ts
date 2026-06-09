import 'server-only';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { env } from '@/lib/env';
import {
  computeConsumerEntitlement,
  isConsumerPriceId,
  type ConsumerEntitlement,
} from './consumer-entitlement';

export type { ConsumerEntitlement };

/**
 * Consumer (patient) subscription: "Paxer Plus". Model: audits are free for
 * everyone; generating a dispute draft requires an active Plus subscription
 * (the demo account bypasses it). This is a flat software subscription, NOT a
 * contingency fee — patients still keep 100% of what they recover.
 */
export const CONSUMER_PLAN = {
  id: 'plus' as const,
  label: 'Paxer Plus',
  priceLabel: env.PAXER_CONSUMER_PRICE_LABEL || '$12/mo',
  stripePriceId: env.STRIPE_PRICE_CONSUMER,
};

/** Whether consumer self-serve billing is wired up (Stripe key + Plus price set). */
export function consumerBillingConfigured(): boolean {
  return !!env.STRIPE_SECRET_KEY && !!env.STRIPE_PRICE_CONSUMER;
}

/** True if a Stripe price id is the Paxer Plus consumer subscription. */
export function isConsumerPrice(priceId: string | null | undefined): boolean {
  return isConsumerPriceId(priceId, env.STRIPE_PRICE_CONSUMER);
}

export async function getConsumerEntitlement(userId: string): Promise<ConsumerEntitlement> {
  const [u] = await db
    .select({ email: users.email, plan: users.consumerPlan, status: users.consumerStatus })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  return computeConsumerEntitlement({
    email: u?.email ?? null,
    plan: u?.plan ?? null,
    status: u?.status ?? null,
  });
}
