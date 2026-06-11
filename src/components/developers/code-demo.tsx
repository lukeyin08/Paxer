'use client';

import { useEffect, useRef, useState } from 'react';
import { useInView, useReducedMotion } from 'framer-motion';

/**
 * The developers-page example, animated like a terminal: the cURL request
 * types itself out when scrolled into view, then the JSON response "arrives".
 * SSR/no-JS renders both blocks in full (crawlable); the typing only takes
 * over after hydration, and reduced-motion users always get the full text.
 */
export function CodeDemo({ request, response }: { request: string; response: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.25 });
  const reduce = useReducedMotion();
  const [chars, setChars] = useState(request.length);
  const [arrived, setArrived] = useState(true);

  useEffect(() => {
    if (reduce) {
      setChars(request.length);
      setArrived(true);
      return;
    }
    if (!inView) {
      setChars(0);
      setArrived(false);
      return;
    }
    let i = 0;
    const id = setInterval(() => {
      i += 4;
      if (i >= request.length) {
        setChars(request.length);
        setArrived(true);
        clearInterval(id);
      } else {
        setChars(i);
      }
    }, 16);
    return () => clearInterval(id);
  }, [inView, reduce, request]);

  const typing = chars < request.length;

  return (
    <div ref={ref} className="container grid grid-cols-1 gap-6 py-20 lg:grid-cols-2">
      <div>
        <p className="kicker mb-3">Request</p>
        {/* min-height reserves the block so typing doesn't shift the layout */}
        <pre className="min-h-[14rem] overflow-x-auto rounded-lg border border-rule bg-card p-4 font-mono text-xs leading-relaxed text-muted">
          {request.slice(0, chars)}
          {typing && (
            <span aria-hidden className="animate-pulse text-accent">
              ▌
            </span>
          )}
        </pre>
      </div>
      <div
        className={`transition-all duration-700 ease-reveal ${
          arrived ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
        }`}
      >
        <p className="kicker mb-3">Response</p>
        <pre className="overflow-x-auto whitespace-pre-wrap rounded-lg border border-rule bg-card p-4 font-mono text-xs leading-relaxed text-muted">
          {response}
        </pre>
      </div>
    </div>
  );
}
