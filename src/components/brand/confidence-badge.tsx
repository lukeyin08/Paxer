import { cn } from '@/lib/utils';

/**
 * ConfidenceBadge surfaces an AI/rule confidence score (0..1) per the honesty
 * rules (Section 9). Low-confidence items are visually distinct.
 */
export function ConfidenceBadge({
  confidence,
  className,
}: {
  confidence: number;
  className?: string;
}) {
  const clamped = Math.max(0, Math.min(1, Number.isFinite(confidence) ? confidence : 0));
  const pct = Math.round(clamped * 100);
  const level = clamped >= 0.8 ? 'high' : clamped >= 0.5 ? 'medium' : 'low';
  const styles = {
    high: 'border-success/40 text-success',
    medium: 'border-accent2/40 text-accent2',
    low: 'border-muted/40 text-muted',
  }[level];

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-mono text-[0.65rem] uppercase tracking-wider',
        styles,
        className,
      )}
      title={`Confidence: ${pct}%`}
    >
      <span aria-hidden className="inline-block h-1.5 w-1.5 rounded-full bg-current" />
      {pct}% conf
    </span>
  );
}
