import { redirect } from 'next/navigation';

// There is no standalone cases index — the dashboard lists cases. Redirect any
// direct hit on /app/cases there instead of 404ing.
export default function CasesIndexPage() {
  redirect('/app');
}
