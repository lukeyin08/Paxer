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
    <div className={cn('flex flex-col items-start gap-2 border border-rule px-6 py-10', className)}>
      {kicker && <Kicker>{kicker}</Kicker>}
      <h3 className="text-lg font-bold text-ink">{title}</h3>
      {description && <p className="max-w-xl text-sm leading-relaxed text-muted">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
