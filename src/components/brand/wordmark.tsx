import Link from 'next/link';
import { cn } from '@/lib/utils';

/**
 * Paxer logo: the name, set in ink. No mark — a symbol alongside the word added
 * nothing the word wasn't already saying, and a coloured glyph was the only
 * saturated element left on an otherwise black-and-white site.
 */
const SIZES = {
  sm: 'text-lg',
  base: 'text-xl',
  lg: 'text-2xl',
} as const;

export function Wordmark({
  className,
  href = '/',
  size = 'base',
}: {
  className?: string;
  href?: string | null;
  size?: 'sm' | 'base' | 'lg';
}) {
  const lockup = <span className={cn('font-bold text-ink', SIZES[size], className)}>Paxer</span>;

  if (href === null) return lockup;
  return (
    <Link href={href} aria-label="Paxer home" className="inline-flex">
      {lockup}
    </Link>
  );
}
