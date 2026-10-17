"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useT } from "@/components/I18nProvider";
import type { GameRuntime, Interactable } from "@/lib/game/engine/runtime";
import { describeSurroundings, nearbyAnnouncement, objectiveChanges, objectiveSnapshot, scenePoints, type ObjectiveSnap } from "@/lib/game/a11y/scene";
import type { GuideModel } from "@/lib/game/state/guidance";
import type { PublicSpec } from "@/lib/game/spec/public";
import type { ClientState } from "@/lib/game/state/progress";
import type { InputState } from "../input";

interface Line {
  id: number;
  text: string;
}

const KEEP = 3;
const LIFETIME_MS = 9000;

/**
 * Screen-reader view of the 3D scene. A polite live region announces the area, anything the player walks up to and
 * objective progress; a button (also on the H key) reads out what is nearby, in which direction and how far, plus the
 * way to the next objective. The canvas itself stays a single labelled image: there is no per-object DOM to tab through.
 */
export function SceneAnnouncer({ runtime, spec, client, input, guide, nearby, areaId, areaName, touch, active }: {
  runtime: GameRuntime;
  spec: PublicSpec;
  client: ClientState;
  input: InputState;
  guide: GuideModel;
  nearby: Interactable | null;
  areaId: string;
  areaName: string;
  touch: boolean;
  /** False while a dialog/pause menu is open: the world is not being played, so it is not announced. */
  active: boolean;
}) {
  const t = useT();
  const [lines, setLines] = useState<Line[]>([]);
  const seq = useRef(0);
  const say = useCallback((text: string) => {
    if (!text) return;
    const id = ++seq.current;
    setLines((l) => [...l.slice(-(KEEP - 1)), { id, text }]);
    setTimeout(() => setLines((l) => l.filter((x) => x.id !== id)), LIFETIME_MS);
  }, []);

  // entering an area
  useEffect(() => { say(t("a11y.area", { area: areaName })); }, [areaId]); // eslint-disable-line react-hooks/exhaustive-deps -- announce on area change only

  // walking up to a station / character / portal
  const nearbyKey = nearby ? `${nearby.kind}:${nearby.id}:${nearby.kind === "portal" ? nearby.open : nearby.kind === "station" ? nearby.status : ""}` : null;
  useEffect(() => {
    if (nearby && active) say(nearbyAnnouncement(nearby, touch, t));
  }, [nearbyKey, active]); // eslint-disable-line react-hooks/exhaustive-deps -- keyed on the target, not on every position update

  // objective / mission progress
  const snap = useMemo(() => objectiveSnapshot(spec, client), [spec, client]);
  const prev = useRef<ObjectiveSnap[]>(snap);
  useEffect(() => {
    for (const s of objectiveChanges(prev.current, snap, t)) say(s);
    prev.current = snap;
  }, [snap, t, say]);

  const describe = useCallback(() => {
    const p = runtime.sim.player;
    say(describeSurroundings({
      points: scenePoints(spec, runtime.client, runtime.world, runtime.areaId),
      player: p, yaw: input.yaw, areaName, goal: guide.primary ?? guide.targets[0] ?? null, t,
    }));
  }, [runtime, spec, input, guide, areaName, t, say]);

  useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.code !== "KeyH" || e.ctrlKey || e.metaKey || e.altKey || (e.target as HTMLElement | null)?.closest("input, textarea, select")) return;
      describe();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active, describe]);

  return (
    <>
      <div role="status" aria-live="polite" aria-atomic="false" aria-label={t("a11y.live")} data-testid="scene-announcer" className="sr-only">
        {lines.map((l) => <p key={l.id}>{l.text}</p>)}
      </div>
      {active && (
        <button
          type="button"
          onClick={describe}
          aria-keyshortcuts="H"
          data-testid="describe-scene"
          className="sr-only focus:not-sr-only focus:absolute focus:bottom-40 focus:start-3 focus:z-30 focus:min-h-11 focus:rounded-xl focus:border focus:border-neon focus:bg-ink-900 focus:px-4 focus:py-2 focus:text-sm focus:font-semibold"
        >
          {t("a11y.describe")}
        </button>
      )}
    </>
  );
}
