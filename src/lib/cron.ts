import type { NextRequest } from 'next/server';
import { env } from '@/lib/env';

/**
 * Guard cron routes with CRON_SECRET (Section 13). Vercel Cron includes
 * `Authorization: Bearer <CRON_SECRET>` when the env var is set; a `?secret=`
 * query param is also accepted for manual invocation/testing.
 */
export function authorizeCron(req: NextRequest): boolean {
  if (!env.CRON_SECRET) {
    // No secret configured: only allow in non-production to avoid an open endpoint.
    return env.NODE_ENV !== 'production';
  }
  const auth = req.headers.get('authorization');
  if (auth === `Bearer ${env.CRON_SECRET}`) return true;
  const url = new URL(req.url);
  return url.searchParams.get('secret') === env.CRON_SECRET;
}
