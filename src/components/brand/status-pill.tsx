import { cn } from '@/lib/utils';

type Tone = 'neutral' | 'accent' | 'success' | 'warning' | 'danger' | 'muted';

// Tone only changes the text colour; every status uses the same square, unfilled
// tag so the page doesn't turn into a field of coloured pills.
const toneStyles: Record<Tone, string> = {
  neutral: 'text-ink',
  accent: 'text-accent',
  success: 'text-success',
  warning: 'text-warning',
  danger: 'text-danger',
  muted: 'text-muted',
};

/** StatusPill renders an enum status as a plain bordered tag. */
export function StatusPill({
  label,
  tone = 'neutral',
  className,
}: {
  label: string;
  tone?: Tone;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center border border-rule px-1.5 py-0.5 text-xs',
        toneStyles[tone],
        className,
      )}
    >
      {label.replace(/_/g, ' ')}
    </span>
  );
}
