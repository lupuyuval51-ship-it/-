"use client";

import { useEffect, useMemo, useRef, type RefObject } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import type { RenderProfile } from "@/config/graphics";
import type { GameRuntime } from "@/lib/game/engine/runtime";
import type { GuideKind, GuideModel } from "@/lib/game/state/guidance";
import type { EnvTheme } from "@/lib/game/world/types";
import type { InputState } from "../input";
import { DEFAULT_GUIDE_INSETS, markerBand, type GuideInsets } from "./guideBand";
import { sharedSoftSprite } from "./materials";

/** Several beams can be active at once (talk + two terminals + a coin); six covers every mission. */
const SLOTS = 6;

const beamVert = `varying float vY; void main(){ vY = position.y + 0.5; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;
const beamFrag = `varying float vY; uniform vec3 color; uniform float time; uniform float strength;
void main(){ float a = pow(1.0 - vY, 1.7) * 0.6 * strength; a *= 0.82 + 0.18 * sin(time * 2.6 + vY * 10.0); gl_FragColor = vec4(color, a); }`;

const KIND_SIZE: Record<GuideKind, { h: number; r: number }> = {
  npc: { h: 15, r: 0.5 },
  station: { h: 15, r: 0.55 },
  lore: { h: 11, r: 0.45 },
  portal: { h: 18, r: 0.9 },
  collectible: { h: 5.5, r: 0.22 },
};

function kindColor(kind: GuideKind, theme: EnvTheme): string {
  switch (kind) {
    case "npc": return "#ffd23f";
    case "station": return theme.accent;
    case "lore": return theme.accent2;
    case "portal": return theme.accent2;
    case "collectible": return "#7df9ff";
  }
}

const smooth = (a: number, b: number, x: number) => {
  const t = Math.max(0, Math.min(1, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

/**
 * A soft light beam, a pulsing ground ring and a bobbing chevron over every objective the player can progress
 * right now. Cheap on every tier (one additive mesh per beam) because finding the next step is gameplay, not decoration.
 */
export function GuideBeams({ runtime, model, theme }: { runtime: GameRuntime; model: GuideModel; theme: EnvTheme }) {
  const groups = useRef<(THREE.Group | null)[]>([]);
  const beams = useRef<(THREE.Mesh | null)[]>([]);
  const rings = useRef<(THREE.Mesh | null)[]>([]);
  const chevrons = useRef<(THREE.Mesh | null)[]>([]);
  const color = useMemo(() => new THREE.Color(), []);
  const mats = useMemo(
    () =>
      Array.from({ length: SLOTS }, () =>
        new THREE.ShaderMaterial({
          vertexShader: beamVert,
          fragmentShader: beamFrag,
          uniforms: { color: { value: new THREE.Color("#ffffff") }, time: { value: 0 }, strength: { value: 1 } },
          transparent: true,
          depthWrite: false,
          side: THREE.DoubleSide,
          blending: THREE.AdditiveBlending,
          fog: false,
        }),
      ),
    [],
  );
  const ringMats = useMemo(() => Array.from({ length: SLOTS }, () => new THREE.MeshBasicMaterial({ color: "#ffffff", transparent: true, opacity: 0.5, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, fog: false })), []);
  const chevMats = useMemo(() => Array.from({ length: SLOTS }, () => new THREE.MeshBasicMaterial({ color: "#ffffff", fog: false })), []);
  useEffect(() => () => { mats.forEach((m) => m.dispose()); ringMats.forEach((m) => m.dispose()); chevMats.forEach((m) => m.dispose()); }, [mats, ringMats, chevMats]);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    const p = runtime.sim.player;
    for (let i = 0; i < SLOTS; i++) {
      const g = groups.current[i];
      if (!g) continue;
      const target = model.enabled ? model.targets[i] : undefined;
      g.visible = Boolean(target);
      if (!target) continue;
      const size = KIND_SIZE[target.kind];
      g.position.set(target.x, target.y, target.z);
      const d = Math.hypot(p.x - target.x, p.z - target.z);
      const near = smooth(1.6, 5.5, d); // fade out when you are standing in it
      color.set(kindColor(target.kind, theme));
      const u = mats[i]!.uniforms;
      (u.color!.value as THREE.Color).copy(color);
      u.time!.value = t;
      u.strength!.value = near * (target === model.primary ? 1 : 0.7);
      const beam = beams.current[i]!;
      beam.scale.set(size.r, size.h, size.r);
      beam.position.y = size.h / 2;
      const ring = rings.current[i]!;
      const pulse = 1 + 0.12 * Math.sin(t * 3 + i);
      ring.scale.setScalar((target.kind === "collectible" ? 0.9 : 1.9) * pulse);
      (ring.material as THREE.MeshBasicMaterial).color.copy(color);
      const chev = chevrons.current[i]!;
      chev.visible = target.kind !== "collectible";
      chev.position.y = (target.kind === "portal" ? 5.4 : 4.7) + Math.sin(t * 3 + i) * 0.22;
      chev.rotation.y = t * 1.6;
      (chev.material as THREE.MeshBasicMaterial).color.copy(color);
    }
  });

  return (
    <group>
      {Array.from({ length: SLOTS }, (_, i) => (
        <group key={i} ref={(g) => { groups.current[i] = g; }} visible={false}>
          <mesh ref={(m) => { beams.current[i] = m; }} material={mats[i]} renderOrder={5}>
            <cylinderGeometry args={[1, 1, 1, 18, 1, true]} />
          </mesh>
          <mesh ref={(m) => { rings.current[i] = m; }} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.07, 0]} material={ringMats[i]} renderOrder={4}>
            <ringGeometry args={[0.7, 1, 36]} />
          </mesh>
          <mesh ref={(m) => { chevrons.current[i] = m; }} rotation={[Math.PI, 0, 0]} material={chevMats[i]}>
            <coneGeometry args={[0.32, 0.6, 4]} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/**
 * "Pip": a small drone that floats beside the player and, when the next objective is far away, flies ahead towards
 * it — a diegetic arrow with some personality. It gets impatient (bobs faster, drifts to the target) when idle.
 */
export function Companion({ runtime, model, input, profile, accent }: { runtime: GameRuntime; model: GuideModel; input: InputState; profile: RenderProfile; accent: string }) {
  const root = useRef<THREE.Group>(null);
  const ring = useRef<THREE.Mesh>(null);
  const eye = useRef<THREE.Mesh>(null);
  const pos = useRef(new THREE.Vector3());
  const ready = useRef(false);
  const idle = useRef(0);
  const prev = useRef({ x: 0, z: 0 });
  const want = useMemo(() => new THREE.Vector3(), []);
  const halo = profile.glow ? sharedSoftSprite() : null; // shared by every halo: not disposed here

  useFrame(({ clock }, dt) => {
    const g = root.current;
    if (!g) return;
    const p = runtime.sim.player;
    const t = clock.elapsedTime;
    const moved = Math.hypot(p.x - prev.current.x, p.z - prev.current.z);
    prev.current.x = p.x;
    prev.current.z = p.z;
    idle.current = moved > 0.02 ? 0 : idle.current + dt;

    const fx = -Math.sin(input.yaw), fz = -Math.cos(input.yaw); // camera forward on the ground
    const rx = -fz, rz = fx;
    const prim = model.enabled ? model.primary : null;
    const dx = prim ? prim.x - p.x : 0, dz = prim ? prim.z - p.z : 0;
    const dist = prim ? Math.hypot(dx, dz) : 0;
    const bob = Math.sin(t * (idle.current > 5 ? 4.2 : 2.4)) * 0.16;
    if (prim && dist > 5) {
      // lead the way: hover ahead of the player in the direction of the objective
      const lead = Math.min(2.6 + (idle.current > 5 ? Math.min(3, (idle.current - 5) * 0.8) : 0), dist - 3);
      want.set(p.x + (dx / dist) * lead + rx * 0.5, p.y + 2.35 + bob, p.z + (dz / dist) * lead + rz * 0.5);
    } else if (prim) {
      want.set(prim.x + rx * 1.3, prim.y + 3.1 + bob, prim.z + rz * 1.3);
    } else {
      want.set(p.x + rx * 1.15 + fx * 0.3, p.y + 2.1 + bob, p.z + rz * 1.15 + fz * 0.3);
    }
    if (!ready.current) {
      pos.current.set(p.x + rx, p.y + 2.2, p.z + rz);
      ready.current = true;
    }
    pos.current.lerp(want, 1 - Math.exp(-dt * (prim && dist > 5 ? 3.2 : 4.5)));
    g.position.copy(pos.current);
    // look where it is going / at the objective
    const lx = prim ? dx : p.x - pos.current.x, lz = prim ? dz : p.z - pos.current.z;
    const yawTarget = Math.atan2(lx, lz);
    let dy = yawTarget - g.rotation.y;
    while (dy > Math.PI) dy -= Math.PI * 2;
    while (dy < -Math.PI) dy += Math.PI * 2;
    g.rotation.y += dy * Math.min(1, dt * 6);
    if (ring.current) ring.current.rotation.z = t * 2.2;
    if (eye.current) eye.current.scale.y = Math.sin(t * 0.9) > 0.985 ? 0.15 : 1; // blink
  });

  return (
    <group ref={root}>
      <mesh>
        <sphereGeometry args={[0.2, 16, 14]} />
        <meshStandardMaterial color="#f4f7ff" emissive={accent} emissiveIntensity={0.55} roughness={0.35} metalness={0.2} />
      </mesh>
      <mesh ref={eye} position={[0, 0.02, 0.17]}>
        <sphereGeometry args={[0.07, 10, 8]} />
        <meshBasicMaterial color="#0b1230" />
      </mesh>
      <mesh ref={ring} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.33, 0.028, 8, 26]} />
        <meshBasicMaterial color={accent} fog={false} />
      </mesh>
      {halo && (
        <sprite scale={[1.5, 1.5, 1]}>
          <spriteMaterial map={halo} color={accent} transparent opacity={0.6} depthWrite={false} blending={THREE.AdditiveBlending} fog={false} />
        </sprite>
      )}
    </group>
  );
}

/**
 * Projects the primary objective to the screen and writes the result straight into the HUD marker element
 * (transform + text), so the marker costs no React renders. Off-screen targets pin to the edge with an arrow.
 */
export function GuideProjector({ runtime, model, markerRef, label, insets }: { runtime: GameRuntime; model: GuideModel; markerRef: RefObject<HTMLDivElement | null>; label: (kind: GuideKind, name: string, meters: number) => string; /** Where the HUD leaves room for the marker (read every frame, so the HUD can change it without a render). */ insets?: RefObject<GuideInsets> }) {
  const camera = useThree((s) => s.camera);
  const size = useThree((s) => s.size);
  const v = useMemo(() => new THREE.Vector3(), []);
  const lastText = useRef("");
  const markerWidth = useRef(0);

  useFrame(() => {
    const el = markerRef.current;
    if (!el) return;
    const prim = model.enabled ? model.primary : null;
    const p = runtime.sim.player;
    const d = prim ? Math.hypot(prim.x - p.x, prim.z - p.z) : 0;
    if (!prim || d < 3) {
      if (el.dataset.show !== "0") {
        el.dataset.show = "0";
        el.style.opacity = "0";
      }
      return;
    }
    v.set(prim.x, prim.y + (prim.kind === "collectible" ? 1.8 : 5.2), prim.z).project(camera);
    const behind = v.z > 1;
    const W = size.width, H = size.height;
    let sx = ((behind ? -v.x : v.x) * 0.5 + 0.5) * W;
    let sy = ((behind ? v.y : -v.y) * 0.5 + 0.5) * H;
    const { left, right, top, bottom } = markerBand(W, H, insets?.current ?? DEFAULT_GUIDE_INSETS, markerWidth.current);
    const inside = !behind && sx > left && sx < right && sy > top && sy < bottom;
    let angle = 180; // pointing down at the target when it is on screen
    if (!inside) {
      const cx = W / 2, cy = (top + bottom) / 2;
      let dx = sx - cx, dy = sy - cy;
      if (behind) dy = -Math.abs(dy) - 1; // behind: point "up/away"
      const len = Math.hypot(dx, dy) || 1;
      dx /= len;
      dy /= len;
      const kx = dx === 0 ? Infinity : Math.abs((dx > 0 ? right - cx : left - cx) / dx);
      const ky = dy === 0 ? Infinity : Math.abs((dy > 0 ? bottom - cy : top - cy) / dy);
      const k = Math.min(kx, ky);
      sx = cx + dx * k;
      sy = cy + dy * k;
      angle = (Math.atan2(dy, dx) * 180) / Math.PI + 90;
    }
    el.dataset.show = "1";
    el.dataset.edge = inside ? "0" : "1";
    el.style.opacity = "1";
    el.style.transform = `translate3d(${Math.round(sx)}px, ${Math.round(sy)}px, 0) translate(-50%, -50%)`;
    const arrow = el.firstElementChild?.firstElementChild as HTMLElement | null;
    if (arrow) arrow.style.transform = `rotate(${Math.round(angle)}deg)`;
    const text = label(prim.kind, prim.label, Math.round(d));
    if (text !== lastText.current) {
      lastText.current = text;
      const t = el.firstElementChild?.lastElementChild as HTMLElement | null;
      if (t) t.textContent = text;
      markerWidth.current = el.offsetWidth; // measured only when the text changes, so the pinned marker's label never runs off a side edge
    }
  });
  return null;
}
