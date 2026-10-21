"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { RenderProfile } from "@/config/graphics";
import type { GameRuntime } from "@/lib/game/engine/runtime";
import { stationActive, stationDone, type ClientState } from "@/lib/game/state/progress";
import type { WorldStation } from "@/lib/game/world/types";
import { Halo, Label } from "./Marks";
import { roundedRectPath, type MaterialSet } from "./materials";

export const STATION_GREEN = "#34d399";
export const STATION_GREY = "#7b8499";

export type ScreenState = "challenge" | "lore" | "done" | "locked";

/**
 * The hologram that floats above a station. Drawn once per state; never contains any challenge content.
 * Its rounded panels go through `roundedRectPath`: a WebView without `ctx.roundRect` (before Chrome 99, an Android 6–8 phone
 * whose System WebView was never updated) used to throw here while the first station was drawn, which took the whole scene down.
 */
export function makeScreenTexture(state: ScreenState, color: string): THREE.CanvasTexture {
  const W = 320, H = 208;
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const ctx = c.getContext("2d")!;
  const rr = (x: number, y: number, w: number, h: number, r: number) => {
    ctx.beginPath();
    roundedRectPath(ctx, x, y, w, h, r);
  };
  ctx.clearRect(0, 0, W, H);
  // glass panel
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, "rgba(10,20,46,0.84)");
  g.addColorStop(1, "rgba(6,12,30,0.7)");
  ctx.fillStyle = g;
  rr(6, 6, W - 12, H - 12, 22);
  ctx.fill();
  ctx.strokeStyle = color;
  ctx.lineWidth = 5;
  ctx.globalAlpha = 0.95;
  rr(6, 6, W - 12, H - 12, 22);
  ctx.stroke();
  ctx.globalAlpha = 1;
  // header strip
  ctx.fillStyle = color;
  ctx.globalAlpha = 0.28;
  rr(20, 20, W - 40, 26, 10);
  ctx.fill();
  ctx.globalAlpha = 1;
  for (let i = 0; i < 3; i++) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(36 + i * 16, 33, 4.5, 0, Math.PI * 2);
    ctx.fill();
  }

  const lines = (x: number, y: number, widths: number[]) => {
    ctx.fillStyle = color;
    widths.forEach((w, i) => {
      ctx.globalAlpha = 0.55 - i * 0.05;
      rr(x, y + i * 22, w, 9, 4.5);
      ctx.fill();
    });
    ctx.globalAlpha = 1;
  };

  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  if (state === "done") {
    ctx.lineWidth = 16;
    ctx.beginPath();
    ctx.moveTo(110, 124);
    ctx.lineTo(148, 160);
    ctx.lineTo(216, 84);
    ctx.stroke();
    lines(34, 176, [112, 68]);
  } else if (state === "locked") {
    ctx.lineWidth = 12;
    ctx.beginPath();
    ctx.arc(160, 100, 26, Math.PI, 0);
    ctx.stroke();
    ctx.globalAlpha = 0.9;
    rr(126, 100, 68, 54, 10);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.fillStyle = "#0a142e";
    ctx.beginPath();
    ctx.arc(160, 123, 7, 0, Math.PI * 2);
    ctx.fill();
  } else if (state === "challenge") {
    // a question mark built from strokes (no font dependency) next to "code-like" lines
    ctx.lineWidth = 14;
    ctx.beginPath();
    ctx.arc(88, 94, 26, Math.PI * 1.1, Math.PI * 2.35);
    ctx.lineTo(88, 128);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(88, 154, 7.5, 0, Math.PI * 2);
    ctx.fill();
    lines(146, 70, [128, 92, 116, 66, 104]);
  } else {
    // lore: a page of text with a bookmark
    lines(34, 68, [150, 120, 160, 96, 132]);
    ctx.globalAlpha = 0.85;
    ctx.beginPath();
    ctx.moveTo(244, 60);
    ctx.lineTo(280, 60);
    ctx.lineTo(280, 124);
    ctx.lineTo(262, 108);
    ctx.lineTo(244, 124);
    ctx.closePath();
    ctx.fill();
    ctx.globalAlpha = 1;
  }
  // faint scan lines
  ctx.globalAlpha = 0.07;
  ctx.fillStyle = "#ffffff";
  for (let y = 54; y < H - 12; y += 6) ctx.fillRect(14, y, W - 28, 1.5);
  ctx.globalAlpha = 1;

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

/** One hologram material (and its texture) shared by the stations of a canvas that show the same state in the same colour. */
export interface SharedScreen {
  readonly key: string;
  readonly material: THREE.MeshBasicMaterial;
  users: number;
  disposed: boolean;
  readonly pool: Map<string, SharedScreen>;
}

const SCREEN_POOLS = new WeakMap<object, Map<string, SharedScreen>>();

/**
 * The hologram material for `state` drawn in `color`, one per canvas (`owner` is the canvas's material set, so a new canvas never
 * reuses textures of a renderer that is gone). Every station used to draw its own 320x208 canvas and upload its own texture
 * (about 350 KB of GPU memory each with its mipmaps), although there are only four pictures in a few colours: an area with eight
 * stations kept eight where two or three are the same. The picture is identical, so nothing on screen changes.
 * Looking one up does not keep it alive: a mounted station holds it with `retainScreen` and lets go with `releaseScreen`.
 */
export function screenFor(owner: object, state: ScreenState, color: string): SharedScreen {
  let pool = SCREEN_POOLS.get(owner);
  if (!pool) {
    pool = new Map();
    SCREEN_POOLS.set(owner, pool);
  }
  const key = `${state}|${color}`;
  const hit = pool.get(key);
  if (hit) return hit;
  const material = new THREE.MeshBasicMaterial({ map: makeScreenTexture(state, color), transparent: true, depthWrite: false, side: THREE.DoubleSide, toneMapped: false });
  const made: SharedScreen = { key, material, users: 0, disposed: false, pool };
  pool.set(key, made);
  return made;
}

export function retainScreen(s: SharedScreen): void {
  s.users += 1;
  // a screen freed between a station's render and its effect is used again (three.js uploads a freed texture on its next draw)
  s.disposed = false;
  if (!s.pool.has(s.key)) s.pool.set(s.key, s);
}

export function releaseScreen(s: SharedScreen): void {
  s.users = Math.max(0, s.users - 1);
  if (s.users > 0) return;
  // Freed a moment later, not at once: in one commit React runs every effect cleanup before any new effect, so a station that
  // turns to the picture another station is leaving (or a remount under StrictMode) takes it over instead of finding it freed.
  void Promise.resolve().then(() => {
    if (s.users > 0 || s.disposed) return;
    s.disposed = true;
    if (s.pool.get(s.key) === s) s.pool.delete(s.key);
    s.material.map?.dispose();
    s.material.dispose();
  });
}

const wrap = (a: number) => {
  while (a > Math.PI) a -= Math.PI * 2;
  while (a < -Math.PI) a += Math.PI * 2;
  return a;
};

/**
 * A challenge terminal or a lore lectern. The model turns to face the player, its colour tells the story at a glance
 * (grey = locked, accent = ready, green = done), the hologram shows a matching icon, and completing a station plays a
 * short shockwave. None of this depends on the challenge itself, so nothing about the answer reaches the browser.
 */
export function StationView({ runtime, station, client, nearby, profile, materials }: {
  runtime: GameRuntime;
  station: WorldStation;
  client: ClientState;
  nearby: boolean;
  profile: RenderProfile;
  materials: MaterialSet;
}) {
  const turn = useRef<THREE.Group>(null);
  const scale = useRef<THREE.Group>(null);
  const holo = useRef<THREE.Group>(null);
  const crystal = useRef<THREE.Mesh>(null);
  const ring = useRef<THREE.Mesh>(null);
  const orbit = useRef<THREE.Group>(null);
  const burstRing = useRef<THREE.Mesh>(null);
  const area = runtime.spec.areas.find((a) => a.id === runtime.areaId)!;
  const def = area.stations.find((s) => s.id === station.stationId)!;
  const done = stationDone(client, station.stationId);
  const active = stationActive(runtime.spec, client, def);
  const lore = station.kind === "lore";
  const theme = runtime.world.theme;
  const color = done ? STATION_GREEN : active ? (lore ? theme.accent2 : theme.accent) : STATION_GREY;
  const glow = materials.glow(color, done ? 0.8 : active ? 1.6 : 0.25);
  const padColor = useMemo(() => `#${new THREE.Color(theme.wall).lerp(new THREE.Color("#0d1426"), 0.62).getHexString()}`, [theme.wall]);
  const pad = materials.solid(padColor, { rough: 0.55, metal: 0.3 });
  const body = materials.solid(lore ? "#5b4636" : "#2a3354", { rough: 0.5, metal: lore ? 0.15 : 0.5 });
  const trim = materials.surface("pedestal", 1, 1);
  const shadows = profile.shadows.enabled;
  // additive glow washes out to a white disc on bright ground (desert, lab), so it is much fainter there
  const haloOpacity = useMemo(() => (new THREE.Color(theme.ground).getHSL({ h: 0, s: 0, l: 0 }).l > 0.45 ? 0.2 : 0.55), [theme.ground]);
  const state: ScreenState = done ? "done" : !active ? "locked" : lore ? "lore" : "challenge";

  const screen = useMemo(() => screenFor(materials, state, color), [materials, state, color]);
  useEffect(() => {
    retainScreen(screen);
    return () => releaseScreen(screen);
  }, [screen]);
  const screenMat = screen.material;
  const burstMat = useMemo(() => new THREE.MeshBasicMaterial({ color: STATION_GREEN, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending, fog: false }), []);
  useEffect(() => () => burstMat.dispose(), [burstMat]);

  const wasDone = useRef(done);
  const doneNow = useRef(done);
  const burst = useRef(0);
  useEffect(() => { doneNow.current = done; }, [done]);

  useFrame(({ clock }, dt) => {
    const t = clock.elapsedTime;
    const p = runtime.sim.player;
    // face the player when they are around, otherwise keep looking out of the area (+z)
    const dx = p.x - station.x, dz = p.z - station.z;
    const want = Math.hypot(dx, dz) < 24 ? Math.atan2(-dx, -dz) : Math.PI;
    if (turn.current) turn.current.rotation.y += wrap(want - turn.current.rotation.y) * Math.min(1, dt * 3.2);
    if (scale.current) scale.current.scale.setScalar(THREE.MathUtils.lerp(scale.current.scale.x, nearby ? 1.08 : 1, 0.15));
    if (holo.current) {
      holo.current.position.y = 2.25 + Math.sin(t * 1.8 + station.x) * 0.07;
      const pulse = active && !done ? 1 + Math.sin(t * 5) * 0.02 : 1;
      const target = (done ? 0.78 : 1) * pulse;
      holo.current.scale.setScalar(THREE.MathUtils.lerp(holo.current.scale.x, target, Math.min(1, dt * 6)));
    }
    if (crystal.current) {
      crystal.current.rotation.y = t * (active && !done ? 1.6 : 0.4);
      crystal.current.position.y = 3.15 + Math.sin(t * 2.2 + station.z) * 0.06;
      const s = done ? 0.55 : 1;
      crystal.current.scale.setScalar(THREE.MathUtils.lerp(crystal.current.scale.x, s, Math.min(1, dt * 6)));
    }
    if (ring.current) ring.current.rotation.z = t * (active && !done ? 1.1 : 0.25);
    if (orbit.current) {
      orbit.current.rotation.y = t * 1.5;
      const s = active && !done ? 1 : 0.0001;
      orbit.current.scale.setScalar(THREE.MathUtils.lerp(orbit.current.scale.x, s, Math.min(1, dt * 5)));
    }
    if (doneNow.current && !wasDone.current) burst.current = 1;
    wasDone.current = doneNow.current;
    if (burst.current > 0 && burstRing.current) {
      burst.current = Math.max(0, burst.current - dt * 1.25);
      const k = 1 - burst.current;
      burstRing.current.visible = true;
      burstRing.current.scale.setScalar(0.6 + k * 5.2);
      burstMat.opacity = Math.sin(Math.min(1, burst.current) * Math.PI) * 0.7;
      if (burst.current === 0) burstRing.current.visible = false;
    }
  });

  return (
    <group position={[station.x, station.y, station.z]}>
      <group ref={scale}>
        {/* pad with a glowing rim */}
        <mesh position={[0, 0.08, 0]} material={pad} castShadow={shadows} receiveShadow={shadows}>
          <cylinderGeometry args={[1.2, 1.3, 0.16, 24]} />
        </mesh>
        <mesh ref={ring} position={[0, 0.18, 0]} rotation={[Math.PI / 2, 0, 0]} material={glow}>
          <torusGeometry args={[1.08, 0.045, 8, 40]} />
        </mesh>
        <group ref={turn} rotation={[0, Math.PI, 0]}>
          {lore ? (
            <>
              {/* lectern with an open book */}
              <mesh position={[0, 0.58, 0]} material={body} castShadow={shadows}>
                <boxGeometry args={[0.46, 0.84, 0.36]} />
              </mesh>
              <mesh position={[0, 1.06, -0.03]} rotation={[-0.5, 0, 0]} material={trim} castShadow={shadows}>
                <boxGeometry args={[0.98, 0.07, 0.62]} />
              </mesh>
              {([-1, 1] as const).map((s) => (
                <mesh key={s} position={[s * 0.24, 1.17, -0.09]} rotation={[-0.5, 0, s * -0.12]} material={glow}>
                  <boxGeometry args={[0.44, 0.03, 0.52]} />
                </mesh>
              ))}
            </>
          ) : (
            <>
              {/* console with a slanted screen */}
              <mesh position={[0, 0.5, 0]} material={body} castShadow={shadows}>
                <boxGeometry args={[1.0, 0.7, 0.6]} />
              </mesh>
              <mesh position={[0, 1.0, -0.02]} rotation={[-0.62, 0, 0]} material={trim} castShadow={shadows}>
                <boxGeometry args={[1.0, 0.1, 0.62]} />
              </mesh>
              <mesh position={[0, 1.055, -0.045]} rotation={[-0.62 - Math.PI / 2, 0, 0]} material={screenMat}>
                <planeGeometry args={[0.86, 0.5]} />
              </mesh>
              {/* button row */}
              {[-0.3, 0, 0.3].map((x) => (
                <mesh key={x} position={[x, 0.46, -0.31]} material={glow}>
                  <boxGeometry args={[0.14, 0.08, 0.04]} />
                </mesh>
              ))}
            </>
          )}
          {/* floating hologram */}
          <group ref={holo} position={[0, 2.25, 0]} rotation={[0, Math.PI, 0]}>
            <mesh material={screenMat}>
              <planeGeometry args={[1.5, 0.975]} />
            </mesh>
          </group>
          <mesh ref={crystal} position={[0, 3.15, 0]} material={glow}>
            {lore ? <octahedronGeometry args={[0.2, 0]} /> : <icosahedronGeometry args={[0.2, 0]} />}
          </mesh>
          <group ref={orbit} position={[0, 2.25, 0]}>
            {[0, 1, 2].map((i) => (
              <mesh key={i} position={[Math.cos((i / 3) * Math.PI * 2) * 1.0, Math.sin(i * 2.1) * 0.35, Math.sin((i / 3) * Math.PI * 2) * 1.0]} material={glow}>
                <octahedronGeometry args={[0.06, 0]} />
              </mesh>
            ))}
          </group>
        </group>
      </group>
      <mesh ref={burstRing} position={[0, 0.25, 0]} rotation={[Math.PI / 2, 0, 0]} material={burstMat} visible={false}>
        <torusGeometry args={[1, 0.07, 8, 48]} />
      </mesh>
      {profile.glow && <Halo color={color} size={done ? 2.2 : 3.2} y={1.4} opacity={haloOpacity} />}
      <Label text={(done ? "✓ " : "") + station.label} color={color} y={3.75} />
    </group>
  );
}
