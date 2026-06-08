import { createElement as h } from 'react';
import { Document, Page, Text, StyleSheet, renderToBuffer } from '@react-pdf/renderer';

interface Block {
  kind: 'p' | 'li' | 'h';
  text: string;
}

/** Convert the dispute letter HTML into ordered text blocks for PDF rendering. */
export function htmlToBlocks(html: string): Block[] {
  const blocks: Block[] = [];
  // Match block-level text elements in document order (matches the tags the
  // sanitizer allows so nothing is silently dropped from the PDF).
  const re = /<(p|li|h[1-6]|blockquote)\b[^>]*>([\s\S]*?)<\/\1>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    const tag = m[1]!.toLowerCase();
    const kind: Block['kind'] = tag === 'li' ? 'li' : /^h[1-6]$/.test(tag) ? 'h' : 'p';
    const text = stripTags(m[2]!);
    if (text.trim()) blocks.push({ kind, text });
  }
  if (blocks.length === 0) {
    const text = stripTags(html);
    if (text.trim()) blocks.push({ kind: 'p', text });
  }
  return blocks;
}

function stripTags(s: string): string {
  return s
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .trim();
}

const styles = StyleSheet.create({
  page: { padding: 56, fontSize: 11, fontFamily: 'Times-Roman', lineHeight: 1.5, color: '#16202E' },
  p: { marginBottom: 10 },
  li: { marginBottom: 8, paddingLeft: 14 },
  h: { marginBottom: 10, fontSize: 13, fontFamily: 'Times-Bold' },
});

const blockStyle = (kind: 'p' | 'li' | 'h') =>
  kind === 'li' ? styles.li : kind === 'h' ? styles.h : styles.p;

/** Render the dispute letter to a PDF buffer (Section 7.8). */
export async function renderLetterPdf(letterHtml: string): Promise<Buffer> {
  const blocks = htmlToBlocks(letterHtml);
  const els = blocks.map((b, i) =>
    h(Text, { key: String(i), style: blockStyle(b.kind) }, (b.kind === 'li' ? '•  ' : '') + b.text),
  );
  const doc = h(
    Document,
    null,
    h(
      Page,
      { size: 'LETTER', style: styles.page },
      ...els,
    ),
  );
  return renderToBuffer(doc) as unknown as Promise<Buffer>;
}
