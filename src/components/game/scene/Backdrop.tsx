"use client";

import { useEffect, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { RenderProfile } from "@/config/graphics";
import type { WorldModel } from "@/lib/game/world/types";
import { buildSkyline, buildWater, type SkylineGeo, type WaterPiece } from "@/lib/game/world/skyline";
import { skylineFor } from "./budget";
import { SKYLINE_SEGMENTS, type Detail } from "./geometry";
import type { MaterialSet } from "./materials";

const makeGeo = (geo: SkylineGeo, d: Detail): THREE.BufferGeometry => {
  const s = SKYLINE_SEGMENTS[d];
  switch (geo) {
    case "box": return new THREE.BoxGeometry(1, 1, 1);
    case "cyl": return new THREE.CylinderGeometry(1, 1, 1, s.cyl);
    case "cone": return new THREE.ConeGeometry(1, 1, s.cone);
    case "cone4": return new THREE.ConeGeometry(0.7071, 1, 4).rotateY(Math.PI / 4);
    case "sphere": return new THREE.SphereGeometry(1, s.sphere[0], s.sphere[1]);
    case "dome": return new THREE.SphereGeometry(1, s.dome[0], s.dome[1], 0, Math.PI * 2, 0, Math.PI / 2);
  }
};

/** Horizontal half-extent multiplier for each unit geometry (box and cone4 are 1 wide, the rest have radius 1). */
const HALF: Record<SkylineGeo, number> = { box: 1, cyl: 0.5, cone: 0.5, cone4: 1, sphere: 0.5, dome: 0.5 };
const VERT: Record<SkylineGeo, number> = { box: 1, cyl: 1, cone: 1, cone4: 1, sphere: 0.5, dome: 1 };

/**
 * The horizon: a ground that continues far past the playable area (so scenery never floats in the void) and a ring of
 * distant, haze-tinted silhouettes that give each environment its character. Platformer worlds, which have no ground,
 * get a sea of clouds below the platforms instead. Costs a few draw calls on every tier; detail scales with the tier.
 */
export function Backdrop({ world, profile, materials }: { world: WorldModel; profile: RenderProfile; materials: MaterialSet }) {
  const theme = world.theme;
  const groundY = world.hasVoid ? world.killY + 3 : -0.03;

  const pieces = useMemo(() => {
    return skylineFor(buildSkyline(world.environment, theme, world.seed, groundY), profile);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [world.environment, world.seed, theme, groundY, profile.environmentDetail, profile.limits.skylineMin, profile.limits.skylinePieces]);

  const groups = useMemo(() => {
    const m = new Map<SkylineGeo, typeof pieces>();
    for (const p of pieces) {
      const list = m.get(p.geo);
      if (list) list.push(p);
      else m.set(p.geo, [p]);
    }
    return [...m.entries()];
  }, [pieces]);

  const groundColor = useMemo(() => {
    const c = new THREE.Color(world.hasVoid ? "#ffffff" : theme.groundAlt).lerp(new THREE.Color(theme.fog), world.hasVoid ? 0.55 : 0.35);
    return `#${c.getHexString()}`;
  }, [theme, world.hasVoid]);
  const groundMat = useMemo(() => materials.solid(groundColor, { rough: 1, metal: 0 }), [materials, groundColor]);

  const water = useMemo(() => (world.hasVoid || profile.limits.water === 0 ? [] : buildWater(world.environment, theme, world.seed, world.bounds)), [world, theme, profile.limits.water]);

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, groundY - 0.02, 0]} material={groundMat} receiveShadow={false}>
        <circleGeometry args={[700, profile.geometry === "low" ? 24 : 48]} />
      </mesh>
      {water.length > 0 && <Water pieces={water} y={groundY} animate={profile.tier !== "C"} />}
      {groups.map(([geo, items]) => (
        <SkylineInstances key={geo} geo={geo} items={items} detail={profile.geometry} />
      ))}
    </group>
  );
}

function SkylineInstances({ geo, items, detail }: { geo: SkylineGeo; items: ReturnType<typeof buildSkyline>; detail: Detail }) {
  const geometry = useMemo(() => makeGeo(geo, detail), [geo, detail]);
  const material = useMemo(() => new THREE.MeshBasicMaterial({ fog: false, side: THREE.DoubleSide }), []);
  const mesh = useMemo(() => {
    const m = new THREE.InstancedMesh(geometry, material, items.length);
    const mat = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(), p = new THREE.Vector3(), c = new THREE.Color();
    items.forEach((it, i) => {
      p.set(it.x, it.y, it.z);
      s.set(it.sx * HALF[geo], it.sy * VERT[geo], it.sz * HALF[geo]);
      mat.compose(p, q, s);
      m.setMatrixAt(i, mat);
      m.setColorAt(i, c.set(it.color));
    });
    m.instanceMatrix.needsUpdate = true;
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
    m.frustumCulled = false;
    m.renderOrder = -5;
    return m;
  }, [geometry, material, items, geo]);
  // Each resource is released when it is itself replaced or the skyline unmounts. When the frame governor thins the skyline
  // (levels 3 and 4) only `items`, and so the mesh, change: a shared cleanup used to dispose the geometry and material the new
  // mesh still draws with, forcing a re-upload and a shader recompile at the moment the device was already struggling.
  useEffect(() => () => geometry.dispose(), [geometry]);
  useEffect(() => () => material.dispose(), [material]);
  useEffect(() => () => mesh.dispose(), [mesh]);
  return <primitive object={mesh} />;
}

function rippleTexture(): THREE.CanvasTexture {
  const S = 128;
  const c = document.createElement("canvas");
  c.width = c.height = S;
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, S, S);
  ctx.strokeStyle = "rgba(190,215,235,0.75)";
  ctx.lineWidth = 2;
  for (let i = 0; i < 9; i++) {
    const y = (i + 0.5) * (S / 9);
    ctx.beginPath();
    for (let x = 0; x <= S; x += 8) ctx.lineTo(x, y + Math.sin((x / S) * Math.PI * 2 * 2 + i) * 3);
    ctx.stroke();
  }
  ctx.fillStyle = "rgba(255,255,255,0.9)";
  for (let i = 0; i < 14; i++) ctx.fillRect(((i * 53) % S), ((i * 37) % S), 3, 2);
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.repeat.set(3, 4);
  return tex;
}

/** Rivers and lakes: flat instanced shapes with a drifting ripple texture over a wider strip of shore. */
function Water({ pieces, y, animate }: { pieces: WaterPiece[]; y: number; animate: boolean }) {
  const ripple = useMemo(() => rippleTexture(), []);
  const bankMat = useMemo(() => new THREE.MeshBasicMaterial({ color: "#ffffff", polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 }), []);
  const waterMat = useMemo(() => {
    const m = new THREE.MeshBasicMaterial({ color: "#ffffff", map: ripple, transparent: true, opacity: 0.94, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3 });
    return m;
  }, [ripple]);
  useEffect(() => () => { ripple.dispose(); bankMat.dispose(); waterMat.dispose(); }, [ripple, bankMat, waterMat]);
  useFrame(({ clock }) => {
    if (!animate) return;
    ripple.offset.set((clock.elapsedTime * 0.012) % 1, (clock.elapsedTime * 0.02) % 1);
  });
  const parts = useMemo(() => {
    const rect = (role: WaterPiece["role"]) => pieces.filter((p) => p.shape === "rect" && p.role === role);
    const ell = (role: WaterPiece["role"]) => pieces.filter((p) => p.shape === "ellipse" && p.role === role);
    return [
      { key: "bank-r", items: rect("bank"), circle: false, mat: bankMat, dy: 0.04 },
      { key: "bank-e", items: ell("bank"), circle: true, mat: bankMat, dy: 0.04 },
      { key: "water-r", items: rect("water"), circle: false, mat: waterMat, dy: 0.08 },
      { key: "water-e", items: ell("water"), circle: true, mat: waterMat, dy: 0.08 },
    ].filter((p) => p.items.length > 0);
  }, [pieces, bankMat, waterMat]);
  return (
    <group>
      {parts.map((p) => (
        <WaterInstances key={p.key} items={p.items} circle={p.circle} material={p.mat} y={y + p.dy} />
      ))}
    </group>
  );
}

function WaterInstances({ items, circle, material, y }: { items: WaterPiece[]; circle: boolean; material: THREE.Material; y: number }) {
  const geometry = useMemo(() => (circle ? new THREE.CircleGeometry(0.5, 40) : new THREE.PlaneGeometry(1, 1)).rotateX(-Math.PI / 2), [circle]);
  const mesh = useMemo(() => {
    const m = new THREE.InstancedMesh(geometry, material, items.length);
    const mat = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(), p = new THREE.Vector3(), c = new THREE.Color();
    const yaw = new THREE.Euler();
    items.forEach((it, i) => {
      q.setFromEuler(yaw.set(0, it.rot, 0));
      p.set(it.x, y, it.z);
      s.set(it.sx, 1, it.sz);
      mat.compose(p, q, s);
      m.setMatrixAt(i, mat);
      m.setColorAt(i, c.set(it.color));
    });
    m.instanceMatrix.needsUpdate = true;
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
    m.frustumCulled = false;
    m.renderOrder = -4;
    return m;
  }, [geometry, material, items, y]);
  // as in the skyline: a new mesh over the same geometry must not dispose that geometry (the material belongs to Water)
  useEffect(() => () => geometry.dispose(), [geometry]);
  useEffect(() => () => mesh.dispose(), [mesh]);
  return <primitive object={mesh} />;
}
