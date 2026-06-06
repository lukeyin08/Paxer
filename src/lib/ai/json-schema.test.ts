import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import { zodToJsonSchema } from './json-schema';
import { documentExtractionSchema } from './schemas';

describe('zodToJsonSchema', () => {
  it('marks all object keys required and disallows extra props', () => {
    const s = zodToJsonSchema(z.object({ a: z.string(), b: z.number().nullable() })) as Record<
      string,
      unknown
    >;
    expect(s.type).toBe('object');
    expect(s.additionalProperties).toBe(false);
    expect(s.required).toEqual(['a', 'b']);
  });

  it('represents nullable as anyOf with null', () => {
    const s = zodToJsonSchema(z.string().nullable()) as { anyOf: unknown[] };
    expect(s.anyOf).toEqual([{ type: 'string' }, { type: 'null' }]);
  });

  it('converts the real extraction schema without throwing', () => {
    const s = zodToJsonSchema(documentExtractionSchema) as Record<string, unknown>;
    expect(s.type).toBe('object');
    const props = s.properties as Record<string, unknown>;
    expect(Object.keys(props)).toContain('lineItems');
    expect((s.required as string[]).length).toBeGreaterThan(5);
  });
});
