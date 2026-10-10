"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { makeLabelTexture, makeSoftSprite } from "./materials";

/** World label that keeps a steady, readable size on screen (small when you are next to it, larger when far away). */
export function Label({ text, color, y, scale = 1 }: { text: string; color: string; y: number; scale?: number }) {
  const { texture, aspect } = useMemo(() => makeLabelTexture(text, color), [text, color]);
  useEffect(() => () => texture.dispose(), [texture]);
  const ref = useRef<THREE.Sprite>(null);
  const tmp = useMemo(() => new THREE.Vector3(), []);
  useFrame(({ camera }) => {
    const s = ref.current;
    if (!s) return;
    s.getWorldPosition(tmp);
    const real = camera.position.distanceTo(tmp);
    const d = Math.min(46, Math.max(5, real));
    const h = 0.034 * d * scale;
    s.scale.set(h * aspect, h, 1);
    // far labels fade out so a distant cluster of terminals never turns into a wall of text
    (s.material as THREE.SpriteMaterial).opacity = Math.max(0, Math.min(1, (44 - real) / 16));
  });
  return (
    <sprite ref={ref} position={[0, y, 0]} scale={[0.46 * aspect, 0.46, 1]}>
      <spriteMaterial map={texture} transparent depthWrite={false} fog={false} />
    </sprite>
  );
}

export function Halo({ color, size, y, opacity = 0.55 }: { color: string; size: number; y: number; opacity?: number }) {
  const tex = useMemo(() => makeSoftSprite(), []);
  useEffect(() => () => tex.dispose(), [tex]);
  return (
    <sprite position={[0, y, 0]} scale={[size, size, 1]}>
      <spriteMaterial map={tex} color={color} transparent opacity={opacity} depthWrite={false} blending={THREE.AdditiveBlending} fog={false} />
    </sprite>
  );
}
