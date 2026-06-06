import { NextRequest } from 'next/server';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { requireUser } from '@/lib/auth/session';

// Serves locally-stored dev uploads. In production, files live in Vercel Blob
// and are served directly from blob URLs, so this route is dev-only.
export const runtime = 'nodejs';

const MIME: Record<string, string> = {
  '.pdf': 'application/pdf',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.txt': 'text/plain',
};

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  await requireUser();
  const { path: parts } = await params;
  const rel = parts.join('/');
  // Prevent path traversal.
  const base = path.join(process.cwd(), '.uploads');
  const filePath = path.normalize(path.join(base, rel));
  if (!filePath.startsWith(base)) {
    return new Response('Not found', { status: 404 });
  }
  try {
    const data = await readFile(filePath);
    const ext = path.extname(filePath).toLowerCase();
    return new Response(new Uint8Array(data), {
      headers: { 'Content-Type': MIME[ext] ?? 'application/octet-stream' },
    });
  } catch {
    return new Response('Not found', { status: 404 });
  }
}
