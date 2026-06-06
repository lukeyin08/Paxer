import { formatUsd, formatDate } from '@/lib/utils';
import type { Case, Finding } from '@/lib/db/schema';

export interface LetterFinding {
  type: string;
  title: string;
  explanation: string;
  recommendedNextStep: string | null;
  estimatedRecovery: number | null;
}

export interface LetterContext {
  patientName: string;
  target: 'PROVIDER' | 'INSURER';
  recipientName: string; // provider or payer name
  providerName: string | null;
  payerName: string | null;
  dateOfService: string | null;
  caseTitle: string;
  findings: LetterFinding[];
  totalRequested: number;
}

export function buildLetterContext(input: {
  patientName: string | null;
  case: Case;
  findings: Finding[];
  target: 'PROVIDER' | 'INSURER';
}): LetterContext {
  const lf: LetterFinding[] = input.findings.map((f) => {
    const ev = (f.evidenceJson as Record<string, unknown> | null) ?? {};
    return {
      type: f.type,
      title: f.title,
      explanation: f.explanationPlain,
      recommendedNextStep:
        typeof ev.recommendedNextStep === 'string' ? ev.recommendedNextStep : null,
      estimatedRecovery: f.estimatedRecovery === null ? null : Number(f.estimatedRecovery),
    };
  });
  const totalRequested = lf.reduce((s, f) => s + (f.estimatedRecovery ?? 0), 0);
  return {
    patientName: input.patientName ?? '[Your name]',
    target: input.target,
    recipientName:
      (input.target === 'INSURER' ? input.case.payerName : input.case.providerName) ??
      (input.target === 'INSURER' ? 'your insurer' : 'the provider'),
    providerName: input.case.providerName,
    payerName: input.case.payerName,
    dateOfService: input.case.dateOfService ? formatDate(input.case.dateOfService) : null,
    caseTitle: input.case.title,
    findings: lf,
    totalRequested,
  };
}

/** Serialize the context for an AI prompt (the model gets only this evidence). */
export function contextForPrompt(ctx: LetterContext): string {
  return JSON.stringify(
    {
      patientName: ctx.patientName,
      target: ctx.target,
      recipientName: ctx.recipientName,
      providerName: ctx.providerName,
      payerName: ctx.payerName,
      dateOfService: ctx.dateOfService,
      totalRequested: formatUsd(ctx.totalRequested),
      findings: ctx.findings.map((f) => ({
        title: f.title,
        explanation: f.explanation,
        ask: f.recommendedNextStep,
        amount: f.estimatedRecovery !== null ? formatUsd(f.estimatedRecovery) : null,
      })),
    },
    null,
    2,
  );
}
