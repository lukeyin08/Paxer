import Anthropic from '@anthropic-ai/sdk';
import { and, gte, eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/lib/db';
import { auditLog } from '@/lib/db/schema';
import { env } from '@/lib/env';
import { estimateCostUsd } from './models';
import { zodToJsonSchema } from './json-schema';

let _client: Anthropic | null = null;

function client(): Anthropic {
  if (!env.ANTHROPIC_API_KEY) {
    throw new Error(
      'ANTHROPIC_API_KEY is not set. AI features (ingestion, audit, drafting) require it.',
    );
  }
  if (!_client) {
    _client = new Anthropic({
      apiKey: env.ANTHROPIC_API_KEY,
      timeout: 120_000, // per-request timeout
      maxRetries: 3, // exponential backoff on 429/5xx
    });
  }
  return _client;
}

export function aiConfigured(): boolean {
  return Boolean(env.ANTHROPIC_API_KEY);
}

/**
 * Sum today's AI spend (USD) from the audit log — the daily spend guard
 * (Section 8). When `userId` is provided, scopes to that user's calls so a
 * per-user ceiling can be enforced alongside the global one.
 */
async function spentTodayUsd(userId?: string | null): Promise<number> {
  const startOfDay = new Date();
  startOfDay.setUTCHours(0, 0, 0, 0);
  const where = userId
    ? and(eq(auditLog.action, 'ai.call'), gte(auditLog.at, startOfDay), eq(auditLog.userId, userId))
    : and(eq(auditLog.action, 'ai.call'), gte(auditLog.at, startOfDay));
  const rows = await db.select({ diff: auditLog.diffJson }).from(auditLog).where(where);
  return rows.reduce((sum, r) => {
    const cost = (r.diff as { costUsd?: number } | null)?.costUsd ?? 0;
    return sum + cost;
  }, 0);
}

export interface RunResult<T> {
  data: T;
  modelId: string;
  promptVersion: string;
  usage: { input_tokens: number; output_tokens: number };
  costUsd: number;
  latencyMs: number;
}

export interface RunStructuredInput<T extends z.ZodTypeAny> {
  model: string;
  promptVersion: string;
  system: string;
  content: Anthropic.MessageParam['content'];
  schema: T;
  effort?: 'low' | 'medium' | 'high';
  maxTokens?: number;
  /** Label for the audit log (e.g. "extract", "audit", "draft"). */
  label: string;
  /** Owning user, for per-user budget enforcement + attribution. */
  userId?: string | null;
}

/**
 * Centralized structured-output call (Section 8). Validates the model output
 * with Zod, enforces a hard daily spend guard, logs token usage + cost, and
 * returns the validated data plus metadata (model id, usage, latency).
 */
export async function runStructured<T extends z.ZodTypeAny>(
  input: RunStructuredInput<T>,
): Promise<RunResult<z.infer<T>>> {
  // Global daily spend guard, plus a per-user ceiling so one account can't
  // drain the shared budget (the global + per-user reads run concurrently).
  const [spent, userSpent] = await Promise.all([
    spentTodayUsd(),
    input.userId ? spentTodayUsd(input.userId) : Promise.resolve(0),
  ]);
  if (spent >= env.PAXER_DAILY_AI_BUDGET_USD) {
    throw new Error(
      `Daily AI budget reached ($${env.PAXER_DAILY_AI_BUDGET_USD}). Try again tomorrow or raise PAXER_DAILY_AI_BUDGET_USD.`,
    );
  }
  if (input.userId && userSpent >= env.PAXER_USER_DAILY_AI_BUDGET_USD) {
    throw new Error(
      `You've reached today's AI usage limit ($${env.PAXER_USER_DAILY_AI_BUDGET_USD}). Please try again tomorrow.`,
    );
  }

  const start = Date.now();
  const response = await client().messages.create({
    model: input.model,
    max_tokens: input.maxTokens ?? 8000,
    thinking: { type: 'adaptive' },
    output_config: {
      effort: input.effort ?? 'medium',
      format: { type: 'json_schema', schema: zodToJsonSchema(input.schema) },
    },
    system: input.system,
    messages: [{ role: 'user', content: input.content }],
  });
  const latencyMs = Date.now() - start;

  // Surface non-normal stops as clear errors rather than opaque JSON failures.
  if (response.stop_reason === 'refusal') {
    throw new Error('The model declined to respond to this request.');
  }
  if (response.stop_reason === 'max_tokens') {
    throw new Error(
      `Model output was truncated at the ${input.maxTokens ?? 8000}-token limit. Try a smaller document or raise maxTokens.`,
    );
  }

  // Extract the JSON text block and validate again with Zod (Section 8).
  const textBlock = response.content.find((b) => b.type === 'text');
  if (!textBlock || textBlock.type !== 'text') {
    throw new Error('Model returned no text content.');
  }
  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(textBlock.text);
  } catch {
    throw new Error('Model output was not valid JSON.');
  }
  let data: z.infer<T>;
  try {
    data = input.schema.parse(parsedJson) as z.infer<T>;
  } catch (err) {
    const detail = err instanceof z.ZodError ? err.issues[0]?.message : 'schema mismatch';
    throw new Error(`Model output failed validation: ${detail}`);
  }

  const usage = {
    input_tokens: response.usage.input_tokens,
    output_tokens: response.usage.output_tokens,
  };
  const costUsd = estimateCostUsd(input.model, usage);

  // Log token usage per call (Section 8). userId attributes spend per user.
  await db.insert(auditLog).values({
    entity: 'ai',
    action: 'ai.call',
    userId: input.userId ?? null,
    diffJson: {
      label: input.label,
      model: input.model,
      promptVersion: input.promptVersion,
      usage,
      costUsd,
      latencyMs,
    },
  });

  return {
    data,
    modelId: input.model,
    promptVersion: input.promptVersion,
    usage,
    costUsd,
    latencyMs,
  };
}

export { Anthropic };
