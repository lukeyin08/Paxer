'use client';

import { useState, useTransition } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { startConsumerCheckout } from '@/app/app/settings/billing-actions';

/**
 * Paywall popup, shared by BOTH gates: the audit gate (after the first free
 * audit) and the draft gate. Subscribing kicks off Stripe Checkout. Copy is
 * gate-neutral so it reads correctly from either trigger.
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
        <Dialog.Overlay className="fixed inset-0 z-50 bg-ink/50" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 border border-ink bg-paper p-6 focus:outline-none">
          {/* Padded hit area: a bare 16px icon is nearly untappable on phones. */}
          <Dialog.Close className="absolute right-1 top-1 p-3 text-muted hover:text-ink">
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </Dialog.Close>

          <div className="flex flex-col gap-4">
            <div>
              <Dialog.Title className="text-lg font-bold text-ink">
                Subscribe to Paxer Plus
              </Dialog.Title>
              <Dialog.Description className="mt-2 text-sm leading-relaxed text-muted">
                Paxer Plus ({priceLabel}) unlocks unlimited audits and dispute letters so you can
                chase the money down. A flat subscription, never a cut of what you recover.
              </Dialog.Description>
            </div>

            <ul className="list-disc pl-5 text-sm text-ink">
              {[
                'Unlimited AI-drafted dispute letters',
                'Unlimited bill audits',
                'Keep 100% of what you recover',
                'Cancel anytime',
              ].map((f) => (
                <li key={f} className="py-0.5">
                  {f}
                </li>
              ))}
            </ul>

            {configured ? (
              <Button onClick={subscribe} disabled={pending} className="w-full">
                {pending ? 'Starting checkout…' : `Subscribe for ${priceLabel}`}
              </Button>
            ) : (
              <p className="border border-rule p-3 text-xs text-muted">
                Subscriptions aren&rsquo;t switched on yet. Check back shortly.
              </p>
            )}
            {error && <p className="text-sm text-danger">{error}</p>}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
