"use client";

import { useEffect, useRef } from "react";
import type { GameRuntime } from "@/lib/game/engine/runtime";
import type { GuideModel } from "@/lib/game/state/guidance";
import { stationActive, stationDone, type ClientState } from "@/lib/game/state/progress";
import { cx } from "@/components/ui";
import type { InputState } from "../input";
import { useLayout } from "../useLayout";

const SIZE = 132; // CSS pixels
/** Shown on short landscape screens (the bitmap is scaled down by CSS). */
const SMALL_SIZE = 88;
/** Half-width of the visible window in metres. */
const RANGE = 30;
const GREEN = "#34d399";
const GREY = "#7b8499";

/**
 * A round, camera-aligned mini-map (up = the way the camera looks). It draws the area's floor plan, the stations,
 * characters, pick-ups and the current guide target, imperatively at ~15 Hz, so it never causes React renders.
 * It only uses what the browser already knows (world layout + public spec + progress), never any answer.
 */
export function Minimap({ runtime, client, input, guide }: { runtime: GameRuntime; client: ClientState; input: InputState; guide: GuideModel }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const { shortLandscape } = useLayout();
  const clientRef = useRef(client);
  useEffect(() => { clientRef.current = client; }, [client]);

  useEffect(() => {
    const el = canvas.current;
    const ctx = el?.getContext("2d");
    if (!el || !ctx) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    el.width = SIZE * dpr;
    el.height = SIZE * dpr;
    const world = runtime.world;
    const area = runtime.spec.areas.find((a) => a.id === runtime.areaId);
    const theme = world.theme;
    let raf = 0;
    let last = 0;

    const draw = (now: number) => {
      raf = requestAnimationFrame(draw);
      if (now - last < 66) return;
      last = now;
      const p = runtime.sim.player;
      const cy = Math.cos(input.yaw), sy = Math.sin(input.yaw);
      const s = SIZE / 2 / RANGE;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, SIZE, SIZE);
      ctx.save();
      ctx.beginPath();
      ctx.arc(SIZE / 2, SIZE / 2, SIZE / 2 - 1, 0, Math.PI * 2);
      ctx.clip();
      ctx.fillStyle = "rgba(7,12,30,0.78)";
      ctx.fillRect(0, 0, SIZE, SIZE);
      // world → map: forward (−sin yaw, −cos yaw) maps to "up", right (cos yaw, −sin yaw) to "right"
      const e = SIZE / 2 - (cy * s * p.x - sy * s * p.z);
      const f = SIZE / 2 - (sy * s * p.x + cy * s * p.z);
      ctx.save();
      ctx.transform(cy * s, sy * s, -sy * s, cy * s, e, f);
      for (const b of runtime.sim.boxes()) {
        if (b.kind === "bounds") continue;
        const w = b.x1 - b.x0, h = b.z1 - b.z0;
        if (b.kind === "floor") ctx.fillStyle = "rgba(120,150,230,0.3)";
        else if (b.kind === "platform") ctx.fillStyle = "rgba(150,170,230,0.5)";
        else if (b.kind === "gate") ctx.fillStyle = runtime.gateOpen(b.gateId ?? "") ? "rgba(255,79,216,0.12)" : "rgba(255,79,216,0.75)";
        else if (b.kind === "wall") ctx.fillStyle = "rgba(210,220,255,0.7)";
        else if (!b.solid) continue;
        else ctx.fillStyle = "rgba(110,120,160,0.55)";
        ctx.fillRect(b.x0, b.z0, w, h);
        if (b.kind === "floor" || b.kind === "platform") {
          ctx.strokeStyle = "rgba(190,205,255,0.55)";
          ctx.lineWidth = 1.5 / s;
          ctx.strokeRect(b.x0, b.z0, w, h);
        }
      }
      for (const hz of world.hazards) {
        ctx.fillStyle = "rgba(255,90,40,0.8)";
        ctx.fillRect(hz.x0, hz.z0, hz.x1 - hz.x0, hz.z1 - hz.z0);
      }
      ctx.restore();

      // markers are drawn in screen space so they keep a constant size
      const cl = clientRef.current;
      const toMap = (x: number, z: number) => {
        const dx = x - p.x, dz = z - p.z;
        return { mx: SIZE / 2 + (cy * dx - sy * dz) * s, my: SIZE / 2 + (sy * dx + cy * dz) * s };
      };
      const inside = (mx: number, my: number) => Math.hypot(mx - SIZE / 2, my - SIZE / 2) < SIZE / 2 - 5;
      for (const c of world.collectibles) {
        if (runtime.isCollected(c.itemId)) continue;
        const { mx, my } = toMap(c.x, c.z);
        if (!inside(mx, my)) continue;
        ctx.fillStyle = "#4cf3ff";
        ctx.beginPath();
        ctx.arc(mx, my, 2.2, 0, Math.PI * 2);
        ctx.fill();
      }
      for (const st of world.stations) {
        const def = area?.stations.find((x) => x.id === st.stationId);
        const done = stationDone(cl, st.stationId);
        const active = def ? stationActive(runtime.spec, cl, def) : false;
        const { mx, my } = toMap(st.x, st.z);
        if (!inside(mx, my)) continue;
        ctx.fillStyle = done ? GREEN : active ? (st.kind === "lore" ? theme.accent2 : theme.accent) : GREY;
        ctx.strokeStyle = "#06101f";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(mx - 4, my - 4, 8, 8, 2);
        ctx.fill();
        ctx.stroke();
      }
      for (const n of world.npcs) {
        const { mx, my } = toMap(n.x, n.z);
        if (!inside(mx, my)) continue;
        ctx.fillStyle = "#ffd23f";
        ctx.strokeStyle = "#06101f";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(mx, my, 3.6, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }
      for (const b of world.bosses) {
        const { mx, my } = toMap(b.x, b.z);
        if (!inside(mx, my)) continue;
        ctx.fillStyle = "#ff4d6d";
        ctx.strokeStyle = "#06101f";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(mx, my - 5.5);
        ctx.lineTo(mx + 5, my);
        ctx.lineTo(mx, my + 5.5);
        ctx.lineTo(mx - 5, my);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }
      if (world.portal) {
        const { mx, my } = toMap(world.portal.x, world.portal.z);
        if (inside(mx, my)) {
          ctx.strokeStyle = theme.accent2;
          ctx.lineWidth = 2.2;
          ctx.beginPath();
          ctx.arc(mx, my, 5, 0, Math.PI * 2);
          ctx.stroke();
        }
      }
      // the current objective: a pulsing ring, or a dot on the rim when it is off the map
      const target = guide.enabled ? guide.primary : null;
      if (target) {
        const { mx, my } = toMap(target.x, target.z);
        const dx = mx - SIZE / 2, dy = my - SIZE / 2;
        const d = Math.hypot(dx, dy);
        const k = d > SIZE / 2 - 9 ? (SIZE / 2 - 9) / d : 1;
        const px = SIZE / 2 + dx * k, py = SIZE / 2 + dy * k;
        const pulse = 0.5 + 0.5 * Math.sin(now / 260);
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 2;
        ctx.globalAlpha = 0.5 + pulse * 0.5;
        ctx.beginPath();
        ctx.arc(px, py, 6 + pulse * 3, 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = 1;
        if (k < 1) {
          ctx.fillStyle = "#ffffff";
          ctx.beginPath();
          ctx.arc(px, py, 3, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      // the player: an arrow showing which way the avatar faces relative to the camera
      ctx.save();
      ctx.translate(SIZE / 2, SIZE / 2);
      ctx.rotate(-(p.yaw - input.yaw));
      ctx.fillStyle = "#ffffff";
      ctx.strokeStyle = "#06101f";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(0, -7);
      ctx.lineTo(5, 6);
      ctx.lineTo(0, 3);
      ctx.lineTo(-5, 6);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();
      ctx.restore();
      // rim
      ctx.strokeStyle = "rgba(120,140,220,0.55)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(SIZE / 2, SIZE / 2, SIZE / 2 - 1, 0, Math.PI * 2);
      ctx.stroke();
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [runtime, input, guide]);

  return <canvas ref={canvas} aria-hidden="true" data-testid="minimap" style={shortLandscape ? { width: SMALL_SIZE, height: SMALL_SIZE } : { width: SIZE, height: SIZE }} className={cx("pointer-events-none absolute end-3 z-10 hidden rounded-full shadow-e2 shadow-black/40 sm:block", shortLandscape ? "top-[3.25rem]" : "top-[4.9rem]")} />;
}
