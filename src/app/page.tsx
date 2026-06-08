import Link from 'next/link';
import { Kicker } from '@/components/brand/kicker';
import { StatBlock } from '@/components/brand/stat-block';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MarketingHeader } from '@/components/marketing-header';
import { SiteFooter } from '@/components/site-footer';
import { DEMO_ENABLED } from '@/lib/auth/demo';
import { defaultFeeRate } from '@/lib/audit/fees';
import { PROCESS_STEPS, ERROR_TYPES, API_BUYERS } from '@/lib/marketing';

// The instant demo only exists in non-production (the Credentials provider is
// disabled in prod). So the public CTA points to the real sign-in there instead
// of dead-ending on a "demo" that isn't available.
const PRIMARY_CTA = DEMO_ENABLED
  ? { href: '/login?demo=1', label: 'View the demo' }
  : { href: '/login', label: 'Get started' };

export default function LandingPage() {
  // Derived from the configured fee so the headline can't contradict the app.
  const isFree = defaultFeeRate() === 0;
  const keepPct = Math.round((1 - defaultFeeRate()) * 100);
  return (
    <div className="flex min-h-screen flex-col">
      <MarketingHeader />

      <main className="flex-1">
        {/* Hero */}
        <section className="container py-20 md:py-28">
          <div className="max-w-3xl animate-fade-up">
            <Kicker className="mb-5">Patient-side medical billing advocate</Kicker>
            <h1 className="font-sans text-4xl font-semibold leading-[1.1] text-ink md:text-6xl">
              The only advocate on the patient&rsquo;s side of the bill.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted">
              Paxer audits the medical bills and EOBs you actually receive, finds the errors, and
              helps you get your own money back. Every other tool in medical billing works for the
              hospital. Paxer works for you.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Button asChild size="lg">
                <Link href={PRIMARY_CTA.href}>{PRIMARY_CTA.label}</Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/how-it-works">See how it works</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Stat blocks */}
        <section className="border-y border-rule bg-soft/40">
          <div className="container grid grid-cols-1 gap-8 py-12 sm:grid-cols-3">
            <StatBlock
              label="Of bills contain errors"
              value="80%"
              hint="Industry estimates put error rates on complex, itemized hospital bills in this range."
            />
            <StatBlock
              label="Saved by Paxer users"
              value="$10k+"
              hint="In duplicate charges, denials, and cost-share errors caught and recovered."
            />
            <StatBlock
              label={isFree ? 'Free for individuals' : 'You keep'}
              value={isFree ? '$0' : `${keepPct}%`}
              hint={
                isFree
                  ? 'Paxer is free for patients — we never take a cut of what you recover.'
                  : 'Paxer takes a share only of dollars actually returned to you.'
              }
            />
          </div>
        </section>

        {/* Error types */}
        <section className="container py-20">
          <Kicker className="mb-3">What Paxer finds</Kicker>
          <h2 className="max-w-2xl font-sans text-3xl font-semibold text-ink">
            Four kinds of error, hiding in plain sight.
          </h2>
          <div className="mt-10 grid grid-cols-1 gap-px overflow-hidden rounded-lg border border-rule bg-rule sm:grid-cols-2">
            {ERROR_TYPES.map((e) => (
              <div key={e.title} className="bg-card p-8">
                <h3 className="font-sans text-xl font-semibold text-ink">{e.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted">{e.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* How it works — at-a-glance teaser; the worked example lives on /how-it-works */}
        <section className="border-t border-rule bg-soft/40">
          <div className="container py-20">
            <Kicker className="mb-3">How it works</Kicker>
            <h2 className="max-w-2xl font-sans text-3xl font-semibold text-ink">
              Three steps, and you stay in control.
            </h2>
            <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-3">
              {PROCESS_STEPS.map((c) => (
                <Card key={c.step}>
                  <CardContent className="pt-6">
                    <span className="font-mono text-sm text-accent">{c.step}</span>
                    <h3 className="mt-3 font-sans text-xl font-semibold text-ink">{c.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted">{c.body}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
            <div className="mt-8">
              <Link
                href="/how-it-works"
                className="text-sm font-medium text-accent hover:underline"
              >
                See it on a real bill — a worked example &amp; FAQ &rarr;
              </Link>
            </div>
          </div>
        </section>

        {/* For businesses & developers */}
        <section className="container py-20">
          <div className="flex flex-col items-start justify-between gap-6 rounded-lg border border-rule bg-soft/40 p-8 md:flex-row md:items-center">
            <div className="max-w-xl">
              <Kicker className="mb-2">For businesses &amp; developers</Kicker>
              <h2 className="font-sans text-2xl font-semibold text-ink">
                The same audit engine, as an API.
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                For {API_BUYERS} — the parties whose incentives line up with the patient. Check a
                bill for errors with one API call. Free for individuals; usage-based for businesses.
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
        </section>

        {/* CTA */}
        <section className="container py-24 text-center">
          <h2 className="mx-auto max-w-2xl font-sans text-3xl font-semibold text-ink md:text-4xl">
            See what your bill is hiding.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-muted">
            {DEMO_ENABLED
              ? 'Walk the full loop on a seeded demo case. No sign-up required.'
              : 'Add your first bill and see what it’s hiding in minutes.'}
          </p>
          <div className="mt-8">
            <Button asChild size="lg">
              <Link href={PRIMARY_CTA.href}>{PRIMARY_CTA.label}</Link>
            </Button>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
