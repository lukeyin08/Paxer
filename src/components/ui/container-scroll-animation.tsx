'use client';

import React, { useRef } from 'react';
import {
  useScroll,
  useTransform,
  useReducedMotion,
  motion,
  type MotionValue,
} from 'framer-motion';

/**
 * Scroll-driven 3D card reveal (adapted from Aceternity's ContainerScroll). As
 * the section scrolls into view the card rotates up from a tilt and settles
 * flat while the title drifts up. Restyled to Paxer's dark slate + accent
 * tokens instead of the stock gray. Scroll-linked styles bypass the global
 * reduced-motion CSS guard, so this component checks `useReducedMotion` itself
 * and renders the settled (flat, unscaled) state for those users.
 */
export function ContainerScroll({
  titleComponent,
  children,
}: {
  titleComponent: React.ReactNode;
  children: React.ReactNode;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  // Complete the flatten by the time the card reaches the middle of the
  // viewport (rather than after the whole tall section has scrolled past), so
  // the tablet settles flat with much less scrolling.
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start end', 'center center'],
  });
  const reduce = useReducedMotion();
  const [isMobile, setIsMobile] = React.useState(false);

  // Match Tailwind's md breakpoint exactly (mobile = below 768px) so the JS
  // scale and the CSS layout never disagree at the boundary.
  React.useEffect(() => {
    const query = window.matchMedia('(max-width: 767px)');
    const update = () => setIsMobile(query.matches);
    update();
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);

  const scaleDimensions = (): [number, number] => (isMobile ? [0.85, 0.95] : [1.05, 1]);

  const rotateMotion = useTransform(scrollYProgress, [0, 1], [20, 0]);
  const scaleMotion = useTransform(scrollYProgress, [0, 1], scaleDimensions());
  // Keep the title drift gentle: at -100px it climbed out of the section (which
  // is overflow-hidden) and under the flattening card, so it vanished mid-scroll.
  const translateMotion = useTransform(scrollYProgress, [0, 1], [0, -24]);
  const rotate = reduce ? 0 : rotateMotion;
  const scale = reduce ? 1 : scaleMotion;
  const translate = reduce ? 0 : translateMotion;

  return (
    // Height comes from the content: a fixed section height clipped the title
    // once the header + card stack outgrew it (overflow-hidden parent).
    <div
      ref={containerRef}
      className="relative flex items-center justify-center p-2 py-12 md:p-20"
    >
      <div className="relative w-full py-10 md:py-20" style={{ perspective: '1000px' }}>
        <Header translate={translate} titleComponent={titleComponent} />
        <Card rotate={rotate} scale={scale}>
          {children}
        </Card>
      </div>
    </div>
  );
}

function Header({
  translate,
  titleComponent,
}: {
  translate: MotionValue<number> | number;
  titleComponent: React.ReactNode;
}) {
  return (
    <motion.div style={{ translateY: translate }} className="mx-auto max-w-5xl text-center">
      {titleComponent}
    </motion.div>
  );
}

function Card({
  rotate,
  scale,
  children,
}: {
  rotate: MotionValue<number> | number;
  scale: MotionValue<number> | number;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      style={{
        rotateX: rotate,
        scale,
        boxShadow:
          '0 0 #0000004d, 0 9px 20px #0000004a, 0 37px 37px #00000042, 0 84px 50px #00000026, 0 149px 60px #0000000a, 0 233px 65px #00000003',
      }}
      className="mx-auto mt-10 h-auto w-full max-w-5xl rounded-[28px] border border-rule bg-soft p-2 shadow-2xl md:mt-12 md:h-[40rem] md:p-4"
    >
      <div className="h-full w-full overflow-hidden rounded-2xl border border-rule bg-paper">
        {children}
      </div>
    </motion.div>
  );
}
