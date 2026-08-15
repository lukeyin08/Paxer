'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { reportError } from '@/lib/observability';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    reportError(error, { boundary: 'root', digest: error.digest });
  }, [error]);

  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col justify-center gap-6 px-6">
      <div>
        <h1>Something went wrong</h1>
        <p className="mt-2 text-sm text-muted">
          An unexpected error occurred. Your data is safe. Please try again.
        </p>
      </div>
      <div className="flex gap-3">
        <Button onClick={reset}>Try again</Button>
        <Button asChild variant="outline">
          <Link href="/app">Back to dashboard</Link>
        </Button>
      </div>
    </main>
  );
}
