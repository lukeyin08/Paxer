import { cn } from '@/lib/utils';

/**
 * ConfidenceBadge surfaces an AI/rule confidence score (0..1) per the honesty
 * rules (Section 9). Plain text — the number is the signal, not the colour.
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

  return (
    <span className={cn('text-xs text-muted', className)} title={`Confidence: ${pct}%`}>
      {pct}% confidence
    </span>
  );
}
