'use client';

import { useEffect, useState } from 'react';

export interface WorkStep {
  /** Show this message once elapsed seconds reaches `at`. */
  at: number;
  text: string;
}

/**
 * Live "still working" indicator for long-running (AI) actions, so users don't
 * assume the app hung. Shows a pulsing dot, a step message that advances over
 * time, and a ticking elapsed-seconds counter. Render only while `active`.
 */
export function WorkingIndicator({ active, steps }: { active: boolean; steps: WorkStep[] }) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!active) {
      setElapsed(0);
      return;
    }
    const t = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(t);
  }, [active]);

  if (!active) return null;
  const step = [...steps].reverse().find((s) => elapsed >= s.at) ?? steps[0];

  return (
    <div className="flex items-center gap-2 text-xs text-muted" role="status" aria-live="polite">
      <span className="relative flex h-2 w-2 shrink-0">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-75" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-accent" />
      </span>
      <span>
        {step?.text}… <span className="tabular-nums">{elapsed}s</span>
      </span>
    </div>
  );
}
