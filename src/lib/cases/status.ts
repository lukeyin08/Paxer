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
