/**
 * Shared marketing copy used by both the landing page and /how-it-works, so the
 * two can't silently drift out of sync. The landing page is the at-a-glance
 * teaser; /how-it-works is the detailed page (worked example + FAQ).
 */

export const PROCESS_STEPS = [
  {
    step: '1',
    title: 'Add your bill',
    body: 'Upload a bill or EOB, or type the charges in.',
  },
  {
    step: '2',
    title: 'See the findings',
    body: 'Each charge is checked against your plan and regional prices, with the math shown.',
  },
  {
    step: '3',
    title: 'Send & recover',
    body: 'Paxer drafts the letter. You send it, and Paxer tracks the deadline.',
  },
] as const;

/**
 * The B2B buyers the Audit API is sold to, named explicitly. Chosen because
 * their incentives align with the patient — they win when a bill is corrected,
 * not when a claim is denied — unlike health plans, which stay a "contact" lane
 * and are never the wedge. Shared across landing / developers / pricing so the
 * positioning can't drift.
 */
export const API_BUYERS =
  'patient-billing platforms, TPAs, self-insured employers, and HSA/FSA admins';

/** External booking link for a guided demo (Google Calendar appointment page). */
export const REQUEST_DEMO_URL = 'https://calendar.app.google/JNSip5vZvhQBQgiTA';

export const ERROR_TYPES = [
  {
    title: 'Duplicate & unbundled charges',
    body: 'The same service billed twice, or one procedure split into separate charges.',
  },
  {
    title: 'Cost-share miscalculations',
    body: 'Deductible, coinsurance, and out-of-pocket max recomputed from your plan.',
  },
  {
    title: 'Balance billing & surprise bills',
    body: 'Out-of-network charges above your in-network cost-share (No Surprises Act).',
  },
  {
    title: 'Upcoding & overruns',
    body: 'Codes billed higher than the service described, or prices above the regional benchmark.',
  },
] as const;
