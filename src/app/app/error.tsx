'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { reportError } from '@/lib/observability';

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    reportError(error, { boundary: 'app', digest: error.digest });
  }, [error]);

  return (
    <div className="flex max-w-lg flex-col gap-6 py-16">
      <div>
        <h1>Something went wrong</h1>
        <p className="mt-2 text-sm text-muted">
          We couldn’t load this view. Your cases and documents are unaffected.
        </p>
      </div>
      <div className="flex gap-3">
        <Button onClick={reset}>Try again</Button>
        <Button asChild variant="outline">
          <Link href="/app">Back to dashboard</Link>
        </Button>
      </div>
    </div>
  );
}
