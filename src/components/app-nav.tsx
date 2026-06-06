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
];

export function AppNav({ email }: { email?: string | null }) {
  const pathname = usePathname();
  return (
    <header className="sticky top-0 z-20 border-b border-rule bg-paper/90 backdrop-blur">
      <div className="container flex h-16 items-center justify-between gap-6">
        <div className="flex items-center gap-8">
          <Wordmark href="/app" />
          <nav className="hidden items-center gap-1 md:flex">
            {NAV.map((item) => {
              const active =
                item.href === '/app' ? pathname === '/app' : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'rounded-md px-3 py-1.5 text-sm transition-colors',
                    active ? 'bg-soft text-ink' : 'text-muted hover:text-ink',
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/app/settings" className="hidden text-sm text-muted hover:text-ink sm:block">
            {email ?? 'Settings'}
          </Link>
          <form action={signOutAction}>
            <Button type="submit" variant="outline" size="sm">
              Sign out
            </Button>
          </form>
        </div>
      </div>
    </header>
  );
}
