import Link from 'next/link';
import { Wordmark } from '@/components/brand/wordmark';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/theme-toggle';
import { DEMO_ENABLED } from '@/lib/auth/demo';

// The instant demo only exists in non-production (Credentials provider disabled
// in prod), so the public CTA points to real sign-in there.
const CTA = DEMO_ENABLED
  ? { href: '/login?demo=1', label: 'View the demo' }
  : { href: '/login', label: 'Get started' };

/** Shared public/marketing top bar so every public page exposes the same nav. */
export function MarketingHeader() {
  return (
    <header className="border-b border-rule">
      <div className="container flex h-16 items-center justify-between gap-2">
        <Wordmark />
        <nav className="flex items-center gap-1 sm:gap-2">
          {/* Funnel order: learn → cost → build */}
          <div className="hidden items-center gap-1 md:flex">
            <Button asChild variant="ghost" size="sm">
              <Link href="/how-it-works">How it works</Link>
            </Button>
            <Button asChild variant="ghost" size="sm">
              <Link href="/pricing">Pricing</Link>
            </Button>
            <Button asChild variant="ghost" size="sm">
              <Link href="/developers">Developers</Link>
            </Button>
          </div>
          <ThemeToggle />
          <Button asChild variant="ghost" size="sm">
            <Link href="/login">Sign in</Link>
          </Button>
          <Button asChild size="sm">
            <Link href={CTA.href}>{CTA.label}</Link>
          </Button>
        </nav>
      </div>
    </header>
  );
}
