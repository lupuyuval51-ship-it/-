"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowUp, Check, ChevronDown, ChevronLeft, ChevronUp, Crosshair, HelpCircle, Lightbulb, LoaderCircle, Maximize, MessageCircle, Move, Pause, Play, Shield, Volume2, VolumeX, X, Zap } from "lucide-react";
import { bossPhase, gameStorageKey, GAME_MODE_LABELS, WORLD_LABELS, type ArenaTelemetry, type DailyGame, type GameLocale, type GameSettings, type GameText } from "@/lib/game";
import { QuestScene } from "./scene";
import { ArenaScene } from "./arena-scene";
import { BidiText } from "./BidiText";
import type { GameScene, GameSceneHooks } from "./scene-types";
import { QuestAudio } from "./audio";
import { gameMessages, modeInstructions } from "./messages";
import "./game.css";
import "./arena.css";

export interface GamePlayerProps {
  game: DailyGame;
  attemptId: string;
  locale: GameLocale;
  onFinish: (result: Record<string, unknown>) => void;
  onExit: () => void;
  settings?: GameSettings;
  onAsk?: () => void;
  externalPaused?: boolean;
}
type PendingAnswer = { index: number; answer: number; elapsedMs: number };
type StoredRun = { index: number; score: number; startedAt: number; combo: number; correct?: number; pending?: PendingAnswer };
type Feedback = { correct: boolean; explanation: GameText; score: number; multiplier: number; index: number; complete?: boolean; earned?: number };

function readSaved(attemptId: string): StoredRun | null {
  try { const saved = JSON.parse(localStorage.getItem(gameStorageKey(attemptId)) || "null"); return saved && Number.isFinite(saved.startedAt) && Number.isInteger(saved.index) ? saved : null; } catch { return null; }
}

export default function GamePlayer({ game, attemptId, locale = "he", onFinish, onExit, settings = {}, onAsk, externalPaused = false }: GamePlayerProps) {
  const t = gameMessages[locale];
  const isArena = game.gameMode === "knowledge-arena";
  const tutorialKey = `levelup-quest-tutorial:${game.gameMode}`;
  const [saved] = useState(() => {
    const local = readSaved(attemptId), resumed = game.resumeState;
    if (!resumed) return local;
    const timestamp = resumed.startedAt ? Date.parse(resumed.startedAt) : NaN;
    return { index: resumed.index, score: resumed.score, combo: local?.combo ?? 0, correct: resumed.correct ?? local?.correct ?? 0, startedAt: Number.isFinite(timestamp) ? timestamp : local?.startedAt ?? Date.now(), pending: local?.pending && local.pending.index >= resumed.index ? local.pending : undefined };
  });
  const [index, setIndex] = useState(saved?.index ?? 0);
  const [score, setScore] = useState(saved?.score ?? 0);
  const [combo, setCombo] = useState(saved?.combo ?? 0);
  const [correctCount, setCorrectCount] = useState(saved?.correct ?? 0);
  const [startedAt] = useState(saved?.startedAt ?? Date.now());
  const [seconds, setSeconds] = useState(game.timeLimit);
  const [loading, setLoading] = useState(settings.force2D ? 100 : 0);
  const [ready, setReady] = useState(Boolean(settings.force2D));
  const [lowQuality, setLowQuality] = useState(false);
  const [paused, setPaused] = useState(false);
  const [tutorial, setTutorial] = useState(() => { try { return !localStorage.getItem(tutorialKey); } catch { return true; } });
  const [fallback, setFallback] = useState(Boolean(settings.force2D));
  const [contextLost, setContextLost] = useState(false);
  const [selected, setSelected] = useState(0);
  const [opened, setOpened] = useState(false);
  const [carrying, setCarrying] = useState(false);
  const [attack, setAttack] = useState(false);
  const [shields, setShields] = useState(0);
  const [effects, setEffects] = useState(settings.effects !== false);
  const [music, setMusic] = useState(Boolean(settings.music));
  const [hint, setHint] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const [leave, setLeave] = useState(false);
  const [offline, setOffline] = useState(false);
  const [stick, setStick] = useState({ x: 0, y: 0 });
  const [fireHeld, setFireHeld] = useState(false);
  const [fireStick, setFireStick] = useState({ x: 0, y: 0 });
  const [questionCollapsed, setQuestionCollapsed] = useState(false);
  const [shieldFeedback, setShieldFeedback] = useState<"hit" | "recovered" | null>(null);
  const [arena, setArena] = useState<ArenaTelemetry>({ health: 5, dashCooldown: 0, enemies: 0, collected: 0, wave: 1 });
  const previousHealthRef = useRef(5);
  const fireOrigin = useRef({ x: 0, y: 0 });
  const hostRef = useRef<HTMLDivElement>(null);
  const shellRef = useRef<HTMLElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<GameScene | null>(null);
  const audioRef = useRef<QuestAudio | null>(null);
  const pendingRef = useRef<PendingAnswer | undefined>(saved?.pending);
  const busyRef = useRef(false);
  const queuedRef = useRef(false);
  const submissionTimerRef = useRef<number | undefined>(undefined);
  const lastElapsedRef = useRef(saved?.index ? Math.max(0, Date.now() - startedAt) : 0);
  const finishedRef = useRef(false);
  const submitRef = useRef<(answer: number) => void>(() => {});
  const indexRef = useRef(index);
  const onFinishRef = useRef(onFinish);
  onFinishRef.current = onFinish;
  indexRef.current = index;
  const question = game.questions[index];

  const persist = useCallback((next: Partial<StoredRun> = {}) => {
    try { localStorage.setItem(gameStorageKey(attemptId), JSON.stringify({ index, score, combo, correct: correctCount, startedAt, pending: pendingRef.current, ...next })); } catch { /* Private browsing can disable local storage. Server answers remain saved. */ }
  }, [attemptId, combo, correctCount, index, score, startedAt]);

  const finish = useCallback(async () => {
    if (finishedRef.current) return;
    finishedRef.current = true; setFinishing(true); setError(""); sceneRef.current?.setPaused(true);
    try {
      const response = await fetch("/api/games/finish", { method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ attemptId }) });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || t.finishError);
      try { localStorage.removeItem(gameStorageKey(attemptId)); } catch { /* Nonessential storage cleanup. */ }
      onFinishRef.current({ ...(body.result || body), state: body.state });
    } catch (reason) { finishedRef.current = false; setFinishing(false); setError(reason instanceof Error ? reason.message : t.finishError); }
  }, [attemptId, t.finishError]);

  const sendPending = useCallback(async () => {
    const pending = pendingRef.current;
    if (!pending || busyRef.current) return;
    busyRef.current = true; setBusy(true); setError("");
    try {
      const response = await fetch("/api/games/event", { method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ attemptId, ...pending }) });
      const body = await response.json();
      if (!response.ok) {
        if (response.status === 409 && Date.now() - startedAt >= game.timeLimit * 1000) { pendingRef.current = undefined; persist({ pending: undefined }); void finish(); return; }
        throw new Error(body.error || t.networkError);
      }
      const result = body as Feedback;
      setFeedback({ ...result, earned: Math.max(0, result.score - score) }); setScore(result.score); setCombo(result.correct ? combo + 1 : 0);
      setQuestionCollapsed(false);
      setCorrectCount((value) => value + (result.correct ? 1 : 0));
      sceneRef.current?.resolve(result.correct); audioRef.current?.effect(result.correct);
      pendingRef.current = undefined;
      persist({ index: pending.index + 1, score: result.score, combo: result.correct ? combo + 1 : 0, correct: correctCount + (result.correct ? 1 : 0), pending: undefined });
    } catch (reason) { setError(reason instanceof Error ? reason.message : t.networkError); }
    finally { busyRef.current = false; setBusy(false); }
  }, [attemptId, combo, correctCount, finish, game.timeLimit, persist, score, startedAt, t.networkError]);

  submitRef.current = (answer: number) => {
    if (busyRef.current || queuedRef.current || feedback || paused || tutorial || leave || finishing || externalPaused) return;
    const optionCount = game.questions[indexRef.current]?.options[locale].length ?? 0;
    if (!Number.isInteger(answer) || answer < 0 || answer >= optionCount) return;
    const elapsed = Math.max(0, Date.now() - startedAt);
    const nextElapsed = Math.max(elapsed, lastElapsedRef.current + 500);
    pendingRef.current = { index: indexRef.current, answer, elapsedMs: nextElapsed };
    // The hint has done its job once an answer is on its way; left open it would sit over the feedback panel.
    setHint(false);
    persist(); queuedRef.current = true; setBusy(true);
    submissionTimerRef.current = window.setTimeout(() => { queuedRef.current = false; lastElapsedRef.current = nextElapsed; void sendPending(); }, nextElapsed - elapsed);
  };

  useEffect(() => {
    if (externalPaused) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const background: Array<{ element: HTMLElement; inert: boolean }> = [];
    let element: HTMLElement | null = shellRef.current;
    while (element?.parentElement) {
      for (const sibling of Array.from(element.parentElement.children)) {
        if (sibling !== element && sibling instanceof HTMLElement) { background.push({ element: sibling, inert: sibling.inert }); sibling.inert = true; }
      }
      element = element.parentElement;
      if (element === document.body) break;
    }
    return () => { document.body.style.overflow = previousOverflow; background.forEach((item) => { item.element.inert = item.inert; }); };
  }, [externalPaused]);

  useEffect(() => {
    if (saved?.pending) setError(t.networkError);
    // A recovered unanswered network request must be retried with its original event data.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attemptId]);

  useEffect(() => {
    if (!(tutorial || paused || leave) || !ready || externalPaused) return;
    const previous = document.activeElement as HTMLElement | null;
    const dialog = dialogRef.current;
    const controls = () => Array.from(dialog?.querySelectorAll<HTMLElement>('button:not(:disabled), input, [tabindex="0"]') ?? []);
    controls()[0]?.focus();
    const trap = (event: KeyboardEvent) => {
      if (event.key !== "Tab") return;
      const elements = controls(), first = elements[0], last = elements.at(-1);
      if (event.shiftKey && (document.activeElement === first || !dialog?.contains(document.activeElement))) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && (document.activeElement === last || !dialog?.contains(document.activeElement))) { event.preventDefault(); first?.focus(); }
    };
    document.addEventListener("keydown", trap);
    return () => { document.removeEventListener("keydown", trap); previous?.focus(); };
  }, [externalPaused, leave, paused, ready, tutorial]);

  useEffect(() => {
    if (!hostRef.current || fallback) return;
    let scene: GameScene;
    try {
      const hooks: GameSceneHooks = {
        loading: setLoading,
        ready: (low) => { setLowQuality(low); setReady(true); },
        answer: (answer) => submitRef.current(answer), selection: setSelected, opened: setOpened, carrying: setCarrying, attack: setAttack,
        shield: (change) => setShields((count) => Math.max(0, count + change)), contextLost: () => { setContextLost(true); setFallback(true); setReady(true); }, telemetry: setArena, sound: (kind) => audioRef.current?.pulse(kind),
      };
      scene = isArena ? new ArenaScene(hostRef.current, game, locale, settings, hooks) : new QuestScene(hostRef.current, game, locale, settings, hooks);
      sceneRef.current = scene;
      if (game.questions[indexRef.current]) scene.setQuestion(game.questions[indexRef.current], indexRef.current);
    } catch { setFallback(true); setReady(true); }
    return () => { scene?.dispose(); sceneRef.current = null; };
    // A run uses its initial immutable definition. State changes must not recreate a GPU renderer.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attemptId, fallback]);

  useEffect(() => {
    const stopped = paused || tutorial || leave || !ready || finishing || Boolean(error) || externalPaused;
    sceneRef.current?.setPaused(stopped);
    if (stopped) audioRef.current?.pause();
    else if (audioRef.current) { try { audioRef.current.configure(effects, music); } catch { /* Audio is optional. */ } }
  }, [effects, error, externalPaused, finishing, leave, music, paused, ready, tutorial]);

  useEffect(() => {
    if (question) { sceneRef.current?.setQuestion(question, index); setOpened(false); setCarrying(false); setHint(false); setQuestionCollapsed(false); }
  }, [index, question]);

  useEffect(() => {
    if (index >= game.questions.length) { void finish(); return; }
    const interval = window.setInterval(() => {
      const remaining = Math.max(0, Math.ceil(game.timeLimit - (Date.now() - startedAt) / 1000));
      setSeconds(remaining);
      if (!remaining && !busyRef.current && !pendingRef.current && !error && !(feedback && index + 1 >= game.questions.length)) void finish();
    }, 250);
    return () => window.clearInterval(interval);
  }, [error, feedback, finish, game.questions.length, game.timeLimit, index, startedAt]);

  useEffect(() => {
    const visibility = () => { if (document.hidden) setPaused(true); };
    const key = (event: KeyboardEvent) => { if (event.key === "Escape" && !externalPaused) { event.preventDefault(); setPaused((current) => !current); } };
    const offlineHandler = () => setOffline(!navigator.onLine);
    document.addEventListener("visibilitychange", visibility); window.addEventListener("keydown", key); window.addEventListener("offline", offlineHandler); window.addEventListener("online", offlineHandler);
    return () => { document.removeEventListener("visibilitychange", visibility); window.removeEventListener("keydown", key); window.removeEventListener("offline", offlineHandler); window.removeEventListener("online", offlineHandler); };
  }, [externalPaused]);

  useEffect(() => () => { audioRef.current?.dispose(); window.clearTimeout(submissionTimerRef.current); }, []);

  function configureAudio(nextEffects = effects, nextMusic = music) {
    audioRef.current ??= new QuestAudio(game.worldTheme);
    try { audioRef.current.configure(nextEffects, nextMusic); } catch { /* A browser may deny audio; the game stays usable. */ }
  }
  function begin() { try { localStorage.setItem(tutorialKey, "1"); } catch { /* Optional preference. */ } setTutorial(false); setPaused(false); configureAudio(); }
  function continueGame() {
    if (index + 1 >= game.questions.length) { void finish(); return; }
    setFeedback(null); setIndex((current) => current + 1); setSelected(isArena ? -1 : 0);
  }
  function choose(answer: number) {
    if (busy || feedback || paused || tutorial || error || finishing || externalPaused) return;
    configureAudio(); setSelected(answer);
    if (!fallback) sceneRef.current?.choose(answer);
    else if (game.gameMode === "escape-room" && opened) submitRef.current(answer);
    else if (game.gameMode === "collect-sort") setCarrying(true);
  }
  function action() {
    if (externalPaused || paused || tutorial || leave || feedback || busy || finishing || error) return;
    configureAudio();
    if (!fallback) { sceneRef.current?.action(); return; }
    if (game.gameMode === "escape-room" && !opened) setOpened(true);
    else submitRef.current(selected);
  }
  function moveStick(event: React.PointerEvent<HTMLDivElement>) {
    const bounds = event.currentTarget.getBoundingClientRect();
    const dx = (event.clientX - bounds.left - bounds.width / 2) / 34, dy = (event.clientY - bounds.top - bounds.height / 2) / 34;
    const distance = Math.max(1, Math.hypot(dx, dy));
    const x = dx / distance, y = dy / distance;
    setStick({ x: x * 30, y: y * 30 }); sceneRef.current?.setJoystick(x, y);
  }
  const actionLabel = game.gameMode === "escape-room" ? opened ? t.confirm : t.station : game.gameMode === "collect-sort" ? carrying ? t.deliverAction : t.carry : game.gameMode === "build-path" ? t.bridge : game.gameMode === "answer-gates" ? t.gate : t.interact;
  const combatBlocked = Boolean(error) || finishing || paused || tutorial || leave || !ready || externalPaused;
  const blocked = busy || Boolean(feedback) || combatBlocked;
  const validSelection = selected >= 0 && selected < (question?.options[locale].length ?? 0);
  const completedQuestions = Math.min(game.questions.length, index + (feedback ? 1 : 0));

  const releaseFire = useCallback(() => {
    setFireHeld(false); setFireStick({ x: 0, y: 0 }); sceneRef.current?.setFiring?.(false);
  }, []);
  const releaseMovement = useCallback(() => {
    setStick({ x: 0, y: 0 }); sceneRef.current?.setJoystick(0, 0);
  }, []);
  useEffect(() => {
    if (combatBlocked) { releaseMovement(); releaseFire(); }
  }, [combatBlocked, releaseFire, releaseMovement]);
  useEffect(() => {
    const release = () => { releaseMovement(); releaseFire(); };
    window.addEventListener("blur", release);
    return () => window.removeEventListener("blur", release);
  }, [releaseFire, releaseMovement]);
  useEffect(() => {
    const before = previousHealthRef.current;
    previousHealthRef.current = arena.health;
    if (before === arena.health) return;
    setShieldFeedback(arena.health < before ? "hit" : "recovered");
    const timer = window.setTimeout(() => setShieldFeedback(null), 1400);
    return () => window.clearTimeout(timer);
  }, [arena.health]);
  const answerButtons = (game.gameMode !== "escape-room" || opened || fallback) && question?.options[locale].map((option, answer) => <button type="button" key={answer} className={selected === answer ? "selected" : ""} disabled={blocked || (game.gameMode === "escape-room" && !opened)} aria-pressed={selected === answer} onClick={() => choose(answer)}><span className="quest-option-index">{answer + 1}</span><span><BidiText>{option}</BidiText></span>{selected === answer && <Check size={17} />}</button>);

  return <section className={`quest-player ${isArena ? "quest-arena" : ""} ${questionCollapsed ? "quest-question-minimized" : ""}`} dir={locale === "he" ? "rtl" : "ltr"} ref={shellRef} aria-label={GAME_MODE_LABELS[game.gameMode]?.[locale]}>
    <header className="quest-topbar">
      <div className="quest-world-name"><span>{game.isDemo ? t.demo : WORLD_LABELS[game.worldTheme]?.[locale]}</span><strong>{GAME_MODE_LABELS[game.gameMode]?.[locale]}</strong></div>
      <div className="quest-metrics" aria-live="off"><div className={seconds <= 30 ? "quest-time-urgent" : ""}><span>{t.time}</span><strong dir="ltr">{Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2, "0")}</strong></div><div><span>{t.score}</span><strong>{score.toLocaleString(locale)}</strong></div><div className="quest-combo"><span>{t.combo}</span><strong>{combo}</strong></div></div>
      <div className="quest-toolbar">
        {onAsk && <button type="button" data-testid="quest-ask-ingame" aria-label={t.askAI} title={t.askAI} onClick={onAsk}><MessageCircle size={20} /></button>}
        <button type="button" className="quest-toolbar-help" aria-label={t.tutorial} title={t.tutorial} onClick={() => setTutorial(true)}><HelpCircle size={20} /></button>
        <button type="button" className="quest-toolbar-audio" aria-label={effects ? t.mute : t.sound} title={effects ? t.mute : t.sound} onClick={() => { setEffects(!effects); configureAudio(!effects); }}>{effects ? <Volume2 size={20} /> : <VolumeX size={20} />}</button>
        <button type="button" aria-label={t.pause} title={t.pause} onClick={() => setPaused(true)}><Pause size={20} /></button>
        <button type="button" aria-label={t.exit} title={t.exit} onClick={() => setLeave(true)}><X size={20} /></button>
      </div>
    </header>
    <div className="quest-run-progress" role="progressbar" aria-label={t.progress} aria-valuemin={0} aria-valuemax={game.questions.length} aria-valuenow={completedQuestions} data-testid="quest-run-progress">{game.questions.map((item, step) => <span key={`${item.id}-${step}`} className={step < completedQuestions ? "complete" : step === index ? "current" : ""} />)}</div>

    <div className="quest-stage">
      {!fallback && <div ref={hostRef} className="quest-canvas" role="img" aria-label={t.canvas} />}
      {fallback && <div className={`quest-flat quest-flat-${game.gameMode}`}>
        <p className="quest-flat-notice"><Maximize size={16} />{contextLost ? t.contextLost : t.fallbackTitle}</p>
        <div className="quest-flat-world" aria-hidden="true">
          {game.gameMode === "boss-quiz" ? <><div className="quest-flat-boss">··</div><progress max={game.questions.length} value={Math.max(0, game.questions.length - correctCount)} /></> : game.gameMode === "escape-room" ? <div className={`quest-flat-door ${opened ? "open" : ""}`}><span>{index + 1}</span></div> : <div className="quest-flat-path">{game.questions.map((item, step) => <span key={`${item.id}-${step}`} className={step < index ? "done" : step === index ? "current" : ""}>{step < index ? <Check size={18} /> : step + 1}</span>)}</div>}
        </div>
        <p>{modeInstructions[game.gameMode][locale]}</p>
      </div>}

      {game.gameMode === "boss-quiz" && <div className="quest-boss-status"><span>{t.boss} · {t.phase} {bossPhase(index, game.questions.length)}</span><progress aria-label={t.boss} max={game.questions.length} value={Math.max(0, game.questions.length - correctCount)} /><span><Shield size={14} /> {shields}</span></div>}

      {isArena && !fallback && <div className="arena-hud" data-testid="arena-hud" aria-live="off"><span className="arena-shield" aria-label={`${t.arenaHealth}: ${arena.health}/5`}><Shield size={16} /><span className="arena-health-pips" aria-hidden="true">{Array.from({length:5},(_,i)=><i key={i} className={i<arena.health?"filled":""} />)}</span></span><span>{t.arenaWave} <bdi dir="ltr">{arena.wave}/{game.questions.length}</bdi></span><span title={t.arenaCrystals}><Zap size={14} />{arena.collected}</span></div>}
      {isArena && !fallback && shieldFeedback && !feedback && <div className={`arena-status-feedback ${shieldFeedback}`} role="status"><Shield size={16} />{shieldFeedback === "hit" ? t.shieldHit : t.shieldRecovered}</div>}

      <div className={`quest-question ${questionCollapsed ? "is-collapsed" : ""}`}>
        <div className="quest-question-heading">{isArena && !fallback && question && <button type="button" data-testid="quest-question-hint" className="quest-question-hint" aria-expanded={hint} aria-label={t.hint} title={t.hint} onClick={() => setHint((value) => !value)}><Lightbulb size={18} /></button>}<span className="quest-question-index">{t.question} {Math.min(index + 1, game.questions.length)} {t.of} {game.questions.length}</span><button type="button" data-testid="quest-question-toggle" className="quest-question-toggle" aria-expanded={!questionCollapsed} aria-controls="quest-question-content" aria-label={questionCollapsed ? t.expandQuestion : t.collapseQuestion} title={questionCollapsed ? t.expandQuestion : t.collapseQuestion} onClick={() => setQuestionCollapsed(value => !value)}>{questionCollapsed ? <ChevronDown size={18} /> : <ChevronUp size={18} />}</button></div>
        <h2 aria-live="polite"><BidiText>{question?.prompt[locale] ?? t.finished}</BidiText></h2>
        <div id="quest-question-content" hidden={questionCollapsed}>
          {isArena && !feedback && !fallback && <p className={`arena-select-hint ${arena.aimBlocked?"arena-line-blocked":""}`} aria-live="polite">{selected<0?t.arenaSelect:arena.aimBlocked?t.arenaBlocked:t.arenaReady}</p>}
          {fallback && !validSelection && <p>{t.chooseBeforeSubmit}</p>}
          {game.gameMode === "escape-room" && !opened && !feedback && <p>{t.inspectHint}</p>}
          {carrying && <p className="quest-instruction">{t.deliver}</p>}
          {isArena && <div className="quest-answers" role="group" aria-label={t.chooser}>{answerButtons}</div>}
        </div>
        {questionCollapsed && <span className="quest-collapsed-hint">{validSelection ? <><Crosshair size={14} />{t.selected}: {selected + 1}</> : t.expandToChoose}</span>}
      </div>

      {attack && <div className="quest-attack" role="status">{t.dodge}<button type="button" onClick={() => sceneRef.current?.dodge()}>{t.dodgeButton}</button></div>}

      {!ready && <div className="quest-overlay quest-loading" role="status"><LoaderCircle className="quest-spin" size={32} /><h2>{t.loading}</h2><progress max={100} value={loading} /><span>{loading}% · {loading < 95 ? t.loadingAsset : t.ready}</span></div>}

      {!isArena && <div className="quest-answers" role="group" aria-label={t.chooser}>{answerButtons}</div>}

      {!fallback && <div className={`quest-touch-controls ${(!isArena && settings.controlsSide === "right") || (isArena && settings.controlsSide === "left") ? "reverse" : ""}`}>
        <div className="quest-joystick" data-testid={isArena ? "arena-joystick" : undefined} role="application" tabIndex={0} aria-label={t.joystick} aria-disabled={combatBlocked} onPointerDown={(event) => { if(combatBlocked)return; event.currentTarget.setPointerCapture(event.pointerId); moveStick(event); }} onPointerMove={(event) => { if (!combatBlocked && event.currentTarget.hasPointerCapture(event.pointerId)) moveStick(event); }} onPointerUp={releaseMovement} onPointerCancel={releaseMovement} onLostPointerCapture={releaseMovement}><span style={{ transform: `translate(${stick.x}px, ${stick.y}px)` }} /></div>
        {isArena ? <div className="arena-action-controls"><button className="arena-dash" type="button" data-testid="arena-dash" disabled={combatBlocked || arena.dashCooldown>0} aria-label={arena.dashCooldown>0 ? `${t.dash}: ${Math.ceil(arena.dashCooldown)}` : t.dashReady} title={t.dash} onClick={()=>{configureAudio();sceneRef.current?.dodge();}}><Zap size={22}/><span>{arena.dashCooldown>0?`${Math.ceil(arena.dashCooldown)}s`:t.dash}</span></button><button className={`arena-fire ${fireHeld ? "is-firing" : ""}`} type="button" data-testid="arena-fire" disabled={combatBlocked} aria-label={t.fire} title={t.fireHint} onPointerDown={event=>{event.preventDefault();event.currentTarget.setPointerCapture(event.pointerId);fireOrigin.current={x:event.clientX,y:event.clientY};setFireHeld(true);configureAudio();sceneRef.current?.setFiring?.(true);}} onPointerMove={event=>{if(event.currentTarget.hasPointerCapture(event.pointerId)){const x=(event.clientX-fireOrigin.current.x)/42,y=(event.clientY-fireOrigin.current.y)/42;const length=Math.max(1,Math.hypot(x,y));setFireStick({x:x/length*12,y:y/length*12});sceneRef.current?.setAim?.(x,y);}}} onPointerUp={releaseFire} onPointerCancel={releaseFire} onLostPointerCapture={releaseFire} onClick={event=>{if(event.detail===0)action();}}><Crosshair size={30} style={{transform:`translate(${fireStick.x}px,${fireStick.y}px)`}}/><span>{t.fire}</span></button></div> : <div className="quest-touch-buttons"><button type="button" disabled={blocked} onClick={() => {configureAudio();sceneRef.current?.jump();}} aria-label={t.jump}><ArrowUp size={22} /></button><button type="button" className="quest-touch-action" disabled={blocked} onClick={action}>{t.interact}</button></div>}
      </div>}

      {feedback && !finishing && <div className={`quest-feedback ${feedback.correct ? "correct" : "incorrect"}`} role="status"><div><div className="quest-feedback-heading"><strong>{feedback.correct ? t.correct : t.incorrect}</strong>{Boolean(feedback.earned) && <span className="quest-earned" dir="ltr">+{feedback.earned} <span>{t.score}</span></span>}</div><p><BidiText>{feedback.explanation?.[locale] ?? ""}</BidiText></p><small><Check size={14} />{t.saved}</small></div><button type="button" data-testid="quest-feedback-next" onClick={continueGame}>{index + 1 >= game.questions.length ? t.seeResults : t.next}<ChevronLeft size={18} /></button></div>}
      {(busy || finishing) && <div className="quest-saving" role="status"><LoaderCircle className="quest-spin" size={18} />{t.saving}</div>}
      {(error || offline) && <div className="quest-error" role="alert"><p>{error || t.connection}</p>{error && <button type="button" disabled={busy || finishing} onClick={() => pendingRef.current ? void sendPending() : void finish()}>{t.retry}</button>}</div>}

      {(tutorial || paused || leave) && <div className="quest-overlay">
        <div className="quest-dialog" ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="quest-dialog-title">
          <span className="quest-dialog-kicker">Daily 3D Quest</span>
          <h2 id="quest-dialog-title">{leave ? t.leaveTitle : tutorial ? t.tutorialTitle : t.paused}</h2>
          <p>{leave ? t.leaveBody : tutorial ? modeInstructions[game.gameMode][locale] : t.pauseNote}</p>
          {tutorial && <>{isArena && <ol className="quest-tutorial-steps"><li><Move size={20}/><span><strong>{t.tutorialMove}</strong>{t.tutorialMoveHint}</span></li><li><Crosshair size={20}/><span><strong>{t.tutorialAim}</strong>{t.tutorialAimHint}</span></li><li><Zap size={20}/><span><strong>{t.tutorialDash}</strong>{t.tutorialDashHint}</span></li></ol>}<p className="quest-desktop-guide">{isArena?t.arenaControls:t.controls}</p><p className="quest-mobile-guide">{isArena?t.arenaMobileControls:t.mobileControls}</p></>}
          {!leave && <div className="quest-audio-options"><label className="quest-toggle"><input type="checkbox" checked={music} onChange={(event) => { setMusic(event.target.checked); configureAudio(effects, event.target.checked); }} />{t.music}</label><label className="quest-toggle"><input type="checkbox" checked={effects} onChange={(event) => { setEffects(event.target.checked); configureAudio(event.target.checked); }} />{t.effects}</label></div>}
          <div className="quest-dialog-actions"><button type="button" className="quest-primary" disabled={!ready} autoFocus onClick={() => { if (leave) { setLeave(false); } else begin(); }}><Play size={18} />{leave ? t.return : ready ? tutorial ? t.begin : t.resume : t.unready}</button>{leave && <button type="button" onClick={onExit}>{t.leaveConfirm}</button>}{!tutorial && !leave && <><button type="button" onClick={()=>{setPaused(false);setTutorial(true);}}>{t.tutorial}</button><button type="button" onClick={() => { setFallback(true); setPaused(false); }}>{t.fallbackSwitch}</button></>}</div>
        </div>
      </div>}
    </div>

    {(!isArena || fallback) && <footer className="quest-bottom-bar"><span className="quest-desktop-guide">{t.controls}</span><span className="quest-mobile-guide">{lowQuality ? t.low : t.keyboard}</span><div><button type="button" onClick={() => setHint((value) => !value)} aria-expanded={hint}><HelpCircle size={16} />{t.hint}</button><button type="button" className="quest-primary" disabled={blocked || (fallback && !validSelection && (game.gameMode !== "escape-room" || opened))} onClick={action}>{fallback && game.gameMode !== "escape-room" ? t.fallbackAction : actionLabel}</button></div></footer>}
    {hint && <div className="quest-hint" role="status" data-testid="quest-hint"><div>{question?.hint?.[locale] ? <><strong>{t.questionHint}</strong><p><BidiText>{question.hint[locale]}</BidiText></p>{isArena && <small>{t.arenaAnswerHint}</small>}</> : <p>{isArena ? t.arenaAnswerHint : t.hintText}</p>}</div><button type="button" onClick={() => setHint(false)} aria-label={t.close}><X size={16} /></button></div>}
  </section>;
}
