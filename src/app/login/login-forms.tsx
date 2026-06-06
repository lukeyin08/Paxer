'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { signInDemo, sendMagicLink } from './actions';

function SubmitButton({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? 'Working…' : children}
    </Button>
  );
}

export function DemoButton() {
  return (
    <form action={signInDemo}>
      <SubmitButton>View the demo</SubmitButton>
    </form>
  );
}

export function MagicLinkForm() {
  const [state, formAction] = useActionState(sendMagicLink, null);
  return (
    <form action={formAction} className="flex flex-col gap-3">
      <div className="flex flex-col gap-1.5 text-left">
        <Label htmlFor="email">Email address</Label>
        <Input id="email" name="email" type="email" placeholder="you@example.com" required />
      </div>
      <SubmitButton>Email me a sign-in link</SubmitButton>
      {state && (
        <p className={state.ok ? 'text-sm text-success' : 'text-sm text-danger'}>{state.message}</p>
      )}
    </form>
  );
}
