import { formatUsd, formatDate } from '@/lib/utils';
import type { Case, Finding } from '@/lib/db/schema';

export interface LetterFinding {
  type: string;
  title: string;
  explanation: string;
  recommendedNextStep: string | null;
  estimatedRecovery: number | null;
}

/**
 * Contact / claim details the patient supplies up front so the finished letter
 * has NO [bracketed placeholders]. Optional fields (recipient mailing address,
 * member ID, claim number) are omitted from the letter when blank — never
 * placeholdered. The letter date is stamped on the server.
 */
export interface LetterDetails {
  letterDate: string;
  senderName: string;
  senderAddress: string;
  senderCityStateZip: string;
  senderPhone: string;
  senderEmail: string;
  recipientName: string;
  recipientAddress: string;
  recipientCityStateZip: string;
  memberId: string;
  claimNumber: string;
}

/** What the client collects (the server stamps the letter date). */
export type LetterDetailsInput = Omit<LetterDetails, 'letterDate'>;

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
  /** Set when the patient supplied details, so the letter has no placeholders. */
  details: LetterDetails | null;
}

export function buildLetterContext(input: {
  patientName: string | null;
  case: Case;
  findings: Finding[];
  target: 'PROVIDER' | 'INSURER';
  details?: LetterDetails | null;
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
  const details = input.details ?? null;
  return {
    // Prefer the supplied sender/recipient names so the letter matches what the
    // patient entered (treat an empty string as unset).
    patientName: details?.senderName?.trim() || input.patientName || '[Your name]',
    target: input.target,
    recipientName:
      details?.recipientName?.trim() ||
      (input.target === 'INSURER' ? input.case.payerName : input.case.providerName) ||
      (input.target === 'INSURER' ? 'your insurer' : 'the provider'),
    providerName: input.case.providerName,
    payerName: input.case.payerName,
    dateOfService: input.case.dateOfService ? formatDate(input.case.dateOfService) : null,
    caseTitle: input.case.title,
    findings: lf,
    totalRequested,
    details,
  };
}

/** Serialize the context for an AI prompt (the model gets only this evidence). */
export function contextForPrompt(ctx: LetterContext): string {
  const d = ctx.details;
  // Optional fields are passed as null when blank so the prompt omits the line
  // rather than inventing a placeholder.
  const blank = (s: string) => (s && s.trim() ? s.trim() : null);
  return JSON.stringify(
    {
      patientName: ctx.patientName,
      target: ctx.target,
      recipientName: ctx.recipientName,
      providerName: ctx.providerName,
      payerName: ctx.payerName,
      dateOfService: ctx.dateOfService,
      totalRequested: formatUsd(ctx.totalRequested),
      // Real contact / claim details supplied by the patient (no placeholders).
      letterDate: d?.letterDate ?? null,
      sender: d
        ? {
            name: d.senderName,
            address: d.senderAddress,
            cityStateZip: d.senderCityStateZip,
            phone: d.senderPhone,
            email: d.senderEmail,
          }
        : null,
      recipient: d
        ? {
            name: d.recipientName,
            address: blank(d.recipientAddress),
            cityStateZip: blank(d.recipientCityStateZip),
          }
        : null,
      memberId: d ? blank(d.memberId) : null,
      claimNumber: d ? blank(d.claimNumber) : null,
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
