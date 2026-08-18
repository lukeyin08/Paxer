import type { Metadata } from 'next';
import Link from 'next/link';
import { MarketingHeader } from '@/components/marketing-header';
import { SiteFooter } from '@/components/site-footer';
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
    <div className="flex min-h-screen flex-col">
      <a href="#content" className="skip-link">
        Skip to content
      </a>
      <MarketingHeader />

      {/* Was a bare centred card with no nav: a dead end that looked like a
          different site. It now sits in the same shell as every other page. */}
      <main id="content" className="measure flex-1 py-16">
        <div className="max-w-md">
          <h1 className="text-[2rem] leading-tight">Sign in to Paxer</h1>
          <p className="mt-3 leading-relaxed text-muted">
            We email you a link that signs you in. It works whether or not you already have an
            account.
          </p>

          <div className="mt-8 flex flex-col gap-6">
            {DEMO_ENABLED && (
              <>
                <DemoButton />
                <p className="text-sm text-muted">
                  The demo signs you in instantly as a sample patient with seeded cases. No email
                  needed.
                </p>
                <div className="flex items-center gap-3">
                  <span className="h-px flex-1 bg-rule" />
                  <span className="text-sm text-muted">or</span>
                  <span className="h-px flex-1 bg-rule" />
                </div>
              </>
            )}
            <MagicLinkForm callbackUrl={callbackUrl} />
          </div>

          <p className="mt-8 text-sm text-muted">
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
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
