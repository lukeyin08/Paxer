/**
 * AI extraction eval (Section 12). Renders synthetic fixture PDFs, runs the
 * extractor, and reports field-level accuracy and average confidence. This is
 * how we prove the ingestion engine. Run with: pnpm eval:extract
 */
import { aiConfigured } from '@/lib/ai/client';
import { ingestBytes } from '@/lib/ai/ingest';
import { FIXTURES, type GroundTruthLine } from './fixtures';
import { renderFixturePdf } from './render-pdf';
import type { ExtractedLineItem } from '@/lib/ai/schemas';

const norm = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);

/** Token-overlap match for descriptions (extraction may reword slightly). */
function descMatches(truth: string, got: string): boolean {
  const t = new Set(norm(truth));
  const g = norm(got);
  if (g.length === 0) return false;
  const overlap = g.filter((w) => t.has(w)).length;
  return overlap / Math.max(t.size, 1) >= 0.5;
}

const moneyEq = (a: number | null, b: number | null) =>
  a === null || b === null ? a === b : Math.abs(a - b) < 0.01;

/** Greedily pair each ground-truth line with the best extracted line. */
function pair(truth: GroundTruthLine[], got: ExtractedLineItem[]) {
  const used = new Set<number>();
  return truth.map((tl) => {
    let bestIdx = -1;
    for (let i = 0; i < got.length; i++) {
      if (used.has(i)) continue;
      if (got[i] && descMatches(tl.description, got[i]!.description)) {
        bestIdx = i;
        break;
      }
    }
    if (bestIdx === -1) {
      // fall back to code match
      for (let i = 0; i < got.length; i++) {
        if (used.has(i)) continue;
        if (tl.cptHcpcsCode && got[i]?.cptHcpcsCode === tl.cptHcpcsCode) {
          bestIdx = i;
          break;
        }
      }
    }
    if (bestIdx >= 0) used.add(bestIdx);
    return { truth: tl, got: bestIdx >= 0 ? got[bestIdx]! : null };
  });
}

async function main() {
  if (!aiConfigured()) {
    console.log('⚠  ANTHROPIC_API_KEY not set — skipping extraction eval.');
    console.log('   Set it in .env to run the real extractor against the fixtures.');
    process.exit(0);
  }

  const totals = { lines: 0, matched: 0, code: 0, charge: 0, resp: 0, conf: 0 };

  for (const fx of FIXTURES) {
    const pdf = await renderFixturePdf(fx);
    const { extraction } = await ingestBytes({ bytes: pdf, mimeType: 'application/pdf' });
    const pairs = pair(fx.lines, extraction.lineItems);

    let matched = 0,
      code = 0,
      charge = 0,
      resp = 0,
      confSum = 0;
    for (const p of pairs) {
      if (!p.got) continue;
      matched++;
      confSum += p.got.confidence;
      if ((p.truth.cptHcpcsCode ?? null) === (p.got.cptHcpcsCode ?? null)) code++;
      if (moneyEq(p.truth.charge, p.got.chargeAmount)) charge++;
      if (moneyEq(p.truth.patientResponsibility, p.got.patientResponsibility)) resp++;
    }
    const n = fx.lines.length;
    totals.lines += n;
    totals.matched += matched;
    totals.code += code;
    totals.charge += charge;
    totals.resp += resp;
    totals.conf += confSum;

    const pct = (x: number) => `${Math.round((x / n) * 100)}%`;
    console.log(`\n📄 ${fx.name} (${fx.kind}) — kind detected: ${extraction.documentKind}`);
    console.log(`   lines matched:    ${matched}/${n} (${pct(matched)})`);
    console.log(`   code accuracy:    ${code}/${n} (${pct(code)})`);
    console.log(`   charge accuracy:  ${charge}/${n} (${pct(charge)})`);
    console.log(`   patient-resp acc: ${resp}/${n} (${pct(resp)})`);
    console.log(`   avg confidence:   ${matched ? (confSum / matched).toFixed(2) : 'n/a'}`);
  }

  const t = totals;
  const p = (x: number) => `${Math.round((x / t.lines) * 100)}%`;
  console.log('\n==================== OVERALL ====================');
  console.log(`lines matched:    ${t.matched}/${t.lines} (${p(t.matched)})`);
  console.log(`code accuracy:    ${t.code}/${t.lines} (${p(t.code)})`);
  console.log(`charge accuracy:  ${t.charge}/${t.lines} (${p(t.charge)})`);
  console.log(`patient-resp acc: ${t.resp}/${t.lines} (${p(t.resp)})`);
  console.log(`avg confidence:   ${t.matched ? (t.conf / t.matched).toFixed(2) : 'n/a'}`);
  console.log('=================================================');
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
