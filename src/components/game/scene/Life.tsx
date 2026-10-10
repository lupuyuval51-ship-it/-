"use client";

import { useEffect, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { RenderProfile } from "@/config/graphics";
import type { Environment } from "@/lib/game/spec/constants";
import { mulberry32 } from "@/lib/game/util/prng";
import type { WorldModel } from "@/lib/game/world/types";
import type { MaterialSet } from "./materials";

type Kind = "car" | "bird" | "fish" | "drone" | "balloon";

interface Flock {
  kind: Kind;
  count: number;
  /** Orbit radius, flight height and angular speed ranges. */
  r: [number, number];
  h: [number, number];
  speed: [number, number];
  colors: string[];
  /** `area`: every critter circles its own spot inside the playable area (fish); otherwise they orbit the area's centre. */
  anchor?: "area";
}

const FLOCKS: Partial<Record<Environment, Flock[]>> = {
  "neon-city": [{ kind: "car", count: 16, r: [55, 150], h: [22, 60], speed: [0.05, 0.13], colors: ["#22e6ff", "#ff4fd8", "#ffd23f", "#a3ff4f"] }],
  forest: [{ kind: "bird", count: 8, r: [25, 75], h: [16, 30], speed: [0.1, 0.22], colors: ["#ffffff", "#f3d9a4", "#c9d7ee", "#e8c4c4"] }],
  "desert-ruins": [{ kind: "bird", count: 5, r: [40, 95], h: [30, 48], speed: [0.05, 0.1], colors: ["#3b2f25", "#5a4636"] }],
  "ocean-floor": [{ kind: "fish", count: 28, r: [5, 22], h: [1.8, 7], speed: [0.25, 0.6], colors: ["#ffb347", "#ff7b9c", "#7df9ff", "#ffe066", "#c77bff"], anchor: "area" }],
  "sky-islands": [
    { kind: "bird", count: 7, r: [25, 80], h: [14, 32], speed: [0.1, 0.2], colors: ["#ffffff", "#fff4c2"] },
    { kind: "balloon", count: 3, r: [60, 130], h: [20, 55], speed: [0.012, 0.025], colors: ["#ff7ab6", "#ffd166", "#7ad7ff"] },
  ],
  castle: [{ kind: "bird", count: 7, r: [18, 60], h: [20, 40], speed: [0.14, 0.26], colors: ["#1d1d27", "#2a2a36"] }],
  laboratory: [{ kind: "drone", count: 5, r: [14, 42], h: [7, 15], speed: [0.1, 0.22], colors: ["#2f9bff", "#2fd98a", "#ffffff"] }],
  "space-station": [{ kind: "drone", count: 5, r: [28, 75], h: [9, 32], speed: [0.04, 0.1], colors: ["#35f0ff", "#ff8a3d", "#ffffff"] }],
};

type Geo = "box" | "sphere" | "cone" | "torus";
interface Part {
  geo: Geo;
  size: [number, number, number];
  pos: [number, number, number];
  /** Where the part rotates (wings flap about the shoulder), relative to the critter. */
  pivot?: [number, number, number];
  /** Rotation about local z / y, as a function of time and the critter's own phase. */
  flap?: (t: number, ph: number) => number;
  swing?: (t: number, ph: number) => number;
  /** `tint`: the critter's own colour; `glow`: bright and unlit; otherwise a fixed colour. */
  color: "tint" | "glow" | string;
}

const PARTS: Record<Kind, Part[]> = {
  bird: [
    { geo: "sphere", size: [0.34, 0.26, 0.85], pos: [0, 0, 0], color: "tint" },
    { geo: "box", size: [1.15, 0.05, 0.5], pos: [-0.62, 0, 0], pivot: [-0.2, 0, 0], flap: (t, p) => Math.sin(t * 9 + p) * 0.55 + 0.1, color: "tint" },
    { geo: "box", size: [1.15, 0.05, 0.5], pos: [0.62, 0, 0], pivot: [0.2, 0, 0], flap: (t, p) => -(Math.sin(t * 9 + p) * 0.55 + 0.1), color: "tint" },
  ],
  fish: [
    { geo: "sphere", size: [0.34, 0.4, 1.0], pos: [0, 0, 0], color: "tint" },
    { geo: "cone", size: [0.34, 0.5, 0.34], pos: [0, 0, 0.62], pivot: [0, 0, 0.45], swing: (t, p) => Math.sin(t * 7 + p) * 0.5, color: "tint" },
  ],
  car: [
    { geo: "box", size: [1.5, 0.5, 3.2], pos: [0, 0, 0], color: "#1a2146" },
    { geo: "box", size: [1.1, 0.4, 1.4], pos: [0, 0.4, 0.2], color: "#2a3470" },
    { geo: "box", size: [1.56, 0.12, 3.26], pos: [0, -0.18, 0], color: "glow" },
    { geo: "box", size: [1.2, 0.14, 0.12], pos: [0, 0.02, -1.62], color: "#ffffff" },
  ],
  drone: [
    { geo: "sphere", size: [0.7, 0.55, 0.7], pos: [0, 0, 0], color: "#e6ecf7" },
    { geo: "torus", size: [0.95, 0.95, 0.95], pos: [0, 0, 0], color: "glow" },
    { geo: "sphere", size: [0.2, 0.2, 0.2], pos: [0, 0.05, -0.34], color: "glow" },
  ],
  balloon: [
    { geo: "sphere", size: [4.2, 5.0, 4.2], pos: [0, 0, 0], color: "tint" },
    { geo: "box", size: [0.9, 0.7, 0.9], pos: [0, -3.9, 0], color: "#8a6a44" },
    { geo: "cone", size: [3.0, 0.8, 3.0], pos: [0, -2.7, 0], color: "tint" },
  ],
};

/** Overall size multiplier per kind: far-away critters need to read as more than a speck. */
const SCALE: Record<Kind, number> = { car: 2.4, bird: 1.7, fish: 1.3, drone: 1.6, balloon: 1 };

const GEOS: Record<Geo, () => THREE.BufferGeometry> = {
  box: () => new THREE.BoxGeometry(1, 1, 1),
  sphere: () => new THREE.SphereGeometry(0.5, 12, 8),
  cone: () => new THREE.ConeGeometry(0.5, 1, 8).rotateX(Math.PI / 2), // points along −z → the tail trails behind a −z-facing body
  torus: () => new THREE.TorusGeometry(0.5, 0.05, 6, 20).rotateX(Math.PI / 2),
};

interface Critter {
  cx: number;
  cz: number;
  r: number;
  h: number;
  w: number;
  phase: number;
  color: string;
  bob: number;
}

/**
 * Ambient life that makes a world feel inhabited: birds, hover-cars, fish, drones, balloons. Pure decoration drawn
 * with a few instanced meshes and animated on the CPU (a few dozen matrices per frame). The count scales with the
 * graphics tier's environment detail, and none of it affects the simulation or the score.
 */
export function Life({ world, profile, materials }: { world: WorldModel; profile: RenderProfile; materials: MaterialSet }) {
  const flocks = FLOCKS[world.environment];
  if (!flocks) return null;
  return (
    <group>
      {flocks.map((f, i) => (
        <FlockView key={`${f.kind}-${i}`} flock={f} index={i} world={world} profile={profile} materials={materials} />
      ))}
    </group>
  );
}

function FlockView({ flock, index, world, profile, materials }: { flock: Flock; index: number; world: WorldModel; profile: RenderProfile; materials: MaterialSet }) {
  const count = Math.max(1, Math.round(flock.count * Math.min(1, 0.25 + profile.environmentDetail * 0.75)));
  const critters = useMemo<Critter[]>(() => {
    const rnd = mulberry32(world.seed * 31 + index * 977 + 7);
    const b = world.bounds;
    const lerp = (a: [number, number]) => a[0] + rnd() * (a[1] - a[0]);
    return Array.from({ length: count }, () => {
      const area = flock.anchor === "area";
      return {
        cx: area ? b.x0 + 6 + rnd() * Math.max(1, b.x1 - b.x0 - 12) : (b.x0 + b.x1) / 2,
        cz: area ? b.z0 + 6 + rnd() * Math.max(1, b.z1 - b.z0 - 12) : (b.z0 + b.z1) / 2,
        r: lerp(flock.r),
        h: lerp(flock.h),
        w: lerp(flock.speed) * (rnd() < 0.5 ? -1 : 1),
        phase: rnd() * Math.PI * 2,
        color: flock.colors[Math.floor(rnd() * flock.colors.length)]!,
        bob: rnd() * 6,
      };
    });
  }, [flock, index, world, count]);

  const parts = PARTS[flock.kind];
  const base = world.hasVoid ? world.killY + 14 : 0;
  const meshes = useMemo(() => {
    const lit = materials.solid("#ffffff", { rough: 0.7, metal: 0.05 });
    const unlit = materials.flat("#ffffff");
    const c = new THREE.Color();
    return parts.map((p) => {
      const geo = GEOS[p.geo]();
      const m = new THREE.InstancedMesh(geo, p.color === "glow" ? unlit : lit, critters.length);
      critters.forEach((cr, i) => m.setColorAt(i, c.set(p.color === "tint" ? cr.color : p.color === "glow" ? (flock.kind === "car" || flock.kind === "drone" ? cr.color : "#ffffff") : p.color)));
      if (m.instanceColor) m.instanceColor.needsUpdate = true;
      m.frustumCulled = false;
      return m;
    });
  }, [parts, critters, materials, flock.kind]);
  useEffect(() => () => meshes.forEach((m) => { m.geometry.dispose(); m.dispose(); }), [meshes]);

  const tmp = useMemo(() => ({ root: new THREE.Matrix4(), part: new THREE.Matrix4(), local: new THREE.Matrix4(), out: new THREE.Matrix4(), q: new THREE.Quaternion(), e: new THREE.Euler(), v: new THREE.Vector3(), s: new THREE.Vector3(), pv: new THREE.Vector3() }), []);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    const { root, part, local, out, q, e, v, s, pv } = tmp;
    critters.forEach((c, i) => {
      const a = c.phase + c.w * t;
      const dir = Math.sign(c.w) || 1;
      const x = c.cx + Math.cos(a) * c.r;
      const z = c.cz + Math.sin(a) * c.r;
      let y = base + c.h + Math.sin(t * 0.8 + c.bob) * (flock.kind === "balloon" ? 1.5 : flock.kind === "car" ? 0 : 0.6);
      if (flock.kind === "fish") y = base + c.h + Math.sin(t * 1.3 + c.bob) * 0.5;
      // heading: tangent of the circle; the model's front is −z
      const heading = dir > 0 ? Math.PI - a : -a;
      const roll = flock.kind === "bird" ? -dir * 0.35 : 0;
      root.compose(v.set(x, y, z), q.setFromEuler(e.set(0, heading, roll, "YXZ")), s.setScalar(SCALE[flock.kind]));
      parts.forEach((p, k) => {
        const swing = p.swing?.(t, c.phase) ?? 0;
        const flap = p.flap?.(t, c.phase) ?? 0;
        pv.set(p.pivot?.[0] ?? 0, p.pivot?.[1] ?? 0, p.pivot?.[2] ?? 0);
        // rotate about the pivot: T(pivot) · R · T(pos − pivot) · S
        part.compose(pv, q.setFromEuler(e.set(0, swing, flap)), s.set(1, 1, 1));
        part.multiply(local.compose(v.set(p.pos[0] - pv.x, p.pos[1] - pv.y, p.pos[2] - pv.z), q.identity(), s.set(p.size[0], p.size[1], p.size[2])));
        meshes[k]!.setMatrixAt(i, out.multiplyMatrices(root, part));
      });
    });
    meshes.forEach((m) => { m.instanceMatrix.needsUpdate = true; });
  });

  return (
    <group>
      {meshes.map((m, i) => (
        <primitive key={i} object={m} />
      ))}
    </group>
  );
}
