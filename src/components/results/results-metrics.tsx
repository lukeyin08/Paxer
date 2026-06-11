'use client';

import { useEffect, useRef, useState } from 'react';
import { animate, motion, MotionConfig, useInView, useReducedMotion } from 'framer-motion';

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

function format(v: number, prefix: string, suffix: string, decimals: number) {
  return `${prefix}${v.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}${suffix}`;
}

/**
 * Counts from 0 to `to` when scrolled into view. SSR/no-JS output shows the
 * real figure (crawlers read the served HTML); the count-up only takes over
 * after hydration. Respects reduced motion. Shared by the results page and the
 * how-it-works worked example.
 */
export function CountUp({
  to,
  prefix = '',
  suffix = '',
  decimals = 0,
  delay = 0,
  className,
}: {
  to: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.6 });
  const reduce = useReducedMotion();
  const [display, setDisplay] = useState(() => format(to, prefix, suffix, decimals));

  useEffect(() => {
    if (reduce) {
      setDisplay(format(to, prefix, suffix, decimals));
      return;
    }
    if (!inView) {
      setDisplay(format(0, prefix, suffix, decimals));
      return;
    }
    const controls = animate(0, to, {
      duration: 1.6,
      delay,
      ease: EASE,
      onUpdate: (v) => setDisplay(format(v, prefix, suffix, decimals)),
    });
    return () => controls.stop();
  }, [inView, reduce, to, prefix, suffix, decimals, delay]);

  return (
    <span ref={ref} className={className}>
      {display}
    </span>
  );
}

function FadeIn({
  children,
  delay = 0,
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 26 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.4 }}
      transition={{ duration: 0.6, ease: EASE, delay }}
    >
      {children}
    </motion.div>
  );
}

const HEADLINE = [
  { to: 12_000, prefix: '$', label: 'reported recoveries', sub: 'Money users report getting back after disputing with Paxer.' },
  { to: 240, label: 'free audits completed', sub: 'Bills run through the audit engine by patients.' },
  { to: 44, label: 'Net Promoter Score', sub: 'From in-product surveys of active users.' },
  { to: 58, suffix: '%', label: 'organic or referral signups', sub: 'Most users arrive without paid acquisition.' },
];

const NUMBER_CLS =
  'font-sans text-4xl font-semibold leading-none tracking-tight text-ink md:text-5xl';

function StatCard({
  stat,
  delay,
  accent = false,
}: {
  stat: { to: number; prefix?: string; suffix?: string; decimals?: number; label: string; sub: string };
  delay: number;
  accent?: boolean;
}) {
  return (
    <FadeIn
      delay={delay}
      className={`flex flex-col rounded-xl border px-7 py-8 ${
        accent ? 'border-accent/25 bg-accent/[0.05]' : 'border-rule bg-card'
      }`}
    >
      <CountUp
        to={stat.to}
        prefix={stat.prefix}
        suffix={stat.suffix}
        decimals={stat.decimals}
        delay={delay + 0.1}
        className={accent ? `${NUMBER_CLS} text-gradient` : NUMBER_CLS}
      />
      <p className="mt-4 font-sans text-base font-semibold text-ink">{stat.label}</p>
      <p className="mt-1.5 text-sm leading-relaxed text-muted">{stat.sub}</p>
    </FadeIn>
  );
}

/** Animated revenue bar: draws to its share of the total when scrolled into view. */
function RevenueBar({
  label,
  amount,
  pct,
  delay,
}: {
  label: string;
  amount: string;
  pct: number;
  delay: number;
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3 text-sm">
        <span className="font-medium text-ink">{label}</span>
        <span className="font-mono font-semibold text-ink">{amount}</span>
      </div>
      <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-rule">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-accent2 to-accent"
          style={{ width: `${pct}%`, transformOrigin: 'left' }}
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          viewport={{ once: true, amount: 0.6 }}
          transition={{ duration: 1.1, ease: EASE, delay }}
        />
      </div>
    </div>
  );
}

export function ResultsMetrics() {
  return (
    <MotionConfig reducedMotion="user">
      {/* Headline numbers */}
      <section className="border-y border-rule bg-soft/40">
        <div className="container grid grid-cols-1 gap-6 py-16 sm:grid-cols-2 lg:grid-cols-4">
          {HEADLINE.map((s, i) => (
            <StatCard key={s.label} stat={s} delay={i * 0.1} accent={i === 0} />
          ))}
        </div>
      </section>

      {/* Revenue */}
      <section className="container py-20">
        <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2">
          <FadeIn>
            <p className="kicker mb-3">Revenue</p>
            <h2 className="max-w-xl font-sans text-3xl font-semibold text-ink">
              <CountUp to={16} prefix="$" suffix="K" className="text-gradient" /> annual run-rate,
              six months in.
            </h2>
            <p className="mt-4 max-w-xl leading-relaxed text-muted">
              Business revenue leads, and the consumer subscription compounds underneath it. All of
              it is flat-fee: Paxer never takes a percentage of what anyone recovers.
            </p>
          </FadeIn>
          <FadeIn delay={0.15} className="flex flex-col gap-6 rounded-xl border border-rule bg-card p-8">
            <RevenueBar label="Employer & API partners" amount="$13K ARR" pct={100} delay={0.2} />
            <RevenueBar label="Paxer Plus subscriptions" amount="$3K ARR" pct={23} delay={0.35} />
            <p className="text-xs leading-relaxed text-muted">
              Bar lengths are proportional to annualized recurring revenue.
            </p>
          </FadeIn>
        </div>
      </section>
    </MotionConfig>
  );
}
