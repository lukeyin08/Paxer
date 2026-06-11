import { cn } from '@/lib/utils';
import { Kicker } from './kicker';

/** Big sans number with a mono kicker label (Section 5). */
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
      <Kicker>{label}</Kicker>
      <div className="font-sans text-2xl font-semibold leading-tight tabular-nums text-ink sm:text-3xl">
        {value}
      </div>
      {hint && <p className="text-sm text-muted">{hint}</p>}
    </div>
  );
}
