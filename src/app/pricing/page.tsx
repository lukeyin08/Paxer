import type { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { MarketingHeader } from '@/components/marketing-header';
import { SiteFooter } from '@/components/site-footer';
import { API_PLANS } from '@/lib/billing/plans';
import { CONSUMER_PLAN } from '@/lib/billing/consumer';

const description =
  'Your first medical bill audit is free. Paxer Plus is a flat monthly subscription for unlimited audits and dispute letters. You keep 100% of recoveries.';

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
        {/* Card title, not a section heading: keep it a step below the page h1
            so three tiers sit level and "Employers & TPAs" doesn't wrap. */}
        <h2 className="text-lg leading-snug">{name}</h2>
        <p className="mt-2 font-sans text-2xl font-semibold tabular-nums text-ink">{price}</p>
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
        <section className="measure py-12 md:py-16">
          <div className="max-w-2xl">
            <h1>Your first audit is free.</h1>
            <p className="mt-4 max-w-2xl leading-relaxed text-muted">
              After that, Paxer Plus is a flat monthly subscription. Paxer never takes a cut of what
              you recover.
            </p>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-3">
            <Tier
              name="Paxer Plus"
              price={plusPrice}
              sub="For patients."
              highlight
              features={[
                'Unlimited bill audits',
                'Dispute letters you review and send',
                'Keep 100% of what you recover',
                'Cancel anytime',
              ]}
              cta="Get started free"
              href="/login"
            />
            <Tier
              name="Audit API"
              price={`Free → ${API_PLANS.scale.priceLabel}`}
              sub="For developers. Monthly plans sized by call volume."
              features={[
                `Free: ${API_PLANS.free.monthlyQuota} calls/mo`,
                `Pro: ${API_PLANS.pro.priceLabel} for ${API_PLANS.pro.monthlyQuota.toLocaleString()} calls`,
                `Scale: ${API_PLANS.scale.priceLabel} for ${API_PLANS.scale.monthlyQuota.toLocaleString()} calls`,
                'Enterprise volume and SLA: contact us',
              ]}
              cta="Get a free API key"
              href="/login?next=/app/settings"
            />
            <Tier
              name="Employers & TPAs"
              price="Let’s talk"
              sub="Paxer as an employee benefit."
              features={[
                'Per-member pricing (PEPM)',
                'Aggregate savings reporting',
                'Member roster import',
                'Dedicated support',
              ]}
              cta="Contact us"
              href="mailto:hello@paxer.app?subject=Paxer%20for%20employers"
              external
            />
          </div>

          <p className="mt-8 text-sm text-muted">
            Questions about pricing?{' '}
            <a className="link" href="mailto:hello@paxer.app?subject=Paxer%20pricing">
              hello@paxer.app
            </a>
          </p>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
