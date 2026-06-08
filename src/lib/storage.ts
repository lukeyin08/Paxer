import { env } from '@/lib/env';

export interface StoredFile {
  url: string;
  pathname: string;
}

/**
 * Resolve a relative pathname under the local .uploads dir, refusing anything
 * that escapes it (path traversal). Throws on an out-of-bounds path.
 */
async function resolveLocalPath(pathname: string): Promise<string> {
  const path = await import('node:path');
  const base = path.join(process.cwd(), '.uploads');
  const resolved = path.normalize(path.join(base, pathname));
  if (resolved !== base && !resolved.startsWith(base + path.sep)) {
    throw new Error('Invalid storage path.');
  }
  return resolved;
}

/** Build a collision-resistant, traversal-safe local pathname from a key. */
function localPathname(key: string): string {
  // Collapse any path separators / traversal in the key into a flat, safe name.
  const flat = key.replace(/[^a-zA-Z0-9._-]+/g, '_').replace(/\.{2,}/g, '_');
  const rand = `${Math.round(performance.now()).toString(36)}${Math.random().toString(36).slice(2, 10)}`;
  return `${rand}-${flat}`.slice(0, 200);
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
    // The blob URL carries an unguessable random suffix AND is never exposed to
    // the client — files are served only through /api/documents/[id] after an
    // ownership check. The stored URL is treated as a server-side secret.
    const blob = await put(key, Buffer.from(data), {
      access: 'public',
      contentType,
      token: env.BLOB_READ_WRITE_TOKEN,
      addRandomSuffix: true,
    });
    return { url: blob.url, pathname: blob.pathname };
  }

  // No blob token configured. On a serverless host the filesystem is read-only,
  // so writing PHI to local disk both fails and is unsafe — refuse loudly in
  // production rather than silently corrupting an upload.
  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      'File storage is not configured: set BLOB_READ_WRITE_TOKEN in production.',
    );
  }

  // Local dev fallback: write under .uploads and serve via /api/documents/[id].
  // The pathname is flattened (no separators / traversal) and the resolved path
  // is verified to stay within .uploads.
  const { mkdir, writeFile } = await import('node:fs/promises');
  const path = await import('node:path');
  const pathname = localPathname(key);
  const filePath = await resolveLocalPath(pathname);
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, Buffer.from(data));
  // The `/api/uploads/` prefix is an internal storage marker (not a servable
  // route) that getFileBytes/deleteFile use to read from local disk. Files are
  // served to the browser only via the ownership-checked /api/documents/[id].
  return { url: `/api/uploads/${pathname}`, pathname };
}

/**
 * Read a stored file's bytes server-side. For local dev uploads it reads from
 * disk directly; for Blob it fetches the stored (unguessable) URL server-side.
 * Callers must enforce ownership before invoking this.
 */
export async function getFileBytes(url: string): Promise<Buffer> {
  if (url.startsWith('/api/uploads/')) {
    const { readFile } = await import('node:fs/promises');
    const pathname = url.replace('/api/uploads/', '');
    return readFile(await resolveLocalPath(pathname));
  }
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch file: ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
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
      const pathname = url.replace('/api/uploads/', '');
      await unlink(await resolveLocalPath(pathname));
    }
  } catch (err) {
    console.error('[storage] delete failed', err);
  }
}
