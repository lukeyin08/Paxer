import 'server-only';
import Stripe from 'stripe';
import { env } from '@/lib/env';

/**
 * Server-only Stripe client for Audit-API billing. Lazily constructed so the app
 * boots fine without Stripe configured (the billing UI/routes stay dormant).
 * NEVER pass PHI to Stripe — only email, plan, seat, and usage metadata.
 */
let client: Stripe | null = null;

export function stripeConfigured(): boolean {
  return !!env.STRIPE_SECRET_KEY;
}

export function getStripe(): Stripe {
  if (!env.STRIPE_SECRET_KEY) {
    throw new Error('Stripe is not configured (STRIPE_SECRET_KEY is unset).');
  }
  // Pin to the library's built-in API version (omit apiVersion) so upgrades are
  // a deliberate dependency bump, not an env drift.
  client ??= new Stripe(env.STRIPE_SECRET_KEY);
  return client;
}

/** Where Stripe checkout / portal should return the user. */
export function billingReturnUrl(): string {
  const base = env.STRIPE_PORTAL_RETURN_URL || `${env.AUTH_URL ?? 'https://paxer.app'}/app/settings`;
  return base;
}
