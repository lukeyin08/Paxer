'use server';

import { requireUser } from '@/lib/auth/session';
import { getStripe, stripeConfigured, billingReturnUrl } from '@/lib/billing/stripe';
import { getOrCreateStripeCustomer, getUserBilling } from '@/lib/billing/account';
import { API_PLANS, type ApiPlan } from '@/lib/billing/plans';

type Result = { url: string } | { error: string };

/** Start a Stripe Checkout subscription for a paid plan; returns the redirect URL. */
export async function startCheckout(plan: ApiPlan): Promise<Result> {
  const user = await requireUser();
  if (!stripeConfigured()) return { error: 'Billing isn’t available yet.' };
  const planDef = API_PLANS[plan];
  if (!planDef?.stripePriceId) {
    return { error: 'That plan isn’t available for self-serve checkout.' };
  }
  try {
    const customerId = await getOrCreateStripeCustomer(user.id);
    const session = await getStripe().checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      line_items: [{ price: planDef.stripePriceId, quantity: 1 }],
      client_reference_id: user.id, // so the webhook can resolve the user
      success_url: `${billingReturnUrl()}?billing=success`,
      cancel_url: `${billingReturnUrl()}?billing=cancelled`,
      allow_promotion_codes: true,
    });
    if (!session.url) return { error: 'Could not start checkout.' };
    return { url: session.url };
  } catch (err) {
    console.error('[billing] checkout failed:', err);
    return { error: 'Could not start checkout. Please try again.' };
  }
}

/** Open the Stripe billing portal for the current user's subscription. */
export async function openBillingPortal(): Promise<Result> {
  const user = await requireUser();
  if (!stripeConfigured()) return { error: 'Billing isn’t available yet.' };
  try {
    const billing = await getUserBilling(user.id);
    if (!billing?.stripeCustomerId) return { error: 'No billing account yet — upgrade first.' };
    const session = await getStripe().billingPortal.sessions.create({
      customer: billing.stripeCustomerId,
      return_url: billingReturnUrl(),
    });
    return { url: session.url };
  } catch (err) {
    console.error('[billing] portal failed:', err);
    return { error: 'Could not open the billing portal. Please try again.' };
  }
}
