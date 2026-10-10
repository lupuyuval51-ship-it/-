"use client";

import { useEffect, useMemo, useRef, type RefObject } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import type { RenderProfile } from "@/config/graphics";
import { clipCameraDistance } from "@/lib/game/engine/camera";
import { buildFrame, stationStatusOf, type UnityFrame } from "@/lib/game/unity/bridge";
import type { GameRuntime } from "@/lib/game/engine/runtime";
import type { GuideKind, GuideModel } from "@/lib/game/state/guidance";
import type { ClientState } from "@/lib/game/state/progress";
import type { InputState } from "../input";
import { Backdrop } from "./Backdrop";
import { Life } from "./Life";
import { Entities } from "./Entities";
import { Companion, GuideBeams, GuideProjector } from "./Guide";
import { createMaterialSet } from "./materials";
import { ParticleEmitter, Particles } from "./Particles";
import { PlayerAvatar } from "./PlayerAvatar";
import { Lights, Sky } from "./Sky";
import { WorldView } from "./WorldView";

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
  guideLabel: (kind: GuideKind, name: string, meters: number) => string;
  /**
   * Unity is drawing the world: keep running input, physics, camera and guidance here but draw nothing.
   * Frames (positions and progress flags, display only) are handed to `onUnityFrame` at about 20 Hz.
   */
  headless?: boolean;
  /** Calmer scene for people sensitive to motion: no landing dip, no sprint zoom, far fewer particles. */
  reduceMotion?: boolean;
  onUnityFrame?: (frame: UnityFrame) => void;
}

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

/** One frame of game logic, then adaptive resolution. Registered first so it runs before every renderer callback. */
function Loop({ runtime, input, onInteract, profile, exposeStats }: Pick<GameCanvasProps, "runtime" | "input" | "onInteract" | "profile" | "exposeStats">) {
  const setDpr = useThree((s) => s.setDpr);
  const gl = useThree((s) => s.gl);
  const stats = useRef({ t: 0, n: 0, dpr: Math.min(profile.pixelRatioMax, typeof window === "undefined" ? 1 : window.devicePixelRatio), pub: 0, frames: 0 });
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
    // Guard rail: if frames are consistently slow, render fewer pixels. Never raises quality above the granted tier.
    const s = stats.current;
    s.t += dt;
    s.n += 1;
    if (s.t >= 2.5) {
      const avg = s.t / s.n;
      if (avg > 0.036 && s.dpr > 0.7) {
        s.dpr = Math.max(0.7, s.dpr * 0.8);
        setDpr(s.dpr);
        gl.domElement.dataset.dpr = s.dpr.toFixed(2);
      }
      s.t = 0;
      s.n = 0;
    }
  });
  return null;
}

function CameraRig({ runtime, input, reduceMotion }: Pick<GameCanvasProps, "runtime" | "input" | "reduceMotion">) {
  const camera = useThree((s) => s.camera);
  const init = useRef(false);
  const dir = useMemo(() => new THREE.Vector3(), []);
  const desired = useMemo(() => new THREE.Vector3(), []);
  const look = useMemo(() => new THREE.Vector3(), []);
  const dip = useRef(0);
  const prev = useRef({ grounded: true, vy: 0 });
  const baseFov = useRef<number | null>(null);
  useFrame((_, dt) => {
    const p = runtime.sim.player;
    const yaw = input.yaw;
    const pitch = input.pitch;
    // a short downward bump when landing from a height
    if (!reduceMotion && p.grounded && !prev.current.grounded && prev.current.vy < -6) dip.current = Math.min(0.4, -prev.current.vy * 0.016);
    prev.current = { grounded: p.grounded, vy: p.vy };
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
    const from = { x: p.x, y: p.y + 1.5 - dip.current, z: p.z };
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

function Scene(props: GameCanvasProps) {
  const { runtime, profile, emitter } = props;
  const theme = runtime.world.theme;
  const materials = useMemo(() => createMaterialSet(profile, theme), [profile, theme]);
  useEffect(() => () => materials.dispose(), [materials]);
  const gl = useThree((s) => s.gl);
  useEffect(() => {
    gl.toneMappingExposure = profile.exposure;
    gl.domElement.dataset.tier = profile.tier;
    gl.domElement.dataset.ready = "1";
  }, [gl, profile]);
  return (
    <>
      <Loop runtime={runtime} input={props.input} onInteract={props.onInteract} profile={profile} exposeStats={props.exposeStats} />
      <CameraRig runtime={runtime} input={props.input} reduceMotion={props.reduceMotion} />
      {props.headless ? (
        <>
          <NoRender />
          {props.onUnityFrame && <UnityFrameDriver runtime={runtime} client={props.client} onFrame={props.onUnityFrame} />}
          <GuideDriver runtime={runtime} model={props.guide} client={props.client} />
          <GuideProjector runtime={runtime} model={props.guide} markerRef={props.guideMarker} label={props.guideLabel} />
        </>
      ) : (
        <>
          <Sky profile={profile} theme={theme} />
          <Lights runtime={runtime} profile={profile} theme={theme} />
          <Backdrop world={runtime.world} profile={profile} materials={materials} />
          <Life world={runtime.world} profile={profile} materials={materials} />
          <WorldView runtime={runtime} profile={profile} materials={materials} />
          <Entities runtime={runtime} client={props.client} nearbyKey={props.nearbyKey} profile={profile} materials={materials} guide={props.guide} />
          <PlayerAvatar runtime={runtime} profile={profile} materials={materials} accent={theme.accent} />
          <GuideDriver runtime={runtime} model={props.guide} client={props.client} />
          <GuideBeams runtime={runtime} model={props.guide} theme={theme} />
          <Companion runtime={runtime} model={props.guide} input={props.input} profile={profile} accent={theme.accent} />
          <GuideProjector runtime={runtime} model={props.guide} markerRef={props.guideMarker} label={props.guideLabel} />
          <Particles runtime={runtime} profile={profile} emitter={emitter} accent={theme.accent} />
        </>
      )}
    </>
  );
}

export default function GameCanvas(props: GameCanvasProps) {
  const { profile } = props;
  const shadows = profile.shadows.type === "soft" ? "soft" : profile.shadows.type === "basic" ? "basic" : false;
  return (
    <Canvas
      key={`${props.runtime.areaId}-${profile.tier}`}
      dpr={[1, profile.pixelRatioMax]}
      shadows={shadows}
      flat={profile.toneMapping === "none"}
      gl={{ antialias: profile.antialias, powerPreference: "high-performance", alpha: false, preserveDrawingBuffer: false }}
      camera={{ fov: 62, near: 0.1, far: 520, position: [0, 6, 10] }}
      style={{ touchAction: "none" }}
      aria-label="3D game world"
      role="img"
    >
      <Scene {...props} />
    </Canvas>
  );
}
