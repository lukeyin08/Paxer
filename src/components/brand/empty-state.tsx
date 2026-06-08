import { cn } from '@/lib/utils';
import { Kicker } from './kicker';

/** EmptyState: calm prompt shown when a collection has no rows. */
export function EmptyState({
  kicker,
  title,
  description,
  action,
  className,
}: {
  kicker?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-rule bg-card/50 px-6 py-16 text-center',
        className,
      )}
    >
      {kicker && <Kicker>{kicker}</Kicker>}
      <h3 className="font-sans text-xl font-semibold text-ink">{title}</h3>
      {description && <p className="max-w-md text-sm text-muted">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
