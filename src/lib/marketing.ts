/**
 * Shared marketing copy used by both the landing page and /how-it-works, so the
 * two can't silently drift out of sync. The landing page is the at-a-glance
 * teaser; /how-it-works is the detailed page (worked example + FAQ).
 */

export const PROCESS_STEPS = [
  {
    step: '01',
    title: 'Add your bill',
    body: 'Upload a medical bill or EOB, or enter the charges by hand. Paxer reads the document and pulls out every line item.',
  },
  {
    step: '02',
    title: 'See the findings',
    body: 'The audit engine checks each charge against your plan and regional benchmarks, and flags errors with the evidence and the math behind each one.',
  },
  {
    step: '03',
    title: 'Send & recover',
    body: 'Paxer drafts the dispute letter. You review it, send it to your provider or insurer, and Paxer tracks the deadline until the money comes back.',
  },
] as const;

export const ERROR_TYPES = [
  {
    title: 'Duplicate & unbundled charges',
    body: 'The same service billed twice, or one procedure split into separately billed parts to inflate the total.',
  },
  {
    title: 'Cost-share miscalculations',
    body: 'Your deductible, coinsurance, and out-of-pocket max recomputed from your real plan, then checked against what you were charged.',
  },
  {
    title: 'Balance billing & surprise bills',
    body: 'Out-of-network and emergency charges billed above your in-network cost-share, a likely No Surprises Act violation.',
  },
  {
    title: 'Upcoding & overruns',
    body: 'Higher-intensity codes than the service described, and charges above the regional benchmark for the same code.',
  },
] as const;
