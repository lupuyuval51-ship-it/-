"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { RenderProfile } from "@/config/graphics";
import type { GameRuntime } from "@/lib/game/engine/runtime";
import { mulberry32 } from "@/lib/game/util/prng";
import { makeSoftSprite } from "./materials";

/** Imperative handle so DOM/HUD code can trigger bursts without going through React state. */
export class ParticleEmitter {
  queue: { x: number; y: number; z: number; color: string; count: number; kind: "pop" | "dust" }[] = [];
  /** `pop` sparks fly up and out (pick-ups, rewards); `dust` is a low, short puff (take-off and landing). */
  burst(x: number, y: number, z: number, color: string, count = 24, kind: "pop" | "dust" = "pop"): void {
    if (this.queue.length < 8) this.queue.push({ x, y, z, color, count, kind });
  }
}

/** Ambient motes + event bursts + (Tier A) movement trail. Budgets come from the render profile. */
export function Particles({ runtime, profile, emitter, accent }: { runtime: GameRuntime; profile: RenderProfile; emitter: ParticleEmitter; accent: string }) {
  const sprite = useMemo(() => makeSoftSprite(), []);
  const ambient = profile.particles.ambient;
  const burstCap = Math.max(8, profile.particles.burst * 6);
  const trailCap = profile.particles.trails ? 60 : 0;

  const amb = useMemo(() => {
    const pos = new Float32Array(ambient * 3);
    const seed = new Float32Array(ambient * 3);
    const rnd = mulberry32(4242);
    for (let i = 0; i < ambient; i++) {
      seed.set([rnd() * 44 - 22, rnd() * 9, rnd() * 44 - 22], i * 3);
      pos.set(seed.subarray(i * 3, i * 3 + 3), i * 3);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    return { g, seed };
  }, [ambient]);

  const pool = useMemo(() => {
    const total = burstCap + trailCap;
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(total * 3), 3));
    g.setAttribute("color", new THREE.BufferAttribute(new Float32Array(total * 3), 3));
    return { g, vel: new Float32Array(total * 3), life: new Float32Array(total), base: new Float32Array(total * 3), cursor: 0, total };
  }, [burstCap, trailCap]);

  const trailClock = useRef(0);
  const col = useMemo(() => new THREE.Color(), []);

  function spawn(x: number, y: number, z: number, color: string, speed: number, up: number, lifeTime: number, from: number, to: number) {
    col.set(color);
    const i = from + ((pool.cursor++ % (to - from)));
    pool.life[i] = lifeTime;
    pool.base.set([col.r, col.g, col.b], i * 3);
    const a = Math.random() * Math.PI * 2, r = Math.random();
    pool.vel.set([Math.cos(a) * speed * r, up * (0.5 + Math.random()), Math.sin(a) * speed * r], i * 3);
    (pool.g.attributes.position as THREE.BufferAttribute).setXYZ(i, x, y, z);
  }

  useFrame(({ clock }, dt) => {
    const p = runtime.sim.player;
    const t = clock.elapsedTime;
    if (ambient) {
      const posAttr = amb.g.attributes.position as THREE.BufferAttribute;
      for (let i = 0; i < ambient; i++) {
        const sx = amb.seed[i * 3]!, sy = amb.seed[i * 3 + 1]!, sz = amb.seed[i * 3 + 2]!;
        // wrap motes around the player so density stays constant wherever they go
        const wx = ((((sx + Math.sin(t * 0.3 + i) * 0.6 - p.x + 22) % 44) + 44) % 44) - 22;
        const wz = ((((sz + Math.cos(t * 0.27 + i) * 0.6 - p.z + 22) % 44) + 44) % 44) - 22;
        posAttr.setXYZ(i, p.x + wx, p.y + 0.4 + ((sy + t * 0.25) % 9), p.z + wz);
      }
      posAttr.needsUpdate = true;
    }
    for (const b of emitter.queue.splice(0)) {
      const n = Math.min(b.count, profile.particles.burst);
      // the pool blends additively, so dust is lightened toward white to read as a pale puff on any ground
      const dust = b.kind === "dust" ? `#${new THREE.Color(b.color).lerp(new THREE.Color("#ffffff"), 0.55).getHexString()}` : b.color;
      for (let k = 0; k < n; k++) {
        if (b.kind === "dust") spawn(b.x, b.y + 0.05, b.z, dust, 2.6, 1.3, 0.4 + Math.random() * 0.25, 0, burstCap);
        else spawn(b.x, b.y, b.z, b.color, 4.2, 5.5, 0.9 + Math.random() * 0.4, 0, burstCap);
      }
    }
    if (trailCap && p.speed > 2 && p.grounded) {
      trailClock.current += dt;
      if (trailClock.current > 0.035) {
        trailClock.current = 0;
        spawn(p.x, p.y + 0.12, p.z, accent, 0.4, 0.5, 0.55, burstCap, pool.total);
      }
    }
    const pos = pool.g.attributes.position as THREE.BufferAttribute;
    const colors = pool.g.attributes.color as THREE.BufferAttribute;
    for (let i = 0; i < pool.total; i++) {
      if (pool.life[i]! > 0) {
        pool.life[i]! -= dt;
        pool.vel[i * 3 + 1]! -= 9 * dt * (i < burstCap ? 1 : 0.1);
        pos.setXYZ(i, pos.getX(i) + pool.vel[i * 3]! * dt, pos.getY(i) + pool.vel[i * 3 + 1]! * dt, pos.getZ(i) + pool.vel[i * 3 + 2]! * dt);
      }
      const f = Math.max(0, Math.min(1, pool.life[i]!));
      colors.setXYZ(i, pool.base[i * 3]! * f, pool.base[i * 3 + 1]! * f, pool.base[i * 3 + 2]! * f);
    }
    pos.needsUpdate = true;
    colors.needsUpdate = true;
  });

  return (
    <>
      {ambient > 0 && (
        <points geometry={amb.g} frustumCulled={false}>
          <pointsMaterial map={sprite} color={accent} size={0.22} transparent opacity={0.55} depthWrite={false} blending={THREE.AdditiveBlending} sizeAttenuation />
        </points>
      )}
      <points geometry={pool.g} frustumCulled={false}>
        <pointsMaterial map={sprite} vertexColors size={0.38} transparent depthWrite={false} blending={THREE.AdditiveBlending} sizeAttenuation />
      </points>
    </>
  );
}
