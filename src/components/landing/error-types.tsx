import { Calculator, Copy, ShieldAlert, TrendingUp } from 'lucide-react';
import { ERROR_TYPES } from '@/lib/marketing';

// Icons line up by index with ERROR_TYPES (duplicate, cost-share, balance, upcoding).
const ICONS = [Copy, Calculator, ShieldAlert, TrendingUp];

/** Error-type grid: icon-led cards. */
export function ErrorTypes() {
  return (
    <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2">
      {ERROR_TYPES.map((e, i) => {
        const Icon = ICONS[i] ?? Copy;
        return (
          <div
            key={e.title}
            className="rounded-xl border border-rule bg-card p-7 transition-colors hover:border-accent/40"
          >
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-accent/20 bg-accent/10 text-accent">
                <Icon className="h-5 w-5" />
              </span>
              <h3 className="font-sans text-lg font-semibold text-ink">{e.title}</h3>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-muted">{e.body}</p>
          </div>
        );
      })}
    </div>
  );
}
