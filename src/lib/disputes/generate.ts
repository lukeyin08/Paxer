import { and, eq, isNull } from 'drizzle-orm';
import { db } from '@/lib/db';
import { cases, users } from '@/lib/db/schema';
import { aiConfigured } from '@/lib/ai/client';
import { generateDraftWithAi } from '@/lib/ai/draft';
import { buildLetterContext } from './letter-context';
import { renderTemplateLetter } from './draft-template';
import { sanitizeLetterHtml } from './sanitize';
import { getFindingsByIds, suggestTarget } from './repo';
import type { Dispute } from '@/lib/db/schema';

export interface GeneratedDraft {
  letterHtml: string;
  target: Dispute['target'];
  findingIds: string[];
  modelId: string | null;
  promptVersion: string | null;
}

/**
 * Build a dispute draft for the selected findings (Section 7.8). Uses Opus when
 * configured, falling back to a deterministic template so the full loop works
 * with zero AI config. Ownership is enforced.
 */
export async function generateDraft(input: {
  userId: string;
  caseId: string;
  findingIds: string[];
  target?: Dispute['target'];
}): Promise<GeneratedDraft> {
  const [caseRow] = await db
    .select()
    .from(cases)
    .where(and(eq(cases.id, input.caseId), eq(cases.userId, input.userId), isNull(cases.deletedAt)))
    .limit(1);
  if (!caseRow) throw new Error('Case not found.');

  const found = await getFindingsByIds(input.caseId, input.findingIds);
  if (found.length === 0) throw new Error('Select at least one finding to dispute.');

  const target = input.target ?? suggestTarget(found.map((f) => f.type));
  const [user] = await db.select().from(users).where(eq(users.id, input.userId)).limit(1);
  const ctx = buildLetterContext({
    patientName: user?.name ?? null,
    case: caseRow,
    findings: found,
    target,
  });

  if (aiConfigured()) {
    try {
      const ai = await generateDraftWithAi(ctx);
      return {
        letterHtml: sanitizeLetterHtml(ai.letterHtml),
        target,
        findingIds: found.map((f) => f.id),
        modelId: ai.modelId,
        promptVersion: ai.promptVersion,
      };
    } catch (err) {
      console.error('[draft] AI generation failed, using template:', err);
    }
  }

  return {
    letterHtml: sanitizeLetterHtml(renderTemplateLetter(ctx)),
    target,
    findingIds: found.map((f) => f.id),
    modelId: null,
    promptVersion: 'template.v1',
  };
}
