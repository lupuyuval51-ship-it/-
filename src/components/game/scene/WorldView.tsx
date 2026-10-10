"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { RenderProfile } from "@/config/graphics";
import type { GameRuntime } from "@/lib/game/engine/runtime";
import type { WorldBox, WorldModel } from "@/lib/game/world/types";
import { DECOR_PARTS, decorColor, type Geo } from "./decor";
import type { MaterialSet } from "./materials";

const BOX = new THREE.BoxGeometry(1, 1, 1);
const GEOS: Record<Geo, THREE.BufferGeometry> = {
  box: BOX,
  cyl: new THREE.CylinderGeometry(1, 1, 1, 10),
  cone: new THREE.ConeGeometry(1, 1, 10),
  sphere: new THREE.SphereGeometry(1, 12, 10),
  oct: new THREE.OctahedronGeometry(1, 0),
  torus: new THREE.TorusGeometry(1, 0.14, 8, 20),
};

function BoxMesh({ box, materials, profile, runtime }: { box: WorldBox; materials: MaterialSet; profile: RenderProfile; runtime: GameRuntime }) {
  const ref = useRef<THREE.Mesh>(null);
  const w = box.x1 - box.x0, h = box.y1 - box.y0, d = box.z1 - box.z0;
  const isGate = box.kind === "gate";
  const isFloor = box.kind === "floor";
  const mat = useMemo(() => materials.surface(box.style, w, d), [materials, box.style, w, d]);
  const live = useMemo(() => (box.mover ? runtime.sim.boxes().find((b) => b.id === box.id) : undefined), [box, runtime]);
  const open = useRef(0);

  useFrame((_, dt) => {
    const m = ref.current;
    if (!m) return;
    if (live) {
      m.position.set((live.x0 + live.x1) / 2, (live.y0 + live.y1) / 2, (live.z0 + live.z1) / 2);
    }
    if (isGate && box.gateId) {
      const target = runtime.gateOpen(box.gateId) ? 1 : 0;
      open.current += (target - open.current) * Math.min(1, dt * 5);
      m.scale.y = Math.max(0.001, h * (1 - open.current));
      m.position.y = box.y0 + (m.scale.y) / 2;
      m.visible = open.current < 0.98;
    }
  });

  if (!box.visible) return null;
  return (
    <mesh
      ref={ref}
      position={[(box.x0 + box.x1) / 2, (box.y0 + box.y1) / 2, (box.z0 + box.z1) / 2]}
      scale={[w, h, d]}
      geometry={BOX}
      material={mat}
      castShadow={profile.shadows.enabled && !isFloor && !isGate}
      receiveShadow={profile.shadows.enabled}
    />
  );
}

/** Instanced scenery. Items beyond the tier's detail budget are not drawn at all (solid props always are). */
function Decor({ world, profile, materials }: { world: WorldModel; profile: RenderProfile; materials: MaterialSet }) {
  const groups = useMemo(() => {
    const byKind = new Map<string, typeof world.decor>();
    for (const item of world.decor) {
      if (!item.solid && item.rank >= profile.environmentDetail) continue;
      byKind.set(item.kind, [...(byKind.get(item.kind) ?? []), item]);
    }
    return [...byKind.entries()];
  }, [world, profile.environmentDetail]);

  return (
    <group>
      {groups.map(([kind, items]) =>
        DECOR_PARTS[kind as keyof typeof DECOR_PARTS].map((part, pi) => (
          <DecorInstances key={`${kind}-${pi}`} items={items} part={part} world={world} profile={profile} materials={materials} />
        )),
      )}
    </group>
  );
}

function DecorInstances({ items, part, world, profile, materials }: { items: WorldModel["decor"]; part: (typeof DECOR_PARTS)[keyof typeof DECOR_PARTS][number]; world: WorldModel; profile: RenderProfile; materials: MaterialSet }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  useEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const m = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(), p = new THREE.Vector3(), c = new THREE.Color();
    const e = new THREE.Euler();
    items.forEach((it, i) => {
      e.set(0, it.rot, 0);
      q.setFromEuler(e);
      // part offset is rotated with the item, then scaled
      p.set(part.pos[0] * it.scale, part.pos[1] * it.scale, part.pos[2] * it.scale).applyQuaternion(q).add(new THREE.Vector3(it.x, it.y, it.z));
      s.set(part.size[0] * it.scale, part.size[1] * it.scale, part.size[2] * it.scale);
      m.compose(p, q, s);
      mesh.setMatrixAt(i, m);
      mesh.setColorAt(i, c.set(decorColor(part.color, it.tint, world.theme.accent, world.theme.accent2)));
    });
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, [items, part, world.theme]);

  const mat = useMemo(() => {
    if (part.emissive) return materials.unlit();
    return materials.surface("prop", 2, 2);
  }, [materials, part.emissive]);
  const solid = items.some((i) => i.solid);
  return <instancedMesh ref={ref} args={[GEOS[part.geo], mat as THREE.Material, items.length]} castShadow={profile.shadows.enabled && solid} receiveShadow={false} frustumCulled={false} />;
}

function Hazards({ world }: { world: WorldModel }) {
  const mats = useRef<THREE.MeshBasicMaterial[]>([]);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    mats.current.forEach((m, i) => m?.color.setHSL(0.03 + 0.02 * Math.sin(t * 3 + i), 1, 0.5 + 0.08 * Math.sin(t * 5 + i)));
  });
  return (
    <group>
      {world.hazards.map((h, i) => (
        <mesh key={h.id} position={[(h.x0 + h.x1) / 2, h.y + 0.04, (h.z0 + h.z1) / 2]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[h.x1 - h.x0, h.z1 - h.z0]} />
          <meshBasicMaterial ref={(m) => { if (m) mats.current[i] = m; }} color="#ff4a1c" />
        </mesh>
      ))}
    </group>
  );
}

/** A faint grid on the ground gives a sense of scale and motion on every tier (a single draw call). */
function GroundGrid({ world }: { world: WorldModel }) {
  const floor = world.boxes.find((b) => b.id === "floor" || b.kind === "floor");
  const grid = useMemo(() => {
    if (!floor || world.hasVoid) return null;
    const w = floor.x1 - floor.x0, d = floor.z1 - floor.z0;
    const g = new THREE.GridHelper(Math.max(w, d), Math.round(Math.max(w, d) / 2), world.theme.accent, world.theme.accent);
    (g.material as THREE.Material).transparent = true;
    (g.material as THREE.Material).opacity = 0.22;
    g.position.set((floor.x0 + floor.x1) / 2, floor.y1 + 0.015, (floor.z0 + floor.z1) / 2);
    return g;
  }, [floor, world]);
  useEffect(() => () => { grid?.geometry.dispose(); (grid?.material as THREE.Material | undefined)?.dispose(); }, [grid]);
  return grid ? <primitive object={grid} /> : null;
}

export function WorldView({ runtime, profile, materials }: { runtime: GameRuntime; profile: RenderProfile; materials: MaterialSet }) {
  const world = runtime.world;
  return (
    <group>
      {world.boxes.map((b) => (
        <BoxMesh key={b.id} box={b} materials={materials} profile={profile} runtime={runtime} />
      ))}
      <GroundGrid world={world} />
      <Hazards world={world} />
      <Decor world={world} profile={profile} materials={materials} />
    </group>
  );
}
