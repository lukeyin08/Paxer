import Link from 'next/link';
import { Wordmark } from '@/components/brand/wordmark';
import { Kicker } from '@/components/brand/kicker';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

// Phase 0 placeholder. Real auth (magic link + seeded demo) lands in Phase 1.
export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6">
      <Wordmark size="lg" className="mb-8" />
      <Card className="w-full max-w-md">
        <CardContent className="flex flex-col gap-4 pt-6 text-center">
          <Kicker>Coming in Phase 1</Kicker>
          <h1 className="font-serif text-2xl font-semibold">Sign in</h1>
          <p className="text-sm text-muted">
            Authentication (magic link plus a seeded demo account) is wired up in the next phase.
          </p>
          <Button asChild variant="outline">
            <Link href="/">Back to home</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
