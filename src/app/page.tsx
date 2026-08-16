import type { Metadata } from 'next';
import Link from 'next/link';
import { MarketingHeader } from '@/components/marketing-header';
import { SiteFooter } from '@/components/site-footer';
import { HeroBillDemo } from '@/components/hero-bill-demo';
import { ErrorTypes } from '@/components/landing/error-types';
import { ProcessSteps } from '@/components/landing/process-steps';
import { DEMO_ENABLED } from '@/lib/auth/demo';

// The homepage canonical lives here (not in the root layout) so other routes
// don't inherit a canonical pointing at "/".
export const metadata: Metadata = {
  alternates: { canonical: '/' },
};

// The magic link both registers new users and signs in returning ones. The
// in-app instant demo (?demo=1) only exists outside production.
const SELF_SERVE = DEMO_ENABLED ? '/login?demo=1' : '/login';

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <MarketingHeader />

      <main className="flex-1">
        {/* Centred display hero: eyebrow pill, oversized headline with one word
            carrying the accent, one-line positioning statement, single CTA. */}
        <section className="measure py-16 text-center md:py-24">
          <Link
            href="/pricing"
            className="inline-flex items-center gap-2 bg-ink px-4 py-2 text-xs text-paper hover:text-accent"
          >
            Your first bill audit is free.
            <span aria-hidden>&rsaquo;</span>
          </Link>

          <h1 className="mx-auto mt-10 max-w-[16ch] text-balance">
            Your medical bill is probably <span className="hl">wrong</span>.
          </h1>

          <p className="mx-auto mt-8 max-w-[46ch] text-lg leading-snug text-muted md:text-xl">
            Paxer audits medical bills and EOBs for patients, employers, and the platforms that
            serve them.
          </p>

          <div className="mt-10">
            <Link
              href={SELF_SERVE}
              className="inline-flex items-center gap-3 bg-ink px-8 py-4 font-medium text-paper hover:bg-accent hover:text-accent-foreground"
            >
              Audit your first bill
              <span aria-hidden>&#8599;</span>
            </Link>
          </div>
        </section>

        {/* Split explainer: statement on the left, the detail on the right. */}
        <section className="border-t border-rule">
          <div className="measure grid grid-cols-1 gap-8 py-14 md:grid-cols-2 md:gap-16">
            <h2 className="max-w-[18ch] text-balance">
              Every charge, checked against your actual plan.
            </h2>
            <div className="leading-relaxed text-muted">
              <p>
                Paxer reads a bill or EOB and recomputes your deductible, coinsurance, and
                out-of-pocket maximum from your real plan. Anything that does not line up gets
                flagged with the arithmetic behind it, so you can see exactly where the number went
                wrong.
              </p>
              <p className="mt-4">
                Where a charge is disputable, Paxer drafts the letter and tracks the response
                deadline. You review it and send it. Paxer never takes a cut of what you recover.
              </p>
            </div>
          </div>
        </section>

        <section className="border-t border-rule">
          <div className="measure py-14">
            <HeroBillDemo />
          </div>
        </section>

        <section className="border-t border-rule">
          <div className="measure py-14">
            <h2>What it catches.</h2>
            <ErrorTypes />
          </div>
        </section>

        <section className="border-t border-rule">
          <div className="measure py-14">
            <h2>Three steps.</h2>
            <ProcessSteps />
            <p className="mt-8 text-sm">
              <Link href="/how-it-works" className="link">
                Full walkthrough and FAQ
              </Link>
            </p>
          </div>
        </section>

        <section className="border-t border-rule">
          <div className="measure grid grid-cols-1 gap-8 py-14 md:grid-cols-2 md:gap-16">
            <h2 className="max-w-[18ch] text-balance">The same engine, as an API.</h2>
            <div className="leading-relaxed text-muted">
              <p>
                Send a bill&rsquo;s line items, get back the errors with an explanation and an
                estimated recoverable amount. Free to start, then monthly plans sized by call
                volume.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href="/developers"
                  className="inline-flex items-center gap-2 bg-ink px-6 py-3 text-sm font-medium text-paper hover:bg-accent hover:text-accent-foreground"
                >
                  Read the docs
                  <span aria-hidden>&#8599;</span>
                </Link>
                <Link
                  href="/pricing"
                  className="inline-flex items-center border border-ink px-6 py-3 text-sm font-medium text-ink hover:bg-soft"
                >
                  Pricing
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
