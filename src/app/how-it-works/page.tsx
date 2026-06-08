import type { Metadata } from 'next';
import Link from 'next/link';
import { Kicker } from '@/components/brand/kicker';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MarketingHeader } from '@/components/marketing-header';
import { SiteFooter } from '@/components/site-footer';
import { formatUsd } from '@/lib/utils';
import { defaultFeeRate } from '@/lib/audit/fees';
import { ERROR_TYPES } from '@/lib/marketing';

export const metadata: Metadata = {
  title: 'How it works',
  description:
    'See how Paxer audits a medical bill, finds the errors, drafts a dispute letter, and helps you recover your money — with a worked example.',
};

// Illustrative example (not a real patient). Dollar figures are made up to show
// the kinds of errors Paxer surfaces.
const EXAMPLE_LINES = [
  { desc: 'CT scan, head (70450)', charge: 1200, note: 'billed twice' },
  { desc: 'CT scan, head (70450)', charge: 1200, note: 'duplicate' },
  { desc: 'ER facility fee', charge: 1400, note: '' },
  { desc: 'Emergency physician (out-of-network)', charge: 400, note: '' },
];

const EXAMPLE_FINDINGS = [
  {
    title: 'Duplicate charge',
    body: 'The same CT scan appears twice on the same date for the same amount. A service performed once should be billed once.',
    amount: 1200,
  },
  {
    title: 'Cost-share miscalculation',
    body: 'Coinsurance was applied before your deductible was met, inflating what you were asked to pay.',
    amount: 320,
  },
  {
    title: 'Surprise / balance bill',
    body: 'The out-of-network ER physician billed above your in-network cost-share — a likely No Surprises Act violation.',
    amount: 240,
  },
  {
    title: 'Benchmark overcharge',
    body: 'The facility fee is well above the regional median for the same code.',
    amount: 180,
  },
];

const FAQS = (isFree: boolean, feePct: number) => [
  {
    q: 'How much does Paxer cost?',
    a: isFree
      ? 'Paxer is free for individuals. There’s no fee and no contingency — you keep 100% of anything you recover.'
      : `Paxer charges a ${feePct}% success fee only on money you actually recover. No recovery, no fee.`,
  },
  {
    q: 'Will Paxer contact my provider or insurer for me?',
    a: 'No — you stay in control. Paxer drafts the dispute letter; you review it and send it yourself, so nothing goes out without your say-so.',
  },
  {
    q: 'What kinds of errors does it find?',
    a: `${ERROR_TYPES.map((e) => e.title).join(', ')} — see the example above for how each looks on a real bill.`,
  },
  {
    q: 'Is my information secure?',
    a: 'Your documents are private to your account and never shown to other users. See our Privacy Policy for how your data is handled.',
  },
  {
    q: 'Is this legal or medical advice?',
    a: 'No. Paxer is a tool to help you review your own bills. Estimates are not guarantees, and dispute letters are drafts you review before sending.',
  },
  {
    q: 'What if my dispute isn’t successful?',
    a: isFree
      ? 'Nothing changes — Paxer is free either way. Dispute outcomes are never guaranteed.'
      : 'You owe nothing. The success fee applies only to dollars actually returned to you.',
  },
];

export default function HowItWorksPage() {
  const feePct = Math.round(defaultFeeRate() * 100);
  const isFree = defaultFeeRate() === 0;
  const totalBilled = EXAMPLE_LINES.reduce((s, l) => s + l.charge, 0);
  const totalFound = EXAMPLE_FINDINGS.reduce((s, f) => s + f.amount, 0);

  return (
    <div className="flex min-h-screen flex-col">
      <MarketingHeader />

      <main className="flex-1">
        {/* Intro — orient in prose, then prove it with the worked example below */}
        <section className="container py-16 md:py-24">
          <div className="max-w-3xl">
            <Kicker className="mb-4">How it works</Kicker>
            <h1 className="text-4xl font-semibold leading-[1.1] text-ink md:text-5xl">
              See exactly what your bill is hiding.
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted">
              You add a bill, Paxer audits every charge against your plan and regional prices, flags
              the errors with the math, and drafts the dispute letter you review and send — keeping
              you in control the whole way. Here&rsquo;s what that looks like on a real example.
            </p>
          </div>
        </section>

        {/* Worked example */}
        <section className="border-y border-rule bg-soft/40">
          <div className="container py-16 md:py-20">
            <Kicker className="mb-3">A worked example</Kicker>
            <h2 className="max-w-2xl text-3xl font-semibold text-ink">
              See it on an example ER bill.
            </h2>
            <p className="mt-2 max-w-2xl text-muted">
              Illustrative only — not a real patient. It shows the kinds of errors Paxer surfaces.
            </p>

            <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-2">
              {/* The bill */}
              <Card>
                <CardContent className="pt-6">
                  <p className="kicker mb-4">The bill</p>
                  <div className="flex flex-col divide-y divide-rule">
                    {EXAMPLE_LINES.map((l, i) => (
                      <div key={i} className="flex items-center justify-between gap-3 py-3 text-sm">
                        <span className="text-ink">
                          {l.desc}
                          {l.note && (
                            <span className="ml-2 font-mono text-[0.65rem] uppercase tracking-wider text-warning">
                              {l.note}
                            </span>
                          )}
                        </span>
                        <span className="tabular-nums text-muted">{formatUsd(l.charge)}</span>
                      </div>
                    ))}
                    <div className="flex items-center justify-between py-3 text-sm font-semibold">
                      <span className="text-ink">Total billed</span>
                      <span className="tabular-nums text-ink">{formatUsd(totalBilled)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* The findings */}
              <Card>
                <CardContent className="pt-6">
                  <p className="kicker mb-4">What Paxer finds</p>
                  <div className="flex flex-col gap-4">
                    {EXAMPLE_FINDINGS.map((f) => (
                      <div key={f.title} className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-sm font-medium text-ink">{f.title}</p>
                          <p className="text-sm leading-relaxed text-muted">{f.body}</p>
                        </div>
                        <span className="shrink-0 tabular-nums font-semibold text-success">
                          {formatUsd(f.amount)}
                        </span>
                      </div>
                    ))}
                    <div className="mt-1 flex items-center justify-between border-t border-rule pt-4 text-sm font-semibold">
                      <span className="text-ink">Estimated recoverable</span>
                      <span className="tabular-nums text-success">{formatUsd(totalFound)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="mt-6 rounded-md border border-rule bg-card p-6">
              <p className="text-sm leading-relaxed text-muted">
                <span className="font-medium text-ink">Then Paxer drafts the letter.</span> It cites
                each finding and the math, in plain language. You review and edit it, download the
                PDF, and send it to your provider or insurer. Paxer tracks the response deadline and
                reminds you — and when money comes back, you log the recovery and see exactly what you
                keep.
              </p>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="container py-16 md:py-20">
          <Kicker className="mb-3">FAQ</Kicker>
          <h2 className="text-3xl font-semibold text-ink">Common questions.</h2>
          <div className="mt-8 grid grid-cols-1 gap-px overflow-hidden rounded-lg border border-rule bg-rule md:grid-cols-2">
            {FAQS(isFree, feePct).map((f) => (
              <div key={f.q} className="bg-card p-6">
                <h3 className="text-base font-semibold text-ink">{f.q}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{f.a}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="container pb-24 text-center">
          <h2 className="mx-auto max-w-2xl text-3xl font-semibold text-ink">
            Put your bill to the test.
          </h2>
          <div className="mt-8">
            <Button asChild size="lg">
              <Link href="/login">Start a case</Link>
            </Button>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
