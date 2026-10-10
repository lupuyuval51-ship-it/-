/**
 * Render profiles per graphics tier. These are REAL rendering differences consumed by the 3D runtime:
 * shadow quality, material model, light count, texture detail, scenery density, particle budget, pixel ratio.
 *
 * The server decides which tier a player gets (see plans.ts) and sends the resulting profile with the play
 * session; the runtime applies the numbers it was given and never derives quality from a tier label alone.
 */
import type { GraphicsTier } from "./plans";

export interface RenderProfile {
  tier: GraphicsTier;
  /** Cap on devicePixelRatio. */
  pixelRatioMax: number;
  antialias: boolean;
  toneMapping: "aces" | "none";
  exposure: number;
  shadows: {
    enabled: boolean;
    /** "soft" = PCFSoftShadowMap, "basic" = BasicShadowMap (cheap, hard edges), "none" = disabled. */
    type: "soft" | "basic" | "none";
    mapSize: number;
    /** How many lights cast shadows. */
    casters: number;
  };
  /** pbr = MeshStandardMaterial with generated normal/roughness detail; standard = flat Standard; simple = Lambert. */
  materials: "pbr" | "standard" | "simple";
  /** Resolution of generated procedural textures; 0 disables textures. */
  textureSize: 0 | 64 | 128 | 512;
  /** Number of point lights adding colored accents. */
  accentLights: number;
  /** 0..1 multiplier of scenery (props, foliage, skyline). */
  environmentDetail: number;
  sky: "dome" | "gradient" | "flat";
  fog: boolean;
  particles: { ambient: number; burst: number; trails: boolean };
  /** Soft glow halos (additive sprites) around emissive objects. */
  glow: boolean;
  /** Frame-time guard may lower the pixel ratio when FPS is poor (never raises quality above the tier). */
  adaptiveResolution: boolean;
}

export const RENDER_PROFILES: Readonly<Record<GraphicsTier, RenderProfile>> = Object.freeze({
  A: {
    tier: "A",
    pixelRatioMax: 2,
    antialias: true,
    toneMapping: "aces",
    exposure: 1.1,
    shadows: { enabled: true, type: "soft", mapSize: 2048, casters: 2 },
    materials: "pbr",
    textureSize: 512,
    accentLights: 4,
    environmentDetail: 1,
    sky: "dome",
    fog: true,
    particles: { ambient: 500, burst: 80, trails: true },
    glow: true,
    adaptiveResolution: true,
  },
  B: {
    tier: "B",
    pixelRatioMax: 1.5,
    antialias: true,
    toneMapping: "none",
    exposure: 1,
    shadows: { enabled: true, type: "basic", mapSize: 512, casters: 1 },
    materials: "standard",
    textureSize: 64,
    accentLights: 1,
    environmentDetail: 0.5,
    sky: "gradient",
    fog: true,
    particles: { ambient: 120, burst: 24, trails: false },
    glow: false,
    adaptiveResolution: true,
  },
  C: {
    tier: "C",
    pixelRatioMax: 1,
    antialias: false,
    toneMapping: "none",
    exposure: 1,
    shadows: { enabled: false, type: "none", mapSize: 0, casters: 0 },
    materials: "simple",
    textureSize: 0,
    accentLights: 0,
    environmentDetail: 0.2,
    sky: "flat",
    fog: false,
    particles: { ambient: 24, burst: 8, trails: false },
    glow: false,
    adaptiveResolution: true,
  },
});

export function renderProfileFor(tier: GraphicsTier): RenderProfile {
  return RENDER_PROFILES[tier];
}
