import Link from 'next/link';
import { MarketingMobileMenu } from '@/components/marketing-mobile-menu';

const LINKS = [
  { href: '/how-it-works', label: 'How it works' },
  { href: '/results', label: 'Results' },
  { href: '/pricing', label: 'Pricing' },
  { href: '/developers', label: 'Developers' },
];

/**
 * Full-bleed black bar, cell-ruled: the wordmark, each nav item, and the CTA sit
 * in their own compartment separated by vertical hairlines, with the CTA flush
 * to the right edge on the accent green. No inner measure — the bar spans the
 * viewport so the rules run edge to edge.
 */
export function MarketingHeader() {
  return (
    <header className="sticky top-0 z-40 bg-ink text-paper">
      <div className="flex h-11 items-stretch text-sm">
        <Link
          href="/"
          aria-label="Paxer home"
          className="flex shrink-0 items-center gap-2 border-r border-paper/15 px-5 font-bold uppercase tracking-[0.1em] hover:text-accent"
        >
          Paxer
        </Link>

        <nav className="hidden items-stretch md:flex">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="flex items-center border-r border-paper/15 px-6 hover:text-accent"
            >
              {l.label}
            </Link>
          ))}
        </nav>

        {/* Spacer cell carries the rule across the empty middle. */}
        <div className="flex-1 border-r border-paper/15" />

        <Link
          href="/login"
          className="flex shrink-0 items-center bg-accent px-6 font-medium text-accent-foreground hover:bg-paper hover:text-ink"
        >
          Sign in
        </Link>
        <MarketingMobileMenu links={LINKS} />
      </div>
    </header>
  );
}
