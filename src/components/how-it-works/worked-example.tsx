'use client';

import { motion, MotionConfig } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { CountUp } from '@/components/results/results-metrics';
import { formatUsd } from '@/lib/utils';

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

type Line = { desc: string; charge: number; note: string };
type Finding = { title: string; body: string; amount: number };

const listStagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
};

const fromLeft = {
  hidden: { opacity: 0, x: -20 },
  show: { opacity: 1, x: 0, transition: { duration: 0.5, ease: EASE } },
};

const fromRight = {
  hidden: { opacity: 0, x: 20 },
  show: { opacity: 1, x: 0, transition: { duration: 0.5, ease: EASE } },
};

/**
 * The how-it-works centerpiece, animated: bill lines cascade in on the left,
 * findings answer them from the right, and the dollar totals count up. Data
 * stays in the page (single source of truth). The full text is in the served
 * HTML (crawlable), though visually hidden until the entrance plays.
 */
export function WorkedExample({
  lines,
  findings,
}: {
  lines: Line[];
  findings: Finding[];
}) {
  const totalBilled = lines.reduce((s, l) => s + l.charge, 0);
  const totalFound = findings.reduce((s, f) => s + f.amount, 0);

  return (
    <MotionConfig reducedMotion="user">
      <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* The bill */}
        <Card>
          <CardContent className="pt-6">
            <p className="kicker mb-4">The bill</p>
            <motion.div
              className="flex flex-col divide-y divide-rule"
              variants={listStagger}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.3 }}
            >
              {lines.map((l, i) => (
                <motion.div
                  key={i}
                  variants={fromLeft}
                  className="flex items-center justify-between gap-3 py-3 text-sm"
                >
                  <span className="text-ink">
                    {l.desc}
                    {l.note && (
                      <span className="ml-2 font-mono text-[0.65rem] uppercase tracking-wider text-warning">
                        {l.note}
                      </span>
                    )}
                  </span>
                  <span className="tabular-nums text-muted">{formatUsd(l.charge)}</span>
                </motion.div>
              ))}
              <motion.div
                variants={fromLeft}
                className="flex items-center justify-between py-3 text-sm font-semibold"
              >
                <span className="text-ink">Total billed</span>
                <span className="tabular-nums text-ink">
                  <CountUp to={totalBilled} prefix="$" />
                </span>
              </motion.div>
            </motion.div>
          </CardContent>
        </Card>

        {/* The findings */}
        <Card>
          <CardContent className="pt-6">
            <p className="kicker mb-4">What Paxer finds</p>
            <motion.div
              className="flex flex-col gap-4"
              variants={listStagger}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.3 }}
            >
              {findings.map((f) => (
                <motion.div
                  key={f.title}
                  variants={fromRight}
                  className="flex items-start justify-between gap-4"
                >
                  <div>
                    <p className="text-sm font-medium text-ink">{f.title}</p>
                    <p className="text-sm leading-relaxed text-muted">{f.body}</p>
                  </div>
                  <span className="shrink-0 tabular-nums font-semibold text-success">
                    <CountUp to={f.amount} prefix="$" />
                  </span>
                </motion.div>
              ))}
              <motion.div
                variants={fromRight}
                className="mt-1 flex items-center justify-between border-t border-rule pt-4 text-sm font-semibold"
              >
                <span className="text-ink">Estimated recoverable</span>
                <span className="tabular-nums text-lg text-success">
                  <CountUp to={totalFound} prefix="$" />
                </span>
              </motion.div>
            </motion.div>
          </CardContent>
        </Card>
      </div>
    </MotionConfig>
  );
}
