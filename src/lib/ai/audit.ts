import { z } from 'zod';
import { runStructured } from './client';
import { MODELS } from './models';
import { AUDIT_SYSTEM, AUDIT_PROMPT_VERSION } from './prompts/audit.v1';
import { clampConfidence } from './schemas';
import type { DetectorFinding } from '@/lib/audit/types';
import type { LineItem } from '@/lib/db/schema';
import { money } from '@/lib/audit/types';

const auditOutputSchema = z.object({
  enrichedFindings: z.array(
    z.object({
      index: z.number(),
      explanationPlain: z.string(),
      recommendedNextStep: z.string(),
    }),
  ),
  upcoding: z.array(
    z.object({
      lineItemIndex: z.number(),
      title: z.string(),
      explanationPlain: z.string(),
      recommendedNextStep: z.string(),
      confidence: z.number(),
      estimatedRecovery: z.number().nullable(),
    }),
  ),
});

export interface AiAuditResult {
  findings: DetectorFinding[];
  modelId: string;
  promptVersion: string;
}

/**
 * AI explanation pass (Section 7.6): enriches rule findings with patient-facing
 * explanations + next steps, and adds AI-only upcoding suggestions. Operates only
 * within the structured data; never invents codes or rules. Returns the merged
 * finding set. Caller skips this entirely when no API key is configured.
 */
export async function runAiAuditPass(input: {
  lineItems: LineItem[];
  ruleFindings: DetectorFinding[];
}): Promise<AiAuditResult> {
  const liView = input.lineItems.map((li, i) => ({
    index: i,
    id: li.id,
    description: li.description,
    code: li.cptHcpcsCode,
    units: li.units,
    charge: money(li.chargeAmount),
    allowed: money(li.allowedAmount),
    patientResponsibility: money(li.patientResponsibility),
  }));

  const ruleView = input.ruleFindings.map((f, i) => ({
    index: i,
    type: f.type,
    title: f.title,
    evidence: f.evidence,
  }));

  const content = [
    {
      type: 'text' as const,
      text: `Line items:\n${JSON.stringify(liView, null, 2)}\n\nRule findings (enrich each by index):\n${JSON.stringify(ruleView, null, 2)}`,
    },
  ];

  const { data, modelId, promptVersion } = await runStructured({
    model: MODELS.workhorse,
    promptVersion: AUDIT_PROMPT_VERSION,
    system: AUDIT_SYSTEM,
    content,
    schema: auditOutputSchema,
    effort: 'medium',
    maxTokens: 6000,
    label: 'audit',
  });

  // Merge enrichment into rule findings.
  const merged: DetectorFinding[] = input.ruleFindings.map((f) => ({ ...f }));
  const inRange = (i: number, len: number) => Number.isInteger(i) && i >= 0 && i < len;
  for (const e of data.enrichedFindings) {
    if (!inRange(e.index, merged.length)) continue;
    const target = merged[e.index];
    if (target) {
      target.explanationPlain = e.explanationPlain || target.explanationPlain;
      target.recommendedNextStep = e.recommendedNextStep || target.recommendedNextStep;
      target.detector = target.detector === 'RULE' ? 'RULE+AI' : target.detector;
    }
  }

  // Append AI-only upcoding findings.
  for (const u of data.upcoding) {
    if (!inRange(u.lineItemIndex, input.lineItems.length)) continue;
    const li = input.lineItems[u.lineItemIndex];
    if (!li) continue;
    // Sanity-bound the model-supplied recovery estimate (non-negative).
    const est =
      typeof u.estimatedRecovery === 'number' && u.estimatedRecovery >= 0
        ? u.estimatedRecovery
        : null;
    merged.push({
      type: 'UPCODING',
      severity: 'LOW',
      title: u.title,
      explanationPlain: u.explanationPlain,
      evidence: { description: li.description, code: li.cptHcpcsCode, charge: money(li.chargeAmount) },
      estimatedRecovery: est,
      confidence: Math.min(0.5, clampConfidence(u.confidence)), // upcoding stays low-confidence
      detector: 'AI',
      lineItemId: li.id,
      recommendedNextStep: u.recommendedNextStep,
    });
  }

  return { findings: merged, modelId, promptVersion };
}
