import { formatUsd } from '@/lib/utils';
import type { LetterContext } from './letter-context';

function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * Deterministic dispute-letter template (the no-API-key fallback, Section 2).
 * Produces editable HTML. Uses only the provided evidence and clearly-marked
 * [placeholders] for anything unknown; it never fabricates codes, dates, or
 * citations (Section 8). The patient reviews and edits before any use.
 */
export function renderTemplateLetter(ctx: LetterContext): string {
  const isInsurer = ctx.target === 'INSURER';
  const subject = isInsurer
    ? 'Appeal of claim processing and request for reprocessing'
    : 'Request for billing correction and itemized review';

  const items = ctx.findings
    .map((f) => {
      const amount =
        f.estimatedRecovery !== null
          ? ` We estimate this affects approximately ${esc(formatUsd(f.estimatedRecovery))}.`
          : '';
      const ask = f.recommendedNextStep ? ` ${esc(f.recommendedNextStep)}` : '';
      return `<li><strong>${esc(f.title)}.</strong> ${esc(f.explanation)}${amount}${ask}</li>`;
    })
    .join('\n');

  const nsa = ctx.findings.some((f) => f.type === 'BALANCE_BILLING_NSA')
    ? `<p>Several of these charges appear to fall under the federal No Surprises Act, which limits patient responsibility for certain out-of-network and emergency services to the in-network cost-share. I am requesting that they be reprocessed accordingly.</p>`
    : '';

  const closing = isInsurer
    ? `I am requesting that you reprocess the affected claims and correct my cost-share in accordance with my plan benefits. Please treat this as a formal first-level appeal. I have enclosed the relevant Explanation of Benefits for your reference.`
    : `I am requesting a corrected, itemized bill reflecting the adjustments above. Please confirm in writing once the account has been updated.`;

  return `<div class="dispute-letter">
<p>[Your name]<br/>[Your address]<br/>[City, State ZIP]<br/>[Email] · [Phone]</p>
<p>[Date]</p>
<p>${esc(ctx.recipientName)}<br/>[Recipient address]</p>
<p><strong>Re: ${esc(subject)}</strong><br/>
Patient: ${esc(ctx.patientName)}${ctx.dateOfService ? ` · Date of service: ${esc(ctx.dateOfService)}` : ''}<br/>
[Account / Claim number]</p>
<p>To whom it may concern,</p>
<p>I am writing regarding the charges associated with the service${ctx.dateOfService ? ` on ${esc(ctx.dateOfService)}` : ''}. After a careful review, I have identified the following item(s) that appear inconsistent and that I am asking you to correct:</p>
<ol>
${items}
</ol>
${nsa}
<p>In total, the items above affect an estimated <strong>${esc(formatUsd(ctx.totalRequested))}</strong>. This figure is an estimate based on the information available to me.</p>
<p>${esc(closing)}</p>
<p>Please respond within 30 days. I am happy to provide any additional documentation you need. Thank you for your attention to this matter.</p>
<p>Sincerely,<br/>${esc(ctx.patientName)}</p>
</div>`;
}
