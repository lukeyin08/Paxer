import type { Metadata } from 'next';
import Link from 'next/link';
import { Kicker } from '@/components/brand/kicker';
import { Button } from '@/components/ui/button';
import { MarketingHeader } from '@/components/marketing-header';
import { SiteFooter } from '@/components/site-footer';
import { Reveal } from '@/components/reveal';
import { WorkedExample } from '@/components/how-it-works/worked-example';
import { CONSUMER_PLAN } from '@/lib/billing/consumer';
import { ERROR_TYPES } from '@/lib/marketing';

const description =
  'See how Paxer audits a medical bill, finds the errors, drafts a dispute letter, and helps you recover your money — including a worked example.';

export const metadata: Metadata = {
  title: 'How it works',
  description,
  alternates: { canonical: '/how-it-works' },
  openGraph: { title: 'How it works · Paxer', description, url: '/how-it-works' },
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
    body: 'The out-of-network ER physician billed above your in-network cost-share, a likely No Surprises Act violation.',
    amount: 260,
  },
  {
    title: 'Benchmark overcharge',
    body: 'The facility fee is well above the regional median for the same code.',
    amount: 180,
  },
];

const FAQS = (priceLabel: string) => [
  {
    q: 'How much does Paxer cost?',
    a: `Your first bill audit is free. After that, Paxer Plus is ${priceLabel}: a flat subscription (not a contingency fee) that unlocks unlimited audits and dispute letters. You keep 100% of anything you recover, and can cancel anytime.`,
  },
  {
    q: 'Will Paxer contact my provider or insurer for me?',
    a: 'No. You stay in control. Paxer drafts the dispute letter; you review it and send it yourself, so nothing goes out without your say-so.',
  },
  {
    q: 'What kinds of errors does it find?',
    a: `${ERROR_TYPES.map((e) => e.title).join(', ')}. The worked example shows several of these on a single ER bill.`,
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
    a: 'Your Paxer Plus subscription is the same flat price either way. Paxer never takes a cut of recoveries, and dispute outcomes are never guaranteed.',
  },
];

export default function HowItWorksPage() {
  const plusPrice = CONSUMER_PLAN.priceLabel;
  // FAQ structured data (schema.org) — eligible for FAQ rich results in search.
  const faqLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQS(plusPrice).map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };
  return (
    <div className="flex min-h-screen flex-col">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }}
      />
      <MarketingHeader />

      <main className="flex-1">
        {/* Intro — orient in prose, then prove it with the worked example below */}
        <section className="container py-16 md:py-24">
          <div className="mx-auto max-w-3xl text-center">
            <Kicker className="mb-4">How it works</Kicker>
            <h1 className="text-4xl font-semibold leading-[1.1] text-ink md:text-5xl">
              See exactly what your bill is hiding.
            </h1>
            <p className="mt-5 mx-auto max-w-2xl text-lg leading-relaxed text-muted">
              You add a bill, Paxer audits every charge against your plan and regional prices, flags
              the errors with the math, and drafts the dispute letter you review and send, keeping
              you in control the whole way. Here&rsquo;s what that looks like on a worked example.
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
              Illustrative only, not a real patient. It shows the kinds of errors Paxer surfaces.
            </p>

            <WorkedExample lines={EXAMPLE_LINES} findings={EXAMPLE_FINDINGS} />

            <Reveal className="mt-6 rounded-md border border-rule bg-card p-6">
              <p className="text-sm leading-relaxed text-muted">
                <span className="font-medium text-ink">Then Paxer drafts the letter.</span> It cites
                each finding and the math, in plain language. You review and edit it, download the
                PDF, and send it to your provider or insurer. Paxer tracks the response deadline and
                reminds you, and when money comes back, you log the recovery and see exactly what you
                keep.
              </p>
            </Reveal>
          </div>
        </section>

        {/* FAQ */}
        <section className="container py-16 md:py-20">
          <Kicker className="mb-3">FAQ</Kicker>
          <h2 className="text-3xl font-semibold text-ink">Common questions.</h2>
          <div className="mt-8 grid grid-cols-1 gap-px overflow-hidden rounded-lg border border-rule bg-rule md:grid-cols-2">
            {FAQS(plusPrice).map((f, i) => (
              <Reveal key={f.q} delay={i * 70} className="h-full bg-card p-6">
                <h3 className="text-base font-semibold text-ink">{f.q}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{f.a}</p>
              </Reveal>
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
              <Link href="/login">Audit your first bill</Link>
            </Button>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
