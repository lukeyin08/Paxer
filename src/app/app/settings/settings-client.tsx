'use client';

import { useState, useTransition } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { updateStateAction, deleteCaseAction, deleteAccountAction } from './actions';
import { US_STATES } from '@/lib/us-states';

export function StateForm({ defaultState }: { defaultState: string }) {
  const [state, setState] = useState(defaultState);
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  return (
    <div className="flex items-end gap-3">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="state">State</Label>
        <select
          id="state"
          value={state}
          onChange={(e) => {
            setState(e.target.value);
            setSaved(false);
          }}
          className="h-10 w-56 rounded-md border border-rule bg-card px-3 text-sm text-ink outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <option value="">Select your state…</option>
          {US_STATES.map((s) => (
            <option key={s.code} value={s.code}>
              {s.name}
            </option>
          ))}
        </select>
      </div>
      <Button
        variant="outline"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            await updateStateAction(state);
            setSaved(true);
          })
        }
      >
        {pending ? 'Saving…' : 'Save'}
      </Button>
      {saved && <span className="pb-2 text-sm text-success">Saved.</span>}
    </div>
  );
}

export function DeleteCaseButton({ caseId, title }: { caseId: string; title: string }) {
  const [pending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState(false);
  if (!confirming) {
    return (
      <Button size="sm" variant="ghost" className="text-danger" onClick={() => setConfirming(true)}>
        Delete
      </Button>
    );
  }
  return (
    <span className="flex items-center gap-2">
      <span className="text-xs text-muted">Delete &ldquo;{title}&rdquo;?</span>
      <Button
        size="sm"
        variant="destructive"
        disabled={pending}
        onClick={() => startTransition(async () => void (await deleteCaseAction(caseId)))}
      >
        {pending ? 'Deleting…' : 'Yes, delete'}
      </Button>
      <Button size="sm" variant="ghost" onClick={() => setConfirming(false)}>
        Cancel
      </Button>
    </span>
  );
}

export function DeleteAccountCard() {
  const [pending, startTransition] = useTransition();
  const [confirm, setConfirm] = useState('');
  return (
    <Card className="border-danger/30">
      <CardContent className="flex flex-col gap-3 pt-6">
        <h2 className="font-sans text-lg font-semibold text-danger">Delete account</h2>
        <p className="text-sm text-muted">
          Permanently deletes your account and all cases, documents, findings, disputes, and
          recoveries. This cannot be undone. Type <strong>DELETE</strong> to confirm.
        </p>
        <div className="flex items-center gap-3">
          <Input
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="DELETE"
            className="w-40"
          />
          <Button
            variant="destructive"
            disabled={pending || confirm !== 'DELETE'}
            onClick={() => startTransition(async () => void (await deleteAccountAction()))}
          >
            {pending ? 'Deleting…' : 'Delete my account'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
