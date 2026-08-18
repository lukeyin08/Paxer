import Image from 'next/image';
import { cn } from '@/lib/utils';

/**
 * University affiliation credit.
 *
 * Wording is load-bearing and has been revised several times; current text is
 * "Partnered with", set by the owner.
 *
 * Note for whoever edits this next: "Partnered with X" asserts an
 * organisation-to-organisation relationship, which is a stronger claim than
 * naming the individuals involved. If what exists is faculty collaboration
 * rather than a signed agreement with the university, "Developed with faculty
 * at X" is the accurate form, because a professor collaborating acts as an
 * individual and not as the institution. Confirm before weakening or
 * strengthening this line.
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
      <span className="text-sm text-ink">Partnered with</span>
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
