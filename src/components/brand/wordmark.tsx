import Link from 'next/link';
import { cn } from '@/lib/utils';

/**
 * Paxer wordmark. The final "r" renders in the blue accent color (Section 5,
 * adapted to the black & blue theme).
 */
export function Wordmark({
  className,
  href = '/',
  size = 'base',
}: {
  className?: string;
  href?: string | null;
  size?: 'sm' | 'base' | 'lg';
}) {
  const sizeClass = {
    sm: 'text-xl',
    base: 'text-2xl',
    lg: 'text-3xl',
  }[size];

  const mark = (
    <span className={cn('font-serif font-semibold tracking-tight text-ink', sizeClass, className)}>
      Paxe<span className="text-accent">r</span>
    </span>
  );

  if (href === null) return mark;
  return (
    <Link href={href} aria-label="Paxer home">
      {mark}
    </Link>
  );
}
