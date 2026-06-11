# Paxer — Launch Readiness (real patients, real bills)

This file tracks what was hardened in code and what **you** must still own before
exposing Paxer to real patients with real medical bills. The code changes below
are done and the production build passes; the items under "Blockers code can't
solve" are not optional.

## Scope decisions for v1 (chosen)

- **Payments:** notional — fees/recoveries are recorded, no money moves (no Stripe yet).
- **Dispute sending:** the patient downloads the PDF and sends it themselves.
- **Insurer data:** manual entry / document upload only (the mock FHIR "Connect insurer" path was removed).

## Done in code

- **Private file storage (PHI leak fixed).** Uploaded bills/EOBs are no longer
  exposed at public blob URLs. They are served only through
  `GET /api/documents/[id]`, which enforces per-user ownership. The blob URL is
  treated as a server-side secret; the old unauthenticated `/api/uploads/[...]`
  route was deleted. In production, missing `BLOB_READ_WRITE_TOKEN` now fails
  loudly instead of writing PHI to a read-only/local disk.
- **Rate limiting + per-user AI budget.** Postgres-backed fixed-window limiter
  (`src/lib/rate-limit.ts`, new `rate_limits` table) on extraction, AI audit,
  AI drafting, magic-link sends, and credential logins. Added a per-user daily
  AI spend ceiling (`PAXER_USER_DAILY_AI_BUDGET_USD`, default $3) alongside the
  global one, which also closes the budget race.
- **Error boundaries + observability.** `error.tsx`, `app/error.tsx`,
  `global-error.tsx`, `not-found.tsx`, plus `src/lib/observability.ts`
  (`reportError`) as the single seam to wire Sentry/Logtail. Added
  `GET /api/health` for uptime monitoring.
- **Demo account locked down.** The Credentials provider and the
  `demo@paxer.app` login are disabled in production (`DEMO_ENABLED`); the only
  public sign-in is the email magic link. The demo button is hidden in prod.
- **ADMIN gating.** Benchmark recompute now requires `requireAdmin()` instead of
  any logged-in patient.
- **Prototype framing removed.** "Synthetic data only / prototype" notices are
  gone; onboarding/login now reference the Terms + Privacy Policy; the dispute
  "simulated send" is reframed as the patient marking the letter sent.
- **Legal pages scaffolded.** `/privacy` and `/terms` exist and are linked from
  the footer, login, and onboarding — clearly marked **DRAFT pending counsel**.
- **Business model on the site.** Consumer product is **free** (`PAXER_FEE_RATE=0`),
  reflected on the landing, `/pricing`, `/how-it-works`, and Terms. The **Audit
  API** (B2B revenue) is live at `POST /api/v1/audit` with hashed Bearer keys
  managed in Settings → Developers, and is marketed publicly via `/developers`
  and `/pricing` (free tier rate-limited; "contact us" for volume — no Stripe yet,
  by design). The fee plumbing is retained for a future employer/PEPM tier.
- **Security headers.** Global CSP + `X-Frame-Options: DENY`, `nosniff`,
  `Referrer-Policy`, HSTS, and `Permissions-Policy` via `next.config.mjs`
  (nonce-based CSP is the noted next hardening step).
- **Contact inboxes.** The entire site (`/developers`, `/pricing`, footer,
  legal pages, settings, JSON-LD) is standardized on `hello@paxer.app`.
  **Stand this inbox up before going public.**

## Before deploying (operational — your action)

1. **Run the new migrations** against the prod DB: `pnpm db:migrate`
   (adds `0003_rate_limits`, `0004_recovery_dispute_link`,
   `0005_line_item_adjustment_codes`, and `0006_api_keys`). Then seed only if
   desired (`pnpm seed` creates the demo account; harmless in prod since the
   Credentials provider is off).
2. **Set production env vars** in Vercel: `DATABASE_URL`/`POSTGRES_URL`,
   `AUTH_SECRET` (fresh — do not reuse the local one), `AUTH_URL`,
   `BLOB_READ_WRITE_TOKEN` (now required), `CRON_SECRET` (strong),
   `ANTHROPIC_API_KEY`, `RESEND_API_KEY` + `RESEND_FROM`, and optionally
   `PAXER_USER_DAILY_AI_BUDGET_USD`.
3. **Vercel Pro plan** — the app uses 2 cron jobs and a 120s `maxDuration` on
   `/api/ingest`, both above Hobby limits.
4. **Verify a Resend sending domain** (SPF/DKIM/DMARC) — don't ship magic links
   from the shared `onboarding@resend.dev`.
5. **Wire a real error monitor** in `src/lib/observability.ts` (Sentry, etc.).

## Blockers code CANNOT solve (must be resolved before real PHI)

1. **Signed BAAs** with every processor that touches PHI — at minimum
   **Anthropic, Resend, and Vercel** (Postgres + Blob). Do not send real patient
   data until these are in place.
2. **Pricing.** The consumer product is now **free** for individuals
   (`PAXER_FEE_RATE=0`), which removes the contingency-fee legal exposure (state
   billing-advocate licensing, debt-adjusting statutes, fee caps, UPL) for the
   B2C path. The fee plumbing is retained for a future **B2B / shared-savings**
   tier — if/when that ships, the same regulatory review applies before charging.
3. **Counsel-reviewed Privacy Policy + Terms.** The scaffolds at `/privacy` and
   `/terms` are placeholders, not enforceable legal documents. Once counsel
   finalizes them, remove the yellow "Draft — not yet legal advice" banner in
   `src/components/legal-layout.tsx`, and confirm the `hello@paxer.app`
   inbox referenced there is real and monitored.
4. **Confirm HIPAA posture.** Whether Paxer is a covered entity/business
   associate determines obligations beyond BAAs (breach notification, access
   controls, audit). Get a determination from counsel.

## Recommended follow-ups (not launch blockers)

- Application-level encryption of the most sensitive PHI columns (today storage
  is provider-default at rest).
- A scheduled cleanup of stale `rate_limits` rows.
- Magic-byte sniffing on uploads (current validation trusts the client MIME).

## Counsel review — consumer Paxer Plus subscription (added with the consumer paywall)

The consumer model charges patients a flat **Paxer Plus** subscription (≈$12/mo)
to **generate dispute letters** (audits remain free). This is a flat software fee,
not a contingency — `PAXER_FEE_RATE` stays `0` — but it still needs counsel sign-off
before charging real consumers:

- **UPL / billing-advocate licensing.** Charging consumers to produce dispute/appeal
  letters may implicate unauthorized-practice-of-law rules and state medical-billing-
  advocate licensing/registration regimes. Confirm Paxer is positioned as a self-help
  document tool (patient reviews, completes, and sends every letter — which it does).
- **Subscription / auto-renewal disclosure law.** Recurring consumer subscriptions are
  regulated (e.g. California's Automatic Renewal Law, FTC "click-to-cancel", and similar
  state statutes): clear pre-checkout disclosure of price/renewal terms, affirmative
  consent, easy online cancellation, and renewal reminders. Review the Plus checkout,
  Terms §3, and the Settings cancellation path against these.
- **Refunds.** Terms §3 states a default non-refundable policy "except where required by
  law" — confirm against applicable consumer-protection law.

Not a code blocker (billing is dormant until `STRIPE_PRICE_CONSUMER` is set), but resolve
before flipping consumer billing live.
