import Link from 'next/link';
import { cn } from '@/lib/utils';

/**
 * Paxer logo: a geometric "P" monogram in the accent blue paired with a clean
 * sans-serif wordmark — a single-color, scalable lockup (the mark doubles as the
 * favicon / app icon). Set `markOnly` to render just the glyph.
 */
export function PaxerMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      role="img"
      aria-label="Paxer"
      className={cn('text-accent', className)}
    >
      <rect width="32" height="32" rx="8" fill="currentColor" />
      {/* Stem */}
      <rect x="10.5" y="8" width="3.4" height="16" rx="1.5" fill="#fff" />
      {/* Bowl with counter (evenodd punches the hole) */}
      <path
        fill="#fff"
        fillRule="evenodd"
        d="M10.5 8 H16 A5 5 0 0 1 16 18 H10.5 V8 Z M13.9 11 H15.6 A2.1 2.1 0 0 1 15.6 15.2 H13.9 Z"
      />
    </svg>
  );
}

const SIZES = {
  sm: { mark: 'h-[18px] w-[18px]', text: 'text-lg', gap: 'gap-2' },
  base: { mark: 'h-[22px] w-[22px]', text: 'text-xl', gap: 'gap-2.5' },
  lg: { mark: 'h-7 w-7', text: 'text-2xl', gap: 'gap-2.5' },
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
        <span className={cn('font-sans font-semibold tracking-tight text-ink', s.text)}>Paxer</span>
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
