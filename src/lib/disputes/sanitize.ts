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
  //    The attribute group consumes quoted strings as units, so a '>' inside a
  //    quoted attribute value doesn't terminate the tag early and leak residue.
  out = out.replace(
    /<(\/?)([a-zA-Z][a-zA-Z0-9]*)((?:"[^"]*"|'[^']*'|[^>])*)>/g,
    (_m, slash: string, rawName: string, attrs: string) => {
    const name = rawName.toLowerCase();
    if (!ALLOWED_TAGS.has(name)) return ''; // drop the tag markup, keep inner text
    if (slash === '/') return `</${name}>`;
    if (name === 'a') {
      const hrefMatch = attrs.match(/\bhref\s*=\s*("([^"]*)"|'([^']*)')/i);
      const href = (hrefMatch?.[2] ?? hrefMatch?.[3] ?? '').trim();
      if (/^(https?:|mailto:)/i.test(href)) {
        // Escape HTML metacharacters so the value can't break out of the
        // attribute/tag context.
        const safeHref = href
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;');
        return `<a href="${safeHref}" rel="noreferrer">`;
      }
      return '<a>';
    }
    return `<${name}>`;
  });

  return out;
}
