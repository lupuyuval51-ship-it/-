"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { RenderProfile } from "@/config/graphics";
import type { GameRuntime } from "@/lib/game/engine/runtime";
import { stationActive, stationDone, type ClientState } from "@/lib/game/state/progress";
import type { WorldCollectible, WorldNpc, WorldStation } from "@/lib/game/world/types";
import { makeLabelTexture, makeSoftSprite, type MaterialSet } from "./materials";

const GREEN = "#34d399";
const GREY = "#7b8499";

function Label({ text, color, y, scale = 1 }: { text: string; color: string; y: number; scale?: number }) {
  const { texture, aspect } = useMemo(() => makeLabelTexture(text, color), [text, color]);
  useEffect(() => () => texture.dispose(), [texture]);
  const h = 0.46 * scale;
  return (
    <sprite position={[0, y, 0]} scale={[h * aspect, h, 1]}>
      <spriteMaterial map={texture} transparent depthWrite={false} fog={false} />
    </sprite>
  );
}

function Halo({ color, size, y }: { color: string; size: number; y: number }) {
  const tex = useMemo(() => makeSoftSprite(), []);
  useEffect(() => () => tex.dispose(), [tex]);
  return (
    <sprite position={[0, y, 0]} scale={[size, size, 1]}>
      <spriteMaterial map={tex} color={color} transparent opacity={0.55} depthWrite={false} blending={THREE.AdditiveBlending} fog={false} />
    </sprite>
  );
}

function StationView({ runtime, station, client, nearby, profile, materials }: { runtime: GameRuntime; station: WorldStation; client: ClientState; nearby: boolean; profile: RenderProfile; materials: MaterialSet }) {
  const ring = useRef<THREE.Mesh>(null);
  const group = useRef<THREE.Group>(null);
  const area = runtime.spec.areas.find((a) => a.id === runtime.areaId)!;
  const def = area.stations.find((s) => s.id === station.stationId)!;
  const done = stationDone(client, station.stationId);
  const active = stationActive(runtime.spec, client, def);
  const theme = runtime.world.theme;
  const color = done ? GREEN : active ? (station.kind === "lore" ? theme.accent2 : theme.accent) : GREY;
  const glow = materials.glow(color, done ? 0.8 : active ? 1.6 : 0.25);
  const pad = materials.surface("stationPad", 2, 2);
  const shadows = profile.shadows.enabled;

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (ring.current) {
      ring.current.rotation.z = t * (active && !done ? 1.4 : 0.3);
      ring.current.position.y = 2.05 + Math.sin(t * 2 + station.x) * 0.08;
    }
    if (group.current) group.current.scale.setScalar(THREE.MathUtils.lerp(group.current.scale.x, nearby ? 1.1 : 1, 0.15));
  });

  return (
    <group position={[station.x, station.y, station.z]}>
      <group ref={group}>
        <mesh position={[0, 0.12, 0]} material={pad} castShadow={shadows} receiveShadow={shadows}>
          <cylinderGeometry args={[0.95, 1.1, 0.24, 20]} />
        </mesh>
        <mesh position={[0, 0.85, 0]} material={pad} castShadow={shadows}>
          <boxGeometry args={[0.95, 1.2, 0.3]} />
        </mesh>
        <mesh position={[0, 1.0, -0.17]} material={glow}>
          <planeGeometry args={[0.72, 0.8]} />
        </mesh>
        <mesh ref={ring} position={[0, 2.05, 0]} rotation={[Math.PI / 2, 0, 0]} material={glow}>
          {station.kind === "lore" ? <octahedronGeometry args={[0.42, 0]} /> : <torusGeometry args={[0.55, 0.07, 8, 28]} />}
        </mesh>
      </group>
      {profile.glow && <Halo color={color} size={done ? 2.4 : 4.2} y={1.3} />}
      <Label text={(done ? "✓ " : "") + station.label} color={color} y={3.0} />
    </group>
  );
}

function NpcView({ runtime, npc, nearby, profile, materials }: { runtime: GameRuntime; npc: WorldNpc; nearby: boolean; profile: RenderProfile; materials: MaterialSet }) {
  const g = useRef<THREE.Group>(null);
  const mat = useMemo(() => materials.glow(npc.color, 0.35), [materials, npc.color]);
  const dark = materials.surface("pedestal", 1, 1);
  const shadows = profile.shadows.enabled;
  useFrame(({ clock }) => {
    const p = runtime.sim.player;
    const grp = g.current;
    if (!grp) return;
    const target = Math.atan2(p.x - npc.x, p.z - npc.z);
    let d = target - grp.rotation.y;
    while (d > Math.PI) d -= Math.PI * 2;
    while (d < -Math.PI) d += Math.PI * 2;
    grp.rotation.y += d * 0.08;
    grp.position.y = npc.y + (npc.shape === "orb" ? 1.1 + Math.sin(clock.elapsedTime * 2) * 0.12 : Math.sin(clock.elapsedTime * 2.2 + npc.x) * 0.03);
    const s = THREE.MathUtils.lerp(grp.scale.x, nearby ? 1.08 : 1, 0.15);
    grp.scale.setScalar(s);
  });
  return (
    <group position={[npc.x, 0, npc.z]}>
      <group ref={g}>
        {npc.shape === "robot" && (
          <>
            <mesh position={[0, 0.8, 0]} material={mat} castShadow={shadows}><boxGeometry args={[0.8, 0.9, 0.55]} /></mesh>
            <mesh position={[0, 1.55, 0]} material={mat} castShadow={shadows}><boxGeometry args={[0.6, 0.5, 0.5]} /></mesh>
            <mesh position={[-0.14, 1.58, 0.26]} material={dark}><sphereGeometry args={[0.07, 8, 8]} /></mesh>
            <mesh position={[0.14, 1.58, 0.26]} material={dark}><sphereGeometry args={[0.07, 8, 8]} /></mesh>
            <mesh position={[0, 1.95, 0]} material={dark}><cylinderGeometry args={[0.03, 0.03, 0.3, 6]} /></mesh>
          </>
        )}
        {npc.shape === "human" && (
          <>
            <mesh position={[0, 0.85, 0]} material={mat} castShadow={shadows}><capsuleGeometry args={[0.3, 0.7, 4, 10]} /></mesh>
            <mesh position={[0, 1.6, 0]} material={dark} castShadow={shadows}><sphereGeometry args={[0.27, 12, 10]} /></mesh>
            <mesh position={[0, 1.78, 0]} material={mat}><coneGeometry args={[0.3, 0.3, 12]} /></mesh>
          </>
        )}
        {npc.shape === "creature" && (
          <>
            <mesh position={[0, 0.65, 0]} material={mat} castShadow={shadows}><sphereGeometry args={[0.6, 14, 12]} /></mesh>
            <mesh position={[-0.3, 1.25, 0]} material={mat}><coneGeometry args={[0.15, 0.4, 8]} /></mesh>
            <mesh position={[0.3, 1.25, 0]} material={mat}><coneGeometry args={[0.15, 0.4, 8]} /></mesh>
            <mesh position={[-0.2, 0.8, 0.5]} material={dark}><sphereGeometry args={[0.09, 8, 8]} /></mesh>
            <mesh position={[0.2, 0.8, 0.5]} material={dark}><sphereGeometry args={[0.09, 8, 8]} /></mesh>
          </>
        )}
        {npc.shape === "orb" && (
          <>
            <mesh position={[0, 0, 0]} material={mat}><sphereGeometry args={[0.5, 16, 14]} /></mesh>
            <mesh rotation={[Math.PI / 2.4, 0, 0]} material={dark}><torusGeometry args={[0.75, 0.04, 8, 28]} /></mesh>
          </>
        )}
      </group>
      <Label text={npc.name} color={npc.color} y={2.55} scale={0.9} />
    </group>
  );
}

function CollectibleView({ runtime, item, profile, materials, accent }: { runtime: GameRuntime; item: WorldCollectible; profile: RenderProfile; materials: MaterialSet; accent: string }) {
  const ref = useRef<THREE.Group>(null);
  const colors: Record<string, string> = { gem: "#4cf3ff", "data-core": "#ff6ad5", star: "#ffd23f", leaf: "#7be26b", coin: "#ffc63d" };
  const color = colors[item.kind] ?? accent;
  const mat = materials.glow(color, 1.5);
  useFrame(({ clock }) => {
    const g = ref.current;
    if (!g) return;
    g.visible = !runtime.isCollected(item.itemId);
    g.rotation.y = clock.elapsedTime * 1.8;
    g.position.y = item.y + Math.sin(clock.elapsedTime * 2.4 + item.x) * 0.12;
  });
  return (
    <group position={[item.x, item.y, item.z]}>
      <group ref={ref}>
        <mesh material={mat} castShadow={profile.shadows.enabled}>
          {item.kind === "coin" ? <cylinderGeometry args={[0.32, 0.32, 0.08, 16]} /> : item.kind === "data-core" ? <boxGeometry args={[0.4, 0.4, 0.4]} /> : item.kind === "leaf" ? <coneGeometry args={[0.25, 0.6, 6]} /> : item.kind === "star" ? <octahedronGeometry args={[0.38, 0]} /> : <octahedronGeometry args={[0.3, 0]} />}
        </mesh>
        {profile.glow && <Halo color={color} size={1.2} y={0} />}
      </group>
    </group>
  );
}

function CheckpointView({ pos, active, materials, accent }: { pos: { x: number; y: number; z: number }; active: boolean; materials: MaterialSet; accent: string }) {
  const mat = materials.glow(active ? GREEN : accent, active ? 1.6 : 0.5);
  const base = materials.surface("pedestal", 1, 1);
  const ring = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (ring.current) ring.current.rotation.z = clock.elapsedTime * 1.5;
  });
  return (
    <group position={[pos.x, pos.y, pos.z]}>
      <mesh position={[0, 0.7, 0]} material={base}><cylinderGeometry args={[0.07, 0.1, 1.4, 8]} /></mesh>
      <mesh ref={ring} position={[0, 1.5, 0]} rotation={[Math.PI / 2, 0, 0]} material={mat}><torusGeometry args={[0.32, 0.05, 8, 18]} /></mesh>
    </group>
  );
}

function PortalView({ runtime, client, nearby, materials }: { runtime: GameRuntime; client: ClientState; nearby: boolean; materials: MaterialSet }) {
  const portal = runtime.world.portal!;
  const area = runtime.spec.areas.find((a) => a.id === runtime.areaId)!;
  const open = area.portal!.requiresMissionIds.every((id) => client.missionsDone.includes(id));
  const theme = runtime.world.theme;
  const color = open ? theme.accent2 : GREY;
  const ring = materials.glow(color, open ? 1.8 : 0.3);
  const disc = useRef<THREE.Mesh>(null);
  const spin = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (spin.current) spin.current.rotation.z = t * (open ? 1.2 : 0.2);
    if (disc.current) (disc.current.material as THREE.MeshBasicMaterial).opacity = (open ? 0.3 : 0.1) + Math.sin(t * 3) * 0.07 + (nearby ? 0.12 : 0);
  });
  return (
    <group position={[portal.x, portal.y, portal.z]}>
      <mesh ref={spin} position={[0, 1.9, 0]} material={ring}><torusGeometry args={[1.45, 0.13, 10, 36]} /></mesh>
      <mesh ref={disc} position={[0, 1.9, 0]}>
        <circleGeometry args={[1.35, 28]} />
        <meshBasicMaterial color={color} transparent opacity={0.3} side={THREE.DoubleSide} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
      <Label text={(open ? "" : "🔒 ") + portal.label} color={color} y={4.1} />
    </group>
  );
}

export function Entities({ runtime, client, nearbyKey, profile, materials }: { runtime: GameRuntime; client: ClientState; nearbyKey: string | null; profile: RenderProfile; materials: MaterialSet }) {
  const w = runtime.world;
  const activeCp = client.checkpoint?.areaId === runtime.areaId ? client.checkpoint.id : null;
  return (
    <group>
      {w.stations.map((s) => <StationView key={s.stationId} runtime={runtime} station={s} client={client} nearby={nearbyKey === `station:${s.stationId}`} profile={profile} materials={materials} />)}
      {w.npcs.map((n) => <NpcView key={n.npcId} runtime={runtime} npc={n} nearby={nearbyKey === `npc:${n.npcId}`} profile={profile} materials={materials} />)}
      {w.collectibles.map((c) => <CollectibleView key={c.itemId} runtime={runtime} item={c} profile={profile} materials={materials} accent={w.theme.accent} />)}
      {w.checkpoints.map((c) => <CheckpointView key={c.checkpointId} pos={c} active={activeCp === c.checkpointId} materials={materials} accent={w.theme.accent} />)}
      {w.portal && <PortalView runtime={runtime} client={client} nearby={nearbyKey?.startsWith("portal:") ?? false} materials={materials} />}
    </group>
  );
}

export { stationDone };
