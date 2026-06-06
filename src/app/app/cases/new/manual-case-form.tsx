'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Trash2, Plus } from 'lucide-react';
import { createManualCase } from './actions';
import type { LineItemInput } from '@/lib/domain/line-item';

type Row = {
  description: string;
  cptHcpcsCode: string;
  units: string;
  chargeAmount: string;
  patientResponsibility: string;
};

const emptyRow: Row = {
  description: '',
  cptHcpcsCode: '',
  units: '1',
  chargeAmount: '',
  patientResponsibility: '',
};

export function ManualCaseForm() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [providerName, setProviderName] = useState('');
  const [payerName, setPayerName] = useState('');
  const [dateOfService, setDateOfService] = useState('');
  const [rows, setRows] = useState<Row[]>([{ ...emptyRow }]);

  const setRow = (i: number, patch: Partial<Row>) =>
    setRows((rs) => rs.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  const addRow = () => setRows((rs) => [...rs, { ...emptyRow }]);
  const removeRow = (i: number) => setRows((rs) => rs.filter((_, idx) => idx !== i));

  function submit() {
    setError(null);
    const lineItems: LineItemInput[] = rows
      .filter((r) => r.description.trim())
      .map((r) => ({
        description: r.description.trim(),
        cptHcpcsCode: r.cptHcpcsCode.trim() || null,
        revenueCode: null,
        units: Number(r.units) || 1,
        chargeAmount: r.chargeAmount ? Number(r.chargeAmount) : null,
        allowedAmount: null,
        planPaid: null,
        patientResponsibility: r.patientResponsibility ? Number(r.patientResponsibility) : null,
        dateOfService: dateOfService || null,
        sourceConfidence: 1,
      }));

    if (!title.trim()) return setError('Give the case a title.');
    if (lineItems.length === 0) return setError('Add at least one line item with a description.');

    startTransition(async () => {
      const res = await createManualCase({
        title: title.trim(),
        providerName: providerName || undefined,
        payerName: payerName || undefined,
        dateOfService: dateOfService || undefined,
        lineItems,
      });
      // On success the action redirects; only an error object returns here.
      if (res && !res.ok) {
        setError(res.error);
      } else {
        router.refresh();
      }
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="m-title">Case title</Label>
          <Input id="m-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="ER visit, March 2025" />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="m-dos">Date of service</Label>
          <Input id="m-dos" type="date" value={dateOfService} onChange={(e) => setDateOfService(e.target.value)} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="m-provider">Provider</Label>
          <Input id="m-provider" value={providerName} onChange={(e) => setProviderName(e.target.value)} placeholder="St. Marin Medical Center" />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="m-payer">Insurer / payer</Label>
          <Input id="m-payer" value={payerName} onChange={(e) => setPayerName(e.target.value)} placeholder="Brightpath Health" />
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <Label>Line items</Label>
        <div className="overflow-x-auto rounded-md border border-rule">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="border-b border-rule bg-soft/40 text-left">
              <tr className="font-mono text-[0.65rem] uppercase tracking-wider text-muted">
                <th className="p-2 font-normal">Description</th>
                <th className="p-2 font-normal">Code</th>
                <th className="p-2 font-normal">Units</th>
                <th className="p-2 font-normal">Charge</th>
                <th className="p-2 font-normal">You owe</th>
                <th className="p-2" />
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i} className="border-b border-rule last:border-0">
                  <td className="p-1.5">
                    <Input value={r.description} onChange={(e) => setRow(i, { description: e.target.value })} placeholder="CT scan, head" />
                  </td>
                  <td className="p-1.5">
                    <Input value={r.cptHcpcsCode} onChange={(e) => setRow(i, { cptHcpcsCode: e.target.value })} placeholder="70450" className="w-24" />
                  </td>
                  <td className="p-1.5">
                    <Input inputMode="numeric" value={r.units} onChange={(e) => setRow(i, { units: e.target.value })} className="w-16" />
                  </td>
                  <td className="p-1.5">
                    <Input inputMode="decimal" value={r.chargeAmount} onChange={(e) => setRow(i, { chargeAmount: e.target.value })} placeholder="1240" className="w-24" />
                  </td>
                  <td className="p-1.5">
                    <Input inputMode="decimal" value={r.patientResponsibility} onChange={(e) => setRow(i, { patientResponsibility: e.target.value })} placeholder="248" className="w-24" />
                  </td>
                  <td className="p-1.5">
                    <Button type="button" variant="ghost" size="icon" onClick={() => removeRow(i)} disabled={rows.length === 1} aria-label="Remove row">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={addRow} className="self-start">
          <Plus className="h-4 w-4" /> Add line item
        </Button>
      </div>

      {error && <p className="text-sm text-danger">{error}</p>}
      <Button onClick={submit} disabled={pending} className="self-start">
        {pending ? 'Creating…' : 'Create case'}
      </Button>
    </div>
  );
}
