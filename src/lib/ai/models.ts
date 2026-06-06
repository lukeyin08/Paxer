/**
 * Model routing (Section 8). Pinned exact versioned strings, swappable here in
 * one place. Aliases resolve to the current snapshot server-side.
 */
export const MODELS = {
  // Cheap classification / triage (document kind detection).
  triage: 'claude-haiku-4-5-20251001',
  // Workhorse: extraction + audit explanation.
  workhorse: 'claude-sonnet-4-6',
  // High-stakes dispute drafting.
  drafting: 'claude-opus-4-8',
} as const;

export type ModelKey = keyof typeof MODELS;

// Approximate pricing per million tokens (USD), for the daily spend guard
// (Section 8). Input / output.
export const PRICING: Record<string, { input: number; output: number }> = {
  'claude-haiku-4-5-20251001': { input: 1, output: 5 },
  'claude-sonnet-4-6': { input: 3, output: 15 },
  'claude-opus-4-8': { input: 5, output: 25 },
};

export function estimateCostUsd(
  model: string,
  usage: { input_tokens?: number; output_tokens?: number },
): number {
  const p = PRICING[model] ?? { input: 3, output: 15 };
  const inTok = usage.input_tokens ?? 0;
  const outTok = usage.output_tokens ?? 0;
  return (inTok / 1_000_000) * p.input + (outTok / 1_000_000) * p.output;
}
