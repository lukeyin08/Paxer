import { cn } from '@/lib/utils';

/** Mono uppercase letter-spaced label (Section 5). */
export function Kicker({
  children,
  className,
  as: As = 'p',
}: {
  children: React.ReactNode;
  className?: string;
  as?: 'p' | 'span' | 'div';
}) {
  return <As className={cn('kicker', className)}>{children}</As>;
}
