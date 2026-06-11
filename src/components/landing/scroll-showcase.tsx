'use client';

import { CheckCircle2 } from 'lucide-react';
import { ContainerScroll } from '@/components/ui/container-scroll-animation';

// Illustrative case findings (not a real patient). Kept distinct from the other
// examples on the site (the hero EOB and the /how-it-works worked example) so we
// never show the same bill twice. The amounts sum to the recoverable total on
// the right rail, so the numbers stay consistent.
const FINDINGS = [
  { title: 'Out-of-network anesthesia', tag: 'Balance bill', amount: '$620' },
  { title: 'Unbundled supply kit', tag: 'Unbundling', amount: '$540' },
  { title: 'Duplicate lab panel', tag: 'Duplicate', amount: '$190' },
  { title: 'Upcoded follow-up visit', tag: 'Upcoding', amount: '$150' },
];

/**
 * Landing-page showcase: a Paxer case dashboard mocked up inside the
 * scroll-driven 3D card reveal. Built from on-brand markup (no remote images,
 * so it stays within the site's `img-src 'self'` CSP).
 */
export function ScrollShowcase() {
  return (
    <ContainerScroll
      titleComponent={
        <div className="mb-2 px-4">
          <p className="kicker mb-3">Your dashboard</p>
          <h2 className="font-sans text-3xl font-semibold text-ink md:text-5xl">
            Every finding, every dollar,{' '}
            <span className="text-gradient">in one place.</span>
          </h2>
        </div>
      }
    >
      <div className="flex h-full flex-col text-left">
        {/* Faux app chrome */}
        <div className="flex items-center gap-2 border-b border-rule bg-soft/70 px-4 py-3">
          <span className="h-3 w-3 rounded-full bg-danger/70" />
          <span className="h-3 w-3 rounded-full bg-warning/70" />
          <span className="h-3 w-3 rounded-full bg-success/70" />
          <span className="ml-3 truncate font-mono text-[0.7rem] text-muted sm:text-xs">
            paxer.app/app/cases/lakeshore-surgical
          </span>
        </div>

        {/* Dashboard body */}
        <div className="grid flex-1 grid-cols-1 gap-5 overflow-hidden p-5 md:grid-cols-[1.5fr_1fr] md:gap-6 md:p-8">
          {/* Left: findings list */}
          <div className="flex min-h-0 flex-col">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="kicker mb-1">Case · Lakeshore Surgical</p>
                <h3 className="font-sans text-lg font-semibold text-ink md:text-2xl">
                  Outpatient surgery audit
                </h3>
              </div>
              <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-success/10 px-3 py-1 text-xs font-medium text-success">
                <CheckCircle2 className="h-3.5 w-3.5" /> Audit complete
              </span>
            </div>
            <div className="mt-4 flex flex-col divide-y divide-rule overflow-hidden rounded-xl border border-rule bg-card md:mt-5">
              {FINDINGS.map((f) => (
                <div key={f.title} className="flex items-center justify-between gap-3 px-4 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-ink">{f.title}</p>
                    <p className="font-mono text-[0.6rem] uppercase tracking-wider text-muted">
                      {f.tag}
                    </p>
                  </div>
                  <span className="shrink-0 font-mono text-sm font-semibold text-success">
                    {f.amount}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Right: recoverable total + drafted letter. On phones it stacks
              below the findings (the card height grows with its content). */}
          <div className="flex flex-col gap-4 rounded-xl border border-accent/20 bg-accent/[0.06] p-5 md:gap-5 md:p-6">
            <div>
              <p className="kicker mb-2">Estimated recoverable</p>
              <p className="text-gradient font-sans text-4xl font-semibold md:text-5xl">$1,500</p>
              <p className="mt-2 text-sm text-muted">across 4 findings on one bill</p>
            </div>
            <div className="rounded-lg border border-rule bg-paper/60 px-4 py-3 text-sm leading-relaxed text-muted">
              Paxer drafted a dispute letter citing each finding, ready for you to review and send.
            </div>
            <div className="mt-auto inline-flex items-center justify-center rounded-md bg-accent px-4 py-2.5 text-sm font-medium text-accent-foreground shadow-glow-sm">
              Review the letter &rarr;
            </div>
          </div>
        </div>
      </div>
    </ContainerScroll>
  );
}
