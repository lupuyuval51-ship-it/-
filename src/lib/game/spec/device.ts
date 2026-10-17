/**
 * Fits a finished game to a phone: a touch screen, a thumb joystick and short play sessions.
 *
 * Only the parts that are harder with a thumb than with a keyboard change — less walking, fewer and easier jumps,
 * no moving platforms, milder hazards, more time for timed answers, fewer things to pick up. The learning content
 * (every challenge, answer, mission and boss) stays exactly as it was. The result is re-validated with the real
 * rules; if it would not pass, the original game is returned untouched.
 */
import type { GameSpec } from "./schema";
import { validateGameSpec } from "./validate";

export type PlayDevice = "phone" | "desktop";

/** Most collectibles an area keeps on a phone (more than enough for any "collect" objective it already has). */
const PHONE_MAX_COLLECTIBLES = 8;
/** Typing on a phone is slower: timed answers get more time, never less than this. */
const PHONE_MIN_TIME_SEC = 30;
const PHONE_TIME_FACTOR = 1.5;

export interface DeviceFitResult {
  spec: GameSpec;
  changed: boolean;
  notes: string[];
}

export function fitForDevice(base: GameSpec, device: PlayDevice): DeviceFitResult {
  if (device !== "phone") return { spec: base, changed: false, notes: [] };
  const spec = structuredClone(base);
  const notes: string[] = [];

  for (const area of spec.areas) {
    // Fewer, shorter jumps: a jumping area is built with the fewest connecting pads; other large areas shrink a step.
    const target = area.layout === "terraces" ? "small" : area.size === "large" ? "medium" : area.size;
    if (target !== area.size) {
      notes.push(`area "${area.id}": ${area.size} → ${target} (less walking and jumping on a touch screen)`);
      area.size = target;
    }
    if (area.hazardLevel === "high") {
      area.hazardLevel = "low";
      notes.push(`area "${area.id}": hazards high → low`);
    }
    const needed = Math.max(0, ...spec.missions.filter((m) => m.areaId === area.id).flatMap((m) => m.objectives.map((o) => (o.type === "collect" ? o.count : 0))));
    const keep = Math.max(needed, Math.min(area.collectibles.count, PHONE_MAX_COLLECTIBLES));
    if (keep < area.collectibles.count) {
      notes.push(`area "${area.id}": ${area.collectibles.count} → ${keep} collectibles`);
      area.collectibles.count = keep;
    }
  }

  if (spec.mechanics.includes("moving_platforms")) {
    spec.mechanics = spec.mechanics.filter((m) => m !== "moving_platforms");
    notes.push("moving platforms replaced by fixed ones");
  }

  let timed = 0;
  for (const c of spec.challenges) {
    if (!c.timeLimitSec) continue;
    const longer = Math.min(180, Math.max(PHONE_MIN_TIME_SEC, Math.round(c.timeLimitSec * PHONE_TIME_FACTOR)));
    if (longer !== c.timeLimitSec) {
      c.timeLimitSec = longer;
      timed += 1;
    }
  }
  if (timed) notes.push(`${timed} timed challenge(s) got more time for typing on a phone`);

  if (!notes.length) return { spec: base, changed: false, notes: [] };
  const checked = validateGameSpec(spec, { alignGameType: base.meta.gameType });
  if (!checked.ok) return { spec: base, changed: false, notes: [`kept the original layout: the phone version did not validate (${checked.errors[0]})`] };
  // The validator recomputes some metadata; keep the producer's provenance and the plan's feature tier.
  checked.spec.meta.generator = base.meta.generator;
  if (base.meta.featureTier) checked.spec.meta.featureTier = base.meta.featureTier;
  return { spec: checked.spec, changed: true, notes };
}
