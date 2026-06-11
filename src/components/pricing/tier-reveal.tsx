'use client';

import { motion, MotionConfig } from 'framer-motion';

/**
 * Pricing-page entrance: each tier card springs up in sequence, and the
 * highlighted (most popular) tier gets a softly pulsing glow behind it so the
 * recommended plan reads first. Reduced motion keeps the fade, drops the move.
 */
export function TierReveal({
  children,
  index,
  highlight = false,
}: {
  children: React.ReactNode;
  index: number;
  highlight?: boolean;
}) {
  return (
    <MotionConfig reducedMotion="user">
      <motion.div
        className="relative h-full"
        initial={{ opacity: 0, y: 36, scale: 0.97 }}
        whileInView={{ opacity: 1, y: 0, scale: 1 }}
        viewport={{ once: true, amount: 0.25 }}
        transition={{ type: 'spring', stiffness: 110, damping: 17, delay: index * 0.12 }}
      >
        {highlight && (
          <div
            aria-hidden
            className="absolute -inset-2 -z-10 animate-glow-pulse rounded-xl bg-accent/25 blur-2xl"
          />
        )}
        {children}
      </motion.div>
    </MotionConfig>
  );
}
