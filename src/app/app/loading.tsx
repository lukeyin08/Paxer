// Lightweight skeleton shown while an authenticated page's server data loads.
export default function Loading() {
  return (
    <div className="flex animate-pulse flex-col gap-8" aria-hidden="true">
      <div className="flex flex-col gap-2">
        <div className="h-3 w-28 rounded bg-soft" />
        <div className="h-8 w-48 rounded bg-soft" />
      </div>
      <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex flex-col gap-2">
            <div className="h-3 w-20 rounded bg-soft" />
            <div className="h-7 w-16 rounded bg-soft" />
          </div>
        ))}
      </div>
      <div className="flex flex-col gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-20 rounded-md border border-rule bg-card" />
        ))}
      </div>
      <span className="sr-only">Loading…</span>
    </div>
  );
}
