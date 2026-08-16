import { ERROR_TYPES } from '@/lib/marketing';

/**
 * Error types as a full-width ruled list: label column, description column,
 * hairline between rows. Uses the whole measure rather than stranding a short
 * heading beside a narrow stack, and echoes the cell-ruled bar up top.
 */
export function ErrorTypes() {
  return (
    <dl className="mt-8 border-t border-ink">
      {ERROR_TYPES.map((e) => (
        <div
          key={e.title}
          className="grid grid-cols-1 gap-x-10 gap-y-1 border-b border-rule py-5 md:grid-cols-[1fr_1.6fr]"
        >
          <dt className="font-semibold text-ink">{e.title}</dt>
          <dd className="leading-relaxed text-muted">{e.body}</dd>
        </div>
      ))}
    </dl>
  );
}
