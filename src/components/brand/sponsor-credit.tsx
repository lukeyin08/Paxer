import Image from 'next/image';
import { cn } from '@/lib/utils';

/**
 * Sponsor credit, shared by the hero and the footer so the two placements
 * cannot drift. The mark keeps its own purple: recolouring a third-party
 * trademark to match the palette is forbidden by essentially every brand
 * guideline, so the exception is deliberate.
 *
 * The lockup already contains the university's name, so the visible label is
 * just "Sponsored by"; the name is carried in `alt` for screen readers.
 */
export function SponsorCredit({
  className,
  logoClassName = 'h-9',
}: {
  className?: string;
  logoClassName?: string;
}) {
  return (
    <div className={cn('flex items-center gap-3', className)}>
      <span className="text-sm text-ink">Sponsored by</span>
      <Image
        src="/northwestern.png"
        alt="Northwestern University"
        width={600}
        height={145}
        className={cn('w-auto', logoClassName)}
        priority
      />
    </div>
  );
}
