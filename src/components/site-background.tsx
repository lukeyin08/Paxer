/**
 * Ambient page backdrop — a faint blueprint grid plus two slow "aurora" glows
 * that drift behind all content, giving the site a quiet, techy depth. Purely
 * decorative and non-interactive. Sits at -z-10 so it paints over the solid
 * paper background but under every section. Static markup (no client JS); the
 * looping glows are CSS animations that honor `prefers-reduced-motion`.
 */
export function SiteBackground() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
    >
      {/* Blueprint grid, fading out toward the bottom of the viewport */}
      <div
        className="absolute inset-0 opacity-[0.16] [mask-image:linear-gradient(to_bottom,black,transparent_78%)]"
        style={{
          backgroundImage:
            'linear-gradient(hsl(var(--rule) / 0.7) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--rule) / 0.7) 1px, transparent 1px)',
          backgroundSize: '56px 56px',
        }}
      />
      {/* Aurora glows — offset phases so they drift independently */}
      <div className="absolute -top-48 left-1/2 h-[42rem] w-[42rem] -translate-x-1/2 rounded-full bg-accent/20 blur-[130px] animate-aurora" />
      <div className="absolute top-1/3 -right-40 h-[34rem] w-[34rem] rounded-full bg-accent2/10 blur-[130px] animate-aurora [animation-delay:-7s]" />
      <div className="absolute -bottom-56 -left-32 h-[36rem] w-[36rem] rounded-full bg-accent/[0.08] blur-[140px] animate-aurora [animation-delay:-12s]" />
    </div>
  );
}
