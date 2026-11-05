/**
 * zod → JSON Schema for Claude structured outputs (`output_config.format`) and strict tools.
 *
 * Structured outputs accept a subset of JSON Schema: objects (additionalProperties false,
 * required), arrays (minItems 0/1 only), strings (enum, const, a few formats), numbers, booleans,
 * null, anyOf, internal $ref. Length / range / count constraints are NOT accepted, so — like the
 * SDK's own helper — they are moved into the field description as a machine-readable
 * `Constraints: {...}` suffix. Unlike the SDK helper (which also moves `enum`/`const` into the
 * description), enum and const are kept so the model is constrained to valid values.
 *
 * Every output is re-validated against the original zod schema; the JSON Schema only steers.
 */
import { z } from 'zod';

export type JsonSchema = { [key: string]: unknown };

const SUPPORTED_STRING_FORMATS = new Set([
  'date-time',
  'time',
  'date',
  'duration',
  'email',
  'hostname',
  'uri',
  'ipv4',
  'ipv6',
  'uuid',
]);

/** Keywords moved to the description (unsupported by structured outputs). */
const DESCRIBED_KEYWORDS = [
  'minLength',
  'maxLength',
  'pattern',
  'minimum',
  'maximum',
  'exclusiveMinimum',
  'exclusiveMaximum',
  'multipleOf',
  'maxItems',
  'uniqueItems',
] as const;

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function transform(node: unknown): JsonSchema {
  if (!isRecord(node)) throw new Error('Unsupported JSON schema node');
  const out: JsonSchema = {};
  const constraints: Record<string, unknown> = {};

  if (typeof node.description === 'string') out.description = node.description;

  if (Array.isArray(node.anyOf) || Array.isArray(node.oneOf)) {
    const variants = (Array.isArray(node.anyOf) ? node.anyOf : node.oneOf) as unknown[];
    out.anyOf = variants.map(transform);
    return out;
  }

  const type = node.type;
  if (type === undefined && node.const === undefined && node.enum === undefined) {
    throw new Error('JSON schema node without type');
  }
  if (type !== undefined) out.type = type;
  if (node.const !== undefined) out.const = node.const;
  if (Array.isArray(node.enum)) out.enum = node.enum;

  if (type === 'object') {
    const props = isRecord(node.properties) ? node.properties : {};
    out.properties = Object.fromEntries(Object.entries(props).map(([k, v]) => [k, transform(v)]));
    out.required = Array.isArray(node.required) ? node.required : [];
    out.additionalProperties = false;
  } else if (type === 'array') {
    if (node.items !== undefined) out.items = transform(node.items);
    if (typeof node.minItems === 'number') {
      if (node.minItems <= 1) out.minItems = node.minItems;
      else {
        out.minItems = 1;
        constraints.minItems = node.minItems;
      }
    }
  } else if (type === 'string') {
    if (typeof node.format === 'string' && SUPPORTED_STRING_FORMATS.has(node.format)) out.format = node.format;
    else if (typeof node.format === 'string') constraints.format = node.format;
  }

  for (const key of DESCRIBED_KEYWORDS) {
    const value = node[key];
    if (value === undefined) continue;
    // zod emits ±MAX_SAFE_INTEGER bounds for .int(); they carry no information.
    if (
      (key === 'minimum' || key === 'maximum') && typeof value === 'number' &&
      Math.abs(value) >= Number.MAX_SAFE_INTEGER
    ) continue;
    constraints[key] = value;
  }

  if (Object.keys(constraints).length > 0) {
    const suffix = `Constraints: ${JSON.stringify(constraints)}`;
    out.description = typeof out.description === 'string' ? `${out.description}\n${suffix}` : suffix;
  }
  return out;
}

/** Converts a zod schema (output side) into a structured-outputs compatible JSON Schema. */
export function toStrictJsonSchema(schema: z.ZodType): JsonSchema {
  const raw = z.toJSONSchema(schema, {
    target: 'draft-2020-12',
    io: 'output',
    unrepresentable: 'throw',
    reused: 'inline',
  });
  return transform(raw);
}

/** Parses the `Constraints: {...}` suffix written by `toStrictJsonSchema` (used by the fake server tests). */
export function readConstraints(description: unknown): Record<string, unknown> {
  if (typeof description !== 'string') return {};
  const idx = description.lastIndexOf('Constraints: ');
  if (idx < 0) return {};
  try {
    const parsed: unknown = JSON.parse(description.slice(idx + 'Constraints: '.length));
    return isRecord(parsed) ? parsed : {};
  } catch {
    return {};
  }
}
