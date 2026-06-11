import Link from 'next/link';
import { Wordmark } from '@/components/brand/wordmark';
import { Button } from '@/components/ui/button';
import { MarketingMobileMenu } from '@/components/marketing-mobile-menu';
import { REQUEST_DEMO_URL } from '@/lib/marketing';

const LINKS = [
  { href: '/results', label: 'Results' },
  { href: '/pricing', label: 'Pricing' },
  { href: '/developers', label: 'Developers' },
];

/** Shared public/marketing top bar so every public page exposes the same nav. */
export function MarketingHeader() {
  return (
    <header className="glass sticky top-0 z-40 border-b">
      <div className="container relative flex h-16 items-center justify-between gap-3 max-[359px]:gap-2">
        <Wordmark />

        {/* Centered primary nav (funnel order: learn → proof → cost → build) so
            the bar doesn't pile everything up on the right. Centered absolutely,
            so it only appears at lg+ where it can't collide with the edges. */}
        <nav className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-1 lg:flex">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="group relative rounded-md px-3 py-2 text-sm text-muted transition-colors hover:text-ink focus-visible:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {l.label}
              <span className="absolute inset-x-3 -bottom-px h-px origin-left scale-x-0 bg-gradient-to-r from-accent to-accent2 transition-transform duration-300 ease-out group-hover:scale-x-100 group-focus-visible:scale-x-100" />
            </Link>
          ))}
        </nav>

        {/* Sign in is the self-serve path — the magic link both registers new
            users and signs in returning ones. Kept as a quiet text link so
            "Request a demo" stays the single button in the bar. */}
        <div className="flex items-center gap-4 max-[459px]:gap-2">
          <Link
            href="/login"
            className="rounded-md py-2 text-sm text-muted transition-colors hover:text-ink focus-visible:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring max-sm:hidden"
          >
            Sign in
          </Link>
          <Button asChild size="sm">
            <a href={REQUEST_DEMO_URL} target="_blank" rel="noopener noreferrer">
              Request a demo
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
          </Button>
          <MarketingMobileMenu links={LINKS} />
        </div>
      </div>
    </header>
  );
}
