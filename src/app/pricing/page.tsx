import type { Metadata } from 'next';
import Link from 'next/link';
import { Kicker } from '@/components/brand/kicker';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MarketingHeader } from '@/components/marketing-header';
import { SiteFooter } from '@/components/site-footer';
import { Check } from 'lucide-react';
import { env } from '@/lib/env';
import { API_PLANS } from '@/lib/billing/plans';

export const metadata: Metadata = {
  title: 'Pricing — Paxer Plus & Audit API',
  description:
    'Your first medical-bill audit is free. Paxer Plus unlocks unlimited audits and dispute letters — a flat subscription, no contingency, keep 100% of recoveries. The Audit API is usage-based for businesses.',
  alternates: { canonical: '/pricing' },
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
    <Card
      className={`h-full transition duration-200 hover:-translate-y-1 hover:shadow-md ${
        highlight ? 'border-2 border-accent' : ''
      }`}
    >
      <CardContent className="flex h-full flex-col gap-5 pt-6">
        {highlight && (
          <span className="-mt-1 self-start rounded-full bg-accent/10 px-2 py-0.5 font-mono text-[0.6rem] uppercase tracking-wider text-accent">
            Most popular
          </span>
        )}
        <div>
          <h2 className="font-sans text-xl font-semibold text-ink">{name}</h2>
          <p className="mt-3 font-sans text-3xl font-semibold text-ink">{price}</p>
          <p className="mt-1 text-sm text-muted">{sub}</p>
        </div>
        <ul className="flex flex-1 flex-col gap-2 text-sm text-muted">
          {features.map((f) => (
            <li key={f} className="flex gap-2">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
              <span>{f}</span>
            </li>
          ))}
        </ul>
        <Button asChild variant={highlight ? 'default' : 'outline'} className="w-full">
          {external ? <a href={href}>{cta}</a> : <Link href={href}>{cta}</Link>}
        </Button>
      </CardContent>
    </Card>
  );
}

export default function PricingPage() {
  const plusPrice = env.PAXER_CONSUMER_PRICE_LABEL || '$12/mo';

  return (
    <div className="flex min-h-screen flex-col">
      <MarketingHeader />
      <main className="flex-1">
        <section className="container py-16 md:py-20">
          <div className="max-w-2xl animate-fade-up">
            <Kicker className="mb-4">Pricing</Kicker>
            <h1 className="font-sans text-4xl font-semibold leading-[1.1] text-ink md:text-5xl">
              Your first audit is free.
            </h1>
            <p className="mt-5 text-lg leading-relaxed text-muted">
              Your first bill audit is free. Paxer Plus unlocks unlimited audits and dispute
              letters — a flat subscription, never a cut of your recovery. The same engine is
              available to businesses as an API.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
            <Tier
              name="Paxer Plus"
              price={plusPrice}
              sub="For patients. First audit free, then unlimited — flat, no contingency."
              highlight
              features={[
                'Unlimited bill audits',
                'AI-drafted dispute letters (you review & send)',
                'Track outcomes and recoveries',
                'Keep 100% of what you recover — no contingency',
                'Cancel anytime',
              ]}
              cta="Get started free"
              href="/login"
            />
            <Tier
              name="Audit API"
              price={`Free → ${API_PLANS.pro.priceLabel}`}
              sub="For developers: embed the audit engine in your own software. Self-serve, billed per API call."
              features={[
                'Embedded /api/v1/audit endpoint — your code calls it',
                `${API_PLANS.free.monthlyQuota} free API calls/mo to start`,
                `Pro: ${API_PLANS.pro.monthlyQuota.toLocaleString()}/mo (${API_PLANS.pro.priceLabel}) · Scale: ${API_PLANS.scale.monthlyQuota.toLocaleString()}/mo (${API_PLANS.scale.priceLabel})`,
                'Bearer API keys — create & revoke anytime',
                'Enterprise volume & SLA — contact us',
              ]}
              cta="Get an API key — free"
              href="/login?next=/app/settings"
            />
            <Tier
              name="Employers & TPAs"
              price="Let’s talk"
              sub="Give your workforce Paxer as a benefit — per-member (PEPM) or shared-savings, sales-led."
              features={[
                'Bill-review benefit for your whole population',
                'Per-member pricing (PEPM) or shared savings',
                'Aggregate savings reporting (your people recovered $X)',
                'Member roster import & rollout',
                'Dedicated support · design-partner program now onboarding',
              ]}
              cta="Contact us"
              href="mailto:ly3569@princeton.edu?subject=Paxer%20for%20employers"
              external
            />
          </div>

          <p className="mt-10 text-center text-sm text-muted">
            Questions about pricing?{' '}
            <a className="text-accent hover:underline" href="mailto:ly3569@princeton.edu?subject=Paxer%20pricing">
              ly3569@princeton.edu
            </a>
          </p>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
