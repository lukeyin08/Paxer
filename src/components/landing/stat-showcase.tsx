'use client';

import Link from 'next/link';
import { motion, MotionConfig } from 'framer-motion';
import { CountUp } from '@/components/results/results-metrics';

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

/** Thin accent underline that draws in to `fillPct` of its track when in view. */
function Underline({ fillPct, delay }: { fillPct: number; delay: number }) {
  return (
    <div className="relative mt-4 h-1.5 w-28 overflow-hidden rounded-full bg-rule">
      <motion.div
        className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-accent2 to-accent"
        style={{ width: `${fillPct}%`, transformOrigin: 'left' }}
        initial={{ scaleX: 0 }}
        whileInView={{ scaleX: 1 }}
        viewport={{ once: true, amount: 0.6 }}
        transition={{ duration: 1, ease: EASE, delay: delay + 0.2 }}
      />
    </div>
  );
}

function StatCard({ children, delay }: { children: React.ReactNode; delay: number }) {
  return (
    <motion.div
      className="flex flex-col items-center rounded-xl border border-rule bg-card px-8 py-10 text-center"
      initial={{ opacity: 0, y: 26 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.4 }}
      transition={{ duration: 0.6, ease: EASE, delay }}
    >
      {children}
    </motion.div>
  );
}

const NUMBER_CLS = 'font-sans text-5xl font-semibold leading-none tracking-tight md:text-6xl';

/**
 * Three landing-page stats. No iconography — the figures are the focal point:
 * each counts up on scroll-in over a thin underline that draws to its fill (the
 * 80% bar stops at 80%, a quiet nod to the stat). Differentiated by color so the
 * three don't read as identical cards.
 */
export function StatShowcase() {
  return (
    <MotionConfig reducedMotion="user">
      <div className="container grid grid-cols-1 gap-6 py-16 md:grid-cols-3">
        <StatCard delay={0}>
          <CountUp to={80} suffix="%" delay={0.1} className={`${NUMBER_CLS} text-ink`} />
          <Underline fillPct={80} delay={0} />
          <p className="mt-6 font-sans text-lg font-semibold text-ink">of bills may contain errors</p>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            Industry estimates for complex, itemized hospital bills.
          </p>
        </StatCard>

        <StatCard delay={0.12}>
          <CountUp to={12} prefix="$" suffix="K" delay={0.22} className={`${NUMBER_CLS} text-ink`} />
          <Underline fillPct={100} delay={0.12} />
          <p className="mt-6 font-sans text-lg font-semibold text-ink">reported back by users</p>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            Recoveries reported since launch.{' '}
            <Link href="/results" className="text-accent hover:underline">
              See the results &rarr;
            </Link>
          </p>
        </StatCard>

        <StatCard delay={0.24}>
          <CountUp to={100} suffix="%" delay={0.34} className={`${NUMBER_CLS} text-ink`} />
          <Underline fillPct={100} delay={0.24} />
          <p className="mt-6 font-sans text-lg font-semibold text-ink">you keep</p>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            A flat subscription. Paxer never takes a cut of your recovery.
          </p>
        </StatCard>
      </div>
    </MotionConfig>
  );
}
