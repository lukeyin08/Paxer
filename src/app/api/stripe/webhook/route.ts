import { NextRequest, NextResponse } from 'next/server';
import type Stripe from 'stripe';
import { getStripe, stripeConfigured } from '@/lib/billing/stripe';
import { env } from '@/lib/env';
import { planForStripePrice } from '@/lib/billing/plans';
import { isConsumerPrice } from '@/lib/billing/consumer';
import { isActiveStatus } from '@/lib/billing/consumer-entitlement';
import { applyPlanFromStripe, applyConsumerPlanFromStripe } from '@/lib/billing/account';

// Node runtime + raw body for Stripe signature verification.
export const runtime = 'nodejs';

function customerIdOf(c: string | { id: string } | null | undefined): string | null {
  if (!c) return null;
  return typeof c === 'string' ? c : c.id;
}

export async function POST(req: NextRequest) {
  if (!stripeConfigured() || !env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Billing not configured.' }, { status: 503 });
  }
  const sig = req.headers.get('stripe-signature');
  if (!sig) return NextResponse.json({ error: 'Missing signature.' }, { status: 400 });

  const raw = await req.text();
  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(raw, sig, env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('[stripe] webhook signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature.' }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const s = event.data.object as Stripe.Checkout.Session;
        const customerId = customerIdOf(s.customer);
        const subId = typeof s.subscription === 'string' ? s.subscription : (s.subscription?.id ?? null);
        if (customerId && subId) {
          const sub = await getStripe().subscriptions.retrieve(subId);
          const priceId = sub.items.data[0]?.price.id;
          const active = isActiveStatus(sub.status);
          if (isConsumerPrice(priceId)) {
            await applyConsumerPlanFromStripe({
              userId: s.client_reference_id,
              customerId,
              subscriptionId: subId,
              active,
              status: sub.status,
            });
          } else {
            // Only write the API columns for a recognized API price — an unknown
            // price must not spuriously stamp apiPlan on this customer.
            const plan = planForStripePrice(priceId);
            if (plan) {
              await applyPlanFromStripe({
                userId: s.client_reference_id,
                customerId,
                subscriptionId: subId,
                plan: plan.id,
                status: sub.status,
              });
            }
          }
        }
        break;
      }
      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription;
        const customerId = customerIdOf(sub.customer);
        if (customerId) {
          const priceId = sub.items.data[0]?.price.id;
          const active = isActiveStatus(sub.status);
          if (isConsumerPrice(priceId)) {
            await applyConsumerPlanFromStripe({
              customerId,
              subscriptionId: sub.id,
              active,
              status: sub.status,
            });
          } else {
            const plan = planForStripePrice(priceId);
            if (plan) {
              await applyPlanFromStripe({
                customerId,
                subscriptionId: sub.id,
                plan: active ? plan.id : 'free',
                status: sub.status,
              });
            }
          }
        }
        break;
      }
      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription;
        const customerId = customerIdOf(sub.customer);
        if (customerId) {
          const priceId = sub.items.data[0]?.price.id;
          if (isConsumerPrice(priceId)) {
            await applyConsumerPlanFromStripe({
              customerId,
              subscriptionId: null,
              active: false,
              status: 'canceled',
            });
          } else if (planForStripePrice(priceId)) {
            await applyPlanFromStripe({
              customerId,
              subscriptionId: null,
              plan: 'free',
              status: 'canceled',
            });
          }
        }
        break;
      }
    }
  } catch (err) {
    console.error('[stripe] webhook handler error:', err);
    return NextResponse.json({ error: 'Handler error.' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
