import { redirect } from 'next/navigation';
import { auth } from './config';

/** Returns the current session or null. */
export async function getSession() {
  return auth();
}

/**
 * Require an authenticated user in a server component / action. Redirects to
 * /login when there is no session. Returns the typed session user.
 */
export async function requireUser() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect('/login');
  }
  return session.user;
}

/**
 * Require an authenticated ADMIN. Use to gate operational actions (e.g.
 * recomputing global benchmarks) that must not be available to patients.
 * Throws — callers should already have a user, so this is a hard authz failure.
 */
export async function requireAdmin() {
  const user = await requireUser();
  if (user.role !== 'ADMIN') {
    throw new Error('Not authorized.');
  }
  return user;
}
