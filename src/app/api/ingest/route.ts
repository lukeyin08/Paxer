import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireUser } from '@/lib/auth/session';
import { processDocumentIngestion } from '@/lib/cases/ingest';

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
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Extraction failed.' },
      { status: 500 },
    );
  }
}
