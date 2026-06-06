import { describe, it, expect } from 'vitest';
import { sanitizeLetterHtml } from './sanitize';

describe('sanitizeLetterHtml', () => {
  it('removes script blocks and their content', () => {
    const out = sanitizeLetterHtml('<p>Hi</p><script>alert(1)</script>');
    expect(out).not.toContain('alert');
    expect(out).not.toContain('<script');
    expect(out).toContain('<p>Hi</p>');
  });

  it('strips event-handler attributes', () => {
    const out = sanitizeLetterHtml('<p onclick="steal()">x</p><img src=x onerror="alert(1)">');
    expect(out).not.toContain('onclick');
    expect(out).not.toContain('onerror');
    expect(out).toBe('<p>x</p>'); // img is not allowlisted -> dropped, text kept
  });

  it('keeps safe formatting tags and a safe href', () => {
    const out = sanitizeLetterHtml('<ol><li><strong>A</strong></li></ol><a href="https://x.com">link</a>');
    expect(out).toContain('<ol><li><strong>A</strong></li></ol>');
    expect(out).toContain('href="https://x.com"');
  });

  it('drops javascript: hrefs', () => {
    const out = sanitizeLetterHtml('<a href="javascript:alert(1)">x</a>');
    expect(out).toBe('<a>x</a>');
  });

  it('drops disallowed tags but keeps their text', () => {
    expect(sanitizeLetterHtml('<iframe src="x"></iframe><b>keep</b>')).toBe('<b>keep</b>');
  });
});
