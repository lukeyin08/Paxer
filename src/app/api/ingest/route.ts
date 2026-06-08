import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireUser } from '@/lib/auth/session';
import { processDocumentIngestion } from '@/lib/cases/ingest';
import { RateLimitError } from '@/lib/rate-limit';

// Node runtime (Anthropic SDK + PDF handling). Section 13.
export const runtime = 'nodejs';
export const maxDuration = 120;

const bodySchema = z.object({ documentId: z.string().uuid() });

export async function POST(req: NextRequest) {
  const user = await requireUser();
  const json = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: 'documentId is required.' }, { status: 400 });
  }
  try {
    const result = await processDocumentIngestion(user.id, parsed.data.documentId);
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof RateLimitError) {
      return NextResponse.json(
        { error: err.message },
        { status: 429, headers: { 'Retry-After': String(err.retryAfterSec) } },
      );
    }
    // Log the real cause server-side; return a generic message so internal
    // details (AI-budget config, authorization semantics) don't leak to callers.
    console.error('[ingest] failed:', err);
    return NextResponse.json({ error: 'Extraction failed.' }, { status: 500 });
  }
}
