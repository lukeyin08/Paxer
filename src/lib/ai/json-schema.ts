import { z } from 'zod';

/**
 * Minimal Zod -> JSON Schema converter producing Anthropic structured-output
 * compatible schemas (Section 8): every object sets additionalProperties:false
 * and lists all keys in `required` (our schemas use .nullable() rather than
 * .optional(), so absence is modeled as null, not as a missing key). Supports
 * the subset we use: object, array, string, number, boolean, enum, nullable.
 */
type JsonSchema = Record<string, unknown>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function defOf(schema: z.ZodTypeAny): any {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (schema as any)._def;
}

export function zodToJsonSchema(schema: z.ZodTypeAny): JsonSchema {
  const def = defOf(schema);
  const typeName: string = def.typeName;

  switch (typeName) {
    case 'ZodObject': {
      const shape = def.shape();
      const properties: Record<string, JsonSchema> = {};
      const required: string[] = [];
      for (const key of Object.keys(shape)) {
        const field = shape[key] as z.ZodTypeAny;
        properties[key] = zodToJsonSchema(field);
        // `.optional()` fields are genuinely omittable — keep them OUT of
        // `required` (and they carry no null-union, which keeps the schema under
        // Anthropic's structured-output cap of 16 union-typed parameters).
        if (defOf(field).typeName !== 'ZodOptional') required.push(key);
      }
      return { type: 'object', properties, required, additionalProperties: false };
    }
    case 'ZodArray':
      return { type: 'array', items: zodToJsonSchema(def.type as z.ZodTypeAny) };
    case 'ZodString':
      return { type: 'string' };
    case 'ZodNumber':
      return { type: 'number' };
    case 'ZodBoolean':
      return { type: 'boolean' };
    case 'ZodEnum':
      return { type: 'string', enum: def.values as string[] };
    case 'ZodNullable':
      return { anyOf: [zodToJsonSchema(def.innerType as z.ZodTypeAny), { type: 'null' }] };
    case 'ZodOptional':
      return zodToJsonSchema(def.innerType as z.ZodTypeAny);
    case 'ZodDefault':
      return zodToJsonSchema(def.innerType as z.ZodTypeAny);
    default:
      throw new Error(`zodToJsonSchema: unsupported Zod type ${typeName}`);
  }
}
