'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Wordmark } from '@/components/brand/wordmark';
import { cn } from '@/lib/utils';
import { UserMenu } from '@/components/user-menu';

// Primary workflow tabs only. Secondary items (Settings, Benchmarks, API keys,
// theme, sign out) live in the account menu to keep the bar uncluttered.
const NAV = [
  { href: '/app', label: 'Dashboard' },
  { href: '/app/cases/new', label: 'New case' },
  { href: '/app/disputes', label: 'Disputes' },
  { href: '/app/recoveries', label: 'Recoveries' },
];

export function AppNav({ email }: { email?: string | null }) {
  const pathname = usePathname();

  const links = NAV.map((item) => {
    const active = item.href === '/app' ? pathname === '/app' : pathname.startsWith(item.href);
    return (
      <Link
        key={item.href}
        href={item.href}
        className={cn(
          'whitespace-nowrap rounded-md px-3 py-1.5 text-sm transition-colors',
          active
            ? 'bg-accent/10 text-ink ring-1 ring-inset ring-accent/20'
            : 'text-muted hover:bg-soft hover:text-ink',
        )}
      >
        {item.label}
      </Link>
    );
  });

  return (
    <header className="glass sticky top-0 z-20 border-b">
      <div className="container flex h-16 items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-8">
          {/* Logo returns to the public homepage (always visible); the Dashboard
              tab is the app home. */}
          <Wordmark href="/" />
          {/* Desktop nav */}
          <nav className="hidden items-center gap-1 md:flex">{links}</nav>
        </div>
        <div className="flex items-center gap-3">
          <UserMenu email={email} />
        </div>
      </div>
      {/* Mobile nav: horizontally scrollable strip so every section is reachable */}
      <nav className="flex items-center gap-1 overflow-x-auto border-t border-rule px-4 py-2 md:hidden">
        {links}
      </nav>
    </header>
  );
}
