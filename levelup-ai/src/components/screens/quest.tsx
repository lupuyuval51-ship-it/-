"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import dynamic from "next/dynamic";
import {
  ArrowLeft,
  ArrowUpRight,
  Check,
  ChevronDown,
  Clock3,
  Crosshair,
  Gamepad2,
  HelpCircle,
  Layers3,
  LoaderCircle,
  LockKeyhole,
  MessageCircle,
  Move,
  Play,
  Plus,
  RotateCcw,
  Sparkles,
  Target,
  Trash2,
  Trophy,
  X,
  Zap,
} from "lucide-react";
import { useApp } from "../context";
import { Button, Countdown, Field, Modal, Notice } from "../ui";
import { useCheckout } from "../checkout";
import { api } from "@/lib/client";
import {
  GAME_MODES,
  WORLD_THEMES,
  GAME_MODE_LABELS,
  WORLD_LABELS,
  type GameMode,
  type WorldTheme,
} from "@/lib/game";
import { questMessages } from "@/lib/quest-i18n";
import ArenaPreview from "../arena-preview";
import QuestArt from "../quest-art";
import QuestAssistant from "../quest-assistant";
import { modeSummaries } from "../game/messages";
import "./quest.css";

const GamePlayer = dynamic(() => import("../game/GamePlayer"), {
  ssr: false,
  loading: () => (
    <div className="arena-engine-loading" role="status">
      <LoaderCircle size={28} className="spin" />
      <span>LEVELUP AI</span>
    </div>
  ),
});
type Panel = "play" | "create" | "ask";
type Creation = {
  topic: string;
  level: "beginner" | "intermediate" | "advanced";
  durationMinutes: 3 | 5 | 7;
  worldTheme: WorldTheme;
  gameMode: GameMode;
};
type ReviewItem = {
  index: number;
  prompt: { he: string; en: string };
  options: { he: string[]; en: string[] };
  chosen: number;
  answer: number;
  correct: boolean;
  explanation: { he: string; en: string };
};
const worldColors = ["#82bfae", "#aec7e0", "#79b9cb", "#b8a38f", "#829de3"];

export default function Quest() {
  const { state, locale, l, refresh, catalog, toast } = useApp();
  const q = questMessages[locale];
  const [panel, setPanel] = useState<Panel>("play");
  const [mode, setMode] = useState<GameMode>("knowledge-arena");
  const [world, setWorld] = useState<WorldTheme>("future-city");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);
  const [customGames, setCustomGames] = useState<any[]>([]);
  const [generatorIsDemo, setGeneratorIsDemo] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [generationError, setGenerationError] = useState("");
  const [reload, setReload] = useState(0);
  const [attempt, setAttempt] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);
  const [preview, setPreview] = useState(false);
  const [paywall, setPaywall] = useState(false);
  const [instructions, setInstructions] = useState(false);
  const [inGameChat, setInGameChat] = useState(false);
  const [previewAnswer, setPreviewAnswer] = useState<number | null>(null);
  const [form, setForm] = useState<Creation>({
    topic: "",
    level: "beginner",
    durationMinutes: 3,
    worldTheme: "future-city",
    gameMode: "knowledge-arena",
  });
  const [generating, setGenerating] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<any>(null);
  const [deleting, setDeleting] = useState(false);
  const [slowGeneration, setSlowGeneration] = useState(false);
  const cached = useRef(new Map<string, any>());
  const chatOpener = useRef<HTMLElement | null>(null);
  const checkout = useCheckout();
  const canPlay = !!state.features?.canPlayFull3DGames;
  const game = data?.game;
  const activeWorld = game?.worldTheme || world;
  const title =
    l(game?.title) ||
    (selectedId
      ? game?.topic || q.yourGame
      : mode === "knowledge-arena"
        ? q.dailyTitle
        : l(GAME_MODE_LABELS[mode]));
  const topic =
    typeof game?.topic === "string"
      ? game.topic
      : game?.lessonTopics
          ?.map((v: any) => l(v))
          .filter(Boolean)
          .slice(0, 2)
          .join(" · ") || "";
  const canStart = !canPlay || data?.canStart !== false;
  const userId = state.user.id;
  const formKey = `levelup-arena-draft:${userId}`;

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [panel, selectedId]);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(formKey) || "null");
      if (
        saved &&
        typeof saved.topic === "string" &&
        [3, 5, 7].includes(saved.durationMinutes) &&
        ["beginner", "intermediate", "advanced"].includes(saved.level) &&
        WORLD_THEMES.includes(saved.worldTheme)
      )
        setForm({
          ...saved,
          // Drafts saved before the mode picker existed default to the arena they were made for.
          gameMode: GAME_MODES.includes(saved.gameMode)
            ? saved.gameMode
            : "knowledge-arena",
        });
      const search = new URLSearchParams(window.location.search);
      const tab = search.get("panel");
      if (tab === "ask" || tab === "create") setPanel(tab);
      const selected =
        search.get("game") ||
        localStorage.getItem(`levelup-arena-selected:${userId}`);
      if (selected) setSelectedId(selected);
    } catch {
      /* The form still works when local storage is unavailable. */
    }
  }, [formKey, userId]);
  useEffect(() => {
    let valid = true;
    setError("");
    setData(selectedId ? cached.current.get(selectedId) || null : null);
    const endpoint = selectedId
      ? "/games/custom/" + encodeURIComponent(selectedId)
      : "/games/daily?mode=" + mode + "&world=" + world;
    api(endpoint)
      .then((r) => {
        if (valid) {
          setData(r);
          if (selectedId) cached.current.set(selectedId, r);
        }
      })
      .catch((e) => {
        if (valid) setError(e.message || q.failedLoad);
      });
    return () => {
      valid = false;
    };
  }, [selectedId, mode, world, reload, q.failedLoad]);
  useEffect(() => {
    let valid = true;
    api("/games/custom")
      .then((r) => {
        if (valid) {
          setCustomGames(r.games || []);
          setGeneratorIsDemo(Boolean(r.generatorIsDemo));
        }
      })
      .catch(() => {});
    return () => {
      valid = false;
    };
  }, [userId, reload]);
  useEffect(() => {
    if (inGameChat || !chatOpener.current) return;
    const opener = chatOpener.current;
    chatOpener.current = null;
    const frame = requestAnimationFrame(() => {
      if (opener.isConnected) opener.focus({ preventScroll: true });
    });
    return () => cancelAnimationFrame(frame);
  }, [inGameChat]);
  useEffect(() => {
    if (!generating) {
      setSlowGeneration(false);
      return;
    }
    const timer = setTimeout(() => setSlowGeneration(true), 15000);
    return () => clearTimeout(timer);
  }, [generating]);

  const choose = (id: string | null) => {
    setSelectedId(id);
    setResult(null);
    setPanel("play");
    setError("");
    try {
      if (id) localStorage.setItem(`levelup-arena-selected:${userId}`, id);
      else localStorage.removeItem(`levelup-arena-selected:${userId}`);
      const location = new URL(window.location.href);
      location.searchParams.delete("panel");
      if (id) location.searchParams.set("game", id);
      else location.searchParams.delete("game");
      window.history.replaceState(
        null,
        "",
        location.pathname + location.search,
      );
    } catch {
      /* Server persistence is unchanged. */
    }
  };
  const edit = (patch: Partial<Creation>) => {
    const next = { ...form, ...patch };
    setForm(next);
    try {
      localStorage.setItem(formKey, JSON.stringify(next));
    } catch {
      /* A form error never clears the current values. */
    }
  };
  const generate = async (event: React.FormEvent) => {
    event.preventDefault();
    if (form.topic.trim().length < 2) {
      setGenerationError(q.topicRequired);
      return;
    }
    setGenerating(true);
    setGenerationError("");
    try {
      const response = await api("/games/generate", {
        ...form,
        topic: form.topic.trim(),
        locale,
      });
      cached.current.set(response.game.dailyGameId, response);
      setData(response);
      choose(response.game.dailyGameId);
      setReload((x) => x + 1);
      toast(q.generated);
    } catch (reason) {
      setGenerationError((reason as Error).message);
    } finally {
      setGenerating(false);
    }
  };
  const start = async () => {
    if (!game || busy) return;
    if (!canPlay) {
      setPreview(true);
      setPreviewAnswer(null);
      return;
    }
    setBusy(true);
    setError("");
    try {
      const response = await api("/games/start", {
        dailyGameId: game.dailyGameId,
      });
      setData((current: any) => ({
        ...current,
        game: {
          ...(response.game || game),
          resumeState: {
            ...response.game?.resumeState,
            index: response.nextIndex,
            score: response.score,
            correct: response.correct ?? response.game?.resumeState?.correct,
            startedAt: response.startedAt,
          },
        },
      }));
      setAttempt(response.attemptId);
      setResult(null);
    } catch (reason) {
      setError((reason as Error).message);
    } finally {
      setBusy(false);
    }
  };
  const finish = (response: any) => {
    setAttempt(null);
    setResult(response);
    setInGameChat(false);
    setReload((x) => x + 1);
    void refresh();
  };
  const removeGame = async () => {
    const id = confirmDelete?.dailyGameId || confirmDelete?.id;
    if (!id || deleting) return;
    setDeleting(true);
    try {
      const response = await api(
        "/games/custom/" + encodeURIComponent(id) + "/delete",
        {},
      );
      cached.current.delete(id);
      setCustomGames(response.games || []);
      if (selectedId === id) choose(null);
      setConfirmDelete(null);
      toast(q.gameDeleted);
    } catch (reason) {
      setError((reason as Error).message);
      setConfirmDelete(null);
    } finally {
      setDeleting(false);
    }
  };
  const activeMode: GameMode =
    game?.gameMode || (selectedId ? "knowledge-arena" : mode);
  const navigation: [Panel, string, typeof Gamepad2][] = [
    ["play", q.play, Gamepad2],
    ["create", q.create, Sparkles],
    ["ask", q.ask, MessageCircle],
  ];
  const toggleChat = (event?: React.MouseEvent<HTMLButtonElement>) => {
    chatOpener.current =
      event?.currentTarget || (document.activeElement as HTMLElement | null);
    setInGameChat(true);
  };

  if (attempt && game)
    return (
      <>
        <GamePlayer
          game={game}
          attemptId={attempt}
          locale={locale}
          settings={{ ...state.profile, ...state.profile?.gameSettings }}
          onFinish={finish}
          onExit={() => {
            setAttempt(null);
            setInGameChat(false);
            setReload((x) => x + 1);
            void refresh();
          }}
          onAsk={toggleChat}
          externalPaused={inGameChat}
        />
        {inGameChat && (
          <Modal title={q.ask} onClose={() => setInGameChat(false)}>
            <QuestAssistant gameId={game.dailyGameId} topic={topic} inGame />
          </Modal>
        )}
      </>
    );

  return (
    <div className="quest-hub">
      <header className="quest-hub-heading">
        <div>
          <span className="quest-section-label">
            <span />
            {q.arenaGenre}
          </span>
          <h1>
            {panel === "create"
              ? q.createTitle
              : panel === "ask"
                ? q.assistantTitle
                : q.title}
          </h1>
          <p>
            {panel === "create"
              ? q.createSubtitle
              : panel === "ask"
                ? q.assistantSubtitle
                : q.subtitle}
          </p>
        </div>
        {panel === "play" && (
          <button
            className="quest-help-button"
            type="button"
            onClick={() => setInstructions(true)}
            aria-label={q.controls}
          >
            <HelpCircle size={21} />
          </button>
        )}
      </header>
      <nav className="quest-hub-nav" aria-label={q.arenaGenre}>
        {navigation.map(([id, label, Icon]) => (
          <button
            key={id}
            type="button"
            data-testid={"quest-tab-" + id}
            aria-pressed={panel === id}
            aria-controls={"quest-panel-" + id}
            className={panel === id ? "active" : ""}
            onClick={() => {
              setPanel(id);
              setResult(null);
            }}
            disabled={generating}
          >
            <Icon size={21} />
            <span>{label}</span>
          </button>
        ))}
      </nav>

      {panel === "play" && (
        <section
          id="quest-panel-play"
          className="quest-play-panel"
          aria-label={q.play}
        >
          {error && (
            <Notice type="error">
              {error}
              <div className="actions">
                <Button
                  variant="secondary"
                  onClick={() => setReload((x) => x + 1)}
                >
                  {q.retry}
                </Button>
                {selectedId && (
                  <Button variant="tertiary" onClick={() => choose(null)}>
                    {q.changeDaily}
                  </Button>
                )}
              </div>
            </Notice>
          )}
          {result ? (
            <section className="arena-results">
              <span className="arena-result-mark">
                <Trophy size={32} />
              </span>
              <span className="quest-section-label">{q.savedResult}</span>
              <h2>{q.resultTitle}</h2>
              <div className="arena-result-stats">
                <div>
                  <strong>
                    {result.correct ?? 0}
                    <small>/{result.total ?? 8}</small>
                  </strong>
                  <span>{q.correct}</span>
                </div>
                <div>
                  <strong>{result.score ?? 0}</strong>
                  <span>{q.score}</span>
                </div>
                <div>
                  <strong dir="ltr">+{result.xp || 0}</strong>
                  <span>XP</span>
                </div>
              </div>
              <div className="arena-result-topics">
                <h3>{q.resultLearn}</h3>
                {result.strongTopics?.length > 0 && (
                  <p>
                    <Check size={16} />
                    <span>
                      <b>{q.strengths}: </b>
                      {[...new Set(result.strongTopics.map(l))].join(" · ")}
                    </span>
                  </p>
                )}
                {result.weakTopics?.length > 0 && (
                  <p>
                    <Target size={16} />
                    <span>
                      <b>{q.weaknesses}: </b>
                      {[...new Set(result.weakTopics.map(l))].join(" · ")}
                    </span>
                  </p>
                )}
                <p>{l(result.recommendation)}</p>
              </div>
              {Array.isArray(result.review) && result.review.length > 0 && (
                <details
                  className="arena-result-review"
                  data-testid="quest-review"
                >
                  <summary>
                    {q.reviewAnswers}
                    <ChevronDown size={18} />
                  </summary>
                  <ol>
                    {(result.review as ReviewItem[]).map((item) => (
                      <li
                        key={item.index}
                        className={item.correct ? "correct" : "incorrect"}
                      >
                        <span className="arena-review-mark" aria-hidden="true">
                          {item.correct ? <Check size={16} /> : <X size={16} />}
                        </span>
                        <div>
                          <strong>{l(item.prompt)}</strong>
                          <p>
                            <b>{q.yourAnswer}: </b>
                            {item.options?.[locale]?.[item.chosen]}
                          </p>
                          {!item.correct && (
                            <p>
                              <b>{q.correctAnswer}: </b>
                              {item.options?.[locale]?.[item.answer]}
                            </p>
                          )}
                          <small>{l(item.explanation)}</small>
                        </div>
                      </li>
                    ))}
                  </ol>
                </details>
              )}
              <div className="actions">
                <Button
                  onClick={() => {
                    setPanel("ask");
                    setResult(null);
                  }}
                >
                  <MessageCircle size={18} />
                  {q.resultAsk}
                </Button>
                <Button variant="secondary" onClick={() => setResult(null)}>
                  {q.playAgain}
                </Button>
              </div>
            </section>
          ) : (
            <>
              <div className="arena-play-layout">
                <article className="arena-feature">
                  <div className="arena-feature-art">
                    {activeMode === "knowledge-arena" ? (
                      <ArenaPreview world={activeWorld} />
                    ) : (
                      <QuestArt />
                    )}
                    <div className="arena-art-topline">
                      <span className="arena-label">
                        <Gamepad2 size={14} />
                        {selectedId ? q.custom : q.daily}
                      </span>
                      {(data?.source === "demo" || state.isDemo) && (
                        <span className="arena-demo-tag">{q.demo}</span>
                      )}
                    </div>
                    <span className="arena-art-world">
                      <Layers3 size={15} />
                      {l(WORLD_LABELS[activeWorld as WorldTheme])}
                    </span>
                  </div>
                  <div className="arena-feature-info">
                    <div className="arena-feature-title">
                      <div>
                        <h2 data-testid="quest-selected-title">{title}</h2>
                        <p>
                          {selectedId ? topic : modeSummaries[mode][locale]}
                        </p>
                      </div>
                      {!!data?.personalBest && (
                        <span className="arena-best" title={q.yourBest}>
                          <Trophy size={15} />
                          {data.personalBest}
                        </span>
                      )}
                    </div>
                    <div className="arena-game-facts">
                      {selectedId && (
                        <span>
                          <Gamepad2 size={16} />
                          {l(GAME_MODE_LABELS[activeMode])}
                        </span>
                      )}
                      <span>
                        <Clock3 size={16} />
                        {Math.round((game?.timeLimit || 180) / 60)} {q.minutes}
                      </span>
                      <span>
                        <Target size={16} />
                        {game?.questions?.length || 8} {q.questions}
                      </span>
                      <span>
                        <Zap size={16} />
                        {q[
                          (game?.difficulty || "beginner") as
                            "beginner" | "intermediate" | "advanced"
                        ] || q.beginner}
                      </span>
                    </div>
                    {!game && !error && (
                      <div className="arena-preparing" role="status">
                        <LoaderCircle className="spin" size={17} />
                        {q.preparing}
                      </div>
                    )}
                    <Button
                      data-testid="quest-start"
                      className="arena-start"
                      busy={busy}
                      disabled={!game || !canStart}
                      onClick={start}
                    >
                      {canPlay ? (
                        <Play size={21} fill="currentColor" />
                      ) : (
                        <LockKeyhole size={20} />
                      )}
                      <span>{canPlay ? q.start : q.preview}</span>
                      <ArrowLeft size={20} />
                    </Button>
                    {!canStart && (
                      <p className="arena-inline-note">{q.exhausted}</p>
                    )}
                    {selectedId && (
                      <>
                        <p className="arena-source-note">
                          {l(data?.sourceNotice || game?.sourceNotice) ||
                            q.savedNotice}
                        </p>
                        <Button
                          variant="tertiary"
                          className="arena-back-daily"
                          onClick={() => {
                            choose(null);
                            setMode("knowledge-arena");
                          }}
                        >
                          <RotateCcw size={16} />
                          {q.changeDaily}
                        </Button>
                      </>
                    )}
                    {!selectedId && (
                      <div className="arena-reset">
                        <span>{q.next}</span>
                        <Countdown />
                      </div>
                    )}
                  </div>
                </article>
                <aside className="arena-side">
                  <button
                    type="button"
                    className="arena-create-shortcut"
                    onClick={() => setPanel("create")}
                  >
                    <span className="arena-shortcut-symbol">
                      <Sparkles size={25} />
                    </span>
                    <strong>{q.createTitle}</strong>
                    <span>{q.createSubtitle}</span>
                    <b>
                      {q.create}
                      <ArrowLeft size={17} />
                    </b>
                  </button>
                  <button
                    type="button"
                    className="arena-ask-shortcut"
                    onClick={() => setPanel("ask")}
                  >
                    <span>
                      <MessageCircle size={21} />
                      <strong>{q.ask}</strong>
                    </span>
                    <ArrowLeft size={17} />
                  </button>
                  <div className="arena-controls-summary">
                    <span>
                      <Move size={16} />
                      {q.move}
                    </span>
                    <span>
                      <Crosshair size={16} />
                      {q.shoot}
                    </span>
                    <span>
                      <Target size={16} />
                      {q.learn}
                    </span>
                  </div>
                </aside>
              </div>
              {customGames.length > 0 && (
                <section className="arena-library">
                  <div className="arena-section-heading">
                    <h2>{q.savedGames}</h2>
                    <button
                      type="button"
                      onClick={() => setPanel("create")}
                      aria-label={q.newGame}
                    >
                      <Plus size={20} />
                    </button>
                  </div>
                  <div className="arena-saved-list">
                    {customGames.slice(0, 8).map((saved) => (
                      <div key={saved.dailyGameId || saved.id}>
                        <button
                          type="button"
                          onClick={() => choose(saved.dailyGameId || saved.id)}
                          className={`arena-saved-open ${
                            (saved.dailyGameId || saved.id) === selectedId
                              ? "selected"
                              : ""
                          }`}
                        >
                          <span className="arena-saved-icon">
                            <Gamepad2 size={23} />
                          </span>
                          <span>
                            <strong>
                              {l(saved.title) || saved.topic || q.yourGame}
                            </strong>
                            <small>
                              {l(
                                GAME_MODE_LABELS[saved.gameMode as GameMode],
                              ) || l(GAME_MODE_LABELS["knowledge-arena"])}{" "}
                              ·{" "}
                              {l(WORLD_LABELS[saved.worldTheme as WorldTheme])}{" "}
                              · {Math.round((saved.timeLimit || 180) / 60)}{" "}
                              {q.minutes}
                            </small>
                          </span>
                          <ArrowUpRight size={18} />
                        </button>
                        <button
                          type="button"
                          className="arena-saved-delete"
                          aria-label={`${q.deleteGame}: ${l(saved.title) || saved.topic || q.yourGame}`}
                          title={q.deleteGame}
                          onClick={() => setConfirmDelete(saved)}
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    ))}
                  </div>
                </section>
              )}
              <details className="arena-more-modes">
                <summary>
                  {q.moreModes}
                  <ChevronDown size={18} />
                </summary>
                <div className="arena-more-fields">
                  <Field label={q.mode}>
                    <select
                      value={selectedId ? "knowledge-arena" : mode}
                      onChange={(e) => {
                        choose(null);
                        setMode(e.target.value as GameMode);
                      }}
                    >
                      {GAME_MODES.map((value) => (
                        <option key={value} value={value}>
                          {l(GAME_MODE_LABELS[value])}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label={q.world}>
                    <select
                      value={world}
                      onChange={(e) => {
                        choose(null);
                        setWorld(e.target.value as WorldTheme);
                      }}
                    >
                      {WORLD_THEMES.map((value) => (
                        <option key={value} value={value}>
                          {l(WORLD_LABELS[value])}
                        </option>
                      ))}
                    </select>
                  </Field>
                </div>
                {selectedId && (
                  <Button variant="tertiary" onClick={() => choose(null)}>
                    <RotateCcw size={15} />
                    {q.changeDaily}
                  </Button>
                )}
              </details>
              {state.attempts?.length > 0 && (
                <section className="arena-recent">
                  <h2>{q.todayProgress}</h2>
                  {state.attempts
                    .filter((a: any) => a.status === "finished" || a.finishedAt)
                    .slice(0, 3)
                    .map((a: any) => (
                      <div key={a.id}>
                        <span>
                          <Gamepad2 size={17} />
                          {l(GAME_MODE_LABELS[a.mode as GameMode]) ||
                            q.dailyTitle}
                        </span>
                        <b>
                          {a.score || 0}
                          <small>{q.score}</small>
                        </b>
                      </div>
                    ))}
                </section>
              )}
            </>
          )}
        </section>
      )}

      {panel === "create" && (
        <section
          id="quest-panel-create"
          className="arena-create-panel"
          aria-label={q.create}
        >
          <form
            className="arena-creator"
            onSubmit={generate}
            aria-busy={generating}
          >
            <fieldset disabled={generating} className="arena-creator-fields">
              <Field label={q.questionTopic} help={q.topicHelp}>
                <textarea
                  data-testid="arena-topic"
                  value={form.topic}
                  maxLength={150}
                  minLength={2}
                  required
                  rows={2}
                  placeholder={q.topicPlaceholder}
                  onChange={(e) => edit({ topic: e.target.value })}
                />
              </Field>
              <div
                className="arena-topic-suggestions"
                aria-label={q.suggestions}
              >
                {[q.math, q.english, q.coding, q.ai].map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => edit({ topic: value })}
                    className={form.topic === value ? "selected" : ""}
                  >
                    {value}
                  </button>
                ))}
              </div>
              <div className="arena-form-options">
                <fieldset className="arena-choice">
                  <legend>{q.difficulty}</legend>
                  <div>
                    {(["beginner", "intermediate", "advanced"] as const).map(
                      (level) => (
                        <label key={level}>
                          <input
                            type="radio"
                            name="arena-level"
                            checked={form.level === level}
                            onChange={() => edit({ level })}
                          />
                          <span>{q[level]}</span>
                        </label>
                      ),
                    )}
                  </div>
                </fieldset>
                <fieldset className="arena-choice">
                  <legend>{q.duration}</legend>
                  <div>
                    {([3, 5, 7] as const).map((durationMinutes) => (
                      <label key={durationMinutes}>
                        <input
                          type="radio"
                          name="arena-duration"
                          checked={form.durationMinutes === durationMinutes}
                          onChange={() => edit({ durationMinutes })}
                        />
                        <span>
                          {durationMinutes} {q.minutes}
                        </span>
                      </label>
                    ))}
                  </div>
                </fieldset>
              </div>
              <fieldset className="arena-modes">
                <legend>{q.mode}</legend>
                <div>
                  {GAME_MODES.map((value) => (
                    <button
                      type="button"
                      key={value}
                      data-testid={`arena-mode-${value}`}
                      aria-pressed={form.gameMode === value}
                      onClick={() => edit({ gameMode: value })}
                    >
                      <strong>{l(GAME_MODE_LABELS[value])}</strong>
                      <span>{modeSummaries[value][locale]}</span>
                    </button>
                  ))}
                </div>
                <p>{q.modeHelp}</p>
              </fieldset>
              <fieldset className="arena-worlds">
                <legend>{q.world}</legend>
                <div>
                  {WORLD_THEMES.map((value, i) => (
                    <button
                      type="button"
                      key={value}
                      style={
                        { "--world-swatch": worldColors[i] } as CSSProperties
                      }
                      aria-pressed={form.worldTheme === value}
                      onClick={() => edit({ worldTheme: value })}
                    >
                      <span className="arena-world-icon">
                        <Layers3 size={23} />
                        {form.worldTheme === value && (
                          <i>
                            <Check size={11} />
                          </i>
                        )}
                      </span>
                      <span>{l(WORLD_LABELS[value])}</span>
                    </button>
                  ))}
                </div>
              </fieldset>
            </fieldset>
            {generatorIsDemo && (
              <p className="arena-demo-disclosure">
                <span>{q.demo}</span>
                {q.demoGeneration}
              </p>
            )}
            {generationError && <Notice type="error">{generationError}</Notice>}
            {generating && (
              <div className="arena-building" role="status">
                <LoaderCircle className="spin" size={25} />
                <div>
                  <strong>{q.generating}</strong>
                  <p>{slowGeneration ? q.generatingLong : q.generatingHelp}</p>
                </div>
              </div>
            )}
            <Button
              data-testid="arena-generate"
              type="submit"
              className="arena-generate"
              busy={generating}
              disabled={form.topic.trim().length < 2}
            >
              <Sparkles size={19} />
              {q.generate}
              <ArrowLeft size={19} />
            </Button>
          </form>
          <aside className="arena-creator-preview">
            {form.gameMode === "knowledge-arena" ? (
              <ArenaPreview world={form.worldTheme} />
            ) : (
              <QuestArt />
            )}
            <div>
              <span className="quest-section-label">{q.yourGame}</span>
              <h2>{form.topic || q.questionTopic}</h2>
              <p>{modeSummaries[form.gameMode][locale]}</p>
              <span>
                {l(GAME_MODE_LABELS[form.gameMode])} · {form.durationMinutes}{" "}
                {q.minutes} · {q[form.level]}
              </span>
            </div>
          </aside>
        </section>
      )}
      {panel === "ask" && (
        <section
          id="quest-panel-ask"
          className="arena-assistant-layout"
          aria-label={q.ask}
        >
          <QuestAssistant gameId={game?.dailyGameId} topic={topic} />
          <aside className="arena-assistant-aside">
            <BookIllustration />
            <h2>{q.assistantLabel}</h2>
            <p>{q.assistantScope}</p>
            <button type="button" onClick={() => setPanel("play")}>
              <Gamepad2 size={19} />
              {q.backToPlay}
              <ArrowLeft size={17} />
            </button>
          </aside>
        </section>
      )}

      {instructions && (
        <Modal title={q.controls} onClose={() => setInstructions(false)}>
          <div className="arena-instructions">
            {[
              [Move, q.move, q.moveHelp],
              [Crosshair, q.shoot, q.shootHelp],
              [Target, q.learn, q.learnHelp],
            ].map(([Icon, label, text], i) => {
              const Symbol = Icon as typeof Move;
              return (
                <div key={i}>
                  <Symbol size={25} />
                  <div>
                    <strong>{label as string}</strong>
                    <p>{text as string}</p>
                  </div>
                </div>
              );
            })}
          </div>
          <Button onClick={() => setInstructions(false)}>{q.backToPlay}</Button>
        </Modal>
      )}
      {preview && (
        <Modal title={q.previewTitle} onClose={() => setPreview(false)}>
          <div className="arena-trial-art">
            <ArenaPreview world={activeWorld} />
          </div>
          <p>{q.previewHelp}</p>
          {game?.questions?.[0] && (
            <div className="arena-preview-question">
              <h3>{l(game.questions[0].prompt)}</h3>
              {game.questions[0].options[locale].map(
                (answer: string, i: number) => (
                  <button
                    key={i}
                    className={previewAnswer === i ? "selected" : ""}
                    type="button"
                    onClick={() => setPreviewAnswer(i)}
                  >
                    <span>{i + 1}</span>
                    {answer}
                    {previewAnswer === i && <Check size={17} />}
                  </button>
                ),
              )}
            </div>
          )}
          {previewAnswer !== null && (
            <p className="small-text">{q.previewSelected}</p>
          )}
          <Button
            onClick={() => {
              setPreview(false);
              setPaywall(true);
            }}
          >
            {q.openGames}
            <ArrowLeft size={18} />
          </Button>
        </Modal>
      )}
      {confirmDelete && (
        <Modal
          title={q.deleteGameTitle}
          onClose={() => {
            if (!deleting) setConfirmDelete(null);
          }}
        >
          <p>
            <strong>
              {l(confirmDelete.title) || confirmDelete.topic || q.yourGame}
            </strong>
          </p>
          <p>{q.deleteGameBody}</p>
          <div className="actions">
            <Button
              data-testid="arena-delete-confirm"
              busy={deleting}
              onClick={removeGame}
            >
              <Trash2 size={18} />
              {q.deleteGame}
            </Button>
            <Button
              variant="secondary"
              disabled={deleting}
              onClick={() => setConfirmDelete(null)}
            >
              {q.cancel}
            </Button>
          </div>
        </Modal>
      )}
      {checkout.dialog}
      {checkout.error && <Notice type="error">{checkout.error}</Notice>}
      {paywall && !checkout.dialog && (
        <Modal title={q.paywallTitle} onClose={() => setPaywall(false)}>
          <Gamepad2 size={34} />
          <p>{q.paywallDescription}</p>
          <div className="paywall-price">
            <b>Basic</b>
            <strong>
              ₪{catalog.plans?.find((p: any) => p.id === "BASIC")?.price}
            </strong>
            <span>{q.monthly}</span>
          </div>
          <p>{q.manualPayment}</p>
          <Button
            className="full-width"
            busy={checkout.busy}
            onClick={() => checkout.start({ plan: "BASIC" })}
          >
            {q.openGames}
            <ArrowLeft size={18} />
          </Button>
        </Modal>
      )}
    </div>
  );
}

function BookIllustration() {
  return (
    <div className="arena-book-symbol" aria-hidden="true">
      <MessageCircle size={54} />
      <Sparkles size={23} />
    </div>
  );
}
