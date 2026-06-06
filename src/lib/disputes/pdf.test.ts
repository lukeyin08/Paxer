import { describe, it, expect } from 'vitest';
import { htmlToBlocks } from './pdf';

describe('htmlToBlocks', () => {
  it('extracts paragraphs and list items in order', () => {
    const b = htmlToBlocks('<p>Intro</p><ol><li>One</li><li>Two</li></ol><p>Outro</p>');
    expect(b.map((x) => x.text)).toEqual(['Intro', 'One', 'Two', 'Outro']);
    expect(b.map((x) => x.kind)).toEqual(['p', 'li', 'li', 'p']);
  });

  it('includes headings and blockquotes (sanitizer-allowed tags)', () => {
    const b = htmlToBlocks('<h2>Re: Claim</h2><p>Body</p><blockquote>Quote</blockquote>');
    expect(b.map((x) => x.text)).toEqual(['Re: Claim', 'Body', 'Quote']);
    expect(b[0]!.kind).toBe('h');
  });

  it('strips inline tags but keeps text, and skips empty blocks', () => {
    const b = htmlToBlocks('<p>Hello <strong>world</strong></p><p>  </p>');
    expect(b).toHaveLength(1);
    expect(b[0]!.text).toBe('Hello world');
  });

  it('falls back to whole-document text when no block tags match', () => {
    expect(htmlToBlocks('just text').map((x) => x.text)).toEqual(['just text']);
  });
});
