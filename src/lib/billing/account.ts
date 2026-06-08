import 'server-only';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { getStripe } from './stripe';
import type { ApiPlan } from './plans';

/**
 * Billing account queries. In Phase 2 the billing unit is the user; Phase 3
 * moves it to organizations. Keep all writes of paid-plan state behind the
 * Stripe webhook (`applyPlanFromStripe`).
 */
export interface UserBilling {
  id: string;
  email: string;
  name: string | null;
  apiPlan: string;
  planStatus: string | null;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
}

export async function getUserBilling(userId: string): Promise<UserBilling | null> {
  const [u] = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      apiPlan: users.apiPlan,
      planStatus: users.planStatus,
      stripeCustomerId: users.stripeCustomerId,
      stripeSubscriptionId: users.stripeSubscriptionId,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  return u ?? null;
}

/** Ensure the user has a Stripe customer; create + persist it if missing. Email only — no PHI. */
export async function getOrCreateStripeCustomer(userId: string): Promise<string> {
  const u = await getUserBilling(userId);
  if (!u) throw new Error('User not found');
  if (u.stripeCustomerId) return u.stripeCustomerId;
  const customer = await getStripe().customers.create({
    email: u.email,
    name: u.name ?? undefined,
    metadata: { userId },
  });
  await db.update(users).set({ stripeCustomerId: customer.id }).where(eq(users.id, userId));
  return customer.id;
}

/**
 * The ONLY writer of paid-plan state — called from the signature-verified Stripe
 * webhook. Identifies the user by the checkout's client_reference_id when present,
 * else by Stripe customer id.
 */
export async function applyPlanFromStripe(opts: {
  userId?: string | null;
  customerId: string;
  subscriptionId: string | null;
  plan: ApiPlan;
  status: string;
}): Promise<void> {
  const set = {
    apiPlan: opts.plan,
    planStatus: opts.status,
    stripeCustomerId: opts.customerId,
    stripeSubscriptionId: opts.subscriptionId,
  };
  if (opts.userId) {
    await db.update(users).set(set).where(eq(users.id, opts.userId));
  } else {
    await db.update(users).set(set).where(eq(users.stripeCustomerId, opts.customerId));
  }
}
