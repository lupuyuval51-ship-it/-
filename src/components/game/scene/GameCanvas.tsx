"use client";

import { memo, useEffect, useMemo, useRef, useState, type RefObject } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import type { RenderProfile } from "@/config/graphics";
import { clipCameraDistance } from "@/lib/game/engine/camera";
import { buildFrame, stationStatusOf, type UnityFrame } from "@/lib/game/unity/bridge";
import type { GameRuntime } from "@/lib/game/engine/runtime";
import type { GuideKind, GuideModel } from "@/lib/game/state/guidance";
import type { ClientState } from "@/lib/game/state/progress";
import type { InputState } from "../input";
import { Entities } from "./Entities";
import { Companion, GuideBeams, GuideProjector } from "./Guide";
import type { GuideInsets } from "./guideBand";
import { FrameGovernor, degradeProfile, dprForLevel, governedDprFor, rememberLevel, rememberedLevel, type GovernedDpr } from "./governor";
import { createMaterialSet } from "./materials";
import { ParticleEmitter } from "./Particles";
import { StaticBackdrop, StaticLife, StaticLights, StaticParticles, StaticPlayerAvatar, StaticSky, StaticWorldView } from "./staticScene";

export { ParticleEmitter };

export interface GameCanvasProps {
  runtime: GameRuntime;
  profile: RenderProfile;
  input: InputState;
  emitter: ParticleEmitter;
  client: ClientState;
  nearbyKey: string | null;
  onInteract: () => void;
  /** Publish renderer statistics on the canvas element (automated browser tests only). */
  exposeStats?: boolean;
  guide: GuideModel;
  guideMarker: RefObject<HTMLDivElement | null>;
  /** The screen band the objective marker may use (the HUD keeps it clear of the top bar and the controls). */
  guideInsets?: RefObject<GuideInsets>;
  guideLabel: (kind: GuideKind, name: string, meters: number) => string;
  /** Accessible name of the canvas (translated by the host). */
  sceneLabel?: string;
  /**
   * Unity is drawing the world: keep running input, physics, camera and guidance here but draw nothing.
   * Frames (positions and progress flags, display only) are handed to `onUnityFrame` at about 20 Hz.
   */
  headless?: boolean;
  /** Calmer scene for people sensitive to motion: no landing dip, no sprint zoom, far fewer particles. */
  reduceMotion?: boolean;
  onUnityFrame?: (frame: UnityFrame) => void;
}

/**
 * The fields of a render profile that `createMaterialSet` reads (kept in step with materials.ts by tests/unit/w2-scene-4.test.ts).
 * Everything else (particles, shadows, lights, exposure) the scene applies itself.
 */
export const MATERIAL_PROFILE_FIELDS = ["materials", "textureSize"] as const satisfies readonly (keyof RenderProfile)[];

/**
 * The profile to build the material set from: `built`, the one the current set was made from, as long as the fields the set
 * reads are the same, otherwise `next`. Turning "reduce motion" on or off hands the canvas a new profile object of the same tier
 * (other particles only); that used to rebuild every material and procedural texture, hand every mesh a new material and dispose
 * the old set before the new one was drawn (so three.js compiles those shaders again): a freeze on a phone, for a set that came out
 * exactly the same.
 */
export function materialProfileFor(built: RenderProfile | null, next: RenderProfile): RenderProfile {
  return built !== null && MATERIAL_PROFILE_FIELDS.every((f) => built[f] === next[f]) ? built : next;
}

/** The pixel ratio of the tier on this screen, before any fallback step. */
const baseDprOf = (profile: RenderProfile) => Math.min(profile.pixelRatioMax, typeof window === "undefined" ? 1 : window.devicePixelRatio);

/** A subscriber with a positive priority takes over rendering from R3F; this one renders nothing. */
function NoRender() {
  useFrame(() => {}, 1);
  return null;
}

function UnityFrameDriver({ runtime, client, onFrame }: { runtime: GameRuntime; client: ClientState; onFrame: (f: UnityFrame) => void }) {
  const latest = useRef(client);
  useEffect(() => { latest.current = client; }, [client]);
  const camera = useThree((s) => s.camera);
  const acc = useRef(0);
  const dir = useMemo(() => new THREE.Vector3(), []);
  useFrame((_, dt) => {
    acc.current += dt;
    if (acc.current < 0.05) return;
    acc.current = 0;
    camera.getWorldDirection(dir);
    const frame = buildFrame(
      {
        sim: runtime.sim,
        nearby: runtime.nearby,
        client: latest.current,
        world: runtime.world,
        stationStatus: (id) => stationStatusOf(runtime.spec, latest.current, id),
        gateOpen: (id) => runtime.gateOpen(id),
      },
      { x: camera.position.x, y: camera.position.y, z: camera.position.z, lx: camera.position.x + dir.x, ly: camera.position.y + dir.y, lz: camera.position.z + dir.z },
    );
    onFrame(frame);
  });
  return null;
}

/** Keeps the guide model in step with progress and the player's position (4 Hz). */
function GuideDriver({ runtime, model, client }: { runtime: GameRuntime; model: GuideModel; client: ClientState }) {
  const latest = useRef(client);
  useEffect(() => {
    latest.current = client;
    model.refresh(runtime.spec, client, runtime.world, { isCollected: (id) => runtime.isCollected(id), player: runtime.sim.player });
  }, [client, model, runtime]);
  useFrame((_, dt) => {
    model.tick(dt, runtime.spec, latest.current, runtime.world, { isCollected: (id) => runtime.isCollected(id), player: runtime.sim.player });
  });
  return null;
}

/**
 * One frame of game logic, then the quality governor. Registered first so it runs before every renderer callback.
 * When frame time stays high the governor steps down the fallback ladder (see governor.ts): the pixel ratio shrinks
 * with every step and `onLevel` lets the scene switch off effects. Nothing here can raise quality above the tier.
 */
function Loop({ runtime, input, onInteract, profile, exposeStats, onLevel, onDpr }: Pick<GameCanvasProps, "runtime" | "input" | "onInteract" | "profile" | "exposeStats"> & { onLevel: (level: number) => void; onDpr: (dpr: number) => void }) {
  const setDpr = useThree((s) => s.setDpr);
  const gl = useThree((s) => s.gl);
  const stats = useRef({ pub: 0, frames: 0 });
  // a new canvas (another area, a replay) carries on from the level this tier already had to step down to
  const governor = useMemo(() => new FrameGovernor({ startLevel: rememberedLevel(profile.tier) }), [profile.tier]);
  const baseDpr = useMemo(() => baseDprOf(profile), [profile]);
  useFrame((_, dt) => {
    const step = Math.min(dt, 0.1);
    const { sim, interact } = input.poll(step);
    runtime.update(step, sim, input.yaw);
    if (interact) onInteract();
    if (exposeStats) {
      stats.current.pub += dt;
      stats.current.frames += 1;
      if (stats.current.pub > 0.4) {
        const ds = gl.domElement.dataset;
        ds.calls = String(gl.info.render.calls);
        ds.triangles = String(gl.info.render.triangles);
        ds.frames = String(stats.current.frames);
        ds.shadowMap = gl.shadowMap.enabled ? String(gl.shadowMap.type) : "off";
        ds.toneMapping = String(gl.toneMapping);
        ds.pixelRatio = gl.getPixelRatio().toFixed(2);
        ds.textures = String(gl.info.memory.textures);
        ds.lights = String(runtime.world.stations.length);
        stats.current.pub = 0;
      }
    }
    if (!profile.adaptiveResolution) return;
    const next = governor.push(dt);
    if (next === null) return;
    const dpr = dprForLevel(baseDpr, next);
    rememberLevel(profile.tier, next);
    setDpr(dpr);
    onDpr(dpr); // tell the canvas component, which would otherwise put the full ratio back on its next render
    gl.domElement.dataset.dpr = dpr.toFixed(2);
    gl.domElement.dataset.qualityLevel = String(next);
    onLevel(next);
  });
  return null;
}

function CameraRig({ runtime, input, reduceMotion }: Pick<GameCanvasProps, "runtime" | "input" | "reduceMotion">) {
  const camera = useThree((s) => s.camera);
  const init = useRef(false);
  const dir = useMemo(() => new THREE.Vector3(), []);
  const desired = useMemo(() => new THREE.Vector3(), []);
  const look = useMemo(() => new THREE.Vector3(), []);
  const from = useMemo(() => ({ x: 0, y: 0, z: 0 }), []); // the camera ray's origin, reused every frame
  const dip = useRef(0);
  const prev = useRef({ grounded: true, vy: 0 });
  const baseFov = useRef<number | null>(null);
  useFrame((_, dt) => {
    const p = runtime.sim.player;
    const yaw = input.yaw;
    const pitch = input.pitch;
    // a short downward bump when landing from a height
    if (!reduceMotion && p.grounded && !prev.current.grounded && prev.current.vy < -6) dip.current = Math.min(0.4, -prev.current.vy * 0.016);
    prev.current.grounded = p.grounded;
    prev.current.vy = p.vy;
    dip.current *= Math.exp(-dt * 9);
    // sprinting widens the view a little: a cheap, strong sense of speed
    if (camera instanceof THREE.PerspectiveCamera) {
      if (baseFov.current === null) baseFov.current = camera.fov;
      const want = baseFov.current + (reduceMotion ? 0 : Math.max(0, Math.min(1, (p.speed - 6.5) / 2.5)) * 6);
      if (Math.abs(camera.fov - want) > 0.01) {
        camera.fov += (want - camera.fov) * (1 - Math.exp(-dt * 6));
        camera.updateProjectionMatrix();
      }
    }
    const dist = 7.2;
    dir.set(Math.sin(yaw) * Math.cos(pitch), Math.sin(pitch), Math.cos(yaw) * Math.cos(pitch));
    from.x = p.x;
    from.y = p.y + 1.5 - dip.current;
    from.z = p.z;
    const d = clipCameraDistance(runtime.sim.boxes(), from, dir, dist, (id) => runtime.gateOpen(id));
    desired.set(from.x + dir.x * d, from.y + dir.y * d, from.z + dir.z * d);
    if (!init.current) {
      camera.position.copy(desired);
      init.current = true;
    } else {
      camera.position.lerp(desired, 1 - Math.exp(-dt * 12));
    }
    look.set(p.x, p.y + 1.2 - dip.current * 0.5, p.z);
    camera.lookAt(look);
  });
  return null;
}

function Scene(props: GameCanvasProps & { onDpr: (dpr: number) => void }) {
  const { runtime, profile: tierProfile, emitter } = props;
  // `tierProfile` is what the server granted: it is the ceiling. `profile` is what is drawn right now (never better).
  const [level, setLevel] = useState(() => rememberedLevel(tierProfile.tier));
  const profile = useMemo(() => degradeProfile(tierProfile, level), [tierProfile, level]);
  const theme = runtime.world.theme;
  // the set follows only the fields it reads (see materialProfileFor), not every new profile object of the same tier
  const [built, setBuilt] = useState(tierProfile);
  const materialProfile = materialProfileFor(built, tierProfile);
  if (materialProfile !== built) setBuilt(materialProfile);
  const materials = useMemo(() => createMaterialSet(materialProfile, theme), [materialProfile, theme]);
  useEffect(() => () => materials.dispose(), [materials]);
  const gl = useThree((s) => s.gl);
  useEffect(() => {
    gl.toneMappingExposure = profile.exposure;
    gl.domElement.dataset.tier = tierProfile.tier;
    gl.domElement.dataset.ready = "1";
  }, [gl, profile.exposure, tierProfile.tier]);
  return (
    <>
      <Loop runtime={runtime} input={props.input} onInteract={props.onInteract} profile={tierProfile} exposeStats={props.exposeStats} onLevel={setLevel} onDpr={props.onDpr} />
      <CameraRig runtime={runtime} input={props.input} reduceMotion={props.reduceMotion} />
      {props.headless ? (
        <>
          <NoRender />
          {props.onUnityFrame && <UnityFrameDriver runtime={runtime} client={props.client} onFrame={props.onUnityFrame} />}
          <GuideDriver runtime={runtime} model={props.guide} client={props.client} />
          <GuideProjector runtime={runtime} model={props.guide} markerRef={props.guideMarker} label={props.guideLabel} insets={props.guideInsets} />
        </>
      ) : (
        <>
          <StaticSky profile={profile} theme={theme} />
          <StaticLights runtime={runtime} profile={profile} theme={theme} />
          <StaticBackdrop world={runtime.world} profile={profile} materials={materials} />
          <StaticLife world={runtime.world} profile={profile} materials={materials} />
          <StaticWorldView runtime={runtime} profile={profile} materials={materials} />
          <Entities runtime={runtime} client={props.client} nearbyKey={props.nearbyKey} profile={profile} materials={materials} guide={props.guide} />
          <StaticPlayerAvatar runtime={runtime} profile={profile} materials={materials} accent={theme.accent} />
          <GuideDriver runtime={runtime} model={props.guide} client={props.client} />
          <GuideBeams runtime={runtime} model={props.guide} theme={theme} />
          <Companion runtime={runtime} model={props.guide} input={props.input} profile={profile} accent={theme.accent} />
          <GuideProjector runtime={runtime} model={props.guide} markerRef={props.guideMarker} label={props.guideLabel} insets={props.guideInsets} />
          <StaticParticles runtime={runtime} profile={profile} emitter={emitter} accent={theme.accent} />
        </>
      )}
    </>
  );
}

function GameCanvas(props: GameCanvasProps) {
  const { profile } = props;
  const canvasKey = `${props.runtime.areaId}-${profile.tier}`;
  // Once the frame governor has lowered the pixel ratio, the canvas must be given that number: handing it the profile's range
  // again on the next render (any toast, score change or rotation re-renders the game screen) would put the full ratio back.
  const [governed, setGoverned] = useState<GovernedDpr | null>(null);
  // a new canvas starts at the level this tier already had to step down to (the scene starts there too), never above it
  const remembered = profile.adaptiveResolution ? rememberedLevel(profile.tier) : 0;
  const governedDpr = governedDprFor(governed, canvasKey) ?? (remembered > 0 ? dprForLevel(baseDprOf(profile), remembered) : null);
  const shadows = profile.shadows.type === "soft" ? "soft" : profile.shadows.type === "basic" ? "basic" : false;
  return (
    <Canvas
      key={canvasKey}
      dpr={governedDpr ?? [Math.min(1, profile.pixelRatioMax), profile.pixelRatioMax]}
      shadows={shadows}
      flat={profile.toneMapping === "none"}
      gl={{ antialias: profile.antialias, powerPreference: "high-performance", alpha: false, preserveDrawingBuffer: false }}
      camera={{ fov: 62, near: 0.1, far: 520, position: [0, 6, 10] }}
      style={{ touchAction: "none" }}
      aria-label={props.sceneLabel ?? "3D game world"}
      role="img"
    >
      <Scene {...props} onDpr={(dpr) => setGoverned({ key: canvasKey, dpr })} />
    </Canvas>
  );
}

/**
 * Memoised: the play screen re-renders for every toast, score pop-up, overlay and HUD measurement, and none of those change
 * what the canvas gets. Without this each of them reconciled the whole scene (hundreds of elements) for nothing, which on a
 * phone is a dropped frame at exactly the moments the player is tapping. Every prop the play screen passes is a stable
 * reference or a primitive, and `client`/`nearbyKey` change when the scene really has to follow them.
 */
export default memo(GameCanvas);
