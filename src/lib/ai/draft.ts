import { z } from 'zod';
import { runStructured } from './client';
import { MODELS } from './models';
import { DRAFT_SYSTEM, DRAFT_PROMPT_VERSION } from './prompts/draft.v1';
import { contextForPrompt, type LetterContext } from '@/lib/disputes/letter-context';

const draftSchema = z.object({
  target: z.enum(['PROVIDER', 'INSURER']),
  subjectLine: z.string(),
  letterHtml: z.string(),
});

export interface DraftResult {
  letterHtml: string;
  modelId: string;
  promptVersion: string;
}

/**
 * Generate a dispute letter with Opus (high stakes — Section 7.8). Uses only the
 * case's real evidence; the system prompt forbids fabrication and limits cited
 * rules. Returns editable HTML plus model metadata to store on the dispute.
 */
export async function generateDraftWithAi(ctx: LetterContext): Promise<DraftResult> {
  const content = [
    {
      type: 'text' as const,
      text: `Draft a ${ctx.target === 'INSURER' ? 'health-insurer appeal' : 'provider billing-correction'} letter from this evidence:\n\n${contextForPrompt(ctx)}`,
    },
  ];
  const { data, modelId, promptVersion } = await runStructured({
    model: MODELS.drafting,
    promptVersion: DRAFT_PROMPT_VERSION,
    system: DRAFT_SYSTEM,
    content,
    schema: draftSchema,
    effort: 'high', // high stakes (Section 8)
    maxTokens: 8000,
    label: 'draft',
  });
  return { letterHtml: data.letterHtml, modelId, promptVersion };
}
