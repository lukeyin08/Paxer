import { PROCESS_STEPS } from '@/lib/marketing';

/** The three-step process. */
export function ProcessSteps() {
  return (
    <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-3">
      {PROCESS_STEPS.map((c) => (
        <div
          key={c.step}
          className="rounded-xl border border-rule bg-card p-6 transition-colors hover:border-accent/40"
        >
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-accent/20 bg-paper font-mono text-lg font-semibold text-accent">
            {c.step}
          </span>
          <h3 className="mt-4 font-sans text-xl font-semibold text-ink">{c.title}</h3>
          <p className="mt-2 text-sm leading-relaxed text-muted">{c.body}</p>
        </div>
      ))}
    </div>
  );
}
