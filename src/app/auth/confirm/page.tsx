import type { Metadata } from 'next';
import Link from 'next/link';
import { headers } from 'next/headers';
import { Wordmark } from '@/components/brand/wordmark';
import { Kicker } from '@/components/brand/kicker';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

// Token-bearing page: never cache or index it.
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Confirm sign-in',
  robots: { index: false, follow: false },
};

/**
 * Magic-link confirmation interstitial.
 *
 * The sign-in email links HERE, not straight to the Auth.js callback, because
 * corporate/university mail scanners (Microsoft Safe Links, Proofpoint, etc.)
 * pre-fetch every link in an email to vet it — and a GET on the real callback
 * would consume the one-time token before the human ever clicks, leaving them
 * with an "expired link". This page does NOT touch the token; it only renders a
 * button that forwards to the real callback on a genuine click. Auth.js passes
 * the full callback URL as the `u` query param.
 */
async function resolveCallback(raw: string | undefined): Promise<string | null> {
  if (!raw) return null;
  try {
    const target = new URL(raw);
    const host = (await headers()).get('host');
    // Only ever forward to THIS host's own Auth.js callback — never an arbitrary
    // URL — so the page can't be abused as an open redirect / phishing hop.
    if (host && target.host === host && target.pathname.startsWith('/api/auth/')) {
      return target.toString();
    }
  } catch {
    // malformed URL → treat as invalid below
  }
  return null;
}

export default async function ConfirmSignInPage({
  searchParams,
}: {
  searchParams: Promise<{ u?: string }>;
}) {
  const { u } = await searchParams;
  const callbackUrl = await resolveCallback(u);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-6 py-12">
      <Wordmark size="lg" />
      <Card className="w-full max-w-md">
        <CardContent className="flex flex-col gap-5 pt-6 text-center">
          <div>
            <Kicker className="mb-2">Almost there</Kicker>
            <h1 className="font-sans text-2xl font-semibold">Confirm your sign-in</h1>
          </div>

          {callbackUrl ? (
            <>
              <p className="text-sm text-muted">
                Click below to finish signing in to Paxer. This extra step keeps email security
                scanners from using up your one-time sign-in link.
              </p>
              <Button asChild className="w-full">
                {/* Plain <a>: a real full-page navigation to the Auth.js callback,
                    only on a genuine click — Next.js won't prefetch it. */}
                <a href={callbackUrl} rel="nofollow">
                  Confirm sign-in
                </a>
              </Button>
            </>
          ) : (
            <>
              <p className="text-sm text-danger">
                This sign-in link is missing or invalid — it may have already been used or expired.
                Request a fresh one and try again.
              </p>
              <Button asChild className="w-full">
                <Link href="/login">Back to sign in</Link>
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
