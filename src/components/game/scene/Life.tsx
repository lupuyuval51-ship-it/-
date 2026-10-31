"use client";

import { useEffect, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { RenderProfile } from "@/config/graphics";
import { mulberry32 } from "@/lib/game/util/prng";
import type { WorldModel } from "@/lib/game/world/types";
import { FLOCKS, PARTS, SCALE, type Flock, type Geo } from "./flocks";
import { flockCountFor } from "./budget";
import { LIFE_SEGMENTS, type Detail } from "./geometry";
import type { MaterialSet } from "./materials";

const makeGeo = (geo: Geo, d: Detail): THREE.BufferGeometry => {
  const s = LIFE_SEGMENTS[d];
  switch (geo) {
    case "box": return new THREE.BoxGeometry(1, 1, 1);
    case "sphere": return new THREE.SphereGeometry(0.5, s.sphere[0], s.sphere[1]);
    // lies along z with its apex at +z, i.e. backwards (the model's front is −z): a tail tapers away behind the body
    case "cone": return new THREE.ConeGeometry(0.5, 1, s.cone).rotateX(Math.PI / 2);
    case "torus": return new THREE.TorusGeometry(0.5, 0.05, s.torus[0], s.torus[1]).rotateX(Math.PI / 2);
  }
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
      {flocks.map((f, i) => (flockCountFor(f.count, profile) === 0 ? null : <FlockView key={`${f.kind}-${i}`} flock={f} index={i} world={world} profile={profile} materials={materials} />
      ))}
    </group>
  );
}

function FlockView({ flock, index, world, profile, materials }: { flock: Flock; index: number; world: WorldModel; profile: RenderProfile; materials: MaterialSet }) {
  const count = flockCountFor(flock.count, profile);
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
  const detail = profile.geometry;
  const base = world.hasVoid ? world.killY + 14 : 0;
  const meshes = useMemo(() => {
    const lit = materials.solid("#ffffff", { rough: 0.7, metal: 0.05 });
    const unlit = materials.flat("#ffffff");
    const c = new THREE.Color();
    return parts.map((p) => {
      const geo = makeGeo(p.geo, detail);
      const m = new THREE.InstancedMesh(geo, p.color === "glow" ? unlit : lit, critters.length);
      critters.forEach((cr, i) => m.setColorAt(i, c.set(p.color === "tint" ? cr.color : p.color === "glow" ? (flock.kind === "car" || flock.kind === "drone" ? cr.color : "#ffffff") : p.color)));
      if (m.instanceColor) m.instanceColor.needsUpdate = true;
      m.frustumCulled = false;
      return m;
    });
  }, [parts, critters, materials, flock.kind, detail]);
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
