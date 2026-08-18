import { cn } from '@/lib/utils';

/** A labelled figure: small label above, tabular number below. */
export function StatBlock({
  label,
  value,
  hint,
  className,
}: {
  label: string;
  value: React.ReactNode;
  hint?: string;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-col gap-1', className)}>
      <p className="label-sm">{label}</p>
      <div className="text-xl font-bold tabular-nums text-ink">{value}</div>
      {hint && <p className="text-sm text-muted">{hint}</p>}
    </div>
  );
}
