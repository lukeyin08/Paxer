/**
 * Seeded demo account (Section 7.1). Lets reviewers skip email and walk the full
 * loop immediately. Synthetic data only.
 */
export const DEMO_EMAIL = 'demo@paxer.health';
export const DEMO_PASSWORD = 'paxer-demo';
export const DEMO_NAME = 'Demo Patient';

/**
 * The demo account (and the Credentials provider that backs it) is a known,
 * shared, hardcoded-password login on synthetic data — fine for local review,
 * unacceptable in production where real patients enter real PHI. Gate it off in
 * production so the only public sign-in path is the email magic link.
 */
export const DEMO_ENABLED = process.env.NODE_ENV !== 'production';
