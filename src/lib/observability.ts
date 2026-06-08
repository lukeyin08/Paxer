/**
 * Centralized error reporting. Today this emits a structured line to the
 * platform logs (captured by Vercel's log drains / any drain you attach). It is
 * the single seam to wire a real error monitor — add Sentry, Logtail, etc. here
 * and every boundary + catch that calls reportError() lights up automatically.
 *
 * Usage:
 *   import { reportError } from '@/lib/observability';
 *   reportError(err, { where: 'ingest', userId });
 *
 * NOTE (launch): for a money/PHI app you should attach a real monitor before
 * going live so failures page someone instead of sitting in log history.
 */
export function reportError(error: unknown, context?: Record<string, unknown>): void {
  const err = error instanceof Error ? error : new Error(String(error));
  // Structured so log search/alerting can key off `level` + `event`.
  const payload = {
    level: 'error' as const,
    event: 'app.error',
    message: err.message,
    name: err.name,
    stack: err.stack,
    ...context,
  };
  // eslint-disable-next-line no-console
  console.error(JSON.stringify(payload));

  // TODO(launch): forward to a real monitor, e.g.
  //   Sentry.captureException(err, { extra: context });
}
