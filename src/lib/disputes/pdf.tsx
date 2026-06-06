import { createElement as h } from 'react';
import { Document, Page, View, Text, StyleSheet, renderToBuffer } from '@react-pdf/renderer';

interface Block {
  kind: 'p' | 'li';
  text: string;
}

/** Convert the dispute letter HTML into ordered text blocks for PDF rendering. */
export function htmlToBlocks(html: string): Block[] {
  const blocks: Block[] = [];
  // Match <p>...</p> and <li>...</li> in document order.
  const re = /<(p|li)\b[^>]*>([\s\S]*?)<\/\1>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    const kind = m[1]!.toLowerCase() === 'li' ? 'li' : 'p';
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
  footer: { marginTop: 24, fontSize: 8, color: '#888', borderTop: '1 solid #ccc', paddingTop: 8 },
});

const DISCLAIMER =
  'Paxer is a prototype. This letter is a draft for the patient to review before any use. It is not legal advice.';

/** Render the dispute letter to a PDF buffer (Section 7.8). */
export async function renderLetterPdf(letterHtml: string): Promise<Buffer> {
  const blocks = htmlToBlocks(letterHtml);
  const els = blocks.map((b, i) =>
    h(
      Text,
      { key: String(i), style: b.kind === 'li' ? styles.li : styles.p },
      (b.kind === 'li' ? '•  ' : '') + b.text,
    ),
  );
  const doc = h(
    Document,
    null,
    h(
      Page,
      { size: 'LETTER', style: styles.page },
      ...els,
      h(View, { style: styles.footer }, h(Text, null, DISCLAIMER)),
    ),
  );
  return renderToBuffer(doc) as unknown as Promise<Buffer>;
}
