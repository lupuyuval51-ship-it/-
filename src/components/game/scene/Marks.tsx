"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { labelSafeTop, labelScreenOpacity } from "@/lib/labelFade";
import { useLayout } from "../useLayout";
import { labelHeightFactor } from "./labelScale";
import { makeLabelTexture, sharedSoftSprite } from "./materials";

/** World label that keeps a steady, readable size on screen (small when you are next to it, larger when far away). */
export function Label({ text, color, y, scale = 1 }: { text: string; color: string; y: number; scale?: number }) {
  const { texture, aspect } = useMemo(() => makeLabelTexture(text, color), [text, color]);
  useEffect(() => () => texture.dispose(), [texture]);
  const ref = useRef<THREE.Sprite>(null);
  const tmp = useMemo(() => new THREE.Vector3(), []);
  const ndc = useMemo(() => new THREE.Vector3(), []);
  const layout = useLayout();
  const safeTop = labelSafeTop(layout);
  useFrame(({ camera, size }) => {
    const s = ref.current;
    if (!s) return;
    s.getWorldPosition(tmp);
    const real = camera.position.distanceTo(tmp);
    const d = Math.min(46, Math.max(5, real));
    // never smaller than a readable size on short screens (a phone held sideways); unchanged on tall ones
    const fov = camera instanceof THREE.PerspectiveCamera ? camera.fov : 62;
    const h = labelHeightFactor(size.height, fov) * d * scale;
    s.scale.set(h * aspect, h, 1);
    // far labels fade out so a distant cluster of terminals never turns into a wall of text
    const far = Math.max(0, Math.min(1, (44 - real) / 16));
    // labels are sprites inside the canvas: near the side edges they would be cut off, and at the top they would slide under the DOM HUD
    ndc.copy(tmp).project(camera);
    (s.material as THREE.SpriteMaterial).opacity = far * labelScreenOpacity(ndc.x, ndc.y, ndc.z, safeTop);
  });
  return (
    <sprite ref={ref} position={[0, y, 0]} scale={[0.46 * aspect, 0.46, 1]}>
      <spriteMaterial map={texture} transparent depthWrite={false} fog={false} />
    </sprite>
  );
}

export function Halo({ color, size, y, opacity = 0.55 }: { color: string; size: number; y: number; opacity?: number }) {
  const tex = sharedSoftSprite(); // shared by every halo: not disposed here
  return (
    <sprite position={[0, y, 0]} scale={[size, size, 1]}>
      <spriteMaterial map={tex} color={color} transparent opacity={opacity} depthWrite={false} blending={THREE.AdditiveBlending} fog={false} />
    </sprite>
  );
}
