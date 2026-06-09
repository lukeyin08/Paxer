'use client';

import { useState, useTransition } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { Sparkles, X, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { startConsumerCheckout } from '@/app/app/settings/billing-actions';

/**
 * Paywall popup shown when a non-subscriber tries to generate a dispute draft.
 * Audits are free; this gates the draft. Subscribing kicks off Stripe Checkout.
 */
export function ConsumerPaywall({
  open,
  onOpenChange,
  priceLabel,
  configured,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  priceLabel: string;
  configured: boolean;
}) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const subscribe = () =>
    start(async () => {
      setError(null);
      const res = await startConsumerCheckout();
      if ('url' in res) window.location.href = res.url;
      else setError(res.error);
    });

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-ink/40 backdrop-blur-sm data-[state=open]:animate-in data-[state=open]:fade-in" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg border border-rule bg-card p-6 shadow-xl focus:outline-none data-[state=open]:animate-in data-[state=open]:fade-in data-[state=open]:zoom-in-95">
          <Dialog.Close className="absolute right-4 top-4 text-muted transition-colors hover:text-ink">
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </Dialog.Close>

          <div className="flex flex-col gap-4">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/10 text-accent">
              <Sparkles className="h-5 w-5" />
            </span>
            <div>
              <Dialog.Title className="font-sans text-xl font-semibold text-ink">
                Subscribe to Paxer Plus
              </Dialog.Title>
              <Dialog.Description className="mt-2 text-sm leading-relaxed text-muted">
                Your audit is free. To generate dispute letters and chase the money down, upgrade to
                Paxer Plus for {priceLabel}. It&rsquo;s a flat subscription — never a cut of what you
                recover.
              </Dialog.Description>
            </div>

            <ul className="flex flex-col gap-2 text-sm text-ink">
              {[
                'Unlimited AI-drafted dispute letters',
                'Unlimited bill audits',
                'Keep 100% of what you recover',
                'Cancel anytime',
              ].map((f) => (
                <li key={f} className="flex items-center gap-2">
                  <Check className="h-4 w-4 shrink-0 text-accent" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>

            {configured ? (
              <Button onClick={subscribe} disabled={pending} className="w-full">
                {pending ? 'Starting checkout…' : `Subscribe — ${priceLabel}`}
              </Button>
            ) : (
              <p className="rounded-md border border-rule bg-soft/50 p-3 text-xs text-muted">
                Subscriptions aren&rsquo;t switched on yet — check back shortly.
              </p>
            )}
            {error && <p className="text-sm text-danger">{error}</p>}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
