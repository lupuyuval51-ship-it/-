"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { RenderProfile } from "@/config/graphics";
import type { GameRuntime } from "@/lib/game/engine/runtime";
import type { WorldCollectible } from "@/lib/game/world/types";
import { Halo } from "./Marks";
import type { MaterialSet } from "./materials";

const COLORS: Record<string, string> = { gem: "#4cf3ff", "data-core": "#ff6ad5", star: "#ffd23f", leaf: "#7be26b", coin: "#ffc63d" };
const SPARKS = 7;

function starGeometry(): THREE.BufferGeometry {
  const s = new THREE.Shape();
  for (let i = 0; i < 10; i++) {
    const r = i % 2 === 0 ? 0.42 : 0.19;
    const a = Math.PI / 2 + (i * Math.PI) / 5;
    const x = Math.cos(a) * r, y = Math.sin(a) * r;
    if (i === 0) s.moveTo(x, y);
    else s.lineTo(x, y);
  }
  s.closePath();
  const g = new THREE.ExtrudeGeometry(s, { depth: 0.1, bevelEnabled: true, bevelThickness: 0.035, bevelSize: 0.035, bevelSegments: 1 });
  g.center();
  return g;
}

function leafGeometry(): THREE.BufferGeometry {
  const s = new THREE.Shape();
  s.moveTo(0, -0.38);
  s.bezierCurveTo(0.36, -0.14, 0.32, 0.26, 0, 0.46);
  s.bezierCurveTo(-0.32, 0.26, -0.36, -0.14, 0, -0.38);
  const g = new THREE.ExtrudeGeometry(s, { depth: 0.04, bevelEnabled: true, bevelThickness: 0.02, bevelSize: 0.02, bevelSegments: 1 });
  g.center();
  return g;
}

/**
 * A pick-up. Each kind has its own silhouette, hovers and spins, leans toward you when you are close, and bursts into
 * sparks when collected. Collection itself is decided by the simulation; this only draws it.
 */
export function CollectibleView({ runtime, item, profile, materials, accent }: { runtime: GameRuntime; item: WorldCollectible; profile: RenderProfile; materials: MaterialSet; accent: string }) {
  const root = useRef<THREE.Group>(null);
  const body = useRef<THREE.Group>(null);
  const inner = useRef<THREE.Mesh>(null);
  const sparks = useRef<THREE.Group>(null);
  const shock = useRef<THREE.Mesh>(null);
  const was = useRef(false);
  const pop = useRef(0);
  const color = COLORS[item.kind] ?? accent;
  const mat = materials.glow(color, 1.5);
  const bright = materials.glow("#ffffff", 1.2);
  const shadows = profile.shadows.enabled;

  const geo = useMemo(() => (item.kind === "star" ? starGeometry() : item.kind === "leaf" ? leafGeometry() : null), [item.kind]);
  useEffect(() => () => geo?.dispose(), [geo]);
  const edges = useMemo(() => (item.kind === "data-core" ? new THREE.EdgesGeometry(new THREE.BoxGeometry(0.5, 0.5, 0.5)) : null), [item.kind]);
  useEffect(() => () => edges?.dispose(), [edges]);
  const lineMat = useMemo(() => new THREE.LineBasicMaterial({ color, toneMapped: false }), [color]);
  useEffect(() => () => lineMat.dispose(), [lineMat]);
  const shockMat = useMemo(() => new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending, fog: false }), [color]);
  useEffect(() => () => shockMat.dispose(), [shockMat]);

  useFrame(({ clock }, dt) => {
    const g = root.current, b = body.current;
    if (!g || !b) return;
    const t = clock.elapsedTime;
    const collected = runtime.isCollected(item.itemId);
    if (collected && !was.current) pop.current = 1;
    was.current = collected;
    b.visible = !collected;
    if (!collected) {
      const p = runtime.sim.player;
      const dx = p.x - item.x, dz = p.z - item.z, dy = p.y + 0.9 - item.y;
      const d = Math.hypot(dx, dy, dz);
      const pull = d < 3 ? (1 - d / 3) * 0.35 : 0;
      g.position.set(item.x + (dx / (d || 1)) * pull, item.y + Math.sin(t * 2.4 + item.x) * 0.12 + (dy / (d || 1)) * pull * 0.5, item.z + (dz / (d || 1)) * pull);
      const s = 1 + (d < 3 ? (1 - d / 3) * 0.18 : 0);
      b.scale.setScalar(s);
      b.rotation.y = t * (d < 3 ? 3.4 : 1.8);
      if (item.kind === "data-core") b.rotation.x = t * 0.9;
      if (item.kind === "leaf") b.rotation.z = Math.sin(t * 1.6) * 0.35;
      if (inner.current) inner.current.rotation.set(t * 1.4, t * 1.9, 0);
    }
    if (pop.current > 0) {
      pop.current = Math.max(0, pop.current - dt * 2.4);
      const k = 1 - pop.current;
      if (sparks.current) {
        sparks.current.visible = true;
        sparks.current.position.copy(g.position);
        sparks.current.children.forEach((c, i) => {
          const a = (i / SPARKS) * Math.PI * 2;
          const r = k * 1.1;
          c.position.set(Math.cos(a) * r, k * 0.9 + Math.sin(i * 1.7) * 0.15 * k, Math.sin(a) * r);
          c.scale.setScalar(Math.max(0.0001, 1 - k) * 1.2);
        });
        if (pop.current === 0) sparks.current.visible = false;
      }
      if (shock.current) {
        shock.current.visible = pop.current > 0;
        shock.current.scale.setScalar(0.3 + k * 2.2);
        shockMat.opacity = (1 - k) * 0.8;
      }
    }
  });

  const model = (() => {
    switch (item.kind) {
      case "coin":
        return (
          <group rotation={[Math.PI / 2, 0, 0]}>
            <mesh material={mat} castShadow={shadows}><cylinderGeometry args={[0.32, 0.32, 0.07, 20]} /></mesh>
            <mesh material={bright}><torusGeometry args={[0.32, 0.03, 6, 24]} /></mesh>
            <mesh position={[0, 0.045, 0]} material={bright}><cylinderGeometry args={[0.17, 0.17, 0.02, 14]} /></mesh>
          </group>
        );
      case "data-core":
        return (
          <>
            <mesh ref={inner} material={bright}><boxGeometry args={[0.2, 0.2, 0.2]} /></mesh>
            {edges && <lineSegments geometry={edges} material={lineMat} />}
            <mesh material={mat} scale={1.0}><boxGeometry args={[0.36, 0.36, 0.36]} /></mesh>
          </>
        );
      case "star":
        return geo ? <mesh geometry={geo} material={mat} castShadow={shadows} /> : null;
      case "leaf":
        return (
          <>
            {geo && <mesh geometry={geo} material={mat} castShadow={shadows} rotation={[0, 0, 0.4]} />}
            <mesh position={[0.1, -0.33, 0]} rotation={[0, 0, 0.4]} material={bright}><cylinderGeometry args={[0.014, 0.014, 0.24, 5]} /></mesh>
          </>
        );
      default:
        return (
          <>
            <mesh material={mat} scale={[1, 1.5, 1]} castShadow={shadows}><octahedronGeometry args={[0.26, 0]} /></mesh>
            <mesh ref={inner} material={bright} scale={[1, 1.5, 1]}><octahedronGeometry args={[0.12, 0]} /></mesh>
          </>
        );
    }
  })();

  return (
    <group>
      <group ref={root} position={[item.x, item.y, item.z]}>
        <group ref={body}>
          {model}
          {profile.glow && <Halo color={color} size={1.35} y={0} />}
        </group>
      </group>
      <group ref={sparks} position={[item.x, item.y, item.z]} visible={false}>
        {Array.from({ length: SPARKS }, (_, i) => (
          <mesh key={i} material={mat}><octahedronGeometry args={[0.08, 0]} /></mesh>
        ))}
      </group>
      <mesh ref={shock} position={[item.x, item.y, item.z]} rotation={[-Math.PI / 2, 0, 0]} material={shockMat} visible={false}>
        <ringGeometry args={[0.8, 1, 28]} />
      </mesh>
    </group>
  );
}
