import type { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { MarketingHeader } from '@/components/marketing-header';
import { SiteFooter } from '@/components/site-footer';
import { HeroBillDemo } from '@/components/hero-bill-demo';
import { ErrorTypes } from '@/components/landing/error-types';
import { ProcessSteps } from '@/components/landing/process-steps';
import { DEMO_ENABLED } from '@/lib/auth/demo';
import { REQUEST_DEMO_URL } from '@/lib/marketing';

// The homepage canonical lives here (not in the root layout) so other routes
// don't inherit a canonical pointing at "/".
export const metadata: Metadata = {
  alternates: { canonical: '/' },
};

// The magic link both registers new users and signs in returning ones. The
// in-app instant demo (?demo=1) only exists outside production.
const SELF_SERVE = DEMO_ENABLED
  ? { href: '/login?demo=1', label: 'Try the demo' }
  : { href: '/login', label: 'Sign in' };

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <MarketingHeader />

      <main className="flex-1">
        {/* The headline sets the measure; the sample bill sits under it at full
            width rather than beside it, so neither column is left half-empty. */}
        <section className="measure pb-14 pt-16">
          <h1 className="max-w-[19ch] text-balance">
            Check your medical bills for billing errors.
          </h1>
          <p className="mt-5 max-w-[58ch] text-lg leading-relaxed text-muted">
            Paxer checks a bill or EOB against your insurance plan, shows the math on anything that
            looks wrong, and drafts the dispute letter for you to send.
          </p>
          <div className="mt-7 flex flex-wrap items-center gap-3">
            <Button asChild size="lg">
              <Link href={SELF_SERVE.href}>{SELF_SERVE.label}</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <a href={REQUEST_DEMO_URL} target="_blank" rel="noopener noreferrer">
                Request a demo
                <span className="sr-only"> (opens in a new tab)</span>
              </a>
            </Button>
          </div>

          <div className="mt-14">
            <HeroBillDemo />
          </div>
        </section>

        <section className="measure border-t border-rule py-12">
          <h2>What it checks</h2>
          <ErrorTypes />
        </section>

        <section className="measure border-t border-rule py-12">
          <h2>How it works</h2>
          <ProcessSteps />
          <p className="mt-8 text-sm">
            <Link href="/how-it-works" className="text-accent underline">
              Full walkthrough and FAQ
            </Link>
          </p>
        </section>

        <section className="measure border-t border-rule py-12">
          <h2>For developers</h2>
          <p className="mt-3 max-w-[58ch] leading-relaxed text-muted">
            The same audit engine is available as an API. Send a bill&rsquo;s line items, get back
            the errors. Free to start.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button asChild variant="outline">
              <Link href="/developers">Read the docs</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/pricing">Pricing</Link>
            </Button>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
