/**
 * JSON.stringify with sorted keys: equal values give equal strings regardless of key order (PostgreSQL jsonb reorders keys).
 * Everything else follows JSON.stringify, so a value and what jsonb stores for it compare equal: an object key whose value
 * is undefined, a function or a symbol is left out (inside an array it becomes null) and `toJSON` is honoured (a Date
 * becomes its ISO string).
 */
export function stableStringify(value: unknown): string {
  const v = value !== null && typeof value === "object" && typeof (value as { toJSON?: unknown }).toJSON === "function" ? (value as { toJSON(): unknown }).toJSON() : value;
  if (Array.isArray(v)) return `[${v.map((x) => (omitted(x) ? "null" : stableStringify(x))).join(",")}]`;
  if (v && typeof v === "object") {
    const o = v as Record<string, unknown>;
    return `{${Object.keys(o).filter((k) => !omitted(o[k])).sort().map((k) => `${JSON.stringify(k)}:${stableStringify(o[k])}`).join(",")}}`;
  }
  return JSON.stringify(v);
}

/** Values JSON leaves out of an object (and writes as null inside an array). */
const omitted = (x: unknown): boolean => x === undefined || typeof x === "function" || typeof x === "symbol";
