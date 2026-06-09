'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { startConsumerCheckout, openBillingPortal } from './billing-actions';

type Action = () => Promise<{ url: string } | { error: string }>;

export function ConsumerBillingClient({
  plan,
  status,
  priceLabel,
  configured,
  hasCustomer,
}: {
  plan: string;
  status: string | null;
  priceLabel: string;
  configured: boolean;
  hasCustomer: boolean;
}) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const go = (fn: Action) =>
    start(async () => {
      setError(null);
      const res = await fn();
      if ('url' in res) window.location.href = res.url;
      else setError(res.error);
    });

  const active = plan === 'plus' && (status === 'active' || status === 'trialing' || status === 'past_due');

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm">
        {active ? (
          <>
            You&rsquo;re on <span className="font-medium text-ink">Paxer Plus</span>
            {status && status !== 'active' ? ` (${status})` : ''}.
          </>
        ) : (
          <>You&rsquo;re on the free plan — audits are free; generating dispute letters needs Paxer Plus.</>
        )}
      </p>
      <div className="flex flex-wrap items-center gap-2">
        {active ? (
          <Button size="sm" variant="outline" disabled={pending} onClick={() => go(openBillingPortal)}>
            Manage billing
          </Button>
        ) : configured ? (
          <Button size="sm" disabled={pending} onClick={() => go(startConsumerCheckout)}>
            Subscribe — {priceLabel}
          </Button>
        ) : (
          <p className="text-xs text-muted">Subscriptions aren&rsquo;t switched on yet.</p>
        )}
        {!active && hasCustomer && configured && (
          <Button size="sm" variant="ghost" disabled={pending} onClick={() => go(openBillingPortal)}>
            Manage billing
          </Button>
        )}
      </div>
      {error && <p className="text-sm text-danger">{error}</p>}
    </div>
  );
}
