"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { RenderProfile } from "@/config/graphics";
import type { GameRuntime } from "@/lib/game/engine/runtime";
import type { MaterialSet } from "./materials";

/** The player: a small robot built from primitives, with a walk cycle and landing squash. */
export function PlayerAvatar({ runtime, profile, materials, accent }: { runtime: GameRuntime; profile: RenderProfile; materials: MaterialSet; accent: string }) {
  const root = useRef<THREE.Group>(null);
  const body = useRef<THREE.Group>(null);
  const legL = useRef<THREE.Mesh>(null);
  const legR = useRef<THREE.Mesh>(null);
  const phase = useRef(0);
  const squash = useRef(0);
  const wasGrounded = useRef(true);
  const shadows = profile.shadows.enabled;
  const shell = materials.surface("avatar", 1, 1);
  const glow = materials.glow(accent, 1.4);

  useFrame((_, dt) => {
    const p = runtime.sim.player;
    const g = root.current;
    if (!g) return;
    g.position.set(p.x, p.y, p.z);
    g.rotation.y = p.yaw;
    const speed = Math.min(1, p.speed / 6);
    phase.current += dt * (6 + p.speed * 0.9);
    const swing = p.grounded ? Math.sin(phase.current) * 0.9 * speed : 0.7;
    if (legL.current) legL.current.rotation.x = swing;
    if (legR.current) legR.current.rotation.x = -swing;
    if (p.grounded && !wasGrounded.current) squash.current = 1;
    wasGrounded.current = p.grounded;
    squash.current = Math.max(0, squash.current - dt * 6);
    if (body.current) {
      const s = 1 - squash.current * 0.18;
      body.current.scale.set(1 + squash.current * 0.12, s, 1 + squash.current * 0.12);
      body.current.position.y = p.grounded ? Math.abs(Math.sin(phase.current)) * 0.05 * speed : 0;
    }
  });

  return (
    <group ref={root} name="player">
      <group ref={body}>
        <mesh position={[0, 0.86, 0]} material={shell} castShadow={shadows}>
          <capsuleGeometry args={[0.27, 0.5, 4, 10]} />
        </mesh>
        <mesh position={[0, 1.5, 0]} material={shell} castShadow={shadows}>
          <sphereGeometry args={[0.27, 14, 12]} />
        </mesh>
        <mesh position={[0, 1.52, -0.19]} material={glow}>
          <boxGeometry args={[0.36, 0.1, 0.1]} />
        </mesh>
        <mesh position={[0, 0.9, 0.3]} material={glow}>
          <boxGeometry args={[0.28, 0.4, 0.1]} />
        </mesh>
        <mesh ref={legL} position={[-0.14, 0.38, 0]} material={shell} castShadow={shadows}>
          <boxGeometry args={[0.16, 0.5, 0.18]} />
        </mesh>
        <mesh ref={legR} position={[0.14, 0.38, 0]} material={shell} castShadow={shadows}>
          <boxGeometry args={[0.16, 0.5, 0.18]} />
        </mesh>
      </group>
    </group>
  );
}
