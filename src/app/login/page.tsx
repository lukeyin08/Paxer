import type { Metadata } from 'next';
import Link from 'next/link';
import { Wordmark } from '@/components/brand/wordmark';
import { Kicker } from '@/components/brand/kicker';
import { Card, CardContent } from '@/components/ui/card';
import { Disclaimer } from '@/components/brand/disclaimer';
import { DEMO_ENABLED } from '@/lib/auth/demo';
import { DemoButton, MagicLinkForm } from './login-forms';

export const metadata: Metadata = {
  title: 'Sign in',
  description: 'Sign in to Paxer to audit your medical bills and recover your money.',
  robots: { index: false, follow: true },
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  // Only forward same-site /app destinations (e.g. developers land in Settings).
  const callbackUrl = next && next.startsWith('/app') && !next.startsWith('//') ? next : undefined;
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-6 py-12 animate-fade-up">
      <Wordmark size="lg" />
      <Card className="w-full max-w-md">
        <CardContent className="flex flex-col gap-6 pt-6">
          <div className="text-center">
            <Kicker className="mb-2">Welcome</Kicker>
            <h1 className="font-sans text-2xl font-semibold">Sign in to Paxer</h1>
          </div>

          {DEMO_ENABLED && (
            <>
              <DemoButton />
              <p className="text-center text-xs text-muted">
                The demo signs you in instantly as a sample patient with seeded cases. No email
                needed.
              </p>

              <div className="flex items-center gap-3">
                <span className="h-px flex-1 bg-rule" />
                <span className="font-mono text-[0.65rem] uppercase tracking-wider text-muted">
                  or
                </span>
                <span className="h-px flex-1 bg-rule" />
              </div>
            </>
          )}

          <MagicLinkForm callbackUrl={callbackUrl} />
        </CardContent>
      </Card>

      <div className="flex w-full max-w-md flex-col gap-3 text-center">
        <p className="text-xs text-muted">
          By signing in you agree to our{' '}
          <Link href="/terms" className="text-accent hover:underline">
            Terms
          </Link>{' '}
          and{' '}
          <Link href="/privacy" className="text-accent hover:underline">
            Privacy Policy
          </Link>
          .
        </p>
        <Disclaimer className="text-center" />
        <Link href="/" className="text-sm text-accent hover:underline">
          Back to home
        </Link>
      </div>
    </div>
  );
}
