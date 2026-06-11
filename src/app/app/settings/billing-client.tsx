'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import type { ApiPlan } from '@/lib/billing/plans';
import { startCheckout, openBillingPortal } from './billing-actions';

export interface BillingProps {
  planLabel: string;
  planId: string;
  used: number;
  quota: number;
  hasSubscription: boolean;
  billingConfigured: boolean;
  checkoutPlans: { id: ApiPlan; label: string; priceLabel: string }[];
}

export function BillingClient(props: BillingProps) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const go = (fn: () => Promise<{ url: string } | { error: string }>) =>
    start(async () => {
      setError(null);
      const res = await fn();
      if ('url' in res) window.location.href = res.url;
      else setError(res.error);
    });

  const pct = props.quota > 0 ? Math.min(100, Math.round((props.used / props.quota) * 100)) : 0;

  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className="text-sm">
          Current plan: <span className="font-medium text-ink">{props.planLabel}</span>
        </p>
        <p className="mt-1 text-xs text-muted">
          {props.used.toLocaleString()} / {props.quota.toLocaleString()} audits this month
        </p>
        <div className="mt-2 h-1.5 w-44 overflow-hidden rounded-full bg-rule">
          <div className="h-full bg-accent" style={{ width: `${pct}%` }} />
        </div>
      </div>

      {props.billingConfigured ? (
        <div className="flex flex-wrap items-center gap-2">
          {props.checkoutPlans.map((p) => (
            <Button
              key={p.id}
              size="sm"
              variant="outline"
              disabled={pending || props.planId === p.id}
              onClick={() => go(() => startCheckout(p.id))}
            >
              {props.planId === p.id ? `${p.label} — current` : `Upgrade to ${p.label} · ${p.priceLabel}`}
            </Button>
          ))}
          {props.hasSubscription && (
            <Button size="sm" variant="ghost" disabled={pending} onClick={() => go(() => openBillingPortal())}>
              Manage billing
            </Button>
          )}
        </div>
      ) : (
        <p className="text-xs text-muted">
          Self-serve billing is being set up. For higher volume or an SLA,{' '}
          <a className="text-accent hover:underline" href="mailto:hello@paxer.app?subject=Paxer%20API%20upgrade">
            contact us
          </a>
          .
        </p>
      )}

      {error && <p className="text-sm text-danger">{error}</p>}
    </div>
  );
}
