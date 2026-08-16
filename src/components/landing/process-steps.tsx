import { PROCESS_STEPS } from '@/lib/marketing';

/** The three-step process, as an ordered list. */
export function ProcessSteps() {
  return (
    <ol className="grid grid-cols-1 gap-y-6">
      {PROCESS_STEPS.map((c) => (
        <li key={c.step}>
          <p className="font-semibold text-ink">
            <span className="text-accent">{c.step}.</span> {c.title}
          </p>
          <p className="mt-1 leading-relaxed text-muted">{c.body}</p>
        </li>
      ))}
    </ol>
  );
}
