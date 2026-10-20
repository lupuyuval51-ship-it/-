"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useT } from "@/components/I18nProvider";
import type { DictKey } from "@/lib/i18n";
import { Button, Spinner } from "@/components/ui";
import type { Answer, PublicChallenge } from "@/lib/game/challenges/grade";
import { GameRuntime, type Interactable } from "@/lib/game/engine/runtime";
import { GuideModel, type GuideKind } from "@/lib/game/state/guidance";
import type { LearningSummary, ClientState } from "@/lib/game/state/progress";
import { ApiFailure, flushPosition, httpTransport, isTransientFailure, type EventResponse, type PlayTransport, type StartedSession as Started } from "./transport";
import { GameAudio } from "./audio";
import { canVibrate, webHaptic, type Feedback } from "./haptics";
import { webglAvailable } from "./webgl";
import { bootErrorKey, playBackAction } from "./playModel";
import { sameProgress } from "./clientState";
import { streakLevel } from "./audioModel";
import { ChallengePanel, type AnswerResult } from "./hud/ChallengePanel";
import { AreaBanner, BossCard, Dialogue, DoneOverlay, GuideMarker, InteractPrompt, LoreCard, PauseMenu, ScorePopups, TopBar, TouchControls, Toasts, TutorialCard, type Popup, type Toast } from "./hud/Overlays";
import { withReaction } from "@/lib/game/state/reactions";
import { Minimap } from "./hud/Minimap";
import { SceneAnnouncer } from "./hud/SceneAnnouncer";
import { useWakeLock } from "./hud/useWakeLock";
import { guideInsets } from "./hud/hudLayout";
import { DEFAULT_GUIDE_INSETS, type GuideInsets } from "./scene/guideBand";
import { useLayout } from "./useLayout";
import { InputState } from "./input";
import { ParticleEmitter } from "./scene/emitter";
import { UnityView, unityBuildAvailable } from "./UnityView";
import type { UnityFrame } from "@/lib/game/unity/bridge";

const GameCanvas = dynamic(() => import("./scene/GameCanvas"), { ssr: false });
/** The renderer (three + react-three-fiber) is a separate chunk. Fetch it while the session is still being created, so the two waits overlap. */
const preloadRenderer = () => { void import("./scene/GameCanvas").catch(() => undefined); };

type Overlay =
  | { type: "none" }
  | { type: "challenge"; stationId: string; label: string; challenge: PublicChallenge; result: AnswerResult | null; hint: string | null; busy: boolean }
  | { type: "dialogue"; npcId: string }
  | { type: "boss"; bossId: string }
  | { type: "lore"; stationId: string }
  | { type: "pause" }
  | { type: "done"; summary: LearningSummary };

const SFX_KEY = "levelup.sfx";
const MUSIC_KEY = "levelup.music";
const GUIDE_KEY = "levelup.guide";
const MOTION_KEY = "levelup.reduceMotion";
const systemReducesMotion = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const TUTORIAL_KEY = "levelup.tutorial";
/** After a pickup failed to reach the server, how long before standing on it picks it up again. */
const COLLECT_RETRY_MS = 3000;
const VIBRATION_KEY = "levelup.vibration";
const readPref = (k: string, d: boolean): boolean => {
  try {
    const v = localStorage.getItem(k);
    return v === null ? d : v === "1";
  } catch {
    return d;
  }
};

export type { Feedback };

/**
 * `onFeedback` lets a host add device feedback (the Android app vibrates). The page also listens for a `levelup:back`
 * window event (the Android back button): it closes the open panel, or pauses, or — from the pause menu — leaves the game.
 */
export default function PlayClient({ gameId, soundDefault, musicDefault, transport = httpTransport, onFeedback, allowUnity = true, saveErrorKey }: { gameId: string; soundDefault: boolean; musicDefault: boolean; transport?: PlayTransport; onFeedback?: (kind: Feedback) => void; /** The Android app has no Unity build and no scene API: it never asks for one. */ allowUnity?: boolean; /** The message for a failed save on the device ("no room left"), or null for any other failure. Only the Android app has one. */ saveErrorKey?: (e: unknown) => DictKey | null }) {
  const t = useT();
  const [boot, setBoot] = useState<{ status: "loading" } | { status: "error"; message: string } | { status: "ready"; data: Started }>({ status: "loading" });
  const [client, setClient] = useState<ClientState | null>(null);
  const [runtime, setRuntime] = useState<GameRuntime | null>(null);
  const [overlay, setOverlay] = useState<Overlay>({ type: "none" });
  const [nearby, setNearby] = useState<Interactable | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [score, setScore] = useState(0);
  const [popups, setPopups] = useState<Popup[]>([]);
  const [hudBottom, setHudBottom] = useState<number | undefined>(undefined);
  const [tutorial, setTutorial] = useState(() => (typeof window === "undefined" ? false : !readPref(TUTORIAL_KEY, false)));
  // Read once on the client; the loading screen (the only thing rendered on the server) does not depend on these.
  const [touch] = useState(() => typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches);
  const [sfx, setSfx] = useState(() => (typeof window === "undefined" ? soundDefault : readPref(SFX_KEY, soundDefault)));
  const [music, setMusic] = useState(() => (typeof window === "undefined" ? musicDefault : readPref(MUSIC_KEY, musicDefault)));
  const [reduceMotion, setReduceMotion] = useState(() => (typeof window === "undefined" ? false : readPref(MOTION_KEY, systemReducesMotion())));
  const [guideOn, setGuideOn] = useState(() => (typeof window === "undefined" ? true : readPref(GUIDE_KEY, true)));
  // Website on a phone that can vibrate: the same short buzzes as the Android app, switchable in the pause menu (off by default for people whose device asks for reduced motion). The app brings its own (`onFeedback`).
  const [vibration, setVibration] = useState(() => (typeof window === "undefined" ? true : readPref(VIBRATION_KEY, !systemReducesMotion())));
  const webVibration = !onFeedback && touch && canVibrate();
  const router = useRouter();
  // Optional Unity renderer (?renderer=unity). Display only: input, physics, scoring and the server stay as they are.
  const [unity, setUnity] = useState<"off" | "loading" | "ready">("off");
  const unitySend = useRef<((frame: UnityFrame) => void) | null>(null);
  const registerUnity = useCallback((fn: ((frame: UnityFrame) => void) | null) => { unitySend.current = fn; }, []);
  const onUnityFrame = useCallback((frame: UnityFrame) => unitySend.current?.(frame), []);
  const guide = useMemo(() => new GuideModel(), []);
  const guideMarker = useRef<HTMLDivElement>(null);
  // where the objective marker may be pinned: under the top bar and above the controls (updated without re-rendering the scene)
  const markerInsets = useRef<GuideInsets>(DEFAULT_GUIDE_INSETS);
  const layout = useLayout();
  useEffect(() => {
    // control sizes are in rem, so they grow with the system font size: measure what a rem is right now
    const rootPx = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
    markerInsets.current = guideInsets({ hudBottom, viewportHeight: layout.height, touch, scale: layout.touchScale, rootPx });
  }, [hudBottom, layout.height, layout.touchScale, touch]);
  // On a phone a downward drag must never pull the page down to refresh it, and a quick double tap on a button must not zoom.
  useEffect(() => {
    if (!touch) return;
    const html = document.documentElement, body = document.body;
    const before = [html.style.overscrollBehavior, body.style.overscrollBehavior];
    html.style.overscrollBehavior = "none";
    body.style.overscrollBehavior = "none";
    return () => { html.style.overscrollBehavior = before[0] ?? ""; body.style.overscrollBehavior = before[1] ?? ""; };
  }, [touch]);
  const input = useMemo(() => new InputState(), []);
  const emitter = useMemo(() => new ParticleEmitter(), []);
  const audio = useMemo(() => new GameAudio(), []);
  const host = useRef<HTMLDivElement>(null);
  const queue = useRef<Promise<unknown>>(Promise.resolve());
  const toastId = useRef(0);
  const feedback = useRef(onFeedback);
  useEffect(() => { feedback.current = onFeedback ?? (touch && vibration ? webHaptic : undefined); }, [onFeedback, touch, vibration]);
  const lastSaved = useRef({ x: 1e9, z: 1e9 });
  const dataRef = useRef<Started | null>(null);
  const clientRef = useRef<ClientState | null>(null);
  const overlayRef = useRef<Overlay>(overlay);
  const data = boot.status === "ready" ? boot.data : null;
  // The renderer rebuilds its materials whenever the profile object changes, so the calmer profile must be one stable object
  // (a new object on every render of this component made every toast, score change and rotation rebuild the materials).
  const sceneProfile = useMemo(() => {
    if (!data) return null;
    const p = data.render.profile;
    return reduceMotion ? { ...p, particles: { ambient: 0, burst: Math.min(p.particles.burst, 6), trails: false } } : p;
  }, [data, reduceMotion]);
  // Event handlers read the latest values through refs (kept in sync after every render).
  useEffect(() => {
    overlayRef.current = overlay;
    clientRef.current = client;
    dataRef.current = data;
  });

  const popupId = useRef(0);
  const pop = useCallback((text: string, tone: Popup["tone"] = "good") => {
    const id = ++popupId.current;
    setPopups((x) => [...x.slice(-2), { id, text, tone }]);
    setTimeout(() => setPopups((x) => x.filter((y) => y.id !== id)), 1500);
  }, []);
  const dismissTutorial = useCallback(() => {
    setTutorial(false);
    try { localStorage.setItem(TUTORIAL_KEY, "1"); } catch { /* optional */ }
  }, []);

  const toast = useCallback((text: string, tone: Toast["tone"] = "info") => {
    const id = ++toastId.current;
    setToasts((x) => [...x.slice(-3), { id, text, tone }]);
    setTimeout(() => setToasts((x) => x.filter((y) => y.id !== id)), 3200);
  }, []);

  // Opt in with ?renderer=unity. Without a deployed build (or below Tier A) the built-in renderer is used, with a note.
  const tier = data?.render.tier;
  useEffect(() => {
    if (!allowUnity || !tier || new URLSearchParams(window.location.search).get("renderer") !== "unity") return;
    if (tier !== "A") { toast(t("unity.tier"), "info"); return; }
    const ctl = new AbortController();
    void unityBuildAvailable(ctl.signal).then((ok) => {
      if (ctl.signal.aborted) return;
      if (ok) setUnity("loading");
      else toast(t("unity.fallback"), "info");
    });
    return () => ctl.abort();
  }, [allowUnity, tier, toast, t]);
  const onUnityStatus = useCallback((status: "ready" | "error") => {
    if (status === "ready") { setUnity("ready"); return; }
    setUnity("off");
    toast(t("unity.error"), "warn");
  }, [toast, t]);

  // ───────── session boot ─────────
  const load = useCallback(async (restart: boolean) => {
    try {
      const d = await transport.startSession(gameId, restart);
      setClient(d.state);
      setScore(d.state.score);
      setBoot({ status: "ready", data: d });
      if (d.resumed && !restart) toast(t("hud.resumed"), "info");
    } catch (e) {
      setBoot({ status: "error", message: t(bootErrorKey(e, saveErrorKey)) });
    }
  }, [gameId, saveErrorKey, t, toast, transport]);
  /** (Re)start from an event handler: show the loading screen, close overlays, then fetch the session. */
  const start = useCallback((restart = false) => {
    setBoot({ status: "loading" });
    setOverlay({ type: "none" });
    return load(restart);
  }, [load]);
  useEffect(() => {
    // First load (the initial state is already "loading"). Deferred a tick so React StrictMode's
    // mount/unmount/mount in development cancels the first request instead of firing two.
    const id = setTimeout(() => void load(false), 0);
    return () => clearTimeout(id);
  }, [load]);
  useEffect(preloadRenderer, []);
  useEffect(() => { audio.setSfx(sfx); audio.setMusic(music); }, [audio, sfx, music]);
  useEffect(() => { guide.enabled = guideOn; }, [guide, guideOn]);
  const guideLabel = useCallback((kind: GuideKind, name: string, meters: number) => `${kind === "npc" ? t("hud.guide.talk", { name }) : kind === "collectible" ? t("hud.guide.collect") : name} · ${meters} ${t("hud.guide.m")}`, [t]);
  useEffect(() => () => audio.dispose(), [audio]);

  // ───────── server events (strictly ordered) ─────────
  const send = useCallback(<T extends EventResponse>(event: Record<string, unknown>): Promise<T> => {
    const d = dataRef.current;
    if (!d) return Promise.reject(new Error("not ready"));
    const run = async () => {
      const res = await transport.sendEvent<T>(d.sessionId, event);
      // an autosave changes nothing on screen (only the stored position): no new state, so no render of the scene for it
      if (event.type !== "save" || !sameProgress(clientRef.current, res.state)) {
        setClient(res.state);
        setScore(res.state.score);
        runtime?.setClientState(res.state);
      }
      for (const id of res.newlyCompletedMissions) {
        const m = d.spec.missions.find((x) => x.id === id);
        toast(t("toast.mission", { title: m?.title ?? id }), "good");
        if (!res.completed) audio.playEvent({ type: "mission" }); // the last mission is covered by the victory jingle
        feedback.current?.("mission");
        const p = runtime?.sim.player;
        if (p) emitter.burst(p.x, p.y + 1, p.z, "#a3ff4f", 40);
      }
      for (const id of res.newlyDefeatedBosses ?? []) {
        const b = d.spec.bosses?.find((x) => x.id === id);
        toast(t("boss.toast", { name: b?.name ?? id }), "good");
        if (!res.completed) { audio.play("mission"); audio.play("streak", { level: 3, delay: 0.3 }); }
        feedback.current?.("victory");
        const p = runtime?.sim.player;
        if (p) emitter.burst(p.x, p.y + 1.2, p.z, "#ff4d6d", 70);
      }
      for (const a of res.newAchievements) toast(t("toast.achievement", { name: t(`ach.${a}` as never) }), "good");
      if (res.completed && res.summary) {
        setOverlay({ type: "done", summary: res.summary });
        audio.playEvent({ type: "complete" });
        feedback.current?.("victory");
      }
      return res;
    };
    const p = queue.current.then(run, run);
    queue.current = p.catch(() => undefined);
    return p;
  }, [audio, emitter, runtime, t, toast, transport]);

  const handleError = useCallback((e: unknown) => {
    if (e instanceof ApiFailure) {
      if (e.code === "SESSION_STALE") { toast(t("hud.stale"), "warn"); setTimeout(() => void start(false), 800); return; }
      if (e.status === 401) { router.push("/login"); return; }
      if (e.status === 429) { toast(t("common.error.rateLimited"), "warn"); return; }
      const saveError = saveErrorKey?.(e); // the phone could not store the move: say so instead of losing progress silently
      if (saveError) { toast(t(saveError), "warn"); return; }
      return; // state conflicts (already collected, locked...) are harmless: the server state is authoritative
    }
    toast(t("toast.offline"), "warn");
  }, [router, saveErrorKey, start, t, toast]);

  // ───────── runtime per area ─────────
  const areaId = client?.areaId;
  useEffect(() => {
    if (!data || !areaId || !clientRef.current) return;
    const rt = new GameRuntime(data.spec, areaId, clientRef.current, {
      onNearbyChange: setNearby,
      onCollect: (itemId) => {
        const item = rt.world.collectibles.find((c) => c.itemId === itemId);
        if (item) emitter.burst(item.x, item.y, item.z, "#4cf3ff", 18);
        audio.play("collect");
        feedback.current?.("collect");
        send({ type: "collect", itemId }).then(() => pop(t("hud.points", { n: 10 }), "gold")).catch((e) => {
          // the server never took it: let it be picked up again a moment later (not every frame), or the item stays hidden for good
          if (isTransientFailure(e)) setTimeout(() => rt.forgetPending(itemId), COLLECT_RETRY_MS);
          handleError(e);
        });
      },
      onCheckpoint: (id, pos) => {
        audio.play("checkpoint");
        feedback.current?.("checkpoint");
        toast(t("toast.checkpoint"), "info");
        send({ type: "checkpoint", checkpointId: id, position: pos }).catch(handleError);
      },
      onRespawn: (reason) => { audio.play("fall"); feedback.current?.("wrong"); toast(t(reason === "fell" ? "toast.respawn.fell" : "toast.respawn.hazard"), "warn"); },
      onJump: () => { audio.play("jump"); const p = rt.sim.player; emitter.burst(p.x, p.y, p.z, rt.world.theme.groundAlt, 5, "dust"); },
      onLand: () => { audio.play("land"); const p = rt.sim.player; emitter.burst(p.x, p.y, p.z, rt.world.theme.groundAlt, 9, "dust"); },
      onStep: (fast) => audio.play(fast ? "stepFast" : "step"),
      onGateOpen: (g) => {
        audio.play("gate");
        feedback.current?.("gate");
        emitter.burst(g.x, g.y, g.z, rt.world.theme.accent2, 40);
        toast(t("toast.gate"), "good");
      },
    });
    audio.setTheme(rt.world.environment);
    input.yaw = rt.sim.player.yaw;
    setRuntime(rt);
    return () => { rt.paused = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, areaId]);

  useEffect(() => {
    if (runtime && client) runtime.setClientState(client);
    runtime?.refreshNearby();
  }, [runtime, client]);

  // pause the world and block movement input while an overlay is open
  useEffect(() => {
    const blocking = overlay.type !== "none";
    input.enabled = !blocking;
    if (blocking) input.reset();
    if (runtime) runtime.paused = blocking;
  }, [overlay, input, runtime]);

  // On a phone the first-run card has done its job once the player is clearly walking around: it then stops covering the world.
  useEffect(() => {
    if (!tutorial || !touch || !runtime) return;
    const from = { x: runtime.sim.player.x, z: runtime.sim.player.z };
    const id = setInterval(() => {
      const p = runtime.sim.player;
      if (Math.hypot(p.x - from.x, p.z - from.z) > 15) dismissTutorial();
    }, 1000);
    return () => clearInterval(id);
  }, [tutorial, touch, runtime, dismissTutorial]);

  // ───────── interaction ─────────
  const interact = useCallback(() => {
    const d = dataRef.current;
    const target = runtime?.nearby;
    if (!d || !runtime || !target || overlayRef.current.type !== "none") return;
    audio.unlock();
    dismissTutorial(); // the player found out how interaction works
    if (target.kind === "npc") {
      setOverlay({ type: "dialogue", npcId: target.id });
      audio.play("blip");
      send({ type: "talk", npcId: target.id }).catch(handleError);
    } else if (target.kind === "boss") {
      setOverlay({ type: "boss", bossId: target.id });
      audio.play("blip");
    } else if (target.kind === "portal") {
      if (!target.open) { feedback.current?.("wrong"); toast(t("prompt.portal.locked", { label: target.label }), "warn"); return; }
      send({ type: "enter_area", areaId: target.id })
        .then(() => { audio.play("portal"); audio.play("areaEnter", { delay: 0.55 }); feedback.current?.("area"); toast(t("toast.area", { name: d.spec.areas.find((a) => a.id === target.id)?.name ?? "" }), "good"); })
        .catch(handleError);
    } else if (target.status === "locked") {
      feedback.current?.("wrong");
      toast(t(target.lockedByBoss ? "prompt.station.lockedBoss" : "prompt.station.locked", { label: target.label }), "warn");
    } else if (target.status === "done") {
      toast(t("prompt.station.done", { label: target.label }), "info");
    } else if (target.stationKind === "lore") {
      setOverlay({ type: "lore", stationId: target.id });
      send({ type: "visit", stationId: target.id }).catch(handleError);
    } else {
      audio.play("open");
      send<EventResponse & { data: { challenge: PublicChallenge } }>({ type: "open", stationId: target.id })
        .then((res) => setOverlay({ type: "challenge", stationId: target.id, label: target.label, challenge: res.data.challenge, result: null, hint: null, busy: false }))
        .catch(handleError);
    }
  }, [audio, dismissTutorial, handleError, runtime, send, t, toast]);

  useEffect(() => {
    input.onPause = () => setOverlay((o) => (o.type === "none" ? { type: "pause" } : o.type === "pause" ? { type: "none" } : o));
    const detach = host.current ? input.attach(host.current) : () => undefined;
    const unlock = () => audio.unlock();
    window.addEventListener("pointerdown", unlock, { once: true });
    window.addEventListener("keydown", unlock, { once: true });
    return () => { detach(); input.onPause = null; window.removeEventListener("pointerdown", unlock); window.removeEventListener("keydown", unlock); };
  }, [audio, input, boot.status]);

  const submitAnswer = useCallback(async (answer: Answer) => {
    const o = overlayRef.current;
    if (o.type !== "challenge") return;
    setOverlay({ ...o, busy: true });
    try {
      const res = await send<EventResponse & { data: { result: AnswerResult } }>({ type: "answer", stationId: o.stationId, answer });
      const result = res.data.result;
      const streak = result.correct ? res.state.streak : 0; // the server's count of right answers in a row
      audio.playEvent({ type: "answer", correct: result.correct, streak });
      feedback.current?.(result.correct ? "correct" : "wrong");
      if (result.correct && streakLevel(streak) > 0) feedback.current?.("streak");
      if (result.correct) {
        if (streak >= 3) pop(t("hud.streak", { n: streak }), "gold");
        const p = runtime?.sim.player;
        if (p) emitter.burst(p.x, p.y + 1.2, p.z, "#a3ff4f", 36);
        if (result.pointsAwarded > 0) pop(t("hud.points", { n: result.pointsAwarded }));
      }
      setOverlay((cur) => (cur.type === "challenge" ? { ...cur, result, busy: false } : cur));
    } catch (e) {
      setOverlay((cur) => (cur.type === "challenge" ? { ...cur, busy: false } : cur));
      handleError(e);
    }
  }, [audio, emitter, handleError, pop, runtime, send, t]);

  const requestHint = useCallback(async () => {
    const o = overlayRef.current;
    if (o.type !== "challenge") return;
    try {
      const res = await send<EventResponse & { data: { hint: string } }>({ type: "hint", stationId: o.stationId });
      setOverlay((cur) => (cur.type === "challenge" ? { ...cur, hint: res.data.hint } : cur));
    } catch (e) { handleError(e); }
  }, [handleError, send]);

  const closeOverlay = useCallback(() => {
    setOverlay({ type: "none" });
    runtime?.refreshNearby();
  }, [runtime]);

  // ───────── system back (Android back button / gesture) ─────────
  useEffect(() => {
    const onBack = (ev: Event) => {
      const o = overlayRef.current;
      // Without a ready game (loading, failed to start) or without WebGL the screen has no pause menu, so Back leaves at once.
      const action = playBackAction({ ready: dataRef.current !== null, webgl: webglAvailable(), overlay: o.type, busy: o.type === "challenge" && o.busy });
      ev.preventDefault(); // answered here: the app shell leaves the screen by itself only when nobody answers
      if (action === "pause") setOverlay({ type: "pause" });
      else if (action === "leave") router.push("/games");
      else if (action === "close") closeOverlay();
    };
    window.addEventListener("levelup:back", onBack);
    return () => window.removeEventListener("levelup:back", onBack);
  }, [closeOverlay, router]);

  // ───────── autosave ─────────
  useEffect(() => {
    if (!runtime || !data) return;
    const id = setInterval(() => {
      const snap = runtime.snapshot();
      if (overlayRef.current.type === "done") return;
      if (Math.hypot(snap.x - lastSaved.current.x, snap.z - lastSaved.current.z) < 0.5) return;
      lastSaved.current = { x: snap.x, z: snap.z };
      send({ type: "save", position: snap }).catch(() => undefined);
    }, 8000);
    const flush = () => {
      if (document.visibilityState === "hidden" && overlayRef.current.type !== "done") flushPosition(transport, data.sessionId, runtime.snapshot());
    };
    document.addEventListener("visibilitychange", flush);
    return () => { clearInterval(id); document.removeEventListener("visibilitychange", flush); };
  }, [data, runtime, send, transport]);

  // a phone keeps its screen on while a game is on (reading a question takes longer than the screen timeout); paused or finished, it may sleep
  useWakeLock(touch && boot.status === "ready" && overlay.type !== "pause" && overlay.type !== "done");

  // auto-pause when the tab is hidden
  useEffect(() => {
    const hide = () => { if (document.hidden) setOverlay((o) => (o.type === "none" ? { type: "pause" } : o)); };
    document.addEventListener("visibilitychange", hide);
    return () => document.removeEventListener("visibilitychange", hide);
  }, []);

  // ───────── test hooks (only when the SERVER enabled them; never in production) ─────────
  useEffect(() => {
    if (!data?.testHooks || !runtime) return;
    const w = window as unknown as { __LEVELUP_TEST__?: unknown };
    w.__LEVELUP_TEST__ = {
      snapshot: () => ({
        player: { ...runtime.sim.player }, nearby: runtime.nearby, client: clientRef.current, overlay: overlayRef.current.type, yaw: input.yaw,
        stations: runtime.world.stations, npcs: runtime.world.npcs, bosses: runtime.world.bosses, collectibles: runtime.world.collectibles, portal: runtime.world.portal,
        tier: data.render.tier, profile: data.render.profile, layout: runtime.world.layout, areaId: runtime.areaId, sessionId: data.sessionId,
      }),
      teleport: (x: number, y: number, z: number) => runtime.sim.teleport(x, y, z),
      look: (yaw: number, pitch?: number) => { input.yaw = yaw; if (pitch !== undefined) input.pitch = pitch; },
      interact: () => interact(),
      canvas: () => host.current?.querySelector("canvas")?.dataset,
      guide: () => ({ enabled: guide.enabled, targets: guide.targets, primary: guide.primary }),
    };
    return () => { delete w.__LEVELUP_TEST__; };
  }, [data, runtime, interact, input, guide]);

  // ───────── render ─────────
  if (boot.status === "loading") {
    return (
      <main className="theme-dark grid h-dvh place-items-center bg-ink-950" aria-busy="true">
        <div className="flex items-center gap-3 text-lg"><Spinner /> {t("hud.loading")}</div>
      </main>
    );
  }
  if (boot.status === "error") {
    return (
      <main className="theme-dark grid h-dvh place-items-center bg-ink-950 p-6">
        <div className="max-w-md space-y-4 text-center">
          <p role="alert" className="text-lg">{boot.message}</p>
          <div className="flex justify-center gap-3"><Button onClick={() => void start(false)}>{t("common.retry")}</Button><Link href="/games" className="inline-flex min-h-11 items-center rounded-xl border border-line px-4 text-sm font-semibold">{t("hud.exit")}</Link></div>
        </div>
      </main>
    );
  }
  const d = boot.data;
  if (!webglAvailable()) {
    return <main className="theme-dark grid h-dvh place-items-center bg-ink-950 p-6"><p role="alert" className="max-w-md text-center text-lg">{t("hud.webgl.error")}</p></main>;
  }
  const npc = overlay.type === "dialogue" ? d.spec.areas.flatMap((a) => a.npcs).find((n) => n.id === overlay.npcId) : null;
  const boss = overlay.type === "boss" ? d.spec.bosses?.find((b) => b.id === overlay.bossId) : null;
  const lore = overlay.type === "lore" ? d.spec.areas.flatMap((a) => a.stations).find((s) => s.id === overlay.stationId) : null;
  const area = d.spec.areas.find((a) => a.id === (client?.areaId ?? d.state.areaId))!;

  return (
    <main ref={host} data-reduce-motion={reduceMotion ? "1" : "0"} className={`theme-dark ${reduceMotion ? "reduce-motion" : ""} fixed inset-0 touch-manipulation select-none overflow-hidden bg-ink-950`} data-testid="play-root" data-tier={d.render.tier} data-plan={d.render.plan} data-shadows={d.render.profile.shadows.type} data-materials={d.render.profile.materials} data-particles={d.render.profile.particles.ambient} data-layout={runtime?.world.layout} data-source={d.game.generator.kind} data-renderer={unity === "ready" ? "unity" : "three"}>
      {runtime && client && (
        <GameCanvas runtime={runtime} profile={sceneProfile ?? d.render.profile} reduceMotion={reduceMotion} input={input} emitter={emitter} client={client} nearbyKey={nearby ? `${nearby.kind}:${nearby.id}` : null} onInteract={interact} exposeStats={d.testHooks} guide={guide} guideMarker={guideMarker} guideInsets={markerInsets} guideLabel={guideLabel} sceneLabel={t("a11y.scene")} headless={unity === "ready"} onUnityFrame={unity === "ready" ? onUnityFrame : undefined} />
      )}
      {runtime && unity !== "off" && <UnityView key={runtime.areaId} gameId={gameId} areaId={runtime.areaId} register={registerUnity} onStatus={onUnityStatus} />}
      {unity === "ready" && <span data-testid="renderer-badge" className="pointer-events-none absolute bottom-2 start-2 rounded-md bg-ink-950/70 px-2 py-0.5 text-xs text-slate-300">{t("unity.badge")}</span>}
      {client && (
        <>
          <TopBar spec={d.spec} client={client} areaName={area.name} score={score} maxScore={d.maxScore} demo={d.game.generator.kind === "demo"} engine={d.game.generator.kind === "engine"} catalog={d.game.generator.kind === "catalog"} onPause={() => setOverlay({ type: "pause" })} collect={runtime ? { have: runtime.world.collectibles.filter((c) => client.collected.includes(c.itemId)).length, total: runtime.world.collectibles.length } : undefined} onHeadBottom={setHudBottom} />
          <Toasts toasts={toasts} top={hudBottom === undefined ? undefined : hudBottom + 8} />
          {runtime && <SceneAnnouncer runtime={runtime} spec={d.spec} client={client} input={input} guide={guide} nearby={nearby} areaId={runtime.areaId} areaName={area.name} touch={touch} active={overlay.type === "none"} />}
          <ScorePopups popups={popups} />
          {tutorial && overlay.type === "none" && !(touch && nearby) && <TutorialCard touch={touch} onDismiss={dismissTutorial} />}
          {overlay.type === "none" && <GuideMarker markerRef={guideMarker} />}
          {overlay.type === "none" && guideOn && runtime && <Minimap runtime={runtime} client={client} input={input} guide={guide} calm={reduceMotion} />}
          {/* on a phone held sideways the title card and the first-steps card want the same strip: the title waits until the tips are dismissed */}
          {runtime && !(tutorial && layout.shortLandscape) && <AreaBanner key={runtime.areaId} calm={reduceMotion} below={hudBottom === undefined ? undefined : hudBottom + 88} name={area.name} subtitle={d.spec.missions.find((m) => m.areaId === area.id && !client.missionsDone.includes(m.id))?.title} />}
          {overlay.type === "none" && <InteractPrompt target={nearby} touch={touch} onActivate={interact} />}
          {touch && overlay.type === "none" && runtime && <TouchControls input={input} onInteract={interact} hasJump={runtime.jumpEnabled} ready={nearby !== null} />}
        </>
      )}
      {overlay.type === "challenge" && (
        <ChallengePanel challenge={overlay.challenge} stationLabel={overlay.label} result={overlay.result} hint={overlay.hint} busy={overlay.busy} onSubmit={submitAnswer} onHint={requestHint} onClose={closeOverlay} />
      )}
      {npc && <Dialogue npc={withReaction(npc, client?.missionsDone ?? [])} onClose={closeOverlay} onLine={() => audio.play("blip")} />}
      {boss && client && <BossCard boss={boss} client={client} stationLabel={(id) => d.spec.areas.flatMap((a) => a.stations).find((s) => s.id === id)?.label ?? id} onClose={closeOverlay} />}
      {lore && lore.loreTitle && lore.loreText && <LoreCard title={lore.loreTitle} text={lore.loreText} onClose={closeOverlay} />}
      {overlay.type === "pause" && (
        <PauseMenu touch={touch} source={d.game.generator.kind === "demo" ? "demo" : d.game.generator.kind === "engine" ? "engine" : d.game.generator.kind === "catalog" ? "catalog" : undefined} profile={d.render.profile} reduceMotion={reduceMotion} onReduceMotion={(v) => { setReduceMotion(v); try { localStorage.setItem(MOTION_KEY, v ? "1" : "0"); } catch { /* optional */ } }} sfx={sfx} music={music} guide={guideOn} vibration={webVibration ? { on: vibration, onChange: (v) => { setVibration(v); try { localStorage.setItem(VIBRATION_KEY, v ? "1" : "0"); } catch { /* optional */ } if (v) webHaptic("collect"); } } : undefined} onGuide={(v) => { setGuideOn(v); try { localStorage.setItem(GUIDE_KEY, v ? "1" : "0"); } catch { /* optional */ } }} onSfx={(v) => { setSfx(v); try { localStorage.setItem(SFX_KEY, v ? "1" : "0"); } catch { /* optional */ } }}
          onMusic={(v) => { setMusic(v); audio.unlock(); try { localStorage.setItem(MUSIC_KEY, v ? "1" : "0"); } catch { /* optional */ } }}
          onResume={closeOverlay} onRestart={() => void start(true)} />
      )}
      {overlay.type === "done" && <DoneOverlay summary={overlay.summary} gameId={gameId} sessionId={d.sessionId} onReplay={() => void start(true)} />}
    </main>
  );
}
