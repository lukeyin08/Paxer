import { cn } from '@/lib/utils';
import { Kicker } from './kicker';

/** Big number in Spectral with a mono kicker label (Section 5). */
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
      <div className="font-serif text-3xl font-semibold leading-none tabular-nums text-ink">
        {value}
      </div>
      {hint && <p className="text-sm text-muted">{hint}</p>}
    </div>
  );
}
