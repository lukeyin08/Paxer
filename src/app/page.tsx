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
        <section className="container py-12">
          <div className="grid grid-cols-1 items-start gap-10 lg:grid-cols-2">
            <div className="max-w-xl">
              <h1 className="text-3xl font-bold text-ink">
                Check your medical bills for billing errors.
              </h1>
              <p className="mt-4 leading-relaxed text-muted">
                Paxer checks a bill or EOB against your insurance plan, shows the math on anything
                that looks wrong, and drafts the dispute letter for you to send.
              </p>
              <div className="mt-6 flex flex-wrap items-center gap-3">
                <Button asChild>
                  <Link href={SELF_SERVE.href}>{SELF_SERVE.label}</Link>
                </Button>
                <Button asChild variant="outline">
                  <a href={REQUEST_DEMO_URL} target="_blank" rel="noopener noreferrer">
                    Request a demo
                    <span className="sr-only"> (opens in a new tab)</span>
                  </a>
                </Button>
              </div>
            </div>
            <div className="flex lg:justify-end">
              <HeroBillDemo />
            </div>
          </div>
        </section>

        <section className="container border-t border-rule py-10">
          <h2 className="text-lg font-bold text-ink">What it checks</h2>
          <ErrorTypes />
        </section>

        <section className="container border-t border-rule py-10">
          <h2 className="text-lg font-bold text-ink">How it works</h2>
          <ProcessSteps />
          <p className="mt-6 text-sm">
            <Link href="/how-it-works" className="text-accent underline">
              Full walkthrough and FAQ
            </Link>
          </p>
        </section>

        <section className="container border-t border-rule py-10">
          <h2 className="text-lg font-bold text-ink">For developers</h2>
          <p className="mt-2 max-w-xl text-muted">
            The same audit engine is available as an API. Free to start.{' '}
            <Link href="/developers" className="text-accent underline">
              Docs
            </Link>{' '}
            and{' '}
            <Link href="/pricing" className="text-accent underline">
              pricing
            </Link>
            .
          </p>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
