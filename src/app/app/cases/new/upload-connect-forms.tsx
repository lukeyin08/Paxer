'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Disclaimer } from '@/components/brand/disclaimer';
import { createCaseFromUpload } from './actions';

function UploadSubmit() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="self-start">
      {pending ? 'Uploading…' : 'Upload & create case'}
    </Button>
  );
}

export function UploadForm() {
  const [state, formAction] = useActionState(createCaseFromUpload, null);
  return (
    <form action={formAction} className="flex flex-col gap-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="u-title">Case title</Label>
          <Input id="u-title" name="title" placeholder="Hospital bill, March 2025" required />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="u-provider">Provider (optional)</Label>
          <Input id="u-provider" name="providerName" placeholder="St. Marin Medical Center" />
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="u-files">Bill and/or EOB</Label>
        <Input
          id="u-files"
          name="files"
          type="file"
          multiple
          accept="application/pdf,image/png,image/jpeg"
          className="cursor-pointer file:mr-3 file:rounded file:border-0 file:bg-soft file:px-3 file:py-1 file:text-ink"
        />
        <p className="text-xs text-muted">
          PDF, PNG, or JPEG up to 12&nbsp;MB. Paxer reads the document and extracts every charge in
          the next step.
        </p>
      </div>
      <UploadSubmit />
      {state?.error && <p className="text-sm text-danger">{state.error}</p>}
      <Disclaimer variant="inline" />
    </form>
  );
}
