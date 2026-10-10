import { hashSeed, mulberry32 } from "../util/prng";
import type { GameSpec } from "../spec/schema";

/** The parts of a spec the world builder reads; satisfied by both the full and the public spec. */
export type WorldSpec = Pick<GameSpec, "meta" | "theme" | "areas" | "mechanics" | "challenges">;
import { makeCtx } from "./helpers";
import { LAYOUT_BUILDERS } from "./layouts";
import { themeFor } from "./theme";
import type { WorldModel } from "./types";

/** Build the world for one area of a validated spec. Pure and deterministic for a given spec + area. */
export function buildWorld(spec: WorldSpec, areaId: string): WorldModel {
  const area = spec.areas.find((a) => a.id === areaId);
  if (!area) throw new Error(`unknown area ${areaId}`);
  const seed = hashSeed(`${spec.meta.title}|${spec.meta.subject}|${area.id}|${area.layout}`);
  const theme = themeFor(spec.theme.environment, spec.theme.timeOfDay, spec.theme.palette);
  const ctx = makeCtx(spec, area, mulberry32(seed), theme);
  const result = LAYOUT_BUILDERS[area.layout](ctx);
  return { areaId, layout: area.layout, environment: spec.theme.environment, seed, theme, ...result };
}
