import type { NextRequest } from 'next/server';
import { env } from '@/lib/env';

/**
 * Guard cron routes with CRON_SECRET (Section 13). Vercel Cron includes
 * `Authorization: Bearer <CRON_SECRET>`; that header path is the only one used
 * in production. A `?secret=` query param is accepted for manual invocation in
 * non-production only — query strings land in access logs / browser history, so
 * we never honor the secret-in-URL path in prod.
 */
export function authorizeCron(req: NextRequest): boolean {
  if (!env.CRON_SECRET) {
    // No secret configured: only allow in non-production to avoid an open endpoint.
    return env.NODE_ENV !== 'production';
  }
  const auth = req.headers.get('authorization');
  if (auth === `Bearer ${env.CRON_SECRET}`) return true;
  if (env.NODE_ENV === 'production') return false;
  const url = new URL(req.url);
  return url.searchParams.get('secret') === env.CRON_SECRET;
}
