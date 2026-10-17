"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { RenderProfile } from "@/config/graphics";
import type { GameRuntime } from "@/lib/game/engine/runtime";
import { bossProgress, stationDone, type ClientState } from "@/lib/game/state/progress";
import type { WorldBoss, WorldNpc } from "@/lib/game/world/types";
import type { GuideModel } from "@/lib/game/state/guidance";
import { Character } from "./Characters";
import { CollectibleView } from "./Collectibles";
import { Label } from "./Marks";
import type { MaterialSet } from "./materials";
import { StationView, STATION_GREEN as GREEN, STATION_GREY as GREY } from "./Stations";

function NpcView({ runtime, npc, nearby, profile, materials, model }: { runtime: GameRuntime; npc: WorldNpc; nearby: boolean; profile: RenderProfile; materials: MaterialSet; model: GuideModel }) {
  const labelY = npc.shape === "orb" ? 2.75 : npc.shape === "creature" ? 2.05 : npc.shape === "robot" ? 2.3 : 2.2;
  return (
    <group position={[npc.x, 0, npc.z]}>
      <Character runtime={runtime} npc={npc} nearby={nearby} profile={profile} materials={materials} model={model} />
      <Label text={npc.name} color={npc.color} y={labelY} scale={0.9} />
    </group>
  );
}

/**
 * A boss is a character drawn larger than life with a health bar that follows the battle: one segment per round,
 * and a segment goes dark each time a round is won. The bar always faces the camera.
 */
function BossView({ runtime, boss, client, nearby, profile, materials, model }: { runtime: GameRuntime; boss: WorldBoss; client: ClientState; nearby: boolean; profile: RenderProfile; materials: MaterialSet; model: GuideModel }) {
  const def = runtime.spec.bosses?.find((b) => b.id === boss.bossId);
  const progress = def ? bossProgress(def, client) : { total: 1, done: 0, defeated: false, nextPhase: 0 };
  const left = progress.total - progress.done;
  const bar = useRef<THREE.Group>(null);
  const fill = materials.glow(boss.color, 1.4);
  const empty = materials.flat("#1a2038");
  const frame = materials.flat("#06101f");
  // The character's own coordinates are local to this scaled group; only facing needs the world position.
  const npc: WorldNpc = { npcId: boss.bossId, name: boss.name, color: boss.color, shape: boss.shape, facing: boss.facing, x: boss.x, y: 0, z: boss.z };
  const labelY = boss.shape === "orb" ? 2.75 : boss.shape === "creature" ? 2.05 : boss.shape === "robot" ? 2.3 : 2.2;
  const top = (labelY + 0.9) * boss.scale;
  useFrame(({ camera }) => {
    const g = bar.current;
    if (g) g.quaternion.copy(camera.quaternion);
  });
  const w = 0.42 * progress.total;
  return (
    <group position={[boss.x, boss.y, boss.z]}>
      <group scale={boss.scale}>
        <Character runtime={runtime} npc={npc} nearby={nearby} profile={profile} materials={materials} model={model} />
      </group>
      <group ref={bar} position={[0, top, 0]} visible={!progress.defeated}>
        <mesh position={[0, 0, -0.01]} material={frame}><planeGeometry args={[w + 0.14, 0.34]} /></mesh>
        {Array.from({ length: progress.total }, (_, i) => (
          <mesh key={i} position={[-w / 2 + 0.21 + i * 0.42, 0, 0]} material={i < left ? fill : empty}><planeGeometry args={[0.36, 0.2]} /></mesh>
        ))}
      </group>
      <Label text={boss.name} color={boss.color} y={top + 0.55} scale={1.1} />
    </group>
  );
}

function CheckpointView({ pos, active, materials, accent }: { pos: { x: number; y: number; z: number }; active: boolean; materials: MaterialSet; accent: string }) {
  const mat = materials.glow(active ? GREEN : accent, active ? 1.6 : 0.5);
  const pole = materials.solid("#cfd6ea", { rough: 0.4, metal: 0.5 });
  const base = materials.surface("pedestal", 1, 1);
  const cloth = useMemo(() => new THREE.MeshStandardMaterial({ color: active ? GREEN : accent, emissive: active ? GREEN : accent, emissiveIntensity: active ? 0.5 : 0.15, side: THREE.DoubleSide, roughness: 0.7 }), [active, accent]);
  useEffect(() => () => cloth.dispose(), [cloth]);
  const flag = useRef<THREE.Mesh>(null);
  const raise = useRef(active ? 1 : 0);
  useFrame(({ clock }, dt) => {
    const t = clock.elapsedTime;
    raise.current += ((active ? 1 : 0) - raise.current) * Math.min(1, dt * 3);
    const f = flag.current;
    if (!f) return;
    f.position.y = 1.05 + raise.current * 0.5;
    f.rotation.y = Math.sin(t * 3 + pos.x) * 0.22;
    f.scale.x = 1 + Math.sin(t * 5 + pos.z) * 0.06;
  });
  return (
    <group position={[pos.x, pos.y, pos.z]}>
      <mesh position={[0, 0.06, 0]} material={base}><cylinderGeometry args={[0.45, 0.5, 0.12, 14]} /></mesh>
      <mesh position={[0, 0.13, 0]} rotation={[Math.PI / 2, 0, 0]} material={mat}><torusGeometry args={[0.4, 0.03, 6, 24]} /></mesh>
      <mesh position={[0, 0.85, 0]} material={pole}><cylinderGeometry args={[0.035, 0.045, 1.6, 8]} /></mesh>
      <mesh position={[0, 1.7, 0]} material={mat}><sphereGeometry args={[0.07, 10, 8]} /></mesh>
      <mesh ref={flag} position={[0.3, 1.05, 0]} material={cloth}><planeGeometry args={[0.56, 0.34]} /></mesh>
    </group>
  );
}

const SWIRL_VERT = "varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }";
const SWIRL_FRAG = `
varying vec2 vUv; uniform float uTime; uniform vec3 uColor; uniform float uOpen; uniform float uNear;
void main(){
  vec2 p = vUv * 2.0 - 1.0;
  float r = length(p);
  if (r > 1.0) discard;
  float a = atan(p.y, p.x);
  float arms = sin(a * 3.0 + r * 9.0 - uTime * (1.2 + uOpen * 2.0));
  float rings = sin(r * 18.0 - uTime * 3.0) * 0.5 + 0.5;
  float swirl = smoothstep(-0.2, 1.0, arms) * (0.45 + 0.55 * rings);
  float core = pow(1.0 - r, 2.2);
  float edge = smoothstep(0.65, 1.0, r) * (1.0 - smoothstep(0.96, 1.0, r));
  float v = (swirl * 0.55 + core * 0.9 + edge * 0.5) * (0.28 + uOpen * 0.72 + uNear * 0.2);
  gl_FragColor = vec4(uColor * (0.6 + v), v * (0.4 + uOpen * 0.6));
}`;

function PortalView({ runtime, client, nearby, materials, profile }: { runtime: GameRuntime; client: ClientState; nearby: boolean; materials: MaterialSet; profile: RenderProfile }) {
  const portal = runtime.world.portal!;
  const area = runtime.spec.areas.find((a) => a.id === runtime.areaId)!;
  const open = area.portal!.requiresMissionIds.every((id) => client.missionsDone.includes(id));
  const theme = runtime.world.theme;
  const color = open ? theme.accent2 : GREY;
  const ring = materials.glow(color, open ? 1.8 : 0.3);
  const stone = materials.surface("pedestal", 1, 1);
  const spin = useRef<THREE.Mesh>(null);
  const runes = useRef<THREE.Group>(null);
  const swirl = useMemo(
    () => new THREE.ShaderMaterial({
      vertexShader: SWIRL_VERT,
      fragmentShader: SWIRL_FRAG,
      uniforms: { uTime: { value: 0 }, uColor: { value: new THREE.Color(color) }, uOpen: { value: open ? 1 : 0 }, uNear: { value: 0 } },
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      fog: false,
    }),
    [color, open],
  );
  useEffect(() => () => swirl.dispose(), [swirl]);
  useFrame(({ clock }, dt) => {
    const t = clock.elapsedTime;
    if (spin.current) spin.current.rotation.z = t * (open ? 1.2 : 0.2);
    if (runes.current) runes.current.rotation.z = -t * (open ? 0.6 : 0.1);
    swirl.uniforms.uTime!.value = t;
    swirl.uniforms.uNear!.value += ((nearby ? 1 : 0) - swirl.uniforms.uNear!.value) * Math.min(1, dt * 6);
  });
  return (
    <group position={[portal.x, portal.y, portal.z]}>
      <mesh position={[0, 0.1, 0]} material={stone}><cylinderGeometry args={[2.0, 2.2, 0.2, 28]} /></mesh>
      <mesh position={[0, 0.22, 0]} rotation={[Math.PI / 2, 0, 0]} material={ring}><torusGeometry args={[1.85, 0.05, 8, 48]} /></mesh>
      {([-1, 1] as const).map((s) => (
        <mesh key={s} position={[s * 1.7, 1.6, 0]} material={stone} castShadow={profile.shadows.enabled}>
          <boxGeometry args={[0.34, 3.2, 0.34]} />
        </mesh>
      ))}
      <mesh ref={spin} position={[0, 1.9, 0]} material={ring}><torusGeometry args={[1.45, 0.13, 10, 36]} /></mesh>
      <mesh position={[0, 1.9, 0]} material={swirl}>
        <circleGeometry args={[1.38, 40]} />
      </mesh>
      <group ref={runes} position={[0, 1.9, 0]}>
        {Array.from({ length: 8 }, (_, i) => (
          <mesh key={i} position={[Math.cos((i / 8) * Math.PI * 2) * 1.72, Math.sin((i / 8) * Math.PI * 2) * 1.72, 0]} rotation={[0, 0, (i / 8) * Math.PI * 2]} material={ring}>
            <boxGeometry args={[0.14, 0.05, 0.05]} />
          </mesh>
        ))}
      </group>
      <Label text={(open ? "" : "🔒 ") + portal.label} color={color} y={4.4} />
    </group>
  );
}

export function Entities({ runtime, client, nearbyKey, profile, materials, guide }: { runtime: GameRuntime; client: ClientState; nearbyKey: string | null; profile: RenderProfile; materials: MaterialSet; guide: GuideModel }) {
  const w = runtime.world;
  const activeCp = client.checkpoint?.areaId === runtime.areaId ? client.checkpoint.id : null;
  return (
    <group>
      {w.stations.map((s) => <StationView key={s.stationId} runtime={runtime} station={s} client={client} nearby={nearbyKey === `station:${s.stationId}`} profile={profile} materials={materials} />)}
      {w.npcs.map((n) => <NpcView key={n.npcId} runtime={runtime} npc={n} nearby={nearbyKey === `npc:${n.npcId}`} profile={profile} materials={materials} model={guide} />)}
      {w.bosses.map((b) => <BossView key={b.bossId} runtime={runtime} boss={b} client={client} nearby={nearbyKey === `boss:${b.bossId}`} profile={profile} materials={materials} model={guide} />)}
      {w.collectibles.map((c) => <CollectibleView key={c.itemId} runtime={runtime} item={c} profile={profile} materials={materials} accent={w.theme.accent} />)}
      {w.checkpoints.map((c) => <CheckpointView key={c.checkpointId} pos={c} active={activeCp === c.checkpointId} materials={materials} accent={w.theme.accent} />)}
      {w.portal && <PortalView runtime={runtime} client={client} nearby={nearbyKey?.startsWith("portal:") ?? false} materials={materials} profile={profile} />}
    </group>
  );
}

export { stationDone };
