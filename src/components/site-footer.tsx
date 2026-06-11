import Link from 'next/link';
import { Wordmark } from '@/components/brand/wordmark';
import { Disclaimer } from '@/components/brand/disclaimer';

const COLUMNS: { title: string; links: { label: string; href: string }[] }[] = [
  {
    title: 'Product',
    links: [
      { label: 'How it works', href: '/how-it-works' },
      { label: 'Results', href: '/results' },
      { label: 'Pricing', href: '/pricing' },
    ],
  },
  {
    title: 'Developers',
    links: [{ label: 'Audit API', href: '/developers' }],
  },
  {
    title: 'Legal',
    links: [
      { label: 'Privacy', href: '/privacy' },
      { label: 'Terms', href: '/terms' },
    ],
  },
  {
    title: 'Contact',
    links: [{ label: 'hello@paxer.app', href: 'mailto:hello@paxer.app' }],
  },
];

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-rule">
      <div className="container flex flex-col gap-10 py-12">
        <div className="flex flex-col gap-10 md:flex-row md:justify-between">
          <div className="max-w-xs">
            <Wordmark size="sm" />
            <p className="mt-3 text-sm leading-relaxed text-muted">
              The advocate on the patient&rsquo;s side of the bill.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-4 md:gap-12">
            {COLUMNS.map((col) => (
              <div key={col.title} className="flex flex-col gap-3">
                <p className="font-mono text-[0.65rem] uppercase tracking-wider text-muted/70">
                  {col.title}
                </p>
                <ul className="flex flex-col gap-2 text-sm">
                  {col.links.map((l) => (
                    <li key={l.href}>
                      <Link
                        href={l.href}
                        className="inline-block py-1 text-muted hover:text-ink hover:underline"
                      >
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
        <div className="border-t border-rule pt-6">
          <Disclaimer />
        </div>
      </div>
    </footer>
  );
}
