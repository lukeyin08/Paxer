import { cn } from '@/lib/utils';
import { formatUsd } from '@/lib/utils';

/**
 * Money primitive. Formats currency and, when `estimate` is set, marks the
 * value as an estimate per the honesty rules (Section 9). Estimates are never
 * presented as guarantees.
 */
export function Money({
  amount,
  estimate = false,
  cents = false,
  className,
  size = 'base',
}: {
  amount: number | null | undefined;
  estimate?: boolean;
  cents?: boolean;
  className?: string;
  size?: 'sm' | 'base' | 'lg' | 'xl' | 'inherit';
}) {
  const value = typeof amount === 'number' ? amount : null;
  // 'inherit' sets no size class so a styled wrapper (e.g. StatBlock's big
  // number) controls the size instead of being overridden by `text-base`.
  const sizeClass = {
    sm: 'text-sm',
    base: 'text-base',
    lg: 'text-lg',
    xl: 'text-2xl',
    inherit: '',
  }[size];

  return (
    <span className={cn('tabular-nums', sizeClass, className)}>
      {value === null ? '—' : formatUsd(value, { cents })}
      {estimate && value !== null && (
        <span className="ml-1 align-baseline text-[0.7em] text-muted">est</span>
      )}
    </span>
  );
}
