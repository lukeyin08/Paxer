import type { Case, Dispute, Finding } from '@/lib/db/schema';

type Tone = 'neutral' | 'accent' | 'success' | 'warning' | 'danger' | 'muted';

export function caseStatusTone(status: Case['status']): Tone {
  switch (status) {
    case 'DRAFT':
      return 'muted';
    case 'INGESTING':
      return 'warning';
    case 'AUDITED':
      return 'accent';
    case 'IN_DISPUTE':
      return 'warning';
    case 'RESOLVED':
      return 'success';
    case 'CLOSED':
      return 'neutral';
    default:
      return 'neutral';
  }
}

export function findingStatusTone(status: Finding['status']): Tone {
  switch (status) {
    case 'OPEN':
      return 'accent';
    case 'DISMISSED':
      return 'muted';
    case 'DISPUTING':
      return 'warning';
    case 'RECOVERED':
      return 'success';
    default:
      return 'neutral';
  }
}

/** Plain-English label for a finding's severity (priority; color conveys level). */
export function severityLabel(severity: Finding['severity']): string {
  return { HIGH: 'High', MED: 'Medium', LOW: 'Low' }[severity] ?? severity;
}

/** Plain-English label for what kind of billing error a finding is. */
export function findingTypeLabel(type: string): string {
  const map: Record<string, string> = {
    DUPLICATE_CHARGE: 'Duplicate charge',
    CROSS_PROVIDER_DUPLICATE: 'Duplicate across providers',
    COST_SHARE_ERROR: 'Cost-share error',
    NON_COVERED_BILLED_TO_PATIENT: 'Denial billed to you',
    BALANCE_BILLING_NSA: 'Balance billing',
    UNBUNDLING_NCCI: 'Unbundled charges',
    UPCODING: 'Possible upcoding',
    OTHER: 'Flagged charge',
  };
  return map[type] ?? type.replace(/_/g, ' ').toLowerCase().replace(/^./, (c) => c.toUpperCase());
}

/** Plain-English label for a finding's status. */
export function findingStatusLabel(status: string): string {
  const map: Record<string, string> = {
    OPEN: 'Open',
    DISMISSED: 'Dismissed',
    DISPUTING: 'In dispute',
    RECOVERED: 'Recovered',
  };
  return map[status] ?? status.replace(/_/g, ' ');
}

/** How a finding was detected, in plain English. */
export function detectorLabel(detector: string): string {
  if (detector === 'AI') return 'Found by AI';
  if (detector === 'RULE+AI') return 'Rules + AI';
  return 'Rule-based';
}

export function severityTone(severity: Finding['severity']): Tone {
  switch (severity) {
    case 'HIGH':
      return 'danger';
    case 'MED':
      return 'warning';
    case 'LOW':
      return 'muted';
    default:
      return 'neutral';
  }
}

/**
 * Human-facing label for a dispute status. Most are just the enum with
 * underscores spaced out; SIMULATED_SENT is an internal value that we surface to
 * patients simply as "Sent" (Paxer doesn't transmit on their behalf in v1).
 */
export function disputeStatusLabel(status: Dispute['status']): string {
  if (status === 'SIMULATED_SENT') return 'SENT';
  return status.replace(/_/g, ' ');
}

export function disputeStatusTone(status: Dispute['status']): Tone {
  switch (status) {
    case 'DRAFT':
    case 'AWAITING_USER_APPROVAL':
      return 'muted';
    case 'SIMULATED_SENT':
    case 'RESPONSE_RECEIVED':
      return 'accent';
    case 'WON':
    case 'PARTIAL':
      return 'success';
    case 'DENIED':
      return 'danger';
    case 'ESCALATED':
      return 'warning';
    default:
      return 'neutral';
  }
}
