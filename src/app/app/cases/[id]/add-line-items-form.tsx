'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Trash2 } from 'lucide-react';
import { addLineItemsToCaseAction } from './actions';
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

export function AddLineItemsForm({ caseId }: { caseId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<Row[]>([{ ...emptyRow }]);

  const setRow = (i: number, patch: Partial<Row>) =>
    setRows((rs) => rs.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  const addRow = () => setRows((rs) => [...rs, { ...emptyRow }]);
  const removeRow = (i: number) => setRows((rs) => rs.filter((_, idx) => idx !== i));

  function submit() {
    setError(null);
    const items: LineItemInput[] = rows
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
        dateOfService: null,
        sourceConfidence: 1,
      }));
    if (items.length === 0) return setError('Add at least one line item with a description.');

    startTransition(async () => {
      const res = await addLineItemsToCaseAction(caseId, items);
      if (!res.ok) {
        setError(res.error ?? 'Could not add line items.');
        return;
      }
      setRows([{ ...emptyRow }]);
      setOpen(false);
      router.refresh();
    });
  }

  if (!open) {
    return (
      <Button variant="outline" size="sm" onClick={() => setOpen(true)} className="self-start">
        <Plus className="h-4 w-4" /> Add line items manually
      </Button>
    );
  }

  return (
    <div className="flex flex-col gap-3 rounded-md border border-rule bg-soft/30 p-4">
      <div className="overflow-x-auto rounded-md border border-rule bg-card">
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
                  <Input aria-label={`Line ${i + 1} description`} value={r.description} onChange={(e) => setRow(i, { description: e.target.value })} placeholder="CT scan, head" />
                </td>
                <td className="p-1.5">
                  <Input aria-label={`Line ${i + 1} CPT/HCPCS code`} value={r.cptHcpcsCode} onChange={(e) => setRow(i, { cptHcpcsCode: e.target.value })} placeholder="70450" className="w-24" />
                </td>
                <td className="p-1.5">
                  <Input aria-label={`Line ${i + 1} units`} inputMode="numeric" value={r.units} onChange={(e) => setRow(i, { units: e.target.value })} className="w-16" />
                </td>
                <td className="p-1.5">
                  <Input aria-label={`Line ${i + 1} charge amount`} inputMode="decimal" value={r.chargeAmount} onChange={(e) => setRow(i, { chargeAmount: e.target.value })} placeholder="1240" className="w-24" />
                </td>
                <td className="p-1.5">
                  <Input aria-label={`Line ${i + 1} amount you owe`} inputMode="decimal" value={r.patientResponsibility} onChange={(e) => setRow(i, { patientResponsibility: e.target.value })} placeholder="248" className="w-24" />
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
        <Plus className="h-4 w-4" /> Add row
      </Button>
      {error && <p className="text-sm text-danger">{error}</p>}
      <div className="flex items-center gap-2">
        <Button onClick={submit} disabled={pending} size="sm">
          {pending ? 'Saving…' : 'Save line items'}
        </Button>
        <Button variant="ghost" size="sm" onClick={() => setOpen(false)} disabled={pending}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
