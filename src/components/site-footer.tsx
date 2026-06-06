import { Wordmark } from '@/components/brand/wordmark';
import { Disclaimer, SYNTHETIC_DATA_NOTICE } from '@/components/brand/disclaimer';

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-rule">
      <div className="container flex flex-col gap-4 py-10">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Wordmark size="sm" />
          <p className="font-mono text-[0.7rem] uppercase tracking-wider text-muted">
            {SYNTHETIC_DATA_NOTICE}
          </p>
        </div>
        <Disclaimer />
      </div>
    </footer>
  );
}
