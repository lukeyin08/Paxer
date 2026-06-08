import type { Anthropic } from './client';
import { runStructured } from './client';
import { MODELS } from './models';
import { documentExtractionSchema, clampConfidence, type DocumentExtraction } from './schemas';
import { EXTRACT_SYSTEM, EXTRACT_PROMPT_VERSION } from './prompts/extract.v1';
import { getFileBytes } from '@/lib/storage';

type ContentBlocks = Anthropic.MessageParam['content'];

const IMAGE_TYPES = new Set(['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif']);

/** Build the content blocks for a document, using native PDF / vision input (Section 7.5). */
function buildContent(bytes: Buffer, mimeType: string): ContentBlocks {
  const data = bytes.toString('base64');
  const instruction = {
    type: 'text' as const,
    text: 'Extract the structured data from this document. Follow the rules exactly: never guess, return null for anything not clearly present, and lower confidence when uncertain.',
  };

  if (mimeType === 'application/pdf') {
    return [
      {
        type: 'document',
        source: { type: 'base64', media_type: 'application/pdf', data },
      },
      instruction,
    ] as ContentBlocks;
  }

  if (IMAGE_TYPES.has(mimeType)) {
    const media = (mimeType === 'image/jpg' ? 'image/jpeg' : mimeType) as
      | 'image/png'
      | 'image/jpeg'
      | 'image/webp'
      | 'image/gif';
    return [
      { type: 'image', source: { type: 'base64', media_type: media, data } },
      instruction,
    ] as ContentBlocks;
  }

  throw new Error(`Unsupported document type for extraction: ${mimeType}`);
}

export interface IngestResult {
  extraction: DocumentExtraction;
  modelId: string;
  promptVersion: string;
}

/**
 * Extract structured line items from an uploaded document using the Anthropic
 * model's native PDF/image understanding (Section 7.5). Returns validated data
 * with per-field confidence; the caller decides whether to surface a review step.
 */
export async function ingestDocument(input: {
  blobUrl: string;
  mimeType: string;
  userId?: string | null;
}): Promise<IngestResult> {
  const bytes = await getFileBytes(input.blobUrl);
  return ingestBytes({ bytes, mimeType: input.mimeType, userId: input.userId });
}

/** Extract directly from in-memory bytes (used by ingestDocument and the eval harness). */
export async function ingestBytes(input: {
  bytes: Buffer;
  mimeType: string;
  userId?: string | null;
}): Promise<IngestResult> {
  const content = buildContent(input.bytes, input.mimeType);

  const result = await runStructured({
    model: MODELS.workhorse,
    promptVersion: EXTRACT_PROMPT_VERSION,
    system: EXTRACT_SYSTEM,
    content,
    schema: documentExtractionSchema,
    effort: 'low', // keep effort modest for extraction (Section 8)
    maxTokens: 8000,
    label: 'extract',
    userId: input.userId,
  });

  // Normalize confidences into range.
  const extraction: DocumentExtraction = {
    ...result.data,
    overallConfidence: clampConfidence(result.data.overallConfidence),
    lineItems: result.data.lineItems.map((li) => ({
      ...li,
      confidence: clampConfidence(li.confidence),
      units: Number.isFinite(li.units) && li.units > 0 ? Math.round(li.units) : 1,
    })),
  };

  return {
    extraction,
    modelId: result.modelId,
    promptVersion: result.promptVersion,
  };
}

/** Confidence floor below which a document should go to manual review (Section 7.5). */
export const REVIEW_CONFIDENCE_THRESHOLD = 0.6;

export function needsReview(extraction: DocumentExtraction): boolean {
  if (extraction.lineItems.length === 0) return true;
  if (extraction.overallConfidence < REVIEW_CONFIDENCE_THRESHOLD) return true;
  return extraction.lineItems.some((li) => li.confidence < REVIEW_CONFIDENCE_THRESHOLD);
}
