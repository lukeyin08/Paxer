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
  size?: 'sm' | 'base' | 'lg' | 'xl';
}) {
  const value = typeof amount === 'number' ? amount : null;
  const sizeClass = {
    sm: 'text-sm',
    base: 'text-base',
    lg: 'font-sans text-2xl',
    xl: 'font-sans text-4xl',
  }[size];

  return (
    <span className={cn('tabular-nums', sizeClass, className)}>
      {value === null ? '—' : formatUsd(value, { cents })}
      {estimate && value !== null && (
        <span className="ml-1 align-baseline font-mono text-[0.6em] uppercase tracking-wider text-muted">
          est
        </span>
      )}
    </span>
  );
}
