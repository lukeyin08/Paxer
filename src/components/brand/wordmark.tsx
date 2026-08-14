import Link from 'next/link';
import { cn } from '@/lib/utils';

/**
 * Paxer logo: two overlapping discs (the "overlap" mark) in the brand blues,
 * paired with the lowercase "paxer" wordmark — a flat, scalable lockup. The
 * viewBox is cropped to the artwork so the mark sits tight against the word.
 * Set `markOnly` to render just the glyph (e.g. compact / favicon contexts).
 */
export function PaxerMark({ className }: { className?: string }) {
  return (
    <svg viewBox="13 18 38 28" role="img" aria-label="Paxer" className={className}>
      <circle cx="27" cy="32" r="13" fill="#3D7DFF" />
      <circle cx="37" cy="32" r="13" fill="#4FC3FF" />
      {/* Overlap lens (darker blend of the two discs) */}
      <path fill="#1E5FE0" d="M32 20 A13 13 0 0 1 32 44 A13 13 0 0 1 32 20 Z" />
    </svg>
  );
}

// Mark is sized by height (width auto) since the cropped viewBox isn't square.
const SIZES = {
  sm: { mark: 'h-[15px] w-auto', text: 'text-lg', gap: 'gap-1.5' },
  base: { mark: 'h-[19px] w-auto', text: 'text-xl', gap: 'gap-1.5' },
  lg: { mark: 'h-[23px] w-auto', text: 'text-2xl', gap: 'gap-2' },
} as const;

export function Wordmark({
  className,
  href = '/',
  size = 'base',
  markOnly = false,
}: {
  className?: string;
  href?: string | null;
  size?: 'sm' | 'base' | 'lg';
  markOnly?: boolean;
}) {
  const s = SIZES[size];

  const lockup = (
    <span className={cn('inline-flex items-center', s.gap, className)}>
      <PaxerMark className={s.mark} />
      {!markOnly && (
        <span className={cn('font-extrabold tracking-tight text-ink', s.text)}>Paxer</span>
      )}
    </span>
  );

  if (href === null) return lockup;
  return (
    <Link href={href} aria-label="Paxer home" className="inline-flex">
      {lockup}
    </Link>
  );
}
