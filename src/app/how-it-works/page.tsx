import type { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { MarketingHeader } from '@/components/marketing-header';
import { SiteFooter } from '@/components/site-footer';
import { WorkedExample } from '@/components/how-it-works/worked-example';
import { CONSUMER_PLAN } from '@/lib/billing/consumer';
import { ERROR_TYPES } from '@/lib/marketing';

const description =
  'How Paxer audits a medical bill: what it checks, how it explains each finding, and how the dispute letter gets drafted. Includes a worked example and FAQ.';

export const metadata: Metadata = {
  title: 'How it works',
  description,
  alternates: { canonical: '/how-it-works' },
  openGraph: { title: 'How it works · Paxer', description, url: '/how-it-works' },
};

// Illustrative example (not a real patient). Dollar figures are made up to show
// the kinds of errors Paxer surfaces.
const EXAMPLE_LINES = [
  { desc: 'CT scan, head (70450)', charge: 1200, note: '' },
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
    a: `Your first bill audit is free. After that, Paxer Plus is ${priceLabel}: a flat subscription (not a contingency fee) that covers unlimited audits and dispute letters. You keep 100% of anything you recover, and can cancel anytime.`,
  },
  {
    q: 'Will Paxer contact my provider or insurer for me?',
    a: 'No. You stay in control. Paxer drafts the dispute letter; you review it and send it yourself, so nothing goes out without your say-so.',
  },
  {
    q: 'What kinds of errors does it find?',
    a: 'Duplicate and unbundled charges, cost-share miscalculations, balance and surprise billing, and upcoding or charges above the regional benchmark. The worked example above shows several of these on one ER bill.',
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
      <a href="#content" className="skip-link">
        Skip to content
      </a>
      <MarketingHeader />

      <main id="content" className="flex-1">
        {/* Intro — orient in prose, then prove it with the worked example below */}
        <section className="measure py-12 md:py-16">
          <div className="max-w-3xl">
            <h1>How Paxer audits a bill</h1>
            <p className="mt-4 max-w-2xl leading-relaxed text-muted">
              You add a bill. Paxer checks every charge against your plan and against regional
              prices, flags what looks wrong, and drafts the dispute letter you send.
            </p>
          </div>
        </section>

        {/* Worked example */}
        <section className="border-t border-rule">
          <div className="measure py-14">
            <h2>A worked example</h2>
            <p className="mt-2 max-w-2xl text-muted">
              An ER bill. Illustrative only, not a real patient.
            </p>

            <WorkedExample lines={EXAMPLE_LINES} findings={EXAMPLE_FINDINGS} />

            <div className="mt-6 max-w-3xl">
              <p className="text-sm leading-relaxed text-muted">
                <span className="font-semibold text-ink">Then Paxer drafts the letter.</span> It
                cites each finding and the math in plain language. You review and edit it, download
                the PDF, and send it to your provider or insurer. Paxer tracks the response deadline
                and reminds you. When money comes back, you log the recovery against the case.
              </p>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="measure border-t border-rule py-14">
          <h2>Common questions</h2>
          <dl className="mt-6 grid grid-cols-1 gap-x-12 gap-y-6 md:grid-cols-2">
            {FAQS(plusPrice).map((f) => (
              <div key={f.q}>
                <dt className="font-semibold text-ink">{f.q}</dt>
                <dd className="mt-1 text-sm leading-relaxed text-muted">{f.a}</dd>
              </div>
            ))}
          </dl>
        </section>

        {/* CTA */}
        <section className="measure border-t border-rule py-14">
          <h2>Audit your first bill</h2>
          <div className="mt-6">
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
