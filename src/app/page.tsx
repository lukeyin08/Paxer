import type { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { MarketingHeader } from '@/components/marketing-header';
import { SiteFooter } from '@/components/site-footer';
import { HeroBillDemo } from '@/components/hero-bill-demo';
import { StatShowcase } from '@/components/landing/stat-showcase';
import { ErrorTypes } from '@/components/landing/error-types';
import { ProcessSteps } from '@/components/landing/process-steps';
import { ProductShowcase } from '@/components/landing/product-showcase';
import { DEMO_ENABLED } from '@/lib/auth/demo';
import { API_BUYERS, REQUEST_DEMO_URL } from '@/lib/marketing';

// The homepage canonical lives here (not in the root layout) so other routes
// don't inherit a canonical pointing at "/".
export const metadata: Metadata = {
  alternates: { canonical: '/' },
};

// "Request a demo" (a guided walkthrough, booked off-site) is the primary CTA.
// Self-serve sign-in stays one click away so visitors can start on their own;
// the magic link both registers new users and signs in returning ones. The
// in-app instant demo (?demo=1) only exists outside production.
const SELF_SERVE = DEMO_ENABLED
  ? { href: '/login?demo=1', label: 'Try the instant demo' }
  : { href: '/login', label: 'Sign in to get started' };

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <MarketingHeader />

      <main className="flex-1">
        {/* Hero */}
        <section className="container py-12 md:py-16">
          <div className="grid grid-cols-1 items-start gap-10 lg:grid-cols-2">
            <div className="max-w-2xl">
              <h1 className="text-3xl font-bold text-ink md:text-4xl">
                The advocate on the patient&rsquo;s side of the bill.
              </h1>
              <p className="mt-4 max-w-2xl leading-relaxed text-muted">
                Paxer checks your medical bills and EOBs against your insurance plan and flags the
                charges that look wrong. For each one it shows the math and drafts a dispute letter
                you can review and send.
              </p>
              <div className="mt-6 flex flex-wrap items-center gap-3">
                <Button asChild size="lg">
                  <a href={REQUEST_DEMO_URL} target="_blank" rel="noopener noreferrer">
                    Request a demo
                    <span className="sr-only"> (opens in a new tab)</span>
                  </a>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link href="/how-it-works">How it works</Link>
                </Button>
              </div>
              <p className="mt-4 text-sm text-muted">
                Prefer to dive in yourself?{' '}
                <Link href={SELF_SERVE.href} className="text-accent underline">
                  {SELF_SERVE.label}
                </Link>
                .
              </p>
            </div>
            <div className="flex lg:justify-end">
              <HeroBillDemo />
            </div>
          </div>
        </section>

        {/* Stat blocks */}
        <section className="border-t border-rule">
          <StatShowcase />
        </section>

        {/* Error types */}
        <section className="container border-t border-rule py-14">
          <h2 className="text-2xl font-bold text-ink">What Paxer checks for</h2>
          <ErrorTypes />
        </section>

        {/* How it works — at-a-glance teaser; the worked example lives on /how-it-works */}
        <section className="container border-t border-rule py-14">
          <h2 className="text-2xl font-bold text-ink">How it works</h2>
          <ProcessSteps />
          <p className="mt-8">
            <Link href="/how-it-works" className="text-accent underline">
              Read the full walkthrough and FAQ
            </Link>
            .
          </p>
        </section>

        {/* Product showcase */}
        <div className="border-t border-rule">
          <ProductShowcase />
        </div>

        {/* For businesses & developers */}
        <section className="container border-t border-rule py-14">
          <h2 className="text-2xl font-bold text-ink">Audit API</h2>
          <p className="mt-2 max-w-2xl leading-relaxed text-muted">
            The same audit engine is available to {API_BUYERS}. Send a bill&rsquo;s line items, get
            back the errors. Free to start, then tiered monthly plans.
          </p>
          <div className="mt-6 flex gap-3">
            <Button asChild variant="outline">
              <Link href="/developers">Developers</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/pricing">Pricing</Link>
            </Button>
          </div>
        </section>

        {/* CTA */}
        <section className="container border-t border-rule py-14">
          <h2 className="text-2xl font-bold text-ink">Check your first bill</h2>
          <p className="mt-2 max-w-2xl text-muted">
            Book a guided walkthrough, or add a bill yourself and get the findings in a few minutes.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Button asChild size="lg">
              <a href={REQUEST_DEMO_URL} target="_blank" rel="noopener noreferrer">
                Request a demo
                <span className="sr-only"> (opens in a new tab)</span>
              </a>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href={SELF_SERVE.href}>{SELF_SERVE.label}</Link>
            </Button>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
