import type { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { MarketingHeader } from '@/components/marketing-header';
import { SiteFooter } from '@/components/site-footer';
import { API_PLANS } from '@/lib/billing/plans';
import { CONSUMER_PLAN } from '@/lib/billing/consumer';

const description =
  'Your first medical-bill audit is free. Paxer Plus unlocks unlimited audits and dispute letters: a flat subscription, keep 100% of recoveries.';

export const metadata: Metadata = {
  title: 'Pricing',
  description,
  alternates: { canonical: '/pricing' },
  openGraph: { title: 'Pricing · Paxer', description, url: '/pricing' },
};

function Tier({
  name,
  price,
  sub,
  features,
  cta,
  href,
  highlight,
  external,
}: {
  name: string;
  price: string;
  sub: string;
  features: string[];
  cta: string;
  href: string;
  highlight?: boolean;
  external?: boolean;
}) {
  return (
    <div className="flex h-full flex-col gap-4 border border-rule p-6">
      <div>
        <h2 className="text-lg font-bold text-ink">{name}</h2>
        <p className="mt-1 text-xl font-bold tabular-nums text-ink">{price}</p>
        <p className="mt-2 text-sm leading-relaxed text-muted">{sub}</p>
      </div>
      <ul className="flex flex-1 list-disc flex-col gap-1.5 pl-5 text-sm text-muted">
        {features.map((f) => (
          <li key={f}>{f}</li>
        ))}
      </ul>
      <Button asChild variant={highlight ? 'default' : 'outline'} className="w-full">
        {external ? <a href={href}>{cta}</a> : <Link href={href}>{cta}</Link>}
      </Button>
    </div>
  );
}

export default function PricingPage() {
  const plusPrice = CONSUMER_PLAN.priceLabel;

  return (
    <div className="flex min-h-screen flex-col">
      <MarketingHeader />
      <main className="flex-1">
        <section className="container py-12 md:py-16">
          <div className="max-w-2xl">
            <h1 className="text-3xl font-bold text-ink">Your first audit is free.</h1>
            <p className="mt-4 leading-relaxed text-muted">
              Paxer Plus unlocks unlimited audits and dispute letters: a flat subscription, never a
              cut of your recovery. The same engine is available to businesses as an API.
            </p>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-3">
            <Tier
              name="Paxer Plus"
              price={plusPrice}
              sub="For patients. First audit free; Paxer Plus unlocks unlimited audits and dispute letters. Flat, no contingency."
              highlight
              features={[
                'Unlimited bill audits',
                'AI-drafted dispute letters (you review & send)',
                'Track outcomes and recoveries',
                'Keep 100% of what you recover, no contingency',
                'Cancel anytime',
              ]}
              cta="Get started free"
              href="/login"
            />
            <Tier
              name="Audit API"
              price={`Free → ${API_PLANS.scale.priceLabel}`}
              sub="For developers: embed the audit engine in your own software. Self-serve monthly plans, sized by call volume."
              features={[
                'Embedded /api/v1/audit endpoint: your code calls it',
                `Free to start: ${API_PLANS.free.monthlyQuota} API calls/mo`,
                `Pro: ${API_PLANS.pro.priceLabel} for ${API_PLANS.pro.monthlyQuota.toLocaleString()} calls`,
                `Scale: ${API_PLANS.scale.priceLabel} for ${API_PLANS.scale.monthlyQuota.toLocaleString()} calls`,
                'Enterprise volume & SLA: contact us',
              ]}
              cta="Get a free API key"
              href="/login?next=/app/settings"
            />
            <Tier
              name="Employers & TPAs"
              price="Let’s talk"
              sub="Give your workforce Paxer as a benefit: per-member (PEPM), sales-led."
              features={[
                'Bill-review benefit for your whole population',
                'Per-member pricing (PEPM)',
                'Aggregate savings reporting for your population',
                'Member roster import & rollout',
                'Dedicated support · design-partner program now onboarding',
              ]}
              cta="Contact us"
              href="mailto:hello@paxer.app?subject=Paxer%20for%20employers"
              external
            />
          </div>

          <p className="mt-8 text-sm text-muted">
            Questions about pricing?{' '}
            <a
              className="text-accent underline"
              href="mailto:hello@paxer.app?subject=Paxer%20pricing"
            >
              hello@paxer.app
            </a>
          </p>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
