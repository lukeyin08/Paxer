'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { recomputeBenchmarksAction } from './actions';

export function RecomputeButton() {
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  return (
    <div className="flex items-center gap-3">
      <Button
        size="sm"
        variant="outline"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            const res = await recomputeBenchmarksAction();
            setMsg(res.message);
          })
        }
      >
        <RefreshCw className="h-4 w-4" />
        {pending ? 'Recomputing…' : 'Recompute from data'}
      </Button>
      {msg && <span className="text-xs text-success">{msg}</span>}
    </div>
  );
}
