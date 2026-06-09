'use client';

import { useState, useTransition } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Money } from '@/components/brand/money';
import { StatusPill } from '@/components/brand/status-pill';
import { Disclaimer } from '@/components/brand/disclaimer';
import { severityTone } from '@/lib/cases/status';
import { generateDisputeAction } from '@/app/app/disputes/actions';
import { ConsumerPaywall } from '@/components/consumer-paywall';
import type { LetterDetailsInput } from '@/lib/disputes/letter-context';

export interface SelectableFinding {
  id: string;
  type: string;
  severity: 'LOW' | 'MED' | 'HIGH';
  title: string;
  estimatedRecovery: number | null;
}

export interface DraftPrefill {
  senderName: string;
  senderEmail: string;
  payerName: string;
  providerName: string;
}

const REQUIRED_FIELDS: (keyof LetterDetailsInput)[] = [
  'senderName',
  'senderAddress',
  'senderCityStateZip',
  'senderPhone',
  'senderEmail',
  'recipientName',
];

// Defined at module scope (not inside DraftForm) so it keeps a stable identity
// across renders — otherwise each keystroke would remount the input and drop focus.
function Field({
  label,
  value,
  onChange,
  placeholder,
  required,
  type = 'text',
  className,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
  type?: string;
  className?: string;
}) {
  return (
    <div className={`flex flex-col gap-1.5 ${className ?? ''}`}>
      <Label>
        {label}
        {required ? <span className="text-danger"> *</span> : null}
      </Label>
      <Input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  );
}

export function DraftForm({
  caseId,
  findings,
  preselected,
  prefill,
  canDraft,
  plusPriceLabel,
  plusConfigured,
}: {
  caseId: string;
  findings: SelectableFinding[];
  preselected: string[];
  prefill: DraftPrefill;
  /** Whether this user may generate a draft (Plus subscriber or demo). */
  canDraft: boolean;
  plusPriceLabel: string;
  plusConfigured: boolean;
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set(preselected));
  const [target, setTarget] = useState<'PROVIDER' | 'INSURER' | 'AUTO'>('AUTO');
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [showPaywall, setShowPaywall] = useState(false);
  const [details, setDetails] = useState<LetterDetailsInput>({
    senderName: prefill.senderName,
    senderAddress: '',
    senderCityStateZip: '',
    senderPhone: '',
    senderEmail: prefill.senderEmail,
    recipientName: prefill.payerName || prefill.providerName,
    recipientAddress: '',
    recipientCityStateZip: '',
    memberId: '',
    claimNumber: '',
  });

  const setField = (k: keyof LetterDetailsInput) => (v: string) =>
    setDetails((d) => ({ ...d, [k]: v }));

  const toggle = (id: string) =>
    setSelected((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });

  const total = findings
    .filter((f) => selected.has(f.id))
    .reduce((s, f) => s + (f.estimatedRecovery ?? 0), 0);

  function generate() {
    setError(null);
    // Paywall first: don't make a locked user fill out the form. The popup is
    // shown the moment they try to generate (server still enforces the gate).
    if (!canDraft) {
      setShowPaywall(true);
      return;
    }
    if (selected.size === 0) {
      setError('Select at least one finding to dispute.');
      return;
    }
    if (REQUIRED_FIELDS.some((k) => !details[k].trim())) {
      setError('Please complete your contact details and the recipient name (fields marked *).');
      return;
    }
    // Trim everything so stray whitespace never lands in the letter.
    const trimmed = Object.fromEntries(
      Object.entries(details).map(([k, v]) => [k, v.trim()]),
    ) as LetterDetailsInput;
    startTransition(async () => {
      const res = await generateDisputeAction({
        caseId,
        findingIds: [...selected],
        target: target === 'AUTO' ? undefined : target,
        details: trimmed,
      });
      // The subscription may have lapsed between page load and submit — fall back
      // to the paywall if the server gate trips.
      if (res && !res.ok) {
        if (res.code === 'subscription_required') setShowPaywall(true);
        else setError(res.error);
      }
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        {findings.map((f) => (
          <Card key={f.id}>
            <CardContent className="flex items-center gap-3 pt-6">
              <Checkbox
                checked={selected.has(f.id)}
                onCheckedChange={() => toggle(f.id)}
                id={`f-${f.id}`}
              />
              <label htmlFor={`f-${f.id}`} className="flex flex-1 items-center justify-between gap-3">
                <span className="flex items-center gap-2">
                  <StatusPill label={f.severity} tone={severityTone(f.severity)} />
                  <span className="text-sm">{f.title}</span>
                </span>
                <Money amount={f.estimatedRecovery} estimate size="sm" />
              </label>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="kicker">Send to</span>
          {(['AUTO', 'PROVIDER', 'INSURER'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTarget(t)}
              className={`rounded-md border px-3 py-1 text-xs ${
                target === t ? 'border-accent bg-accent/10 text-accent' : 'border-rule text-muted'
              }`}
            >
              {t === 'AUTO' ? 'Auto' : t === 'PROVIDER' ? 'Provider' : 'Insurer'}
            </button>
          ))}
        </div>
        <div className="ml-auto text-right">
          <span className="kicker">Total estimated</span>
          <div>
            <Money amount={total} estimate size="lg" />
          </div>
        </div>
      </div>

      {/* Contact / claim details so the generated letter is final — no [placeholders]. */}
      <Card>
        <CardContent className="flex flex-col gap-6 pt-6">
          <div>
            <h2 className="font-sans text-lg font-semibold">Your details</h2>
            <p className="mt-1 text-sm text-muted">
              We use these to produce a finished letter with no blanks to fill in. Fields marked{' '}
              <span className="text-danger">*</span> are required.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <span className="kicker">Your contact information</span>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Full name" value={details.senderName} onChange={setField('senderName')} placeholder="Jane Doe" required />
              <Field label="Phone" value={details.senderPhone} onChange={setField('senderPhone')} placeholder="(555) 123-4567" required />
              <Field label="Email" type="email" value={details.senderEmail} onChange={setField('senderEmail')} placeholder="you@example.com" required />
              <Field label="Street address" value={details.senderAddress} onChange={setField('senderAddress')} placeholder="123 Main St, Apt 4" required />
              <Field label="City, State ZIP" value={details.senderCityStateZip} onChange={setField('senderCityStateZip')} placeholder="Austin, TX 78701" required className="sm:col-span-2" />
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <span className="kicker">Send the letter to</span>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Recipient name" value={details.recipientName} onChange={setField('recipientName')} placeholder="Cigna Appeals Department" required className="sm:col-span-2" />
              <Field label="Recipient street address" value={details.recipientAddress} onChange={setField('recipientAddress')} placeholder="PO Box 188061" />
              <Field label="Recipient city, state ZIP" value={details.recipientCityStateZip} onChange={setField('recipientCityStateZip')} placeholder="Chattanooga, TN 37422" />
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <span className="kicker">Claim details</span>
            <p className="text-xs text-muted">
              From your insurance card and Explanation of Benefits. Leave blank if not applicable —
              we&rsquo;ll simply omit them.
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Member ID" value={details.memberId} onChange={setField('memberId')} placeholder="U1234567801" />
              <Field label="Claim number" value={details.claimNumber} onChange={setField('claimNumber')} placeholder="20-123456789" />
            </div>
          </div>
        </CardContent>
      </Card>

      {error && <p className="text-sm text-danger">{error}</p>}
      <div className="flex flex-col gap-2">
        <Button onClick={generate} disabled={pending} className="self-start">
          {pending ? 'Drafting…' : 'Generate dispute letter'}
        </Button>
        {!canDraft && (
          <p className="text-xs text-muted">
            Generating a dispute letter requires Paxer Plus ({plusPriceLabel}).
          </p>
        )}
      </div>
      <Disclaimer variant="callout" />

      <ConsumerPaywall
        open={showPaywall}
        onOpenChange={setShowPaywall}
        priceLabel={plusPriceLabel}
        configured={plusConfigured}
      />
    </div>
  );
}
