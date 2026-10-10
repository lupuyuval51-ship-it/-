"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { RenderProfile } from "@/config/graphics";
import type { GameRuntime } from "@/lib/game/engine/runtime";
import type { MaterialSet } from "./materials";

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

/**
 * The player: "Nova", a small robot built from primitives. Articulated arms and legs with a walk/run cycle, forward
 * lean, breathing, head sway and blinking when idle, a stretch on take-off, a squash on landing, jetpack vents that
 * flare while airborne, and an antenna that lags behind the motion.
 */
export function PlayerAvatar({ runtime, profile, materials, accent }: { runtime: GameRuntime; profile: RenderProfile; materials: MaterialSet; accent: string }) {
  const root = useRef<THREE.Group>(null);
  const body = useRef<THREE.Group>(null);
  const torso = useRef<THREE.Group>(null);
  const head = useRef<THREE.Group>(null);
  const legL = useRef<THREE.Group>(null);
  const legR = useRef<THREE.Group>(null);
  const armL = useRef<THREE.Group>(null);
  const armR = useRef<THREE.Group>(null);
  const antenna = useRef<THREE.Group>(null);
  const eyes = useRef<THREE.Group>(null);
  const flames = useRef<THREE.Group>(null);
  const phase = useRef(0);
  const squash = useRef(0);
  const stretch = useRef(0);
  const wasGrounded = useRef(true);
  const idle = useRef(0);
  const lean = useRef(0);
  const shadows = profile.shadows.enabled;

  const shell = materials.solid("#eef2ff", { rough: 0.42, metal: 0.2 });
  const shellDark = materials.solid("#aab4d6", { rough: 0.5, metal: 0.3 });
  const visor = materials.solid("#0b1230", { rough: 0.15, metal: 0.6 });
  const trim = materials.glow(accent, 0.9);
  const eye = materials.flat("#ffffff");
  const boot = materials.solid("#3a4468", { rough: 0.6, metal: 0.3 });
  const flame = materials.flat("#ffb347");

  useFrame(({ clock }, dt) => {
    const p = runtime.sim.player;
    const g = root.current;
    if (!g) return;
    const t = clock.elapsedTime;
    g.position.set(p.x, p.y, p.z);
    g.rotation.y = p.yaw;
    const speed = clamp(p.speed / 6, 0, 1.5);
    const moving = p.speed > 0.4 && p.grounded;
    phase.current += dt * (5.2 + p.speed * 1.05);
    idle.current = p.speed < 0.3 && p.grounded ? idle.current + dt : 0;

    const swing = moving ? Math.sin(phase.current) * 0.95 * Math.min(1, speed) : 0;
    const air = !p.grounded;
    if (legL.current && legR.current) {
      legL.current.rotation.x = air ? 0.55 : swing;
      legR.current.rotation.x = air ? -0.35 : -swing;
    }
    if (armL.current && armR.current) {
      if (air) {
        armL.current.rotation.set(-1.1, 0, 0.55);
        armR.current.rotation.set(-1.1, 0, -0.55);
      } else {
        const breathe = Math.sin(t * 2) * 0.04;
        armL.current.rotation.set(-swing * 0.9 + breathe, 0, 0.08);
        armR.current.rotation.set(swing * 0.9 - breathe, 0, -0.08);
      }
    }

    if (p.grounded && !wasGrounded.current) squash.current = 1;
    if (!p.grounded && wasGrounded.current && p.vy > 0) stretch.current = 1;
    wasGrounded.current = p.grounded;
    squash.current = Math.max(0, squash.current - dt * 6);
    stretch.current = Math.max(0, stretch.current - dt * 3.5);

    lean.current += ((moving ? -0.16 * Math.min(1, speed) : 0) - lean.current) * Math.min(1, dt * 9);
    if (body.current) {
      const s = 1 - squash.current * 0.2 + stretch.current * 0.1;
      const w = 1 + squash.current * 0.14 - stretch.current * 0.06;
      body.current.scale.set(w, s, w);
      body.current.rotation.x = lean.current;
      body.current.position.y = moving ? Math.abs(Math.sin(phase.current)) * 0.06 * Math.min(1, speed) : 0;
    }
    if (torso.current) torso.current.scale.y = 1 + Math.sin(t * 2.1) * (moving ? 0.008 : 0.02);
    if (head.current) {
      const look = idle.current > 1.5 ? Math.sin(t * 0.7) * 0.35 : 0;
      head.current.rotation.y += (look - head.current.rotation.y) * Math.min(1, dt * 4);
      head.current.rotation.x = moving ? 0.06 : Math.sin(t * 1.3) * 0.03;
    }
    if (antenna.current) antenna.current.rotation.z = Math.sin(t * 3.2) * 0.12 + (moving ? Math.sin(phase.current * 2) * 0.22 : 0);
    if (eyes.current) eyes.current.scale.y = t % 3.6 < 0.12 ? 0.12 : air ? 0.7 : 1;
    if (flames.current) {
      const f = air && p.vy > -2 ? 1 : 0.0001;
      flames.current.scale.setScalar(THREE.MathUtils.lerp(flames.current.scale.x, f, Math.min(1, dt * 14)));
    }
  });

  return (
    <group ref={root} name="player" scale={0.95}>
      <group ref={body}>
        {/* legs: pivot at the hip */}
        {([-1, 1] as const).map((side) => (
          <group key={side} ref={side < 0 ? legL : legR} position={[side * 0.14, 0.72, 0]}>
            <mesh position={[0, -0.28, 0]} material={shell} castShadow={shadows}>
              <capsuleGeometry args={[0.085, 0.38, 4, 8]} />
            </mesh>
            <mesh position={[0, -0.58, -0.04]} material={boot} castShadow={shadows}>
              <boxGeometry args={[0.2, 0.12, 0.3]} />
            </mesh>
            <mesh position={[0, -0.5, -0.0]} material={trim}>
              <torusGeometry args={[0.09, 0.016, 6, 14]} />
            </mesh>
          </group>
        ))}
        {/* hips */}
        <mesh position={[0, 0.74, 0]} material={shellDark} scale={[1, 0.7, 0.9]} castShadow={shadows}>
          <sphereGeometry args={[0.2, 12, 10]} />
        </mesh>

        <group ref={torso} position={[0, 1.12, 0]}>
          <mesh material={shell} scale={[1, 1, 0.84]} castShadow={shadows}>
            <capsuleGeometry args={[0.26, 0.3, 6, 12]} />
          </mesh>
          {/* chest emblem and belt */}
          <mesh position={[0, 0.06, -0.225]} material={trim}>
            <boxGeometry args={[0.2, 0.14, 0.03]} />
          </mesh>
          <mesh position={[0, -0.2, 0]} rotation={[Math.PI / 2, 0, 0]} material={trim} scale={[1, 0.84, 1]}>
            <torusGeometry args={[0.265, 0.02, 6, 20]} />
          </mesh>
          {/* arms: pivot at the shoulder */}
          {([-1, 1] as const).map((side) => (
            <group key={side} ref={side < 0 ? armL : armR} position={[side * 0.34, 0.2, 0]}>
              <mesh position={[0, -0.22, 0]} material={shell} castShadow={shadows}>
                <capsuleGeometry args={[0.07, 0.3, 4, 8]} />
              </mesh>
              <mesh position={[0, -0.47, 0]} material={shellDark}>
                <sphereGeometry args={[0.09, 10, 8]} />
              </mesh>
              <mesh position={[0, 0.02, 0]} material={trim}>
                <sphereGeometry args={[0.085, 10, 8]} />
              </mesh>
            </group>
          ))}
          {/* jetpack */}
          <mesh position={[0, 0.02, 0.27]} material={shellDark} castShadow={shadows}>
            <boxGeometry args={[0.32, 0.4, 0.14]} />
          </mesh>
          <group ref={flames} position={[0, -0.22, 0.27]}>
            {([-1, 1] as const).map((s) => (
              <mesh key={s} position={[s * 0.08, -0.12, 0]} rotation={[Math.PI, 0, 0]} material={flame}>
                <coneGeometry args={[0.055, 0.26, 8]} />
              </mesh>
            ))}
          </group>
        </group>

        <mesh position={[0, 1.42, 0]} material={shellDark}>
          <cylinderGeometry args={[0.08, 0.1, 0.1, 8]} />
        </mesh>

        <group ref={head} position={[0, 1.65, 0]}>
          <mesh material={shell} castShadow={shadows}>
            <sphereGeometry args={[0.3, 20, 16]} />
          </mesh>
          {/* dark visor with glowing eyes */}
          <mesh position={[0, -0.01, -0.2]} material={visor} scale={[1, 0.74, 0.5]}>
            <sphereGeometry args={[0.25, 20, 14]} />
          </mesh>
          <group ref={eyes} position={[0, 0.0, -0.312]}>
            {([-1, 1] as const).map((s) => (
              <mesh key={s} position={[s * 0.095, 0, 0]} material={eye} scale={[1, 1.35, 0.5]}>
                <sphereGeometry args={[0.045, 10, 8]} />
              </mesh>
            ))}
          </group>
          {/* ear discs */}
          {([-1, 1] as const).map((s) => (
            <mesh key={s} position={[s * 0.3, 0, 0]} rotation={[0, 0, Math.PI / 2]} material={trim}>
              <cylinderGeometry args={[0.075, 0.075, 0.05, 14]} />
            </mesh>
          ))}
          {/* antenna */}
          <group ref={antenna} position={[0.04, 0.28, 0.02]}>
            <mesh position={[0, 0.1, 0]} material={shellDark}>
              <cylinderGeometry args={[0.012, 0.012, 0.2, 6]} />
            </mesh>
            <mesh position={[0, 0.22, 0]} material={trim}>
              <sphereGeometry args={[0.045, 10, 8]} />
            </mesh>
          </group>
        </group>
      </group>
    </group>
  );
}
