import { NextRequest, NextResponse } from 'next/server';
import type Stripe from 'stripe';
import { getStripe, stripeConfigured } from '@/lib/billing/stripe';
import { env } from '@/lib/env';
import { planForStripePrice } from '@/lib/billing/plans';
import { applyPlanFromStripe } from '@/lib/billing/account';

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
          const plan = planForStripePrice(sub.items.data[0]?.price.id);
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
        break;
      }
      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription;
        const customerId = customerIdOf(sub.customer);
        if (customerId) {
          const plan = planForStripePrice(sub.items.data[0]?.price.id);
          const active = ['active', 'trialing', 'past_due'].includes(sub.status);
          await applyPlanFromStripe({
            customerId,
            subscriptionId: sub.id,
            plan: active && plan ? plan.id : 'free',
            status: sub.status,
          });
        }
        break;
      }
      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription;
        const customerId = customerIdOf(sub.customer);
        if (customerId) {
          await applyPlanFromStripe({
            customerId,
            subscriptionId: null,
            plan: 'free',
            status: 'canceled',
          });
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
