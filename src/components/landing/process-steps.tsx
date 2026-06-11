'use client';

import { motion, MotionConfig } from 'framer-motion';
import { PROCESS_STEPS } from '@/lib/marketing';

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

/**
 * The three-step process, with a connector line that draws across the row and
 * cards that stagger in on scroll. The line sits behind the opaque cards, so it
 * only shows through the gaps between them.
 */
export function ProcessSteps() {
  return (
    <MotionConfig reducedMotion="user">
      <div className="relative mt-10">
        <motion.div
          aria-hidden
          className="absolute inset-x-0 top-12 hidden h-px origin-left bg-gradient-to-r from-accent via-accent2 to-transparent md:block"
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 1.1, ease: EASE }}
        />
        <div className="relative grid grid-cols-1 gap-6 md:grid-cols-3">
          {PROCESS_STEPS.map((c, i) => (
            <motion.div
              key={c.step}
              className="rounded-xl border border-rule bg-card p-6 transition-[box-shadow,border-color] duration-300 hover:border-accent/40 hover:shadow-[0_10px_44px_-14px_hsl(var(--glow)/0.5)]"
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              whileHover={{ y: -6, transition: { duration: 0.25, ease: EASE } }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.55, ease: EASE, delay: i * 0.12 }}
            >
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-accent/20 bg-paper font-mono text-lg font-semibold">
                <span className="text-gradient">{c.step}</span>
              </span>
              <h3 className="mt-4 font-sans text-xl font-semibold text-ink">{c.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{c.body}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </MotionConfig>
  );
}
