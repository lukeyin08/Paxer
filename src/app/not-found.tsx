import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center gap-6 px-6 text-center">
      <div>
        <p className="font-mono text-sm uppercase tracking-wider text-muted">404</p>
        <h1 className="mt-2 font-sans text-2xl font-semibold text-ink">Page not found</h1>
        <p className="mt-2 text-sm text-muted">
          The page you’re looking for doesn’t exist or may have moved.
        </p>
      </div>
      <Button asChild>
        <Link href="/app">Back to dashboard</Link>
      </Button>
    </main>
  );
}
