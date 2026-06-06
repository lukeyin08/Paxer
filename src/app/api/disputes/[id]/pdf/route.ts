import { NextRequest } from 'next/server';
import { requireUser } from '@/lib/auth/session';
import { getDisputeForUser } from '@/lib/disputes/repo';
import { renderLetterPdf } from '@/lib/disputes/pdf';

export const runtime = 'nodejs';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const detail = await getDisputeForUser(user.id, id);
  if (!detail || !detail.dispute.letterHtml) {
    return new Response('Not found', { status: 404 });
  }
  const pdf = await renderLetterPdf(detail.dispute.letterHtml);
  return new Response(new Uint8Array(pdf), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="paxer-dispute-${id.slice(0, 8)}.pdf"`,
    },
  });
}
