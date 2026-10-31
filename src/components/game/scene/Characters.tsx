"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { RenderProfile } from "@/config/graphics";
import type { GameRuntime } from "@/lib/game/engine/runtime";
import type { GuideModel } from "@/lib/game/state/guidance";
import type { WorldNpc } from "@/lib/game/world/types";
import type { MaterialSet } from "./materials";

const SKIN = ["#f1c9a5", "#e0a97d", "#c68863", "#a46a45", "#7a4a2e", "#fbd9c0"];
const HAIR = ["#2b1d14", "#5a3a22", "#a0522d", "#d9b36c", "#1c1c28", "#8a8f99"];

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

const shade = (hex: string, f: number) => `#${new THREE.Color(hex).multiplyScalar(f).getHexString()}`;

/** What three.js draws for a colour it is not given: the hair of a character whose hair index falls outside the palette. */
const UNSET_COLOUR = "#ffffff";

export interface HumanLook {
  skin: string;
  hair: string;
  /** 0 short, 1 bun, 2 spiky, 3 cap; below 0 no hair at all. */
  style: number;
  glasses: boolean;
}

/**
 * The look of a human character, fixed by its id. The hair and style indexes use a signed shift of the unsigned hash, so
 * for about half of all ids (every `n-0`…`n-9` the topic library and the study engine give their guide) they are negative:
 * those characters are drawn without hair, or with white hair (an index outside the palette used to reach the material as
 * `undefined`, which three.js drew white with a console warning). That is the look players know, so it is kept as it is,
 * only spelled out; giving them the palette's hair is a visible design change and a decision of its own.
 */
export function humanLook(npcId: string): HumanLook {
  const h = hash(npcId);
  return {
    skin: SKIN[h % SKIN.length]!,
    hair: HAIR[(h >> 3) % HAIR.length] ?? UNSET_COLOUR,
    style: (h >> 6) % 4,
    glasses: (h >> 9) % 3 === 0,
  };
}

interface NpcProps {
  runtime: GameRuntime;
  npc: WorldNpc;
  nearby: boolean;
  profile: RenderProfile;
  materials: MaterialSet;
  model: GuideModel;
}

/** Turn smoothly to face the player and report how close they are (for waving / looking). */
function useFacing(runtime: GameRuntime, npc: WorldNpc) {
  const g = useRef<THREE.Group>(null);
  const info = useRef({ dist: 99 });
  const face = (dt: number) => {
    const grp = g.current;
    if (!grp) return;
    const p = runtime.sim.player;
    const dx = p.x - npc.x, dz = p.z - npc.z;
    const dist = Math.hypot(dx, dz);
    info.current.dist = dist;
    // NPC models look along −z; rotate so that −z points at the player. Idle NPCs far away keep their own facing.
    const want = dist < 14 ? Math.atan2(-dx, -dz) : npc.facing;
    let d = want - grp.rotation.y;
    while (d > Math.PI) d -= Math.PI * 2;
    while (d < -Math.PI) d += Math.PI * 2;
    grp.rotation.y += d * Math.min(1, dt * 4);
  };
  return [g, face, info] as const;
}

/** A bobbing golden "!" over characters the player still has to talk to for the current mission. */
function QuestMark({ npcId, model, y, materials }: { npcId: string; model: GuideModel; y: number; materials: MaterialSet }) {
  const ref = useRef<THREE.Group>(null);
  const mat = materials.flat("#ffd23f");
  useFrame(({ clock }) => {
    const g = ref.current;
    if (!g) return;
    const wanted = model.enabled && model.targets.some((t) => t.kind === "npc" && t.id === npcId);
    g.visible = wanted;
    if (!wanted) return;
    g.position.y = y + Math.sin(clock.elapsedTime * 3) * 0.12;
    g.rotation.y = clock.elapsedTime * 1.8;
  });
  return (
    <group ref={ref} position={[0, y, 0]} visible={false}>
      <mesh position={[0, 0.22, 0]} material={mat}>
        <cylinderGeometry args={[0.11, 0.06, 0.46, 10]} />
      </mesh>
      <mesh position={[0, -0.1, 0]} material={mat}>
        <sphereGeometry args={[0.075, 10, 8]} />
      </mesh>
    </group>
  );
}

function Robot({ runtime, npc, nearby, profile, materials }: NpcProps) {
  const [gRef, face, info] = useFacing(runtime, npc);
  const arm = useRef<THREE.Group>(null);
  const arm2 = useRef<THREE.Group>(null);
  const head = useRef<THREE.Group>(null);
  const light = useRef<THREE.Mesh>(null);
  const hover = useRef<THREE.Mesh>(null);
  const shadows = profile.shadows.enabled;
  const body = materials.solid(npc.color, { rough: 0.35, metal: 0.55 });
  const dark = materials.solid(shade(npc.color, 0.35), { rough: 0.5, metal: 0.4 });
  const screen = materials.solid("#08102a", { rough: 0.1, metal: 0.5 });
  const glow = materials.glow(npc.color, 1.2);
  const eye = materials.flat("#ffffff");
  const lamp = materials.flat("#ff6a6a");
  const lampOn = materials.flat("#7dff9b");
  useFrame(({ clock }, dt) => {
    face(dt);
    const t = clock.elapsedTime + npc.x;
    const grp = gRef.current;
    if (grp) {
      grp.position.y = npc.y + 0.28 + Math.sin(t * 2) * 0.05;
      grp.scale.setScalar(THREE.MathUtils.lerp(grp.scale.x, nearby ? 1.08 : 1, 0.15));
    }
    if (head.current) head.current.rotation.z = Math.sin(t * 1.1) * 0.06;
    const wave = nearby || info.current.dist < 5;
    if (arm.current) arm.current.rotation.z = wave ? 2.3 + Math.sin(t * 7) * 0.4 : 0.25 + Math.sin(t * 1.4) * 0.05;
    if (arm2.current) arm2.current.rotation.z = -0.25 - Math.sin(t * 1.4 + 1) * 0.05;
    if (light.current) light.current.material = Math.sin(t * 4) > 0 ? lampOn : lamp;
    if (hover.current) hover.current.scale.setScalar(1 + Math.sin(t * 5) * 0.06);
  });
  return (
    <group ref={gRef}>
      <mesh ref={hover} position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]} material={glow}>
        <ringGeometry args={[0.28, 0.4, 24]} />
      </mesh>
      <mesh position={[0, 0.12, 0]} material={dark} castShadow={shadows}>
        <cylinderGeometry args={[0.3, 0.38, 0.22, 16]} />
      </mesh>
      <mesh position={[0, 0.72, 0]} material={body} castShadow={shadows}>
        <boxGeometry args={[0.7, 0.66, 0.5]} />
      </mesh>
      <mesh position={[0, 0.74, -0.255]} material={screen}>
        <boxGeometry args={[0.46, 0.34, 0.02]} />
      </mesh>
      <mesh position={[0, 0.74, -0.27]} material={glow}>
        <boxGeometry args={[0.3, 0.05, 0.01]} />
      </mesh>
      <group ref={head} position={[0, 1.34, 0]}>
        <mesh material={body} castShadow={shadows}>
          <boxGeometry args={[0.58, 0.44, 0.46]} />
        </mesh>
        <mesh position={[0, 0, -0.235]} material={screen}>
          <boxGeometry args={[0.46, 0.3, 0.02]} />
        </mesh>
        {([-1, 1] as const).map((s) => (
          <mesh key={s} position={[s * 0.1, 0.01, -0.25]} material={eye} scale={[1, 1.3, 0.4]}>
            <sphereGeometry args={[0.05, 10, 8]} />
          </mesh>
        ))}
        <mesh position={[0, 0.34, 0]} material={dark}>
          <cylinderGeometry args={[0.015, 0.015, 0.24, 6]} />
        </mesh>
        <mesh ref={light} position={[0, 0.48, 0]} material={lamp}>
          <sphereGeometry args={[0.05, 8, 8]} />
        </mesh>
      </group>
      <group ref={arm} position={[0.42, 0.95, 0]}>
        <mesh position={[0, -0.22, 0]} material={dark}>
          <capsuleGeometry args={[0.06, 0.32, 4, 8]} />
        </mesh>
        <mesh position={[0, -0.46, 0]} material={body}>
          <sphereGeometry args={[0.1, 10, 8]} />
        </mesh>
      </group>
      <group ref={arm2} position={[-0.42, 0.95, 0]}>
        <mesh position={[0, -0.22, 0]} material={dark}>
          <capsuleGeometry args={[0.06, 0.32, 4, 8]} />
        </mesh>
        <mesh position={[0, -0.46, 0]} material={body}>
          <sphereGeometry args={[0.1, 10, 8]} />
        </mesh>
      </group>
    </group>
  );
}

function Human({ runtime, npc, nearby, profile, materials }: NpcProps) {
  const [gRef, face, info] = useFacing(runtime, npc);
  const armR = useRef<THREE.Group>(null);
  const armL = useRef<THREE.Group>(null);
  const head = useRef<THREE.Group>(null);
  const torso = useRef<THREE.Group>(null);
  const shadows = profile.shadows.enabled;
  const { skin, hair, style, glasses } = humanLook(npc.npcId);
  const cloth = materials.solid(npc.color, { rough: 0.75, metal: 0.05 });
  const cloth2 = materials.solid(shade(npc.color, 0.55), { rough: 0.8, metal: 0.05 });
  const pants = materials.solid("#2c3350", { rough: 0.8 });
  const skinM = materials.solid(skin, { rough: 0.7 });
  const hairM = materials.solid(hair, { rough: 0.8 });
  const eyeM = materials.flat("#1b1b25");
  const mouth = materials.flat("#7a2f2f");
  const frame = materials.flat("#2a2f45");
  useFrame(({ clock }, dt) => {
    face(dt);
    const t = clock.elapsedTime + npc.z;
    const grp = gRef.current;
    if (grp) {
      grp.position.y = npc.y;
      grp.scale.setScalar(THREE.MathUtils.lerp(grp.scale.x, nearby ? 1.06 : 1, 0.15));
    }
    if (torso.current) torso.current.scale.y = 1 + Math.sin(t * 2) * 0.015;
    if (head.current) {
      head.current.rotation.y = Math.sin(t * 0.8) * 0.2;
      head.current.rotation.x = Math.sin(t * 1.3) * 0.03;
    }
    const wave = nearby || info.current.dist < 5;
    if (armR.current) armR.current.rotation.z = wave ? 2.5 + Math.sin(t * 8) * 0.35 : 0.12 + Math.sin(t * 1.6) * 0.04;
    if (armL.current) armL.current.rotation.z = -0.12 - Math.sin(t * 1.6 + 1) * 0.04;
  });
  return (
    <group ref={gRef}>
      {([-1, 1] as const).map((s) => (
        <group key={s} position={[s * 0.12, 0.5, 0]}>
          <mesh position={[0, -0.14, 0]} material={pants} castShadow={shadows}>
            <capsuleGeometry args={[0.095, 0.4, 4, 8]} />
          </mesh>
          <mesh position={[0, -0.42, -0.04]} material={cloth2}>
            <boxGeometry args={[0.18, 0.1, 0.28]} />
          </mesh>
        </group>
      ))}
      <group ref={torso} position={[0, 1.0, 0]}>
        <mesh material={cloth} castShadow={shadows}>
          <capsuleGeometry args={[0.25, 0.36, 6, 12]} />
        </mesh>
        <mesh position={[0, -0.22, 0]} rotation={[Math.PI / 2, 0, 0]} material={cloth2}>
          <torusGeometry args={[0.25, 0.03, 6, 18]} />
        </mesh>
        <group ref={armR} position={[0.32, 0.22, 0]}>
          <mesh position={[0, -0.22, 0]} material={cloth} castShadow={shadows}>
            <capsuleGeometry args={[0.07, 0.3, 4, 8]} />
          </mesh>
          <mesh position={[0, -0.46, 0]} material={skinM}>
            <sphereGeometry args={[0.075, 10, 8]} />
          </mesh>
        </group>
        <group ref={armL} position={[-0.32, 0.22, 0]}>
          <mesh position={[0, -0.22, 0]} material={cloth} castShadow={shadows}>
            <capsuleGeometry args={[0.07, 0.3, 4, 8]} />
          </mesh>
          <mesh position={[0, -0.46, 0]} material={skinM}>
            <sphereGeometry args={[0.075, 10, 8]} />
          </mesh>
        </group>
      </group>
      <group ref={head} position={[0, 1.6, 0]}>
        <mesh material={skinM} castShadow={shadows}>
          <sphereGeometry args={[0.26, 18, 14]} />
        </mesh>
        {/* hair */}
        {style === 0 && (
          <mesh position={[0, 0.04, 0.02]} rotation={[-0.15, 0, 0]} material={hairM}>
            <sphereGeometry args={[0.285, 16, 10, 0, Math.PI * 2, 0, Math.PI * 0.55]} />
          </mesh>
        )}
        {style === 1 && (
          <>
            <mesh position={[0, 0.04, 0.02]} rotation={[-0.15, 0, 0]} material={hairM}>
              <sphereGeometry args={[0.285, 16, 10, 0, Math.PI * 2, 0, Math.PI * 0.55]} />
            </mesh>
            <mesh position={[0, 0.3, 0.1]} material={hairM}>
              <sphereGeometry args={[0.11, 10, 8]} />
            </mesh>
          </>
        )}
        {style === 2 && (
          <>
            {[-0.14, 0, 0.14].map((x, i) => (
              <mesh key={i} position={[x, 0.3, 0]} rotation={[0, 0, -x * 2]} material={hairM}>
                <coneGeometry args={[0.07, 0.2, 6]} />
              </mesh>
            ))}
            <mesh position={[0, 0.06, 0.03]} rotation={[-0.2, 0, 0]} material={hairM}>
              <sphereGeometry args={[0.275, 14, 8, 0, Math.PI * 2, 0, Math.PI * 0.45]} />
            </mesh>
          </>
        )}
        {style === 3 && (
          <>
            <mesh position={[0, 0.08, 0]} material={cloth2}>
              <sphereGeometry args={[0.29, 16, 10, 0, Math.PI * 2, 0, Math.PI * 0.5]} />
            </mesh>
            <mesh position={[0, 0.07, -0.26]} rotation={[0.15, 0, 0]} material={cloth2}>
              <boxGeometry args={[0.3, 0.03, 0.2]} />
            </mesh>
          </>
        )}
        {/* face (front is −z) */}
        {([-1, 1] as const).map((s) => (
          <mesh key={s} position={[s * 0.09, 0.02, -0.235]} material={eyeM} scale={[1, 1.25, 0.6]}>
            <sphereGeometry args={[0.035, 8, 8]} />
          </mesh>
        ))}
        <mesh position={[0, -0.09, -0.235]} rotation={[0.1, 0, Math.PI]} material={mouth}>
          <torusGeometry args={[0.06, 0.012, 6, 12, Math.PI]} />
        </mesh>
        {glasses &&
          ([-1, 1] as const).map((s) => (
            <mesh key={s} position={[s * 0.09, 0.02, -0.25]} material={frame}>
              <torusGeometry args={[0.062, 0.01, 6, 16]} />
            </mesh>
          ))}
      </group>
    </group>
  );
}

function Creature({ runtime, npc, nearby, profile, materials }: NpcProps) {
  const [gRef, face] = useFacing(runtime, npc);
  const bodyRef = useRef<THREE.Group>(null);
  const tail = useRef<THREE.Group>(null);
  const shadows = profile.shadows.enabled;
  const fur = materials.solid(npc.color, { rough: 0.85 });
  const belly = materials.solid(shade(npc.color, 1.45), { rough: 0.9 });
  const ear = materials.solid(shade(npc.color, 0.7), { rough: 0.85 });
  const white = materials.flat("#ffffff");
  const pupil = materials.flat("#14141f");
  const cheek = materials.flat("#ff8fb0");
  useFrame(({ clock }, dt) => {
    face(dt);
    const t = clock.elapsedTime * 2.4 + npc.x;
    const grp = gRef.current;
    const hop = Math.max(0, Math.sin(t));
    if (grp) {
      grp.position.y = npc.y + hop * (nearby ? 0.28 : 0.1);
      grp.scale.setScalar(THREE.MathUtils.lerp(grp.scale.x, nearby ? 1.08 : 1, 0.15));
    }
    if (bodyRef.current) bodyRef.current.scale.set(1 + (1 - hop) * 0.05, 1 - (1 - hop) * 0.07, 1 + (1 - hop) * 0.05);
    if (tail.current) tail.current.rotation.y = Math.sin(t * 1.5) * 0.7;
  });
  return (
    <group ref={gRef}>
      <group ref={bodyRef}>
        <mesh position={[0, 0.62, 0]} scale={[1, 0.92, 0.95]} material={fur} castShadow={shadows}>
          <sphereGeometry args={[0.58, 20, 16]} />
        </mesh>
        <mesh position={[0, 0.5, -0.32]} scale={[0.8, 0.85, 0.55]} material={belly}>
          <sphereGeometry args={[0.42, 16, 12]} />
        </mesh>
        {([-1, 1] as const).map((s) => (
          <group key={s}>
            <mesh position={[s * 0.34, 1.2, 0.02]} rotation={[0, 0, -s * 0.3]} material={fur} castShadow={shadows}>
              <coneGeometry args={[0.16, 0.44, 8]} />
            </mesh>
            <mesh position={[s * 0.34, 1.17, -0.04]} rotation={[0, 0, -s * 0.3]} material={ear} scale={[0.6, 0.7, 0.6]}>
              <coneGeometry args={[0.16, 0.44, 8]} />
            </mesh>
            <mesh position={[s * 0.22, 0.72, -0.5]} material={white} scale={[1, 1.15, 0.6]}>
              <sphereGeometry args={[0.12, 12, 10]} />
            </mesh>
            <mesh position={[s * 0.22, 0.72, -0.575]} material={pupil}>
              <sphereGeometry args={[0.06, 8, 8]} />
            </mesh>
            <mesh position={[s * 0.36, 0.55, -0.46]} material={cheek} scale={[1, 0.6, 0.4]}>
              <sphereGeometry args={[0.07, 8, 8]} />
            </mesh>
            <mesh position={[s * 0.24, 0.08, -0.12]} material={ear}>
              <sphereGeometry args={[0.13, 10, 8]} />
            </mesh>
          </group>
        ))}
        <mesh position={[0, 0.56, -0.55]} rotation={[0.1, 0, Math.PI]} material={pupil}>
          <torusGeometry args={[0.07, 0.014, 6, 12, Math.PI]} />
        </mesh>
        <group ref={tail} position={[0, 0.4, 0.5]}>
          <mesh position={[0, 0.05, 0.12]} material={fur}>
            <sphereGeometry args={[0.14, 10, 8]} />
          </mesh>
          <mesh position={[0, 0.12, 0.3]} material={belly}>
            <sphereGeometry args={[0.1, 10, 8]} />
          </mesh>
        </group>
      </group>
    </group>
  );
}

function Orb({ runtime, npc, nearby, materials }: NpcProps) {
  const [gRef, face] = useFacing(runtime, npc);
  const r1 = useRef<THREE.Mesh>(null);
  const r2 = useRef<THREE.Mesh>(null);
  const sparks = useRef<THREE.Group>(null);
  const core = materials.glow(npc.color, 1.1);
  const shell = materials.solid(shade(npc.color, 0.6), { rough: 0.2, metal: 0.6 });
  const white = materials.flat("#ffffff");
  const pupil = materials.flat("#10131f");
  useFrame(({ clock }, dt) => {
    face(dt);
    const t = clock.elapsedTime + npc.x;
    const grp = gRef.current;
    if (grp) {
      grp.position.y = npc.y + 1.15 + Math.sin(t * 2) * 0.12;
      grp.scale.setScalar(THREE.MathUtils.lerp(grp.scale.x, nearby ? 1.12 : 1, 0.15));
    }
    if (r1.current) r1.current.rotation.set(Math.PI / 2.3, t * 0.9, 0);
    if (r2.current) r2.current.rotation.set(Math.PI / 1.7, -t * 0.7, t * 0.3);
    if (sparks.current) sparks.current.rotation.y = t * 1.4;
  });
  return (
    <group ref={gRef}>
      <mesh material={core}>
        <sphereGeometry args={[0.46, 22, 18]} />
      </mesh>
      <mesh material={shell} scale={1.02}>
        <sphereGeometry args={[0.47, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.18]} />
      </mesh>
      <mesh position={[0, 0.02, -0.4]} material={white} scale={[1, 1, 0.6]}>
        <sphereGeometry args={[0.17, 14, 12]} />
      </mesh>
      <mesh position={[0, 0.02, -0.5]} material={pupil}>
        <sphereGeometry args={[0.08, 10, 8]} />
      </mesh>
      <mesh ref={r1} material={shell}>
        <torusGeometry args={[0.72, 0.035, 8, 36]} />
      </mesh>
      <mesh ref={r2} material={core}>
        <torusGeometry args={[0.6, 0.02, 6, 32]} />
      </mesh>
      <group ref={sparks}>
        {[0, 1, 2].map((i) => (
          <mesh key={i} position={[Math.cos((i * Math.PI * 2) / 3) * 0.95, Math.sin(i * 2) * 0.2, Math.sin((i * Math.PI * 2) / 3) * 0.95]} material={white}>
            <sphereGeometry args={[0.04, 8, 6]} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

/** Dispatches on the NPC's `look.shape` from the spec. */
export function Character(props: NpcProps) {
  const body = useMemo(() => props.npc.shape, [props.npc.shape]);
  return (
    <>
      {body === "robot" && <Robot {...props} />}
      {body === "human" && <Human {...props} />}
      {body === "creature" && <Creature {...props} />}
      {body === "orb" && <Orb {...props} />}
      {/* over the head: the body stands at the character's own height (`npc.y`), so the mark does too */}
      <QuestMark npcId={props.npc.npcId} model={props.model} y={props.npc.y + (body === "orb" ? 3.5 : body === "robot" ? 3.0 : body === "creature" ? 2.5 : 2.9)} materials={props.materials} />
    </>
  );
}
