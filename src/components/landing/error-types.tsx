import { ERROR_TYPES } from '@/lib/marketing';

/** Error-type list. Plain headings and prose, no iconography. */
export function ErrorTypes() {
  return (
    <dl className="mt-4 grid grid-cols-1 gap-x-12 gap-y-4 sm:grid-cols-2">
      {ERROR_TYPES.map((e) => (
        <div key={e.title}>
          <dt className="font-semibold text-ink">{e.title}</dt>
          <dd className="mt-1 text-sm leading-relaxed text-muted">{e.body}</dd>
        </div>
      ))}
    </dl>
  );
}
