'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';

/**
 * Phone/tablet nav for the marketing header: the centered desktop links are
 * hidden below lg, so this hamburger panel is the only way to reach them on
 * small screens. The panel stays mounted (toggled with `hidden`) so the
 * trigger's aria-controls always references a real element; Escape closes it
 * and returns focus to the trigger; links self-close on navigation.
 */
export function MarketingMobileMenu({
  links,
}: {
  links: readonly { href: string; label: string }[];
}) {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <div className="lg:hidden">
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={open}
        aria-controls="marketing-mobile-nav"
        aria-label={open ? 'Close navigation menu' : 'Open navigation menu'}
        onClick={() => setOpen((v) => !v)}
        className="flex h-10 w-10 items-center justify-center rounded-md text-muted transition-colors hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      <nav
        id="marketing-mobile-nav"
        hidden={!open}
        className="glass absolute inset-x-0 top-full border-b shadow-lg"
      >
        <div className="container flex flex-col py-3">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="rounded-md px-2 py-3 text-base text-ink transition-colors hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {l.label}
            </Link>
          ))}
          {/* Mirrors the bar's Sign in link, which is hidden on the smallest
              screens to keep the bar from overflowing. */}
          <Link
            href="/login"
            onClick={() => setOpen(false)}
            className="mt-1 rounded-md border-t border-rule px-2 pb-2 pt-4 text-base text-muted transition-colors hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:hidden"
          >
            Sign in
          </Link>
        </div>
      </nav>
    </div>
  );
}
