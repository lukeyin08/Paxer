import Link from 'next/link';
import { Wordmark } from '@/components/brand/wordmark';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/theme-toggle';

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
          {/* Single auth entry: the magic link both registers new users and signs
              in returning ones, so a separate "Get started" would just duplicate
              this. The new-visitor CTA lives in the page hero. */}
          <Button asChild size="sm">
            <Link href="/login">Sign in</Link>
          </Button>
        </nav>
      </div>
    </header>
  );
}
