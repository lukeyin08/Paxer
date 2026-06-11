'use client';

import { motion, MotionConfig } from 'framer-motion';
import { Calculator, Copy, ShieldAlert, TrendingUp } from 'lucide-react';
import { ERROR_TYPES } from '@/lib/marketing';

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

// Icons line up by index with ERROR_TYPES (duplicate, cost-share, balance, upcoding).
const ICONS = [Copy, Calculator, ShieldAlert, TrendingUp];

/** Error-type grid: icon-led cards that stagger in on scroll and lift on hover. */
export function ErrorTypes() {
  return (
    <MotionConfig reducedMotion="user">
      <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {ERROR_TYPES.map((e, i) => {
          const Icon = ICONS[i] ?? Copy;
          return (
            <motion.div
              key={e.title}
              className="group rounded-xl border border-rule bg-card p-7 transition-[box-shadow,border-color] duration-300 hover:border-accent/40 hover:shadow-[0_10px_44px_-14px_hsl(var(--glow)/0.5)]"
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              whileHover={{ y: -6, transition: { duration: 0.25, ease: EASE } }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.55, ease: EASE, delay: i * 0.08 }}
            >
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-accent/20 bg-accent/10 text-accent transition-transform duration-300 group-hover:scale-110">
                  <Icon className="h-5 w-5" />
                </span>
                <h3 className="font-sans text-lg font-semibold text-ink">{e.title}</h3>
              </div>
              <p className="mt-4 text-sm leading-relaxed text-muted">{e.body}</p>
            </motion.div>
          );
        })}
      </div>
    </MotionConfig>
  );
}
