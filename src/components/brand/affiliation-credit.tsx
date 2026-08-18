import Image from 'next/image';
import { cn } from '@/lib/utils';

/**
 * University affiliation credit.
 *
 * Wording is load-bearing here, and has been through three versions:
 *
 *   "Sponsored by X"        — reads, in a product context, as the sponsor being
 *                             behind the product itself.
 *   "With support from X"   — accurate for funding, but undersells actual
 *                             collaboration and implies money only.
 *   "Developed with faculty at X"  <- current
 *
 * The last one is the accurate claim: faculty collaborated on development. It
 * credits the people who did the work rather than the institution, which
 * matters — a professor collaborating acts as an individual, not as the
 * university, and universities are strict about not implying that a department
 * built, tested, or endorsed a commercial product. "faculty at" carries that
 * distinction; "by Northwestern University" would not.
 *
 * The lockup already contains the university's name, so the visible label stops
 * before it; the name is carried in `alt` for screen readers.
 */
export function AffiliationCredit({
  className,
  logoClassName = 'h-9',
}: {
  className?: string;
  logoClassName?: string;
}) {
  return (
    <div className={cn('flex items-center gap-3', className)}>
      <span className="text-sm text-ink">Developed with faculty at</span>
      <Image
        src="/northwestern.png"
        alt="Northwestern University"
        width={600}
        height={145}
        className={cn('w-auto', logoClassName)}
        // Renders at 36-48px tall (~150-200px wide); without this Next requests
        // the 1200px candidate.
        sizes="220px"
        priority
      />
    </div>
  );
}
