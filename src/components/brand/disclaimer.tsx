import { cn } from '@/lib/utils';

/**
 * The persistent product disclaimer (Section 9). Rendered in the footer and on
 * every findings page, dispute draft, and fee estimate. The copy must not change
 * without reason; honesty is non-negotiable. Paxer assists patients but does not
 * provide legal, medical, or financial advice, and every estimate/draft is the
 * patient's to review and act on.
 */
export const DISCLAIMER_TEXT =
  'Estimates are not guarantees. Dispute letters are drafts you must review before sending. Paxer does not provide legal, medical, or financial advice.';

export function Disclaimer({
  className,
  variant = 'default',
}: {
  className?: string;
  variant?: 'default' | 'inline' | 'callout';
}) {
  if (variant === 'inline') {
    return <p className={cn('text-xs text-muted', className)}>{DISCLAIMER_TEXT}</p>;
  }
  if (variant === 'callout') {
    return (
      <div
        className={cn(
          'rounded-md border border-accent2/30 bg-accent2/5 px-4 py-3 text-xs text-accent2',
          className,
        )}
      >
        {DISCLAIMER_TEXT}
      </div>
    );
  }
  return (
    <p className={cn('font-mono text-[0.7rem] leading-relaxed text-muted', className)}>
      {DISCLAIMER_TEXT}
    </p>
  );
}
