'use client';

import { useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { createApiKeyAction, revokeApiKeyAction } from './actions';

type KeyRow = {
  id: string;
  name: string;
  keyPrefix: string;
  lastUsedAt: string | null;
  createdAt: string;
};

type Usage = {
  planLabel: string;
  used: number;
  quota: number;
  isFreePlan: boolean;
  upgradeHref: string;
};

export function ApiKeysClient({ keys, usage }: { keys: KeyRow[]; usage: Usage }) {
  const router = useRouter();
  const [name, setName] = useState('');
  const [pending, start] = useTransition();
  const [created, setCreated] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [origin, setOrigin] = useState('https://paxer.app');

  useEffect(() => setOrigin(window.location.origin), []);

  const create = () => {
    setError(null);
    setCreated(null);
    start(async () => {
      const res = await createApiKeyAction(name);
      if (!res.ok) {
        setError(res.error ?? 'Could not create key.');
        return;
      }
      setCreated(res.plaintext ?? null);
      setName('');
      router.refresh();
    });
  };

  const revoke = (id: string) =>
    start(async () => {
      await revokeApiKeyAction(id);
      router.refresh();
    });

  const copy = () => {
    if (!created) return;
    navigator.clipboard?.writeText(created).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted">
        Call the audit engine from your own systems. Authenticate with{' '}
        <code className="rounded bg-soft px-1 py-0.5 font-mono text-xs">Authorization: Bearer &lt;key&gt;</code>.
        Keys are shown once — store them securely.
      </p>

      {/* Usage / plan */}
      <div className="flex items-center justify-between gap-3 rounded-md border border-rule bg-soft/40 p-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-ink">
            {usage.planLabel} plan · {usage.used.toLocaleString()} / {usage.quota.toLocaleString()} audits
            this month
          </p>
          <div className="mt-2 h-1.5 w-44 overflow-hidden rounded-full bg-rule">
            <div
              className="h-full bg-accent"
              style={{
                width: `${usage.quota > 0 ? Math.min(100, Math.round((usage.used / usage.quota) * 100)) : 0}%`,
              }}
            />
          </div>
        </div>
        {usage.isFreePlan && (
          <Button asChild size="sm" variant="outline">
            <a href={usage.upgradeHref}>Upgrade</a>
          </Button>
        )}
      </div>

      {created && (
        <div className="rounded-md border border-accent/40 bg-accent/5 p-3">
          <p className="text-sm font-medium text-ink">
            Your new API key — copy it now. You won’t be able to see it again.
          </p>
          <div className="mt-2 flex items-center gap-2">
            <code className="flex-1 overflow-x-auto whitespace-nowrap rounded bg-soft px-2 py-1.5 font-mono text-xs">
              {created}
            </code>
            <Button type="button" size="sm" variant="outline" onClick={copy} aria-label="Copy API key">
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
        <div className="flex-1">
          <label htmlFor="key-name" className="kicker mb-1 block">
            New key name
          </label>
          <Input
            id="key-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Production server"
          />
        </div>
        <Button onClick={create} disabled={pending || !name.trim()} size="sm" className="sm:w-auto">
          {pending ? 'Creating…' : 'Create key'}
        </Button>
      </div>
      {error && <p className="text-sm text-danger">{error}</p>}

      {keys.length > 0 ? (
        <ul className="flex flex-col divide-y divide-rule rounded-md border border-rule">
          {keys.map((k) => (
            <li key={k.id} className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
              <div className="min-w-0">
                <p className="truncate font-medium text-ink">{k.name}</p>
                <p className="font-mono text-xs text-muted">
                  {k.keyPrefix}… · last used{' '}
                  {k.lastUsedAt ? new Date(k.lastUsedAt).toLocaleDateString() : 'never'}
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => revoke(k.id)}
                disabled={pending}
                className="text-danger hover:text-danger"
              >
                Revoke
              </Button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted">No active keys yet.</p>
      )}

      <div>
        <p className="kicker mb-2">Example request</p>
        <pre className="overflow-x-auto whitespace-pre-wrap break-all rounded-md border border-rule bg-soft/30 p-3 font-mono text-xs text-muted">{`curl -X POST ${origin}/api/v1/audit \\
  -H "Authorization: Bearer pax_live_..." \\
  -H "Content-Type: application/json" \\
  -d '{"lineItems":[
    {"description":"CT scan, head","cptHcpcsCode":"70450","chargeAmount":1200,"allowedAmount":900,"planPaid":0,"patientResponsibility":900,"adjustmentCodes":["PR-22"]}
  ]}'`}</pre>
      </div>
    </div>
  );
}
