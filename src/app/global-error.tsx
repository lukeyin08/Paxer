'use client';

import { useEffect } from 'react';
import { reportError } from '@/lib/observability';

// global-error replaces the root layout entirely, so it must render its own
// <html>/<body> and can't rely on globals.css — use inline styles.
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    reportError(error, { boundary: 'global', digest: error.digest });
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          fontFamily: '-apple-system, BlinkMacSystemFont, Helvetica, Arial, sans-serif',
          background: '#ffffff',
          color: '#1a1a1a',
        }}
      >
        <main style={{ maxWidth: 480, padding: '0 24px' }}>
          <h1 style={{ fontSize: 20, fontWeight: 700 }}>Something went wrong</h1>
          <p style={{ marginTop: 8, fontSize: 14, color: '#595959' }}>
            An unexpected error occurred. Your data is safe. Please try again.
          </p>
          <button
            onClick={reset}
            style={{
              marginTop: 24,
              padding: '10px 20px',
              border: '1px solid #1a1a1a',
              background: '#1a1a1a',
              color: '#ffffff',
              fontSize: 14,
              cursor: 'pointer',
            }}
          >
            Try again
          </button>
        </main>
      </body>
    </html>
  );
}
