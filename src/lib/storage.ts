import { env } from '@/lib/env';

export interface StoredFile {
  url: string;
  pathname: string;
}

/**
 * File storage. Uses Vercel Blob when BLOB_READ_WRITE_TOKEN is configured (prod /
 * preview), and falls back to local disk for local development so uploads work
 * with zero cloud config. On Vercel the filesystem is read-only, so the token
 * path is always taken there.
 */
export async function putFile(
  key: string,
  data: Buffer | Uint8Array,
  contentType: string,
): Promise<StoredFile> {
  if (env.BLOB_READ_WRITE_TOKEN) {
    const { put } = await import('@vercel/blob');
    const blob = await put(key, Buffer.from(data), {
      access: 'public',
      contentType,
      token: env.BLOB_READ_WRITE_TOKEN,
      addRandomSuffix: true,
    });
    return { url: blob.url, pathname: blob.pathname };
  }

  // Local dev fallback: write under .uploads and serve via /api/uploads/[...path].
  const { mkdir, writeFile } = await import('node:fs/promises');
  const path = await import('node:path');
  const safeKey = key.replace(/[^a-zA-Z0-9._/-]/g, '_');
  const rand = Math.round(performance.now()).toString(36);
  const pathname = `${rand}-${safeKey}`;
  const dir = path.join(process.cwd(), '.uploads');
  const filePath = path.join(dir, pathname);
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, Buffer.from(data));
  return { url: `/api/uploads/${pathname}`, pathname };
}

/** Delete a stored file (best-effort). Used by data-deletion (Section 9). */
export async function deleteFile(url: string): Promise<void> {
  try {
    if (env.BLOB_READ_WRITE_TOKEN && url.startsWith('http')) {
      const { del } = await import('@vercel/blob');
      await del(url, { token: env.BLOB_READ_WRITE_TOKEN });
      return;
    }
    if (url.startsWith('/api/uploads/')) {
      const { unlink } = await import('node:fs/promises');
      const path = await import('node:path');
      const pathname = url.replace('/api/uploads/', '');
      await unlink(path.join(process.cwd(), '.uploads', pathname));
    }
  } catch (err) {
    console.error('[storage] delete failed', err);
  }
}
