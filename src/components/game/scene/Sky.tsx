"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import type { RenderProfile } from "@/config/graphics";
import type { GameRuntime } from "@/lib/game/engine/runtime";
import type { EnvTheme } from "@/lib/game/world/types";
import { mulberry32 } from "@/lib/game/util/prng";

/** three.js r155+ lights use physical units: classic 0–2 intensities need roughly this factor to look the same. */
const LIGHT_UNITS = 2.6;

const skyVert = `varying vec3 vDir; void main(){ vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`;
const skyFrag = `varying vec3 vDir; uniform vec3 top; uniform vec3 bottom; uniform vec3 sun; uniform vec3 sunDir; uniform float time; uniform float clouds;
float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float vnoise(vec2 p){ vec2 i = floor(p); vec2 f = fract(p); f = f*f*(3.0 - 2.0*f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y); }
float fbm(vec2 p){ float v = 0.0; float a = 0.5; for (int i = 0; i < 4; i++) { v += a * vnoise(p); p *= 2.03; a *= 0.5; } return v; }
void main(){ vec3 d = normalize(vDir); float h = clamp(d.y*0.5+0.5, 0.0, 1.0); vec3 c = mix(bottom, top, pow(h, 0.65));
  float s = max(dot(d, normalize(sunDir)), 0.0); c += sun * (pow(s, 600.0)*1.4 + pow(s, 8.0)*0.18);
  float horizon = exp(-abs(d.y)*9.0); c += bottom * horizon * 0.25;
  if (clouds > 0.5 && d.y > 0.02) {
    vec2 uv = d.xz / (d.y + 0.22) * 1.5 + vec2(time * 0.01, time * 0.004);
    float n = fbm(uv);
    float cover = smoothstep(0.5, 0.78, n) * smoothstep(0.02, 0.3, d.y);
    vec3 cc = mix(vec3(1.0), sun, 0.15 + 0.35 * pow(s, 4.0)) * (0.9 - 0.18 * smoothstep(0.6, 0.9, n));
    c = mix(c, cc, cover * 0.85);
  }
  gl_FragColor = vec4(c, 1.0); }`;

/** Backdrop: Tier A = shader dome with sun glow + stars, Tier B = gradient, Tier C = flat colour. */
export function Sky({ profile, theme }: { profile: RenderProfile; theme: EnvTheme }) {
  const scene = useThree((s) => s.scene);
  const stars = useRef<THREE.Points>(null);
  const dome = useRef<THREE.Mesh>(null);

  const uniforms = useMemo(() => ({
    top: { value: new THREE.Color(theme.skyTop) }, bottom: { value: new THREE.Color(theme.skyBottom) },
    // the glow sits where the directional light really comes from (see `Lights`)
    sun: { value: new THREE.Color(theme.sun) }, sunDir: { value: new THREE.Vector3(22, 34, 14).normalize() },
    time: { value: 0 }, clouds: { value: theme.clouds && !theme.stars ? 1 : 0 },
  }), [theme]);

  useEffect(() => {
    if (profile.sky === "flat") {
      scene.background = new THREE.Color(theme.skyBottom);
    } else if (profile.sky === "gradient") {
      const c = document.createElement("canvas");
      c.width = 4;
      c.height = 256;
      const ctx = c.getContext("2d")!;
      const g = ctx.createLinearGradient(0, 0, 0, 256);
      g.addColorStop(0, theme.skyTop);
      g.addColorStop(1, theme.skyBottom);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, 4, 256);
      const tex = new THREE.CanvasTexture(c);
      tex.colorSpace = THREE.SRGBColorSpace;
      scene.background = tex;
      return () => tex.dispose();
    } else {
      scene.background = new THREE.Color(theme.skyBottom);
    }
  }, [scene, profile.sky, theme]);

  const starGeo = useMemo(() => {
    if (profile.sky !== "dome" || !theme.stars) return null;
    const n = 700;
    const pos = new Float32Array(n * 3);
    const rnd = mulberry32(1337);
    for (let i = 0; i < n; i++) {
      const u = rnd() * 2 - 1, a = rnd() * Math.PI * 2, r = Math.sqrt(1 - u * u);
      const y = Math.abs(u) * 0.9 + 0.1;
      pos.set([Math.cos(a) * r * 380, y * 380, Math.sin(a) * r * 380], i * 3);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    return g;
  }, [profile.sky, theme.stars]);

  useEffect(() => () => starGeo?.dispose(), [starGeo]); // handed to <points> as a prop, so react-three-fiber does not free it

  useFrame(({ camera, clock }) => {
    dome.current?.position.copy(camera.position);
    stars.current?.position.copy(camera.position);
    uniforms.time.value = clock.elapsedTime;
  });

  if (profile.sky !== "dome") return null;
  return (
    <>
      <mesh ref={dome} renderOrder={-10} frustumCulled={false}>
        <sphereGeometry args={[400, 32, 20]} />
        <shaderMaterial vertexShader={skyVert} fragmentShader={skyFrag} uniforms={uniforms} side={THREE.BackSide} depthWrite={false} fog={false} />
      </mesh>
      {starGeo && (
        <points ref={stars} geometry={starGeo} frustumCulled={false} renderOrder={-9}>
          <pointsMaterial color="#ffffff" size={1.6} sizeAttenuation={false} transparent opacity={0.85} depthWrite={false} fog={false} />
        </points>
      )}
    </>
  );
}

/** Lighting rig whose richness (and shadow quality) comes from the render profile. */
export function Lights({ runtime, profile, theme }: { runtime: GameRuntime; profile: RenderProfile; theme: EnvTheme }) {
  const sun = useRef<THREE.DirectionalLight>(null);
  const fog = useThree((s) => s.scene);

  useEffect(() => {
    fog.fog = profile.fog ? new THREE.Fog(theme.fog, profile.tier === "A" ? 40 : 28, profile.tier === "A" ? 170 : 110) : null;
    return () => {
      fog.fog = null;
    };
  }, [fog, profile.fog, profile.tier, theme.fog]);

  useFrame(() => {
    const p = runtime.sim.player;
    const l = sun.current;
    if (!l) return;
    l.position.set(p.x + 22, p.y + 34, p.z + 14);
    l.target.position.set(p.x, p.y, p.z);
    l.target.updateMatrixWorld();
  });

  const accents = useMemo(() => {
    const spots = [...runtime.world.stations.map((s) => ({ x: s.x, y: s.y, z: s.z })), ...(runtime.world.portal ? [runtime.world.portal] : [])];
    return spots.slice(0, profile.accentLights);
  }, [runtime, profile.accentLights]);

  // Neutral-ish fill colours keep surfaces readable even in dark, saturated skies.
  const hemiSky = useMemo(() => new THREE.Color(theme.skyBottom).lerp(new THREE.Color("#ffffff"), 0.6), [theme.skyBottom]);
  const hemiGround = useMemo(() => new THREE.Color(theme.groundAlt).lerp(new THREE.Color("#ffffff"), 0.35), [theme.groundAlt]);

  const shadow = profile.shadows;
  return (
    <>
      <hemisphereLight args={[hemiSky, hemiGround, theme.ambient * LIGHT_UNITS * (profile.tier === "C" ? 1.2 : 1)]} />
      <directionalLight
        ref={sun}
        color={theme.sun}
        intensity={theme.sunIntensity * LIGHT_UNITS * (profile.tier === "C" ? 0.9 : 1)}
        castShadow={shadow.enabled}
        shadow-mapSize-width={shadow.mapSize || 1}
        shadow-mapSize-height={shadow.mapSize || 1}
        shadow-camera-left={-34}
        shadow-camera-right={34}
        shadow-camera-top={34}
        shadow-camera-bottom={-34}
        shadow-camera-near={1}
        shadow-camera-far={110}
        shadow-bias={-0.0004}
        shadow-normalBias={0.04}
      />
      {accents.map((a, i) => (
        <pointLight key={i} position={[a.x, a.y + 3, a.z]} color={i % 2 ? theme.accent2 : theme.accent} intensity={28} distance={18} decay={2} />
      ))}
    </>
  );
}
