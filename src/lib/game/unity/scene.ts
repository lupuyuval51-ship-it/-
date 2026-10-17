/**
 * Unity scene export. A Unity client renders the SAME world the browser simulates (the world model is deterministic
 * from the spec), so scoring, rewards and answer keys stay on the server and the Unity build never sees them.
 *
 * The export contains geometry, placements, theme colours and the director's render-only directives. It is built from
 * the public view of the spec: no challenge prompts, options, answers, hints or explanations.
 */
import type { PublicSpec } from "../spec/public";
import { buildWorld } from "../world/build";
import type { WorldModel } from "../world/types";
import { directScene, type SceneDirectives } from "./director";

export const UNITY_SCENE_SCHEMA = "levelup.unity-scene" as const;
export const UNITY_SCENE_VERSION = 1 as const;

const r2 = (n: number) => Math.round(n * 100) / 100;

export interface UnityScene {
  schema: typeof UNITY_SCENE_SCHEMA;
  version: typeof UNITY_SCENE_VERSION;
  title: string;
  areaId: string;
  layout: WorldModel["layout"];
  environment: WorldModel["environment"];
  timeOfDay: PublicSpec["theme"]["timeOfDay"];
  seed: number;
  rtl: boolean;
  theme: WorldModel["theme"];
  bounds: WorldModel["bounds"];
  killY: number;
  hasVoid: boolean;
  spawn: WorldModel["spawn"];
  boxes: WorldModel["boxes"];
  decor: WorldModel["decor"];
  stations: WorldModel["stations"];
  npcs: WorldModel["npcs"];
  collectibles: WorldModel["collectibles"];
  checkpoints: WorldModel["checkpoints"];
  hazards: WorldModel["hazards"];
  gates: WorldModel["gates"];
  portal: WorldModel["portal"];
  director: SceneDirectives;
}

function round<T>(v: T): T {
  if (typeof v === "number") return r2(v) as T;
  if (Array.isArray(v)) return v.map(round) as T;
  if (v && typeof v === "object") return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, round(x)])) as T;
  return v;
}

/** Build the Unity scene description for one area. Pure and deterministic. */
export function buildUnityScene(spec: PublicSpec, areaId: string): UnityScene {
  const world = buildWorld(spec, areaId);
  const director = directScene(spec, world);
  const scene: UnityScene = {
    schema: UNITY_SCENE_SCHEMA,
    version: UNITY_SCENE_VERSION,
    title: spec.meta.title,
    areaId,
    layout: world.layout,
    environment: world.environment,
    timeOfDay: spec.theme.timeOfDay,
    seed: world.seed,
    rtl: spec.meta.language === "he" || spec.meta.language === "ar",
    theme: world.theme,
    bounds: world.bounds,
    killY: world.killY,
    hasVoid: world.hasVoid,
    spawn: world.spawn,
    boxes: world.boxes,
    decor: world.decor,
    stations: world.stations,
    npcs: world.npcs,
    collectibles: world.collectibles,
    checkpoints: world.checkpoints,
    hazards: world.hazards,
    gates: world.gates,
    portal: world.portal,
    director,
  };
  return round(scene);
}
