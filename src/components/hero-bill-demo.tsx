import { AlertTriangle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

function Row({
  desc,
  code,
  amount,
  muted,
}: {
  desc: string;
  code: string;
  amount: string;
  muted?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span className={`text-sm ${muted ? 'text-muted' : 'text-ink'}`}>
        {desc} <span className="font-mono text-xs text-muted">{code}</span>
      </span>
      <span className={`font-mono text-sm ${muted ? 'text-muted' : 'text-ink'}`}>{amount}</span>
    </div>
  );
}

/**
 * Illustrative hero visual — a sample itemized bill with one error Paxer caught
 * (a cost-share overcharge) and the resulting estimated recovery. Static/
 * decorative; clearly labelled as an example so it isn't read as a real result.
 */
export function HeroBillDemo() {
  return (
    <div className="w-full max-w-md">
      <Card className="overflow-hidden shadow-sm">
        <CardContent className="p-0">
          <div className="flex items-center justify-between border-b border-rule px-5 py-3">
            <span className="font-sans text-sm font-semibold text-ink">Riverside Medical Center</span>
            <span className="font-mono text-[0.6rem] uppercase tracking-wider text-muted">
              Your EOB
            </span>
          </div>

          <div className="flex flex-col gap-3 px-5 py-4">
            <Row desc="Office visit, established" code="99213" amount="$30.00" muted />
            <div className="-mx-5 border-y border-rule bg-soft px-5 py-2.5">
              <Row desc="MRI, lumbar spine" code="72148" amount="$720.00" />
              <div className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-danger">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                Cost-share error — your plan puts your share near $240
              </div>
            </div>
            <Row desc="Physical therapy, 30 min" code="97110" amount="$95.00" muted />
          </div>

          <div className="flex items-center justify-between border-t border-rule bg-soft/60 px-5 py-4">
            <div>
              <p className="font-mono text-[0.6rem] uppercase tracking-wider text-muted">
                Paxer found
              </p>
              <p className="font-sans text-sm text-ink">1 billing error</p>
            </div>
            <div className="text-right">
              <p className="font-mono text-[0.6rem] uppercase tracking-wider text-muted">
                Est. recovery
              </p>
              <p className="font-sans text-xl font-semibold text-accent">$480</p>
            </div>
          </div>
        </CardContent>
      </Card>
      <p className="mt-3 text-center text-xs text-muted">Illustrative example — not a real bill.</p>
    </div>
  );
}
