'use client';

import { useState, useTransition } from 'react';
import { useFormStatus } from 'react-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { StatusPill } from '@/components/brand/status-pill';
import { Disclaimer } from '@/components/brand/disclaimer';
import { createCaseFromUpload, connectMockPayer } from './actions';

function UploadSubmit() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="self-start">
      {pending ? 'Uploading…' : 'Upload & create case'}
    </Button>
  );
}

export function UploadForm() {
  return (
    <form action={createCaseFromUpload} className="flex flex-col gap-5">
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
          the next step. Synthetic documents only.
        </p>
      </div>
      <UploadSubmit />
      <Disclaimer variant="inline" />
    </form>
  );
}

export function ConnectForm({ payers }: { payers: { id: string; name: string }[] }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const payerId = payers[0]?.id ?? 'brightpath';

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-2">
        <StatusPill label="DEMO CONNECTION" tone="warning" />
        <span className="text-sm text-muted">No real insurer is contacted.</span>
      </div>
      <p className="text-sm text-muted">
        This simulates connecting your insurer and pulling your Explanation of Benefits (EOBs). In
        this prototype it returns synthetic EOBs from a mock payer feed. The real version connects
        via a FHIR aggregator (a documented seam).
      </p>
      <div className="rounded-md border border-rule bg-soft/40 p-4">
        <p className="font-mono text-[0.65rem] uppercase tracking-wider text-muted">Available (demo)</p>
        <p className="mt-1 font-serif text-lg">{payers[0]?.name ?? 'Brightpath Health (demo)'}</p>
      </div>
      <Button
        onClick={() =>
          startTransition(async () => {
            setError(null);
            try {
              await connectMockPayer(payerId);
            } catch (e) {
              // A successful server action redirects by throwing NEXT_REDIRECT;
              // re-throw it so navigation proceeds instead of showing a fake error.
              if (e && typeof e === 'object' && 'digest' in e && typeof e.digest === 'string' && e.digest.startsWith('NEXT_REDIRECT')) {
                throw e;
              }
              setError(e instanceof Error ? e.message : 'Connection failed.');
            }
          })
        }
        disabled={pending}
        className="self-start"
      >
        {pending ? 'Connecting…' : 'Connect demo insurer'}
      </Button>
      {error && <p className="text-sm text-danger">{error}</p>}
    </div>
  );
}
