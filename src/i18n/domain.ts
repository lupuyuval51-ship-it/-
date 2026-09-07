/**
 * Typed helpers over the "domain.*" dictionary (src/i18n/messages/domain.ts).
 * Usage: const { t } = useT(); roleLabel(t, "wing"); enumLabel(t, "equipment", "cones").
 */
import type { MetricKey, Role, Skill } from "@/lib/types";

export type Translate = (key: string, vars?: Record<string, string | number>) => string;

export const DOMAIN_KINDS = [
  "role", "roleIntent", "level", "ageGroup", "hand", "years", "playContext", "participants", "equipment", "fieldSize",
  "wind", "intensity", "intensityShort", "goal", "skill", "phase", "category", "offenseDefense", "windSuitability",
  "template", "sessionStatus", "source", "period", "metric", "metricUnit", "day", "dayShort",
] as const;
export type DomainKind = (typeof DOMAIN_KINDS)[number];

/** Label for any enum value: enumLabel(t, "fieldSize", "beach") → "חוף". Falls back to the raw value. */
export function enumLabel(t: Translate, kind: DomainKind, value: string | number): string {
  const key = `domain.${kind}.${value}`;
  const text = t(key);
  return text === key ? String(value) : text;
}

/** Heading for a kind ("תפקיד", "ציוד"…), used by filters and form labels. */
export function kindLabel(t: Translate, kind: Exclude<DomainKind, "intensityShort" | "metricUnit" | "dayShort" | "roleIntent" | "offenseDefense" | "windSuitability" | "template" | "sessionStatus" | "source">): string {
  return t(`domain.kind.${kind}`);
}

export function roleLabel(t: Translate, role: Role): string {
  return enumLabel(t, "role", role);
}

export function roleDescription(t: Translate, role: Role): string {
  return t(`domain.role.desc.${role}`);
}

export function skillLabel(t: Translate, skill: Skill): string {
  return enumLabel(t, "skill", skill);
}

export function metricLabel(t: Translate, key: MetricKey): string {
  return enumLabel(t, "metric", key);
}

/** Unit suffix for a metric ("%", "שנ׳", "מ׳", "נק׳", "/5" or ""). */
export function metricUnit(t: Translate, key: MetricKey): string {
  const text = t(`domain.metricUnit.${key}`);
  return text.startsWith("domain.") ? "" : text;
}

/** "72%" / "4.3 שנ׳" – value with its unit, respecting the locale's spacing conventions. */
export function metricValueWithUnit(t: Translate, key: MetricKey, value: string | number): string {
  const unit = metricUnit(t, key);
  if (!unit) return String(value);
  if (unit === "%" || unit === "/5") return `${value}${unit}`;
  return `${value} ${unit}`;
}

/** Day name for 0 (Sunday) … 6 (Saturday). */
export function dayLabel(t: Translate, day: number, short = false): string {
  return enumLabel(t, short ? "dayShort" : "day", ((day % 7) + 7) % 7);
}
