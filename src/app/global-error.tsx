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
          justifyContent: 'center',
          fontFamily: 'ui-sans-serif, system-ui, sans-serif',
          background: '#0a0e14',
          color: '#e6eaf0',
        }}
      >
        <main style={{ maxWidth: 480, padding: '0 24px', textAlign: 'center' }}>
          <h1 style={{ fontSize: 24, fontWeight: 600 }}>Something went wrong</h1>
          <p style={{ marginTop: 8, fontSize: 14, color: '#8a94a3' }}>
            An unexpected error occurred. Your data is safe — please try again.
          </p>
          <button
            onClick={reset}
            style={{
              marginTop: 24,
              padding: '10px 20px',
              borderRadius: 8,
              border: 'none',
              background: '#3b82f6',
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
