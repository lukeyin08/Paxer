'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Wordmark } from '@/components/brand/wordmark';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { signOutAction } from '@/lib/auth/actions';

const NAV = [
  { href: '/app', label: 'Dashboard' },
  { href: '/app/cases/new', label: 'New case' },
  { href: '/app/disputes', label: 'Disputes' },
  { href: '/app/recoveries', label: 'Recoveries' },
  { href: '/app/benchmarks', label: 'Benchmarks' },
  { href: '/app/settings', label: 'Settings' },
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
          active ? 'bg-soft text-ink' : 'text-muted hover:text-ink',
        )}
      >
        {item.label}
      </Link>
    );
  });

  return (
    <header className="sticky top-0 z-20 border-b border-rule bg-paper/90 backdrop-blur">
      <div className="container flex h-16 items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-8">
          <Wordmark href="/app" />
          {/* Desktop nav */}
          <nav className="hidden items-center gap-1 md:flex">{links}</nav>
        </div>
        <div className="flex items-center gap-3">
          {email && (
            <span className="hidden max-w-[14ch] truncate text-sm text-muted lg:block">{email}</span>
          )}
          <form action={signOutAction}>
            <Button type="submit" variant="outline" size="sm">
              Sign out
            </Button>
          </form>
        </div>
      </div>
      {/* Mobile nav: horizontally scrollable strip so every section is reachable */}
      <nav className="flex items-center gap-1 overflow-x-auto border-t border-rule px-4 py-2 md:hidden">
        {links}
      </nav>
    </header>
  );
}
