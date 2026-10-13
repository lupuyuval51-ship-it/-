"use client";

import { useEffect, useMemo, useRef, type Ref } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { RenderProfile } from "@/config/graphics";
import type { GameRuntime } from "@/lib/game/engine/runtime";
import type { WorldBox, WorldModel } from "@/lib/game/world/types";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { boxPlan, decorItemsFor } from "./budget";
import { decorColor, partsFor, type Geo, type Part } from "./decor";
import { DECOR_GEO_ARGS, type Detail } from "./geometry";
import type { MaterialSet } from "./materials";

const BOX = new THREE.BoxGeometry(1, 1, 1);

/** Unit geometries per detail level, built once and shared by every world (never disposed: they are tiny). */
const GEO_CACHE: Partial<Record<Detail, Record<Geo, THREE.BufferGeometry>>> = {};
function decorGeos(detail: Detail): Record<Geo, THREE.BufferGeometry> {
  const hit = GEO_CACHE[detail];
  if (hit) return hit;
  const a = DECOR_GEO_ARGS[detail];
  const made: Record<Geo, THREE.BufferGeometry> = {
    box: BOX,
    cyl: new THREE.CylinderGeometry(...a.cyl),
    cone: new THREE.ConeGeometry(...a.cone),
    sphere: new THREE.SphereGeometry(...a.sphere),
    oct: new THREE.OctahedronGeometry(...a.oct),
    torus: new THREE.TorusGeometry(...a.torus),
  };
  GEO_CACHE[detail] = made;
  return made;
}

type BoxMeshProps = { box: WorldBox; materials: MaterialSet; profile: RenderProfile; runtime: GameRuntime };

/**
 * One level box. Only movers and gates are animated; every other box is plain and registers no per-frame callback (a level
 * has dozens of them, and each `useFrame` subscription is work every frame even when the callback returns at once).
 */
function BoxMesh(props: BoxMeshProps) {
  const { box } = props;
  if (!box.visible) return null;
  return box.mover || (box.kind === "gate" && box.gateId) ? <AnimatedBox {...props} /> : <StaticBox {...props} />;
}

function BoxShape({ box, mat, profile, ref }: { box: WorldBox; mat: THREE.Material; profile: RenderProfile; ref?: Ref<THREE.Mesh> }) {
  const w = box.x1 - box.x0, h = box.y1 - box.y0, d = box.z1 - box.z0;
  const isGate = box.kind === "gate";
  const isFloor = box.kind === "floor";
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

function StaticBox({ box, materials, profile }: BoxMeshProps) {
  const w = box.x1 - box.x0, d = box.z1 - box.z0;
  const mat = useMemo(() => materials.surface(box.style, w, d), [materials, box.style, w, d]);
  return <BoxShape box={box} mat={mat} profile={profile} />;
}

function AnimatedBox({ box, materials, profile, runtime }: BoxMeshProps) {
  const ref = useRef<THREE.Mesh>(null);
  const w = box.x1 - box.x0, h = box.y1 - box.y0, d = box.z1 - box.z0;
  const isGate = box.kind === "gate";
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

  return <BoxShape box={box} mat={mat} profile={profile} ref={ref} />;
}

/**
 * Static level geometry merged into one mesh per material style (Tier C): a "rooms" level goes from dozens of draw
 * calls to a handful. Boxes are baked into world space, so nothing here moves or needs per-frame work.
 */
function MergedBoxes({ boxes, style, materials }: { boxes: WorldBox[]; style: string; materials: MaterialSet }) {
  const geometry = useMemo(() => {
    const parts = boxes.map((b) => {
      const g = new THREE.BoxGeometry(1, 1, 1);
      g.applyMatrix4(new THREE.Matrix4().compose(
        new THREE.Vector3((b.x0 + b.x1) / 2, (b.y0 + b.y1) / 2, (b.z0 + b.z1) / 2),
        new THREE.Quaternion(),
        new THREE.Vector3(b.x1 - b.x0, b.y1 - b.y0, b.z1 - b.z0),
      ));
      return g;
    });
    const merged = mergeGeometries(parts, false);
    parts.forEach((g) => g.dispose());
    return merged;
  }, [boxes]);
  useEffect(() => () => geometry?.dispose(), [geometry]);
  const mat = useMemo(() => materials.surface(style, 1, 1), [materials, style]);
  if (!geometry) return null;
  return <mesh geometry={geometry} material={mat} frustumCulled={false} />;
}

/** Instanced scenery. Items beyond the tier's detail budget are not drawn at all (solid props always are). */
function Decor({ world, profile, materials }: { world: WorldModel; profile: RenderProfile; materials: MaterialSet }) {
  const low = profile.geometry === "low";
  const groups = useMemo(() => {
    const byKind = new Map<string, typeof world.decor>();
    for (const item of decorItemsFor(world, profile)) byKind.set(item.kind, [...(byKind.get(item.kind) ?? []), item]);
    return [...byKind.entries()];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [world, profile.environmentDetail, profile.limits.looseDecor]);

  return (
    <group>
      {groups.map(([kind, items]) =>
        partsFor(kind as Parameters<typeof partsFor>[0], low).map((part, pi) => (
          <DecorInstances key={`${kind}-${pi}`} items={items} part={part} world={world} profile={profile} materials={materials} />
        )),
      )}
    </group>
  );
}

function DecorInstances({ items, part, world, profile, materials }: { items: WorldModel["decor"]; part: Part; world: WorldModel; profile: RenderProfile; materials: MaterialSet }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  useEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const m = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(), p = new THREE.Vector3(), c = new THREE.Color();
    const e = new THREE.Euler();
    const pq = new THREE.Quaternion();
    const hasRot = Boolean(part.rot);
    if (part.rot) pq.setFromEuler(new THREE.Euler(part.rot[0], part.rot[1], part.rot[2], "YXZ"));
    const full = new THREE.Quaternion();
    items.forEach((it, i) => {
      e.set(0, it.rot, 0);
      q.setFromEuler(e);
      // part offset is rotated with the item, then scaled
      p.set(part.pos[0] * it.scale, part.pos[1] * it.scale, part.pos[2] * it.scale).applyQuaternion(q).add(new THREE.Vector3(it.x, it.y, it.z));
      s.set(part.size[0] * it.scale, part.size[1] * it.scale, part.size[2] * it.scale);
      full.copy(q);
      if (hasRot) full.multiply(pq);
      m.compose(p, full, s);
      mesh.setMatrixAt(i, m);
      mesh.setColorAt(i, c.set(decorColor(part.color, it.tint, world.theme.accent, world.theme.accent2)));
    });
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, [items, part, world.theme]);

  const mat = useMemo(() => {
    if (part.emissive) return materials.unlit();
    return materials.surface("decor", 2, 2);
  }, [materials, part.emissive]);
  const solid = items.some((i) => i.solid);
  return <instancedMesh ref={ref} args={[decorGeos(profile.geometry)[part.geo], mat as THREE.Material, items.length]} castShadow={profile.shadows.enabled && solid} receiveShadow={false} frustumCulled={false} />;
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
  const plan = useMemo(() => boxPlan(world, profile), [world, profile.limits.mergeStatic]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <group>
      {plan.individual.map((b) => (
        <BoxMesh key={b.id} box={b} materials={materials} profile={profile} runtime={runtime} />
      ))}
      {[...plan.merged.entries()].map(([style, boxes]) => (
        <MergedBoxes key={style} style={style} boxes={boxes} materials={materials} />
      ))}
      <GroundGrid world={world} />
      <Hazards world={world} />
      <Decor world={world} profile={profile} materials={materials} />
    </group>
  );
}
