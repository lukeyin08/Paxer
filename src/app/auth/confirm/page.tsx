import type { Metadata } from 'next';
import Link from 'next/link';
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
 * button that forwards to the real callback on a genuine click.
 *
 * It carries the callback as OPAQUE params (`cb` path + `token` + `email`) and
 * forwards via a RELATIVE href — never an embedded `https://…` URL — because a
 * `?u=https://…` value reads as an open-redirect/phishing pattern to Google Safe
 * Browsing and can get a fresh domain flagged "Dangerous site".
 */
function buildCallbackHref(sp: { cb?: string; token?: string; email?: string }): string | null {
  const { cb, token, email } = sp;
  if (!cb || !token || !email) return null;
  // `cb` must be a same-origin RELATIVE auth-callback path — no scheme, no host,
  // no protocol-relative `//` — so this page can't be turned into an open redirect.
  if (!cb.startsWith('/api/auth/') || cb.includes('//') || cb.includes(':')) return null;
  const params = new URLSearchParams({ callbackUrl: '/app', token, email });
  return `${cb}?${params.toString()}`;
}

export default async function ConfirmSignInPage({
  searchParams,
}: {
  searchParams: Promise<{ cb?: string; token?: string; email?: string }>;
}) {
  const href = buildCallbackHref(await searchParams);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-6 py-12">
      <Wordmark size="lg" />
      <Card className="w-full max-w-md">
        <CardContent className="flex flex-col gap-5 pt-6 text-center">
          <div>
            <Kicker className="mb-2">Almost there</Kicker>
            <h1 className="font-sans text-2xl font-semibold">Confirm your sign-in</h1>
          </div>

          {href ? (
            <>
              <p className="text-sm text-muted">
                Click below to finish signing in to Paxer. This extra step keeps email security
                scanners from using up your one-time sign-in link.
              </p>
              <Button asChild className="w-full">
                {/* Relative href → resolves to this origin's Auth.js callback. A real
                    full-page navigation, only on a genuine click — never prefetched. */}
                <a href={href} rel="nofollow">
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
