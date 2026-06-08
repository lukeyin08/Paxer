'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { FileText, Sparkles } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusPill } from '@/components/brand/status-pill';
import { ingestDocumentAction, confirmExtractionAction } from './actions';

export interface DocRow {
  id: string;
  fileName: string | null;
  kind: string;
  ingestStatus: string;
  hasFile: boolean;
}

function statusTone(status: string) {
  switch (status) {
    case 'DONE':
      return 'success' as const;
    case 'NEEDS_REVIEW':
      return 'warning' as const;
    case 'FAILED':
      return 'danger' as const;
    case 'PROCESSING':
      return 'accent' as const;
    default:
      return 'muted' as const;
  }
}

function DocumentCard({ doc, aiConfigured }: { doc: DocRow; aiConfigured: boolean }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const canExtract =
    doc.hasFile && (doc.ingestStatus === 'PENDING' || doc.ingestStatus === 'FAILED');

  return (
    <Card>
      <CardContent className="flex flex-col gap-3 pt-6">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <FileText className="h-5 w-5 text-muted" />
            <div>
              <p className="text-sm font-medium text-ink">{doc.fileName ?? 'Document'}</p>
              <p className="font-mono text-[0.65rem] uppercase tracking-wider text-muted">
                {doc.kind.replace(/_/g, ' ')}
              </p>
            </div>
          </div>
          <StatusPill label={doc.ingestStatus} tone={statusTone(doc.ingestStatus)} />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {doc.hasFile && (
            <Button asChild variant="outline" size="sm">
              <a href={`/api/documents/${doc.id}`} target="_blank" rel="noreferrer">
                View file
              </a>
            </Button>
          )}
          {canExtract && (
            <Button
              size="sm"
              disabled={pending || !aiConfigured}
              onClick={() =>
                startTransition(async () => {
                  const res = await ingestDocumentAction(doc.id);
                  setMsg({ ok: res.ok, text: res.message });
                  if (res.ok) router.refresh();
                })
              }
            >
              <Sparkles className="h-4 w-4" />
              {pending ? 'Extracting…' : 'Extract line items'}
            </Button>
          )}
          {doc.ingestStatus === 'NEEDS_REVIEW' && (
            <Button
              size="sm"
              variant="secondary"
              disabled={pending}
              onClick={() =>
                startTransition(async () => {
                  await confirmExtractionAction(doc.id);
                  router.refresh();
                })
              }
            >
              Confirm values
            </Button>
          )}
        </div>

        {canExtract && !aiConfigured && (
          <p className="text-xs text-muted">
            Set ANTHROPIC_API_KEY to enable AI extraction. Until then, add line items manually.
          </p>
        )}
        {msg && (
          <p className={msg.ok ? 'text-xs text-success' : 'text-xs text-danger'}>{msg.text}</p>
        )}
      </CardContent>
    </Card>
  );
}

export function DocumentsSection({
  docs,
  aiConfigured,
}: {
  docs: DocRow[];
  aiConfigured: boolean;
}) {
  if (docs.length === 0) {
    return <p className="text-sm text-muted">No documents attached to this case.</p>;
  }
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {docs.map((d) => (
        <DocumentCard key={d.id} doc={d} aiConfigured={aiConfigured} />
      ))}
    </div>
  );
}
