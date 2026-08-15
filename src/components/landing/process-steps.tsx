import { PROCESS_STEPS } from '@/lib/marketing';

/** The three-step process, as an ordered list. */
export function ProcessSteps() {
  return (
    <ol className="mt-4 grid grid-cols-1 gap-x-12 gap-y-4 md:grid-cols-3">
      {PROCESS_STEPS.map((c) => (
        <li key={c.step}>
          <h3 className="font-semibold text-ink">
            {c.step}. {c.title}
          </h3>
          <p className="mt-1 text-sm leading-relaxed text-muted">{c.body}</p>
        </li>
      ))}
    </ol>
  );
}
