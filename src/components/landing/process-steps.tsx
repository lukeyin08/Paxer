import { PROCESS_STEPS } from '@/lib/marketing';

/** The three-step process, as an ordered list. */
export function ProcessSteps() {
  return (
    <ol className="mt-6 grid grid-cols-1 gap-x-10 gap-y-6 md:grid-cols-3">
      {PROCESS_STEPS.map((c) => (
        <li key={c.step}>
          <p className="font-sans text-sm font-semibold text-ink">
            <span className="text-accent">{c.step}.</span> {c.title}
          </p>
          <p className="mt-1.5 text-sm leading-relaxed text-muted">{c.body}</p>
        </li>
      ))}
    </ol>
  );
}
