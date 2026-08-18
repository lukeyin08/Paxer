import type { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export const metadata: Metadata = {
  title: 'Page not found',
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col justify-center gap-6 px-6">
      <div>
        <p className="text-sm text-muted">404</p>
        <h1 className="mt-2">Page not found</h1>
        <p className="mt-2 text-sm text-muted">
          The page you’re looking for doesn’t exist or may have moved.
        </p>
      </div>
      <Button asChild className="self-start">
        <Link href="/app">Back to dashboard</Link>
      </Button>
    </main>
  );
}
