'use client';

import Link from 'next/link';
import * as DM from '@radix-ui/react-dropdown-menu';
import { BarChart3, ChevronDown, LogOut, Settings } from 'lucide-react';
import { signOutAction } from '@/lib/auth/actions';
import { cn } from '@/lib/utils';

const itemCls =
  'flex w-full cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm text-muted outline-none transition-colors data-[highlighted]:bg-soft data-[highlighted]:text-ink focus-visible:ring-2 focus-visible:ring-ring';

/**
 * Account menu — collapses the secondary nav (Settings, Benchmarks, API keys)
 * and Sign out into one dropdown so the top bar stays focused on the core
 * workflow.
 */
export function UserMenu({ email }: { email?: string | null }) {
  const initial = (email?.trim()?.[0] ?? 'U').toUpperCase();

  return (
    <DM.Root>
      <DM.Trigger asChild>
        <button
          className="inline-flex items-center gap-1.5 rounded-full border border-rule p-0.5 pr-1.5 text-muted transition-colors hover:bg-soft hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="Account menu"
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-accent text-xs font-semibold text-accent-foreground">
            {initial}
          </span>
          <ChevronDown className="h-3.5 w-3.5" />
        </button>
      </DM.Trigger>
      <DM.Portal>
        <DM.Content
          align="end"
          sideOffset={6}
          className="z-50 min-w-[12rem] rounded-lg border border-rule bg-card p-1 text-card-foreground shadow-lg"
        >
          {email && <div className="truncate px-2 py-1.5 text-xs text-muted">{email}</div>}
          <DM.Separator className="my-1 h-px bg-rule" />
          <DM.Item asChild>
            <Link href="/app/settings" className={itemCls}>
              <Settings className="h-4 w-4" /> Settings
            </Link>
          </DM.Item>
          <DM.Item asChild>
            <Link href="/app/benchmarks" className={itemCls}>
              <BarChart3 className="h-4 w-4" /> Benchmarks
            </Link>
          </DM.Item>
          <DM.Separator className="my-1 h-px bg-rule" />
          <DM.Item
            className={cn(itemCls, 'text-danger data-[highlighted]:text-danger')}
            onSelect={(e) => {
              // A <form> submit inside a closing Radix menu gets cancelled — call
              // the server action directly so sign-out actually fires.
              e.preventDefault();
              void signOutAction();
            }}
          >
            <LogOut className="h-4 w-4" /> Sign out
          </DM.Item>
        </DM.Content>
      </DM.Portal>
    </DM.Root>
  );
}
