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
    <div className="flex items-baseline justify-between gap-4 text-base text-muted">
      <span>
        {desc} <span className="font-mono text-sm text-muted/70">{code}</span>
      </span>
      <span className="font-mono tabular-nums">{amount}</span>
    </div>
  );
}

/**
 * Illustrative hero visual — a sample EOB with one error Paxer caught (a
 * cost-share overcharge). The wrong and right amounts sit side by side in
 * labelled boxes so the mistake reads at a glance, and the recovered total
 * anchors the card. Static/decorative; labelled as an example.
 */
export function HeroBillDemo() {
  return (
    <div className="w-full max-w-lg">
      <Card className="overflow-hidden border-accent/20 shadow-glow">
        <CardContent className="p-0">
          <div className="flex items-center justify-between border-b border-rule px-6 py-4">
            <span className="text-base font-semibold text-ink">Riverside Medical Center</span>
            <span className="font-mono text-[0.65rem] uppercase tracking-wider text-muted">
              EOB
            </span>
          </div>

          <div className="flex flex-col gap-4 px-6 py-5">
            <Row desc="Office visit, established" code="99213" amount="$30.00" />

            {/* The flagged line — wrong vs. right, side by side, with the why. */}
            <div className="-mx-6 border-y border-rule bg-soft px-6 py-4">
              <div className="flex items-center justify-between gap-3">
                <span className="text-base font-semibold text-ink">
                  MRI, lumbar spine{' '}
                  <span className="font-mono text-sm font-normal text-muted">72148</span>
                </span>
                <span className="shrink-0 rounded-full bg-danger/10 px-2.5 py-1 font-mono text-[0.65rem] font-medium uppercase tracking-wider text-danger">
                  Overcharged
                </span>
              </div>

              <div className="mt-3 grid grid-cols-1 gap-3 min-[400px]:grid-cols-2">
                <div className="rounded-lg border border-danger/20 bg-danger/[0.04] px-4 py-3">
                  <p className="font-mono text-[0.65rem] uppercase tracking-wider text-muted">
                    You were billed
                  </p>
                  <p className="mt-1 font-mono text-xl font-semibold tabular-nums text-danger md:text-2xl">
                    $720.00
                  </p>
                </div>
                <div className="rounded-lg border border-success/25 bg-success/[0.06] px-4 py-3">
                  <p className="font-mono text-[0.65rem] uppercase tracking-wider text-muted">
                    Your correct share
                  </p>
                  <p className="mt-1 font-mono text-xl font-semibold tabular-nums text-success md:text-2xl">
                    $240.00
                  </p>
                </div>
              </div>

              <p className="mt-3 text-sm leading-relaxed text-muted">
                You were billed at 60% coinsurance. Your plan says 20%.
              </p>
            </div>

            <Row desc="Physical therapy, 30 min" code="97110" amount="$95.00" />
          </div>

          <div className="flex items-center justify-between gap-4 border-t border-rule bg-soft/60 px-6 py-5">
            <span className="text-base text-muted">Paxer caught 1 error</span>
            <div className="text-right">
              <p className="font-mono text-[0.65rem] uppercase tracking-wider text-muted">
                Overcharged by
              </p>
              <p className="mt-0.5 text-3xl font-semibold leading-none text-accent">$480</p>
            </div>
          </div>
        </CardContent>
      </Card>
      <p className="mt-3 text-center text-sm text-muted">Illustrative example, not a real bill.</p>
    </div>
  );
}
