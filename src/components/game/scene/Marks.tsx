"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { labelSafeTop, labelScreenOpacity } from "@/lib/labelFade";
import { useLayout } from "../useLayout";
import { labelHeightFactor } from "./labelScale";
import { makeLabelTexture, sharedSoftSprite } from "./materials";

/**
 * A world label's opacity: far labels fade out (from 28 m, gone at 44 m) so a distant cluster of terminals never turns into a
 * wall of text, and labels fade near the screen edges and under the DOM HUD (`labelScreenOpacity`). 0 means not drawn at all.
 */
export function labelOpacity(distance: number, ndcX: number, ndcY: number, ndcZ: number, safeTop: number): number {
  const far = Math.max(0, Math.min(1, (44 - distance) / 16));
  if (!(far > 0)) return 0;
  return far * labelScreenOpacity(ndcX, ndcY, ndcZ, safeTop);
}

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
    // labels are sprites inside the canvas: near the side edges they would be cut off, and at the top they would slide under the DOM HUD
    ndc.copy(tmp).project(camera);
    const opacity = labelOpacity(real, ndc.x, ndc.y, ndc.z, safeTop);
    (s.material as THREE.SpriteMaterial).opacity = opacity;
    // a label faded out completely is skipped rather than drawn transparent: the same picture, one draw call less for every
    // far terminal and every label behind the camera (a phone draws all of them every frame otherwise)
    s.visible = opacity > 0;
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
