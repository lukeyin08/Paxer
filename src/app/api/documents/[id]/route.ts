import { NextRequest } from 'next/server';
import { requireUser } from '@/lib/auth/session';
import { getDocumentForUser } from '@/lib/cases/repo';
import { getFileBytes } from '@/lib/storage';
import { reportError } from '@/lib/observability';

// Serves uploaded documents (medical bills, EOBs, denial letters — PHI) ONLY to
// the patient who owns the case. The underlying storage URL (a Vercel Blob URL)
// is never exposed to the browser; the client links to this route by document
// id, and we stream the bytes after an ownership check. This closes the IDOR /
// public-URL leak: even though the blob URL is unguessable, it is never sent to
// the client, logged in referrers, or shareable.
export const runtime = 'nodejs';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await requireUser();
  const { id } = await params;

  const doc = await getDocumentForUser(user.id, id);
  if (!doc || !doc.blobUrl) {
    return new Response('Not found', { status: 404 });
  }

  let bytes: Buffer;
  try {
    bytes = await getFileBytes(doc.blobUrl);
  } catch (err) {
    reportError(err, { where: 'documents.serve', documentId: id });
    return new Response('Not found', { status: 404 });
  }

  return new Response(new Uint8Array(bytes), {
    headers: {
      'Content-Type': doc.mimeType ?? 'application/octet-stream',
      'Content-Disposition': `inline; filename="${(doc.fileName ?? 'document').replace(/[^a-zA-Z0-9._-]+/g, '_')}"`,
      // PHI: never cache in shared caches; force re-auth on each fetch.
      'Cache-Control': 'private, no-store, max-age=0',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
