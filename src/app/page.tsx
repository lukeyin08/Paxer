import type { Metadata } from 'next';
import Link from 'next/link';
import { Kicker } from '@/components/brand/kicker';
import { Button } from '@/components/ui/button';
import { MarketingHeader } from '@/components/marketing-header';
import { SiteFooter } from '@/components/site-footer';
import { HeroBillDemo } from '@/components/hero-bill-demo';
import { Reveal } from '@/components/reveal';
import { StatShowcase } from '@/components/landing/stat-showcase';
import { ErrorTypes } from '@/components/landing/error-types';
import { ProcessSteps } from '@/components/landing/process-steps';
import { ScrollShowcase } from '@/components/landing/scroll-showcase';
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
        <section className="container py-20 md:py-28">
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
            <div className="max-w-2xl animate-fade-up">
              <Kicker className="mb-5">Patient-side medical billing advocate</Kicker>
              <h1 className="font-sans text-4xl font-semibold leading-[1.08] text-ink md:text-5xl">
                The <span className="text-gradient">advocate</span> on the patient&rsquo;s side of
                the bill.
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted">
                Paxer audits the medical bills and EOBs you actually receive, finds the errors, and
                helps you get your own money back. Most tools in medical billing work for the
                hospital. Paxer works for you.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
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
                <Link href={SELF_SERVE.href} className="font-medium text-accent hover:underline">
                  {SELF_SERVE.label} &rarr;
                </Link>
              </p>
            </div>
            <div className="relative flex justify-center animate-fade-up [animation-delay:120ms] lg:justify-end">
              {/* Soft accent halo behind the floating demo card */}
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,hsl(var(--accent)/0.22),transparent_70%)] blur-2xl"
              />
              <div className="relative animate-float">
                <HeroBillDemo />
              </div>
            </div>
          </div>
        </section>

        {/* Stat blocks — three distinct, animated visuals */}
        <section className="border-y border-rule bg-soft/40">
          <StatShowcase />
        </section>

        {/* Error types */}
        <section className="container py-20">
          <Kicker className="mb-3">What Paxer finds</Kicker>
          <h2 className="max-w-2xl font-sans text-3xl font-semibold text-ink">
            Four kinds of error, hiding in plain sight.
          </h2>
          <ErrorTypes />
        </section>

        {/* How it works — at-a-glance teaser; the worked example lives on /how-it-works */}
        <section className="border-t border-rule bg-soft/40">
          <div className="container py-20">
            <Kicker className="mb-3">How it works</Kicker>
            <h2 className="max-w-2xl font-sans text-3xl font-semibold text-ink">
              Three steps, and you stay in control.
            </h2>
            <ProcessSteps />
            <div className="mt-10">
              <Link
                href="/how-it-works"
                className="text-sm font-medium text-accent hover:underline"
              >
                See it on an example bill: a full walkthrough and FAQ &rarr;
              </Link>
            </div>
          </div>
        </section>

        {/* Product showcase — scroll-driven dashboard reveal */}
        <section className="overflow-hidden">
          <ScrollShowcase />
        </section>

        {/* For businesses & developers */}
        <section className="container py-20">
          <Reveal>
            <div className="flex flex-col items-start justify-between gap-6 rounded-lg border border-rule bg-soft/40 p-8 md:flex-row md:items-center">
              <div className="max-w-xl">
                <Kicker className="mb-2">For businesses &amp; developers</Kicker>
                <h2 className="font-sans text-2xl font-semibold text-ink">
                  The same audit engine, as an API.
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-muted">
                  For {API_BUYERS}, the parties whose incentives line up with the patient. Check a
                  bill for errors with one API call. Free to start, then tiered plans.
                </p>
              </div>
              <div className="flex shrink-0 gap-3">
                <Button asChild variant="outline">
                  <Link href="/developers">Developers</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href="/pricing">Pricing</Link>
                </Button>
              </div>
            </div>
          </Reveal>
        </section>

        {/* CTA */}
        <section className="container py-24 text-center">
          <Reveal>
            <h2 className="mx-auto max-w-2xl font-sans text-3xl font-semibold text-ink md:text-4xl">
              See what your bill is hiding.
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-muted">
              Book a guided walkthrough, or add your first bill and get your findings in minutes.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
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
          </Reveal>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
