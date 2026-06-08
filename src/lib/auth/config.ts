import NextAuth, { type DefaultSession } from 'next-auth';
import { DrizzleAdapter } from '@auth/drizzle-adapter';
import Credentials from 'next-auth/providers/credentials';
import Resend from 'next-auth/providers/resend';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/lib/db';
import { users, accounts, sessions, verificationTokens } from '@/lib/db/schema';
import { verifyPassword } from './password';
import { env, DEFAULT_EMAIL_FROM } from '@/lib/env';
import { checkRateLimit } from '@/lib/rate-limit';
import { DEMO_ENABLED } from './demo';

// Expose id + role on the session (Section 6).
declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      role: 'PATIENT' | 'ADMIN';
    } & DefaultSession['user'];
  }
  interface User {
    role?: 'PATIENT' | 'ADMIN';
  }
}

const credsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),
  // Credentials (seeded demo) requires JWT sessions; magic link works with JWT too.
  session: { strategy: 'jwt' },
  pages: { signIn: '/login' },
  providers: [
    // Password (demo) login is dev-only: a shared, known-password account on
    // synthetic data. In production the only sign-in is the email magic link.
    ...(DEMO_ENABLED
      ? [
          Credentials({
            id: 'credentials',
            name: 'Demo account',
            credentials: {
              email: { label: 'Email', type: 'email' },
              password: { label: 'Password', type: 'password' },
            },
            async authorize(raw) {
              const parsed = credsSchema.safeParse(raw);
              if (!parsed.success) return null;
              const { email, password } = parsed.data;
              // Brute-force throttle: 10 attempts / 15 min per email. Fail closed
              // (treat as bad credentials) rather than throwing, to avoid enumeration.
              const limit = await checkRateLimit(`login:${email.toLowerCase()}`, 10, 900);
              if (!limit.ok) return null;
              const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
              if (!user?.passwordHash || user.deletedAt) return null;
              const ok = await verifyPassword(password, user.passwordHash);
              if (!ok) return null;
              return { id: user.id, email: user.email, name: user.name, role: user.role };
            },
          }),
        ]
      : []),
    Resend({
      apiKey: env.RESEND_API_KEY ?? 'dev-no-key',
      from: env.RESEND_FROM ?? DEFAULT_EMAIL_FROM,
      // In dev (or when no Resend key), log the magic link instead of sending email.
      async sendVerificationRequest({ identifier, url }) {
        // Rate-limiting lives in the sendMagicLink server action (the only
        // magic-link entry point) so it can return a user-facing message — an
        // error thrown here is swallowed by Auth.js. See src/app/login/actions.ts.
        // Link to our confirmation page, not straight to the Auth.js callback:
        // email security scanners (Microsoft Safe Links, etc.) pre-fetch links,
        // and a GET on the callback burns the one-time token before the user
        // clicks. The interstitial doesn't touch the token; the real callback
        // fires only on a genuine click. See src/app/auth/confirm/page.tsx.
        //
        // Carry the callback as OPAQUE params (path + token + email), NOT as an
        // embedded `?u=https://…` URL — that shape reads as open-redirect/phishing
        // to Google Safe Browsing and can get a fresh domain flagged "Dangerous".
        const cbUrl = new URL(url);
        const confirmUrl = new URL('/auth/confirm', url);
        confirmUrl.searchParams.set('cb', cbUrl.pathname);
        const token = cbUrl.searchParams.get('token');
        const emailParam = cbUrl.searchParams.get('email');
        if (token) confirmUrl.searchParams.set('token', token);
        if (emailParam) confirmUrl.searchParams.set('email', emailParam);
        // Preserve a developer/business post-sign-in destination (e.g. /app/settings)
        // when one was requested. Strip any origin, allow only same-site /app paths,
        // and omit it for the default so the patient flow is unchanged.
        const cbTarget = (cbUrl.searchParams.get('callbackUrl') ?? '').replace(/^https?:\/\/[^/]+/, '');
        if (cbTarget.startsWith('/app') && !cbTarget.startsWith('//') && cbTarget !== '/app') {
          confirmUrl.searchParams.set('next', cbTarget);
        }
        const link = confirmUrl.toString();
        if (!env.RESEND_API_KEY) {
          console.log(`\n🔗 Paxer magic link for ${identifier}:\n${link}\n`);
          return;
        }
        const { Resend: ResendClient } = await import('resend');
        const resend = new ResendClient(env.RESEND_API_KEY);
        await resend.emails.send({
          from: env.RESEND_FROM ?? DEFAULT_EMAIL_FROM,
          to: identifier,
          subject: 'Sign in to Paxer',
          text: `Sign in to Paxer:\n${link}\n\nIf you did not request this, you can ignore it.`,
        });
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role ?? 'PATIENT';
      }
      return token;
    },
    async session({ session, token }) {
      if (token.id) session.user.id = token.id as string;
      session.user.role = (token.role as 'PATIENT' | 'ADMIN') ?? 'PATIENT';
      return session;
    },
  },
});
