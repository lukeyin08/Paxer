'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import Link from 'next/link';
import { DISCLAIMER_TEXT } from '@/components/brand/disclaimer';
import { completeOnboarding } from './actions';

function Submit() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? 'Saving…' : 'Continue to Paxer'}
    </Button>
  );
}

export function OnboardingForm({ defaultName }: { defaultName?: string }) {
  const [state, formAction] = useActionState(completeOnboarding, null);
  return (
    <form action={formAction} className="flex flex-col gap-5">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="name">Your name</Label>
        <Input id="name" name="name" defaultValue={defaultName} placeholder="Jordan Rivera" required />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="state">State (optional)</Label>
        <Input id="state" name="state" placeholder="CA" maxLength={2} />
        <p className="text-xs text-muted">Used to compare charges against regional benchmarks.</p>
      </div>
      <label className="flex items-start gap-3 rounded-md border border-rule bg-soft/40 p-3 text-sm">
        <Checkbox id="consent" name="consent" className="mt-0.5" />
        <span className="text-muted">
          I agree to Paxer&rsquo;s{' '}
          <Link
            href="/terms"
            className="text-accent hover:underline"
            target="_blank"
            onClick={(e) => e.stopPropagation()}
          >
            Terms of Service
          </Link>{' '}
          and{' '}
          <Link
            href="/privacy"
            className="text-accent hover:underline"
            target="_blank"
            onClick={(e) => e.stopPropagation()}
          >
            Privacy Policy
          </Link>
          , and consent to Paxer processing my medical billing information to audit my bills.{' '}
          {DISCLAIMER_TEXT}
        </span>
      </label>
      <Submit />
      {state?.error && <p className="text-sm text-danger">{state.error}</p>}
    </form>
  );
}
