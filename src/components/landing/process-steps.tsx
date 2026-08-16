import { PROCESS_STEPS } from '@/lib/marketing';

/**
 * The three steps as a full-width ruled list, indexed in mono. The index sits
 * in its own column so the titles align down the page. Deep green rather than
 * the bright accent: at this size the bright green fails contrast on cream.
 */
export function ProcessSteps() {
  return (
    <ol className="mt-8 border-t border-ink">
      {PROCESS_STEPS.map((c) => (
        <li
          key={c.step}
          className="grid grid-cols-1 gap-x-10 gap-y-1 border-b border-rule py-5 md:grid-cols-[3rem_1fr_1.6fr]"
        >
          <span className="font-mono text-sm text-accent2">0{c.step}</span>
          <p className="font-semibold text-ink">{c.title}</p>
          <p className="leading-relaxed text-muted">{c.body}</p>
        </li>
      ))}
    </ol>
  );
}
