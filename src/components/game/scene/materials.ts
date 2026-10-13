import * as THREE from "three";
import type { RenderProfile } from "@/config/graphics";
import type { EnvTheme } from "@/lib/game/world/types";

/** Tiny deterministic PRNG for procedural textures. */
function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function canvas(size: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const c = document.createElement("canvas");
  c.width = c.height = size;
  return [c, c.getContext("2d")!];
}

/** Soft, tileable colour-noise "albedo" detail. */
export function makeAlbedoTexture(size: number, seed: number): THREE.CanvasTexture {
  const [c, ctx] = canvas(size);
  const r = rng(seed);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, size, size);
  const blobs = Math.round((size * size) / 380);
  for (let i = 0; i < blobs; i++) {
    const x = r() * size, y = r() * size, rad = 2 + r() * size * 0.06;
    const v = 200 + Math.floor(r() * 55);
    ctx.fillStyle = `rgba(${v},${v},${v},${0.1 + r() * 0.2})`;
    for (const ox of [-size, 0, size]) for (const oy of [-size, 0, size]) {
      ctx.beginPath();
      ctx.arc(x + ox, y + oy, rad, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  if (size >= 256) {
    ctx.strokeStyle = "rgba(0,0,0,0.12)"; // subtle panel seams
    ctx.lineWidth = Math.max(1, size / 256);
    ctx.strokeRect(0, 0, size, size);
    ctx.beginPath();
    ctx.moveTo(size / 2, 0); ctx.lineTo(size / 2, size);
    ctx.moveTo(0, size / 2); ctx.lineTo(size, size / 2);
    ctx.stroke();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

/** Height-noise converted to a normal map (Tier A "higher-quality materials"). */
export function makeNormalTexture(size: number, seed: number): THREE.CanvasTexture {
  const r = rng(seed);
  const h = new Float32Array(size * size);
  for (let pass = 0; pass < 3; pass++) {
    const cell = 4 << pass;
    const grid = new Float32Array((Math.ceil(size / cell) + 1) ** 2).map(() => r());
    const gw = Math.ceil(size / cell) + 1;
    for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
      const gx = x / cell, gy = y / cell, x0 = Math.floor(gx), y0 = Math.floor(gy), fx = gx - x0, fy = gy - y0;
      const v = (grid[y0 * gw + x0]! * (1 - fx) + grid[y0 * gw + x0 + 1]! * fx) * (1 - fy) + (grid[(y0 + 1) * gw + x0]! * (1 - fx) + grid[(y0 + 1) * gw + x0 + 1]! * fx) * fy;
      h[y * size + x]! += v / (1 << pass);
    }
  }
  const [c, ctx] = canvas(size);
  const img = ctx.createImageData(size, size);
  const at = (x: number, y: number) => h[((y + size) % size) * size + ((x + size) % size)]!;
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const dx = (at(x + 1, y) - at(x - 1, y)) * 2.2, dy = (at(x, y + 1) - at(x, y - 1)) * 2.2;
    const len = Math.hypot(dx, dy, 1);
    const i = (y * size + x) * 4;
    img.data[i] = Math.round((-dx / len * 0.5 + 0.5) * 255);
    img.data[i + 1] = Math.round((-dy / len * 0.5 + 0.5) * 255);
    img.data[i + 2] = Math.round((1 / len * 0.5 + 0.5) * 255);
    img.data[i + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

const mix = (a: string, b: string, t: number) => new THREE.Color(a).lerp(new THREE.Color(b), t);

export interface MaterialSet {
  /** Material for a box style; tiled textures scale with the box footprint. */
  surface(style: string, w?: number, d?: number): THREE.Material;
  glow(color: string, intensity?: number): THREE.Material;
  /** Unlit material that is tinted by per-instance colour (used for glowing scenery). */
  unlit(): THREE.Material;
  /** Plain coloured material without procedural textures (characters, props with clean colours). */
  solid(color: string, opts?: { rough?: number; metal?: number }): THREE.Material;
  /** Always-unlit flat colour (eyes, screens, outlines). Cheap on every tier. */
  flat(color: string): THREE.Material;
  dispose(): void;
}

export function createMaterialSet(profile: RenderProfile, theme: EnvTheme): MaterialSet {
  const owned: { dispose(): void }[] = [];
  const cache = new Map<string, THREE.Material>();
  const albedo = profile.textureSize > 0 ? makeAlbedoTexture(profile.textureSize, 7) : null;
  const normal = profile.materials === "pbr" ? makeNormalTexture(Math.min(256, profile.textureSize), 11) : null;
  if (albedo) owned.push(albedo);
  if (normal) owned.push(normal);

  const base: Record<string, { color: THREE.Color; rough: number; metal: number; emissive?: THREE.Color }> = {
    floor: { color: new THREE.Color(theme.ground), rough: 0.9, metal: 0.05 },
    floorAlt: { color: new THREE.Color(theme.groundAlt), rough: 0.9, metal: 0.05 },
    wall: { color: new THREE.Color(theme.wall), rough: 0.85, metal: 0.1 },
    platform: { color: new THREE.Color(theme.platform), rough: 0.75, metal: 0.15 },
    stationPad: { color: mix(theme.platform, theme.accent, 0.25), rough: 0.6, metal: 0.25 },
    mover: { color: mix(theme.platform, theme.accent2, 0.5), rough: 0.5, metal: 0.4, emissive: new THREE.Color(theme.accent2).multiplyScalar(0.18) },
    prop: { color: mix(theme.wall, "#ffffff", 0.1), rough: 0.9, metal: 0.05 },
    /** Scenery: near-white so each instance's own palette colour shows true (only a hint of the world's wall colour). */
    decor: { color: mix("#ffffff", theme.wall, 0.12), rough: 0.82, metal: 0.04 },
    pedestal: { color: mix(theme.wall, theme.accent, 0.2), rough: 0.5, metal: 0.4 },
    pillar: { color: mix(theme.wall, "#ffffff", 0.18), rough: 0.7, metal: 0.1 },
    bench: { color: mix(theme.wall, "#222222", 0.25), rough: 0.5, metal: 0.5 },
    table: { color: mix(theme.platform, theme.accent, 0.35), rough: 0.4, metal: 0.5 },
    gate: { color: new THREE.Color(theme.accent2), rough: 0.3, metal: 0.2, emissive: new THREE.Color(theme.accent2).multiplyScalar(0.55) },
    avatar: { color: new THREE.Color("#e4eaff"), rough: 0.45, metal: 0.25 },
  };

  function surface(style: string, w = 1, d = 1): THREE.Material {
    const def = base[style] ?? base.prop!;
    const repeat = style === "floor" || style === "floorAlt" ? 4 : 2.5;
    // Untextured (simple) materials do not depend on the box size, so every box of a style shares one material.
    const size = profile.materials === "simple" ? "" : `${Math.round(w / repeat)}x${Math.round(d / repeat)}`;
    const key = `${style}|${profile.materials}|${size}`;
    const hit = cache.get(key);
    if (hit) return hit;
    let m: THREE.Material;
    if (profile.materials === "simple") {
      m = new THREE.MeshLambertMaterial({ color: def.color, emissive: def.emissive ?? 0x000000 });
    } else {
      const std = new THREE.MeshStandardMaterial({ color: def.color, roughness: def.rough, metalness: profile.materials === "pbr" ? def.metal : def.metal * 0.3, emissive: def.emissive ?? 0x000000 });
      if (albedo) {
        const map = albedo.clone();
        map.needsUpdate = true;
        map.repeat.set(Math.max(1, Math.round(w / repeat)), Math.max(1, Math.round(d / repeat)));
        std.map = map;
        owned.push(map);
      }
      if (normal && profile.materials === "pbr" && style !== "avatar" && style !== "gate") {
        const nm = normal.clone();
        nm.needsUpdate = true;
        nm.repeat.set(Math.max(1, Math.round(w / 2)), Math.max(1, Math.round(d / 2)));
        std.normalMap = nm;
        std.normalScale.set(0.6, 0.6);
        std.roughnessMap = albedo ?? null;
        owned.push(nm);
      }
      if (style === "gate") {
        std.transparent = true;
        std.opacity = 0.7;
      }
      m = std;
    }
    owned.push(m);
    cache.set(key, m);
    return m;
  }

  function glow(color: string, intensity = 1): THREE.Material {
    const key = `glow|${color}|${intensity}`;
    const hit = cache.get(key);
    if (hit) return hit;
    const m = profile.materials === "simple"
      ? new THREE.MeshBasicMaterial({ color })
      : new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: intensity, roughness: 0.35, metalness: 0.1 });
    owned.push(m);
    cache.set(key, m);
    return m;
  }

  function unlit(): THREE.Material {
    const hit = cache.get("unlit");
    if (hit) return hit;
    const m = new THREE.MeshBasicMaterial({ color: "#ffffff", fog: true });
    owned.push(m);
    cache.set("unlit", m);
    return m;
  }

  function solid(color: string, opts: { rough?: number; metal?: number } = {}): THREE.Material {
    const key = `solid|${profile.materials}|${color}|${opts.rough ?? 0.55}|${opts.metal ?? 0.1}`;
    const hit = cache.get(key);
    if (hit) return hit;
    const m = profile.materials === "simple"
      ? new THREE.MeshLambertMaterial({ color })
      : new THREE.MeshStandardMaterial({ color, roughness: opts.rough ?? 0.55, metalness: profile.materials === "pbr" ? (opts.metal ?? 0.1) : (opts.metal ?? 0.1) * 0.3 });
    owned.push(m);
    cache.set(key, m);
    return m;
  }

  function flat(color: string): THREE.Material {
    const key = `flat|${color}`;
    const hit = cache.get(key);
    if (hit) return hit;
    const m = new THREE.MeshBasicMaterial({ color, fog: false });
    owned.push(m);
    cache.set(key, m);
    return m;
  }

  return { surface, glow, unlit, solid, flat, dispose: () => owned.forEach((o) => o.dispose()) };
}

/** Round soft sprite used for particles and glow halos. */
export function makeSoftSprite(): THREE.CanvasTexture {
  const [c, ctx] = canvas(64);
  const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, "rgba(255,255,255,1)");
  g.addColorStop(0.35, "rgba(255,255,255,0.45)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(c);
}

let softSprite: THREE.CanvasTexture | null = null;
/**
 * The one soft-sprite texture every halo, companion glow and particle layer uses (each of them used to draw its own 64x64
 * canvas and upload its own texture: one per collectible, station and character). It is tiny and shared by every world, so
 * it is never disposed, like the unit geometries in WorldView; a new renderer simply uploads it again.
 */
export function sharedSoftSprite(): THREE.CanvasTexture {
  return (softSprite ??= makeSoftSprite());
}

/** Canvas label (supports Hebrew and any script the OS fonts cover). */
export function makeLabelTexture(text: string, color: string, subtitle?: string): { texture: THREE.CanvasTexture; aspect: number } {
  const W = 512, H = subtitle ? 144 : 96;
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = "rgba(6,9,20,0.78)";
  const r = 22;
  ctx.beginPath();
  ctx.roundRect(4, 4, W - 8, H - 8, r);
  ctx.fill();
  ctx.strokeStyle = color;
  ctx.lineWidth = 4;
  ctx.stroke();
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  let size = 44;
  ctx.font = `600 ${size}px "Segoe UI", system-ui, Arial, sans-serif`;
  while (ctx.measureText(text).width > W - 40 && size > 20) {
    size -= 2;
    ctx.font = `600 ${size}px "Segoe UI", system-ui, Arial, sans-serif`;
  }
  ctx.fillText(text, W / 2, subtitle ? 50 : H / 2);
  if (subtitle) {
    ctx.fillStyle = color;
    ctx.font = `500 28px "Segoe UI", system-ui, Arial, sans-serif`;
    ctx.fillText(subtitle, W / 2, 104);
  }
  const texture = new THREE.CanvasTexture(c);
  texture.colorSpace = THREE.SRGBColorSpace;
  return { texture, aspect: W / H };
}
