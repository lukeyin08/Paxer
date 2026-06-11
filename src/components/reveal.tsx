'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Fades + slides its children in when they scroll into view (once). Honors
 * `prefers-reduced-motion` by showing immediately. Content is always in the DOM
 * (just visually transitioned), so it stays accessible and indexable. `delay`
 * (ms) lets a row of items stagger.
 */
export function Reveal({
  children,
  className,
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (
      typeof window === 'undefined' ||
      typeof IntersectionObserver === 'undefined' ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      setShown(true);
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setShown(true);
          io.disconnect();
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -8% 0px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={`transition-all duration-700 ease-reveal ${
        shown
          ? 'translate-y-0 scale-100 opacity-100 blur-0'
          : 'translate-y-6 scale-[0.985] opacity-0 blur-[3px]'
      } ${className ?? ''}`}
    >
      {children}
    </div>
  );
}
