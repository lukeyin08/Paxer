# Paxer

**The only advocate on the patient's side of the bill.**

Paxer is a patient-side medical billing advocate. It audits the medical bills and
Explanation of Benefits (EOBs) a patient actually receives, finds the errors that
insurers and providers are content to leave in place, and helps the patient recover
their own money.

> **Prototype notice.** This build runs on **synthetic data only**. Do not enter real
> patient information. Real patient data must not be entered until a compliance program
> and Business Associate Agreements (BAAs) are in place. Paxer is a prototype; estimates
> are not guarantees; drafts must be reviewed by you before any use; this is not legal,
> medical, or financial advice.

---

## Stack

- **Framework:** Next.js (App Router) + React 19 + TypeScript (strict)
- **Styling:** Tailwind CSS + shadcn/ui primitives, custom black & blue brand theme
- **Database:** Postgres (Vercel Postgres / Neon) via Drizzle ORM
- **Auth:** Auth.js (NextAuth v5), magic link + seeded demo account
- **Storage:** Vercel Blob (uploaded bills / EOBs)
- **AI:** `@anthropic-ai/sdk`, server-side only (ingestion, audit, drafting)
- **Email:** Resend (magic links + deadline reminders)
- **Deploy target:** Vercel (free / hobby tier, no custom infra)

## Quick start

```bash
pnpm install
cp .env.example .env   # fill in values (see below)
pnpm db:migrate        # once Postgres is configured (Phase 1+)
pnpm seed              # load the synthetic demo (Phase 1+)
pnpm dev               # http://localhost:3000
```

### Scripts

| Script | What it does |
| --- | --- |
| `pnpm dev` | Run the dev server |
| `pnpm build` | Production build |
| `pnpm typecheck` | `tsc --noEmit` |
| `pnpm lint` | ESLint |
| `pnpm db:generate` | Generate Drizzle migrations from schema |
| `pnpm db:migrate` | Apply migrations |
| `pnpm seed` | Seed the synthetic demo (idempotent) |
| `pnpm test` | Vitest unit tests |
| `pnpm test:e2e` | Playwright happy-path e2e |
| `pnpm eval:extract` | AI extraction accuracy eval |

## Environment

See [`.env.example`](.env.example). All secrets are server-side only and are never
shipped to the client.

### Local Postgres

Any Postgres works. With Homebrew: `brew install postgresql@16 && brew services start
postgresql@16 && createdb paxer`, then set `DATABASE_URL=postgresql://<you>@localhost:5432/paxer`
in `.env`. Run `pnpm db:migrate` then `pnpm seed`.

### Auth note (stated deviation)

The spec calls for database sessions, but NextAuth v5's Credentials provider (the seeded
demo account, required for one-click review) only works with JWT sessions. Paxer therefore
uses `session: { strategy: 'jwt' }` while keeping the Drizzle adapter for user/account/
verification-token persistence. Demo login: `demo@paxer.app` / `paxer-demo`.

## Deploy to Vercel

Paxer is Vercel-native (no Docker, no long-running servers). Steps:

1. **Push to a Git repo** and import it in Vercel (Framework preset: Next.js).
2. **Add storage integrations** from the Vercel dashboard:
   - **Vercel Postgres (Neon)** → sets `DATABASE_URL` / `POSTGRES_URL`.
   - **Vercel Blob** → sets `BLOB_READ_WRITE_TOKEN`.
3. **Set environment variables** (Project → Settings → Environment Variables), see
   [`.env.example`](.env.example): `ANTHROPIC_API_KEY`, `AUTH_SECRET`
   (`openssl rand -base64 32`), `AUTH_URL` (your deployment URL), `RESEND_API_KEY` +
   `RESEND_FROM`, `CRON_SECRET`, `PAXER_FEE_RATE`, `PAXER_DAILY_AI_BUDGET_USD`.
4. **Run migrations + seed** against the production database (from your machine, with the
   production `DATABASE_URL` exported): `pnpm db:migrate && pnpm seed`.
5. **Deploy.** Cron jobs in [`vercel.json`](vercel.json) (`/api/cron/reminders` daily,
   `/api/cron/recompute-benchmarks` weekly) run automatically and are guarded by
   `CRON_SECRET` (Vercel injects `Authorization: Bearer $CRON_SECRET`).
6. **Verify the live demo:** open the URL → "View the demo" → walk the full loop on the
   seeded cases (zero configuration required beyond the env above).

AI routes (`/api/ingest`) and PDF/cron routes run on the Node runtime
(`export const runtime = 'nodejs'`). With no `ANTHROPIC_API_KEY`, the audit and draft
steps fall back to deterministic rules/templates, so the seeded demo is still fully
walkable; ingestion of *uploaded* documents requires the key.

> The actual `vercel deploy` is an action on **your** Vercel account — run it yourself once
> the repo and env are configured.

## Stubbed seams (built as interfaces, not faked as working)

- **Real payer FHIR / CMS Patient Access ingestion** — `MockFhirConnector` returns
  synthetic EOBs. `// TODO(paxer): real FHIR via aggregator (e.g. Flexpa)`.
- **Outbound submission** — "Submit" never contacts a real party; it queues a draft for
  explicit user approval, then records `SIMULATED_SENT`.
- **Payments / Stripe** — success fee and invoice are preview-only; no real money moves.
- **OCR at scale** — uses the Anthropic model's native PDF/image understanding.

## Out of scope (see Section 16 of the spec)

HIPAA program / BAAs / SOC 2 / production PHI handling; mobile apps; employer B2B portal;
multi-tenant orgs; dark mode toggle; i18n. Each is left as a documented seam.

## Build progress

- [x] **Phase 0** — Scaffold: Next.js + TS strict + Tailwind + brand system (black & blue),
      base primitives, landing page.
- [x] **Phase 1** — Data model + auth: full Drizzle schema + migrations, Auth.js v5
      (magic link via Resend + seeded demo credentials), onboarding/consent, audit_log,
      protected dashboard.
- [x] **Phase 2** — Cases + uploads: case CRUD + data-access layer, file upload (Vercel
      Blob with local-disk dev fallback), document records, manual line-item entry,
      `MockFhirConnector` (synthetic EOBs), tabbed new-case UI, case detail page.
- [x] **Phase 3** — Ingestion engine: centralized `runStructured` Anthropic client
      (adaptive thinking, effort, retry/timeout, daily spend guard, usage logging),
      versioned prompts, native PDF/image extraction with Zod-validated structured
      output + per-field confidence, low-confidence review step, `/api/ingest`,
      and `pnpm eval:extract` (renders synthetic fixture PDFs, scores field accuracy).
      Live extraction requires `ANTHROPIC_API_KEY`.
- [x] **Phase 4** — Audit engine: deterministic detectors (duplicate, cost-share recompute,
      OOP overrun, balance-billing/NSA, unbundling/NCCI seed, cross-provider duplicate,
      benchmark overcharge) + AI explanation/upcoding pass, findings persisted with
      confidence + capped estimated recovery, findings review UI (FindingCard, cost-share
      recompute table, benchmark widget), run/dismiss actions. Rule findings work without
      an API key; the seed produces all 7 rule-detectable finding types.
- [x] **Phase 5** — Disputes: draft generation (Opus when configured, deterministic
      template fallback so the loop works with no key), provider-vs-insurer target
      suggestion, editable letter workspace, PDF export (`/api/disputes/[id]/pdf`),
      approval → simulated-send (clearly labeled, no real party contacted) → response
      logging → escalation lifecycle, dispute events timeline, disputes list.
- [x] **Phase 6** — Recoveries, fees, benchmarks, cron: recovery logging with success-fee
      computation + invoice preview (Stripe seam marked), findings→RECOVERED / case→RESOLVED
      transitions, benchmark explorer + anonymized aggregate recompute (the moat),
      CRON_SECRET-guarded cron routes (`/api/cron/reminders`, `/api/cron/recompute-benchmarks`),
      `vercel.json` cron schedules, dashboard wired to real recovered totals + deadlines.
- [x] **Phase 7** — Polish, seed, tests, deploy: full demo seed (5 cases, all rule finding
      types, 3 disputes incl. simulated-sent + won, a recorded recovery), settings page
      (edit state, consent record, hard-delete case/account + Blob purge), Vitest unit
      tests (cost-share, fees, detectors, schema converter, currency), Playwright happy-path
      e2e (sign in → case → audit → dispute → simulated send → recovery → fee), disclaimers
      throughout, deploy docs.

## Demo walkthrough (what to verify)

1. **View the demo** from the landing page (no sign-up) — lands on the dashboard with
   cases, an estimated-recoverable total, a recovered total, and an upcoming deadline.
2. **Open a case** (e.g. the ER visit) — see documents, line items, plan benefits, and
   findings (duplicate, unbundling, cost-share recompute table, benchmark widget, …).
3. **Start a dispute** from a finding → generate a letter → edit → **Approve** →
   **Confirm & simulate send** (note the "no real party contacted" banner) → download the PDF.
4. **Log a response** (Won) → **Record recovery** → see the success fee and what you keep.
5. **Benchmarks** page shows the price dataset and "Recompute from data" (the moat).
6. **Settings** lets you edit your state, view your consent record, and delete data.
7. Cron: `curl -H "Authorization: Bearer $CRON_SECRET" $URL/api/cron/reminders`.

## Testing

- `pnpm test` — Vitest unit tests (cost-share math, fee computation, detectors, Zod→JSON
  schema converter, currency formatting).
- `pnpm test:e2e` — Playwright happy-path (boots the dev server; needs a seeded DB).
- `pnpm eval:extract` — AI extraction accuracy eval against synthetic fixture PDFs
  (requires `ANTHROPIC_API_KEY`; skips cleanly without it).
