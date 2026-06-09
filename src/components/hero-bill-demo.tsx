import { AlertTriangle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

function Row({
  desc,
  code,
  amount,
}: {
  desc: string;
  code: string;
  amount: string;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span className="text-sm text-muted">
        {desc} <span className="font-mono text-xs text-muted">{code}</span>
      </span>
      <span className="font-mono text-sm text-muted">{amount}</span>
    </div>
  );
}

/**
 * Illustrative hero visual — a sample EOB with one error Paxer caught (a
 * cost-share overcharge), shown as billed-vs-correct so the mistake is obvious,
 * plus the resulting overcharge. Static/decorative; labelled as an example.
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
            <Row desc="Office visit, established" code="99213" amount="$30.00" />

            {/* The flagged line — billed vs. correct, with the why. */}
            <div className="-mx-5 border-y border-rule bg-soft px-5 py-3">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-semibold text-ink">
                  MRI, lumbar spine <span className="font-mono text-xs text-muted">72148</span>
                </span>
                <span className="rounded-full bg-danger/10 px-2 py-0.5 font-mono text-[0.6rem] font-medium uppercase tracking-wider text-danger">
                  Overcharged
                </span>
              </div>

              <div className="mt-2.5 flex flex-col gap-1.5 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted">What you were billed</span>
                  <span className="font-mono text-muted line-through">$720.00</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-ink">Your share under your plan</span>
                  <span className="font-mono font-semibold text-ink">$240.00</span>
                </div>
              </div>

              <div className="mt-2.5 flex items-start gap-1.5 text-xs font-medium text-danger">
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <span>Cost-share error — billed at 60% coinsurance; your plan is 20%.</span>
              </div>
            </div>

            <Row desc="Physical therapy, 30 min" code="97110" amount="$95.00" />
          </div>

          <div className="flex items-center justify-between border-t border-rule bg-soft/60 px-5 py-4">
            <div>
              <p className="font-mono text-[0.6rem] uppercase tracking-wider text-muted">
                Paxer found
              </p>
              <p className="font-sans text-sm text-ink">1 cost-share error</p>
            </div>
            <div className="text-right">
              <p className="font-mono text-[0.6rem] uppercase tracking-wider text-muted">
                You were overcharged
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
