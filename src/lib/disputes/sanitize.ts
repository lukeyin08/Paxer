/**
 * Allowlist sanitizer for dispute-letter HTML (Section 9 — defense in depth).
 * The letter is rendered via dangerouslySetInnerHTML and can originate from the
 * AI (or, in future, attacker-influenced source documents), so we strip anything
 * executable: only safe formatting tags survive, all attributes are removed
 * (except a safe href on <a>), and script/style/embedding blocks are deleted.
 */
const ALLOWED_TAGS = new Set([
  'p', 'br', 'strong', 'em', 'b', 'i', 'u', 'ol', 'ul', 'li',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'span', 'div', 'a', 'blockquote',
]);

const DANGEROUS_BLOCKS = /<(script|style|iframe|object|embed|noscript|template)[\s\S]*?<\/\1>/gi;

export function sanitizeLetterHtml(html: string): string {
  if (!html) return '';
  // 1) Drop dangerous element blocks (content and all).
  let out = html.replace(DANGEROUS_BLOCKS, '');
  // Also drop any orphan opening tags of those elements.
  out = out.replace(/<\/?(script|style|iframe|object|embed|noscript|template)\b[^>]*>/gi, '');

  // 2) Filter every remaining tag against the allowlist; strip all attributes
  //    (so on* handlers / style / etc. cannot survive) except a safe <a href>.
  out = out.replace(/<(\/?)([a-zA-Z][a-zA-Z0-9]*)\b([^>]*)>/g, (_m, slash: string, rawName: string, attrs: string) => {
    const name = rawName.toLowerCase();
    if (!ALLOWED_TAGS.has(name)) return ''; // drop the tag markup, keep inner text
    if (slash === '/') return `</${name}>`;
    if (name === 'a') {
      const hrefMatch = attrs.match(/\bhref\s*=\s*("([^"]*)"|'([^']*)')/i);
      const href = (hrefMatch?.[2] ?? hrefMatch?.[3] ?? '').trim();
      if (/^(https?:|mailto:)/i.test(href)) {
        return `<a href="${href.replace(/"/g, '')}" rel="noreferrer">`;
      }
      return '<a>';
    }
    return `<${name}>`;
  });

  return out;
}
