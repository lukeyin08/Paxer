import { describe, it, expect } from 'vitest';
import {
  computeConsumerEntitlement,
  isActiveStatus,
  isConsumerPriceId,
} from './consumer-entitlement';
import { DEMO_EMAIL } from '@/lib/auth/demo';

describe('computeConsumerEntitlement', () => {
  const row = (over: Partial<{ email: string | null; plan: string | null; status: string | null }>) => ({
    email: 'patient@example.com',
    plan: 'free',
    status: null,
    ...over,
  });

  it('free user cannot generate a draft', () => {
    const e = computeConsumerEntitlement(row({ plan: 'free' }));
    expect(e.hasActiveSub).toBe(false);
    expect(e.canGenerateDraft).toBe(false);
  });

  it('active Plus subscriber can generate a draft', () => {
    const e = computeConsumerEntitlement(row({ plan: 'plus', status: 'active' }));
    expect(e.hasActiveSub).toBe(true);
    expect(e.canGenerateDraft).toBe(true);
  });

  it('past_due Plus keeps access (grace period)', () => {
    expect(computeConsumerEntitlement(row({ plan: 'plus', status: 'past_due' })).canGenerateDraft).toBe(true);
  });

  it('canceled Plus loses access', () => {
    const e = computeConsumerEntitlement(row({ plan: 'plus', status: 'canceled' }));
    expect(e.hasActiveSub).toBe(false);
    expect(e.canGenerateDraft).toBe(false);
  });

  it('plan plus with null status is not active', () => {
    expect(computeConsumerEntitlement(row({ plan: 'plus', status: null })).canGenerateDraft).toBe(false);
  });

  it('demo account bypasses the gate even on the free plan', () => {
    // DEMO_ENABLED is true under NODE_ENV=test.
    const e = computeConsumerEntitlement(row({ email: DEMO_EMAIL, plan: 'free', status: null }));
    expect(e.isDemo).toBe(true);
    expect(e.canGenerateDraft).toBe(true);
  });

  it('defaults missing columns to free', () => {
    const e = computeConsumerEntitlement({ email: null, plan: null, status: null });
    expect(e.plan).toBe('free');
    expect(e.canGenerateDraft).toBe(false);
  });
});

describe('isActiveStatus', () => {
  it('treats active/trialing/past_due as active', () => {
    expect(isActiveStatus('active')).toBe(true);
    expect(isActiveStatus('trialing')).toBe(true);
    expect(isActiveStatus('past_due')).toBe(true);
  });
  it('treats canceled/unpaid/null as inactive', () => {
    expect(isActiveStatus('canceled')).toBe(false);
    expect(isActiveStatus('unpaid')).toBe(false);
    expect(isActiveStatus(null)).toBe(false);
    expect(isActiveStatus(undefined)).toBe(false);
  });
});

describe('isConsumerPriceId (webhook routing)', () => {
  it('matches the configured consumer price', () => {
    expect(isConsumerPriceId('price_consumer', 'price_consumer')).toBe(true);
  });
  it('does not match an API plan price', () => {
    expect(isConsumerPriceId('price_pro', 'price_consumer')).toBe(false);
  });
  it('is false when no consumer price is configured', () => {
    expect(isConsumerPriceId('price_anything', undefined)).toBe(false);
    expect(isConsumerPriceId('price_anything', '')).toBe(false);
  });
  it('is false for a missing price id', () => {
    expect(isConsumerPriceId(null, 'price_consumer')).toBe(false);
  });
});
