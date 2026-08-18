import Link from 'next/link';
import { Disclaimer } from '@/components/brand/disclaimer';

const LINKS = [
  { label: 'How it works', href: '/how-it-works' },
  { label: 'Results', href: '/results' },
  { label: 'Pricing', href: '/pricing' },
  { label: 'Audit API', href: '/developers' },
  { label: 'Privacy', href: '/privacy' },
  { label: 'Terms', href: '/terms' },
  { label: 'hello@paxer.app', href: 'mailto:hello@paxer.app' },
];

export function SiteFooter() {
  return (
    <footer className="mt-12 border-t border-rule">
      <div className="measure flex flex-col gap-4 py-8">
        <ul className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
          {LINKS.map((l) => (
            <li key={l.href}>
              <Link href={l.href} className="link">
                {l.label}
              </Link>
            </li>
          ))}
        </ul>
        <Disclaimer />
      </div>
    </footer>
  );
}
