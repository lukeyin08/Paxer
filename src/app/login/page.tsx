import type { Metadata } from 'next';
import Link from 'next/link';
import { Wordmark } from '@/components/brand/wordmark';
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
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-6 px-6 py-12">
      <Wordmark size="lg" />
      <div className="flex w-full max-w-md flex-col gap-6 border border-rule p-6">
        <h1 className="text-xl font-bold">Sign in to Paxer</h1>

        {DEMO_ENABLED && (
          <>
            <DemoButton />
            <p className="text-xs text-muted">
              The demo signs you in instantly as a sample patient with seeded cases. No email
              needed.
            </p>

            <div className="flex items-center gap-3">
              <span className="h-px flex-1 bg-rule" />
              <span className="text-xs text-muted">or</span>
              <span className="h-px flex-1 bg-rule" />
            </div>
          </>
        )}

        <MagicLinkForm callbackUrl={callbackUrl} />
      </div>

      <div className="flex w-full max-w-md flex-col gap-3">
        <p className="text-xs text-muted">
          By signing in you agree to our{' '}
          <Link href="/terms" className="link">
            Terms
          </Link>{' '}
          and{' '}
          <Link href="/privacy" className="link">
            Privacy Policy
          </Link>
          .
        </p>
        <Disclaimer />
        <Link href="/" className="link text-sm">
          Back to home
        </Link>
      </div>
    </div>
  );
}
