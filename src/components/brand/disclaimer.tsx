import { cn } from '@/lib/utils';

/**
 * The persistent prototype disclaimer (Section 9). Rendered in the footer and
 * on every findings page, dispute draft, and fee estimate. The copy must not
 * change without reason; honesty is non-negotiable.
 */
export const DISCLAIMER_TEXT =
  'Paxer is a prototype. Estimates are not guarantees. Drafts must be reviewed by you before any use. This is not legal, medical, or financial advice.';

export const SYNTHETIC_DATA_NOTICE =
  'This build runs on synthetic data only. Do not enter real patient information.';

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
