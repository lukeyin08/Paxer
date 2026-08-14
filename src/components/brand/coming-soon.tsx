import { Kicker } from './kicker';
import { EmptyState } from './empty-state';

/** Placeholder for routes built out in a later phase. */
export function ComingSoon({
  title,
  phase,
  description,
}: {
  title: string;
  phase: string;
  description: string;
}) {
  return (
    <div className="flex flex-col gap-8">
      <div>
        <Kicker className="mb-2">{title}</Kicker>
        <h1 className="text-2xl font-bold">{title}</h1>
      </div>
      <EmptyState kicker={phase} title={`${title} is coming soon`} description={description} />
    </div>
  );
}
