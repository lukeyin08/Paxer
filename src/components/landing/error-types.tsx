import { ERROR_TYPES } from '@/lib/marketing';

/** Error-type list. Plain headings and prose, no iconography. */
export function ErrorTypes() {
  return (
    <dl className="grid grid-cols-1 gap-y-6">
      {ERROR_TYPES.map((e) => (
        <div key={e.title}>
          <dt className="font-semibold text-ink">{e.title}</dt>
          <dd className="mt-1 leading-relaxed text-muted">{e.body}</dd>
        </div>
      ))}
    </dl>
  );
}
