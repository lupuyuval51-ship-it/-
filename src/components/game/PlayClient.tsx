"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useT } from "@/components/I18nProvider";
import { Button, Spinner } from "@/components/ui";
import type { RenderProfile } from "@/config/graphics";
import type { Answer, PublicChallenge } from "@/lib/game/challenges/grade";
import { GameRuntime, type Interactable } from "@/lib/game/engine/runtime";
import { GuideModel, type GuideKind } from "@/lib/game/state/guidance";
import type { PublicSpec } from "@/lib/game/spec/public";
import type { LearningSummary, ClientState } from "@/lib/game/state/progress";
import { GameAudio } from "./audio";
import { ChallengePanel, type AnswerResult } from "./hud/ChallengePanel";
import { AreaBanner, Dialogue, DoneOverlay, GuideMarker, InteractPrompt, LoreCard, PauseMenu, ScorePopups, TopBar, TouchControls, Toasts, TutorialCard, type Popup, type Toast } from "./hud/Overlays";
import { Minimap } from "./hud/Minimap";
import { InputState } from "./input";
import { ParticleEmitter } from "./scene/Particles";

const GameCanvas = dynamic(() => import("./scene/GameCanvas"), { ssr: false });

interface Started {
  sessionId: string;
  resumed: boolean;
  game: { id: string; title: string; revision: number; generator: { kind: string; provider: string } };
  spec: PublicSpec;
  state: ClientState;
  maxScore: number;
  render: { tier: "A" | "B" | "C"; plan: string; profile: RenderProfile };
  testHooks: boolean;
}

interface EventResponse {
  data: Record<string, unknown>;
  state: ClientState;
  newlyCompletedMissions: string[];
  newAchievements: string[];
  completed: boolean;
  summary?: LearningSummary;
}

class ApiFailure extends Error {
  constructor(public status: number, public code: string, message: string) {
    super(message);
  }
}

async function api<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body), credentials: "same-origin" });
  const json = (await res.json().catch(() => ({}))) as { error?: { code?: string; message?: string } } & T;
  if (!res.ok) throw new ApiFailure(res.status, json.error?.code ?? "ERROR", json.error?.message ?? "Request failed");
  return json;
}

function webglAvailable(): boolean {
  try {
    const c = document.createElement("canvas");
    return Boolean(c.getContext("webgl2") ?? c.getContext("webgl"));
  } catch {
    return false;
  }
}

type Overlay =
  | { type: "none" }
  | { type: "challenge"; stationId: string; label: string; challenge: PublicChallenge; result: AnswerResult | null; hint: string | null; busy: boolean }
  | { type: "dialogue"; npcId: string }
  | { type: "lore"; stationId: string }
  | { type: "pause" }
  | { type: "done"; summary: LearningSummary };

const SFX_KEY = "levelup.sfx";
const MUSIC_KEY = "levelup.music";
const GUIDE_KEY = "levelup.guide";
const TUTORIAL_KEY = "levelup.tutorial";
const readPref = (k: string, d: boolean): boolean => {
  try {
    const v = localStorage.getItem(k);
    return v === null ? d : v === "1";
  } catch {
    return d;
  }
};

export default function PlayClient({ gameId, soundDefault, musicDefault }: { gameId: string; soundDefault: boolean; musicDefault: boolean }) {
  const t = useT();
  const [boot, setBoot] = useState<{ status: "loading" } | { status: "error"; message: string } | { status: "ready"; data: Started }>({ status: "loading" });
  const [client, setClient] = useState<ClientState | null>(null);
  const [runtime, setRuntime] = useState<GameRuntime | null>(null);
  const [overlay, setOverlay] = useState<Overlay>({ type: "none" });
  const [nearby, setNearby] = useState<Interactable | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [score, setScore] = useState(0);
  const [popups, setPopups] = useState<Popup[]>([]);
  const [tutorial, setTutorial] = useState(() => (typeof window === "undefined" ? false : !readPref(TUTORIAL_KEY, false)));
  // Read once on the client; the loading screen (the only thing rendered on the server) does not depend on these.
  const [touch] = useState(() => typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches);
  const [sfx, setSfx] = useState(() => (typeof window === "undefined" ? soundDefault : readPref(SFX_KEY, soundDefault)));
  const [music, setMusic] = useState(() => (typeof window === "undefined" ? musicDefault : readPref(MUSIC_KEY, musicDefault)));
  const [guideOn, setGuideOn] = useState(() => (typeof window === "undefined" ? true : readPref(GUIDE_KEY, true)));
  const router = useRouter();
  const guide = useMemo(() => new GuideModel(), []);
  const guideMarker = useRef<HTMLDivElement>(null);
  const input = useMemo(() => new InputState(), []);
  const emitter = useMemo(() => new ParticleEmitter(), []);
  const audio = useMemo(() => new GameAudio(), []);
  const host = useRef<HTMLDivElement>(null);
  const queue = useRef<Promise<unknown>>(Promise.resolve());
  const toastId = useRef(0);
  const lastSaved = useRef({ x: 1e9, z: 1e9 });
  const dataRef = useRef<Started | null>(null);
  const clientRef = useRef<ClientState | null>(null);
  const overlayRef = useRef<Overlay>(overlay);
  const data = boot.status === "ready" ? boot.data : null;
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

  // ───────── session boot ─────────
  const load = useCallback(async (restart: boolean) => {
    try {
      const d = await api<Started>(`/api/games/${gameId}/session`, { restart });
      setClient(d.state);
      setScore(d.state.score);
      setBoot({ status: "ready", data: d });
      if (d.resumed && !restart) toast(t("hud.resumed"), "info");
    } catch (e) {
      setBoot({ status: "error", message: e instanceof ApiFailure && e.status === 429 ? t("common.error.rateLimited") : t("hud.loading.error") });
    }
  }, [gameId, t, toast]);
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
  useEffect(() => { audio.setSfx(sfx); audio.setMusic(music); }, [audio, sfx, music]);
  useEffect(() => { guide.enabled = guideOn; }, [guide, guideOn]);
  const guideLabel = useCallback((kind: GuideKind, name: string, meters: number) => `${kind === "npc" ? t("hud.guide.talk", { name }) : kind === "collectible" ? t("hud.guide.collect") : name} · ${meters} ${t("hud.guide.m")}`, [t]);
  useEffect(() => () => audio.dispose(), [audio]);

  // ───────── server events (strictly ordered) ─────────
  const send = useCallback(<T extends EventResponse>(event: Record<string, unknown>): Promise<T> => {
    const d = dataRef.current;
    if (!d) return Promise.reject(new Error("not ready"));
    const run = async () => {
      const res = await api<T>(`/api/play/${d.sessionId}/events`, event);
      setClient(res.state);
      setScore(res.state.score);
      runtime?.setClientState(res.state);
      for (const id of res.newlyCompletedMissions) {
        const m = d.spec.missions.find((x) => x.id === id);
        toast(t("toast.mission", { title: m?.title ?? id }), "good");
        audio.play("mission");
        const p = runtime?.sim.player;
        if (p) emitter.burst(p.x, p.y + 1, p.z, "#a3ff4f", 40);
      }
      for (const a of res.newAchievements) toast(t("toast.achievement", { name: t(`ach.${a}` as never) }), "good");
      if (res.completed && res.summary) {
        setOverlay({ type: "done", summary: res.summary });
        audio.play("mission");
      }
      return res;
    };
    const p = queue.current.then(run, run);
    queue.current = p.catch(() => undefined);
    return p;
  }, [audio, emitter, runtime, t, toast]);

  const handleError = useCallback((e: unknown) => {
    if (e instanceof ApiFailure) {
      if (e.code === "SESSION_STALE") { toast(t("hud.stale"), "warn"); setTimeout(() => void start(false), 800); return; }
      if (e.status === 401) { router.push("/login"); return; }
      if (e.status === 429) { toast(t("common.error.rateLimited"), "warn"); return; }
      return; // state conflicts (already collected, locked...) are harmless: the server state is authoritative
    }
    toast(t("toast.offline"), "warn");
  }, [router, start, t, toast]);

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
        send({ type: "collect", itemId }).then(() => pop(t("hud.points", { n: 10 }), "gold")).catch(handleError);
      },
      onCheckpoint: (id, pos) => {
        audio.play("checkpoint");
        toast(t("toast.checkpoint"), "info");
        send({ type: "checkpoint", checkpointId: id, position: pos }).catch(handleError);
      },
      onRespawn: (reason) => { audio.play("fall"); toast(t(reason === "fell" ? "toast.respawn.fell" : "toast.respawn.hazard"), "warn"); },
      onJump: () => { audio.play("jump"); const p = rt.sim.player; emitter.burst(p.x, p.y, p.z, rt.world.theme.groundAlt, 5, "dust"); },
      onLand: () => { audio.play("land"); const p = rt.sim.player; emitter.burst(p.x, p.y, p.z, rt.world.theme.groundAlt, 9, "dust"); },
      onStep: (fast) => audio.play(fast ? "stepFast" : "step"),
      onGateOpen: (g) => {
        audio.play("gate");
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
    } else if (target.kind === "portal") {
      if (!target.open) { toast(t("prompt.portal.locked", { label: target.label }), "warn"); return; }
      send({ type: "enter_area", areaId: target.id })
        .then(() => { audio.play("portal"); toast(t("toast.area", { name: d.spec.areas.find((a) => a.id === target.id)?.name ?? "" }), "good"); })
        .catch(handleError);
    } else if (target.status === "locked") {
      toast(t("prompt.station.locked", { label: target.label }), "warn");
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
      audio.play(result.correct ? "correct" : "wrong");
      if (result.correct) {
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
      if (document.visibilityState === "hidden" && overlayRef.current.type !== "done") {
        const snap = runtime.snapshot();
        try { navigator.sendBeacon(`/api/play/${data.sessionId}/events`, new Blob([JSON.stringify({ type: "save", position: snap })], { type: "application/json" })); } catch { /* best effort */ }
      }
    };
    document.addEventListener("visibilitychange", flush);
    return () => { clearInterval(id); document.removeEventListener("visibilitychange", flush); };
  }, [data, runtime, send]);

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
        stations: runtime.world.stations, npcs: runtime.world.npcs, collectibles: runtime.world.collectibles, portal: runtime.world.portal,
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
      <main className="grid h-dvh place-items-center bg-ink-950" aria-busy="true">
        <div className="flex items-center gap-3 text-lg"><Spinner /> {t("hud.loading")}</div>
      </main>
    );
  }
  if (boot.status === "error") {
    return (
      <main className="grid h-dvh place-items-center bg-ink-950 p-6">
        <div className="max-w-md space-y-4 text-center">
          <p role="alert" className="text-lg">{boot.message}</p>
          <div className="flex justify-center gap-3"><Button onClick={() => void start(false)}>{t("common.retry")}</Button><Link href="/games" className="inline-flex min-h-11 items-center rounded-xl border border-line px-4 text-sm font-semibold">{t("hud.exit")}</Link></div>
        </div>
      </main>
    );
  }
  const d = boot.data;
  if (!webglAvailable()) {
    return <main className="grid h-dvh place-items-center bg-ink-950 p-6"><p role="alert" className="max-w-md text-center text-lg">{t("hud.webgl.error")}</p></main>;
  }
  const npc = overlay.type === "dialogue" ? d.spec.areas.flatMap((a) => a.npcs).find((n) => n.id === overlay.npcId) : null;
  const lore = overlay.type === "lore" ? d.spec.areas.flatMap((a) => a.stations).find((s) => s.id === overlay.stationId) : null;
  const area = d.spec.areas.find((a) => a.id === (client?.areaId ?? d.state.areaId))!;

  return (
    <main ref={host} className="relative h-dvh w-full select-none overflow-hidden bg-ink-950" data-testid="play-root" data-tier={d.render.tier} data-plan={d.render.plan} data-shadows={d.render.profile.shadows.type} data-materials={d.render.profile.materials} data-particles={d.render.profile.particles.ambient} data-layout={runtime?.world.layout} data-source={d.game.generator.kind}>
      {runtime && client && (
        <GameCanvas runtime={runtime} profile={d.render.profile} input={input} emitter={emitter} client={client} nearbyKey={nearby ? `${nearby.kind}:${nearby.id}` : null} onInteract={interact} exposeStats={d.testHooks} guide={guide} guideMarker={guideMarker} guideLabel={guideLabel} />
      )}
      {client && (
        <>
          <TopBar spec={d.spec} client={client} areaName={area.name} score={score} maxScore={d.maxScore} demo={d.game.generator.kind === "demo"} onPause={() => setOverlay({ type: "pause" })} collect={runtime ? { have: runtime.world.collectibles.filter((c) => client.collected.includes(c.itemId)).length, total: runtime.world.collectibles.length } : undefined} />
          <Toasts toasts={toasts} />
          <ScorePopups popups={popups} />
          {tutorial && overlay.type === "none" && <TutorialCard touch={touch} onDismiss={dismissTutorial} />}
          {overlay.type === "none" && <GuideMarker markerRef={guideMarker} />}
          {overlay.type === "none" && guideOn && runtime && <Minimap runtime={runtime} client={client} input={input} guide={guide} />}
          {runtime && <AreaBanner key={runtime.areaId} name={area.name} subtitle={d.spec.missions.find((m) => m.areaId === area.id && !client.missionsDone.includes(m.id))?.title} />}
          {overlay.type === "none" && <InteractPrompt target={nearby} touch={touch} onActivate={interact} />}
          {touch && overlay.type === "none" && runtime && <TouchControls input={input} onInteract={interact} hasJump={runtime.jumpEnabled} />}
        </>
      )}
      {overlay.type === "challenge" && (
        <ChallengePanel challenge={overlay.challenge} stationLabel={overlay.label} result={overlay.result} hint={overlay.hint} busy={overlay.busy} onSubmit={submitAnswer} onHint={requestHint} onClose={closeOverlay} />
      )}
      {npc && <Dialogue npc={npc} onClose={closeOverlay} onLine={() => audio.play("blip")} />}
      {lore && lore.loreTitle && lore.loreText && <LoreCard title={lore.loreTitle} text={lore.loreText} onClose={closeOverlay} />}
      {overlay.type === "pause" && (
        <PauseMenu profile={d.render.profile} sfx={sfx} music={music} guide={guideOn} onGuide={(v) => { setGuideOn(v); try { localStorage.setItem(GUIDE_KEY, v ? "1" : "0"); } catch { /* optional */ } }} onSfx={(v) => { setSfx(v); try { localStorage.setItem(SFX_KEY, v ? "1" : "0"); } catch { /* optional */ } }}
          onMusic={(v) => { setMusic(v); audio.unlock(); try { localStorage.setItem(MUSIC_KEY, v ? "1" : "0"); } catch { /* optional */ } }}
          onResume={closeOverlay} onRestart={() => void start(true)} />
      )}
      {overlay.type === "done" && <DoneOverlay summary={overlay.summary} gameId={gameId} sessionId={d.sessionId} onReplay={() => void start(true)} />}
    </main>
  );
}
