"use client";

import type { PlanId } from "@/config/plans";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useId, useRef, useState, useSyncExternalStore } from "react";
import { useLocale, useT } from "@/components/I18nProvider";
import { Alert, Arrow, Badge, Button, Card, Field, Input, Select, Textarea, cx } from "@/components/ui";
import { INPUT_LIMITS } from "@/config/limits";
import { CONTENT_LANGUAGES, DIFFICULTIES, GAME_TYPES, GENERATION_MODES, type GenerationModeId, type Mechanic } from "@/lib/game/spec/constants";
import type { DictKey } from "@/lib/i18n";
import { formatDate } from "@/lib/format";
import { MaterialPreview } from "./MaterialPreview";
import { TopicPicker } from "./TopicPicker";
import { TOPICS, findTopic } from "@/lib/game/topics/catalog";
import { leftText } from "@/components/allowance/quota";

export interface CreateFormProps {
  /** `templates`: without AI, whether a subject alone still makes a demo-template game (else material or a topic is needed). */
  backend: { kind: "ai" | "demo" | "unavailable"; provider: string; label: string; reason?: string; templates?: boolean };
  allowance: { periodEnd: string; plan: string; activeJobId: string | null };
  /** Saved games and their level (an extension keeps the level and uses one game of that level's quota). */
  games: { id: string; title: string; subject: string; generatorKind: string; level: Level }[];
  /** Mechanics the user can ask an extension to add. */
  extensionMechanics: readonly Mechanic[];
  /** The game levels, each one's own quota this period and what each can build (the server enforces it; this only explains and disables). */
  levels: {
    options: LevelOption[];
    /** The level preselected for each mode (the highest one that fits and still has a game left). */
    defaults: { FAST: Level; FULL: Level };
    /** Whether the plan's highest level has several areas (Full Adventure and Extend), and the plan that unlocks them. */
    fullAllowed: boolean;
    unlockPlan: string;
  };
  initialMode?: GenerationModeId;
  initialGameId?: string;
}

type Level = "A" | "B" | "C";
export interface LevelOption {
  level: Level;
  share: number;
  /** Games per period at this level on the plan (null: unlimited; 0: not on the plan). */
  limit: number | null;
  /** Games of this level that can still be started this period (null: unlimited). */
  remaining: number | null;
  allowed: boolean;
  /** The cheapest plan that offers this level when the current one does not. */
  unlockPlan: string | null;
  fullAllowed: boolean;
  /** Game types a game at this level can be, and the lowest level that has each. */
  gameTypes: { id: string; allowed: boolean; level: Level }[];
}

const EXAMPLES = [1, 2, 3, 4] as const;

const NATIVE_LANG: Record<string, string> = { he: "עברית", en: "English", ar: "العربية", es: "Español", fr: "Français", de: "Deutsch", ru: "Русский" };

const noopSubscribe = () => () => undefined;

/** Client-side idempotency key: one per form submission attempt, so a double click or a retry never double-charges. */
function newKey(): string {
  const bytes = new Uint8Array(18);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}


/** A touch-first, small screen: the game is fitted to a phone (a hint only; it can never unlock anything). */
function playDevice(): "phone" | "desktop" {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return "desktop";
  const touch = window.matchMedia("(pointer: coarse)").matches;
  const small = Math.min(window.screen?.width ?? window.innerWidth, window.screen?.height ?? window.innerHeight) < 820;
  return touch && small ? "phone" : "desktop";
}
export function CreateForm({ backend, allowance, games, extensionMechanics, levels, initialMode = "FAST", initialGameId }: CreateFormProps) {
  const t = useT();
  const locale = useLocale();
  const router = useRouter();
  const [mode, setMode] = useState<GenerationModeId>(initialMode === "EXTEND" && games.length === 0 ? "FAST" : initialMode);
  const [gameId, setGameId] = useState(initialGameId && games.some((g) => g.id === initialGameId) ? initialGameId : (games[0]?.id ?? ""));
  const [level, setLevel] = useState<Level>(levels.defaults[initialMode === "FULL" ? "FULL" : "FAST"]);
  const [gameType, setGameType] = useState<string>("adventure");
  const [addMissions, setAddMissions] = useState(1);
  const [addChallenges, setAddChallenges] = useState(3);
  const [addMechanics, setAddMechanics] = useState<Mechanic[]>([]);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<{ text: string; jobId?: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const keyRef = useRef<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const examplesId = useId();
  // false while the server-rendered form is still inert, true once React handles events (tests wait for it)
  const hydrated = useSyncExternalStore(noopSubscribe, () => true, () => false);

  const extend = mode === "EXTEND";
  const selected = games.find((g) => g.id === gameId);
  const engineGame = selected?.generatorKind === "engine";
  const mismatch = extend && selected !== undefined && backend.kind !== "unavailable" && selected.generatorKind !== backend.kind && !(engineGame && backend.kind === "demo");
  const [material, setMaterial] = useState("");
  /** "library": a topic from the curated topic library (built without AI); "own": the learner's own subject. */
  const [source, setSource] = useState<"own" | "library">("own");
  const [topicId, setTopicId] = useState<string | null>(null);
  const library = !extend && source === "library";
  // no AI and the demo templates switched off: a game comes from the learner's material or from the topic library
  const noTemplates = backend.kind === "demo" && backend.templates === false;
  const [fileNote, setFileNote] = useState<{ tone: "info" | "error"; text: string } | null>(null);
  // every level has its own quota: a level is usable while it has a game left (an unlimited level always has one)
  const hasLeft = (o: LevelOption) => o.allowed && (o.remaining === null || o.remaining > 0);
  const exhausted = !levels.options.some(hasLeft);
  const resetsOn = formatDate(allowance.periodEnd, locale);
  const catalogGame = extend && selected?.generatorKind === "catalog";
  const levelInfo = levels.options.find((o) => o.level === level) ?? levels.options[0]!;
  const levelUsable = (o: LevelOption) => hasLeft(o) && (mode !== "FULL" || o.fullAllowed);
  // the game type shown is always one the chosen level can build (the select is controlled)
  const typeAllowed = (id: string) => levelInfo.gameTypes.find((g) => g.id === id)?.allowed ?? true;
  const effectiveType = typeAllowed(gameType) ? gameType : typeAllowed("adventure") ? "adventure" : (levelInfo.gameTypes.find((g) => g.allowed)?.id ?? "exploration");
  const selectedInfo = selected ? levels.options.find((o) => o.level === selected.level) : undefined;
  const extendProblem = !extend || !selected ? null
    : !selectedInfo?.allowed ? "locked" as const
    : !selectedInfo.fullAllowed ? "single" as const
    : !hasLeft(selectedInfo) ? "short" as const : null;
  const short = extend ? extendProblem === "short" : !levelUsable(levelInfo);
  // the topic library never needs an AI provider
  const blocked = (backend.kind === "unavailable" && !library) || exhausted || short || Boolean(extendProblem) || Boolean(allowance.activeJobId) || mismatch || catalogGame;
  // the badge under the form speaks about the level this request would use (the game's own level when extending)
  const badgeLevel = extend ? selectedInfo : levelInfo;
  const badgeText = exhausted ? t("create.allowance.none", { date: resetsOn })
    : !badgeLevel?.allowed ? null
    : badgeLevel.remaining === null || badgeLevel.limit === null ? t("create.allowance.unlimited", { level: badgeLevel.level })
    : badgeLevel.remaining > 0 ? t("create.allowance", { level: badgeLevel.level, n: badgeLevel.remaining, limit: badgeLevel.limit })
    : t("create.allowance.levelNone", { level: badgeLevel.level, date: resetsOn });

  function chooseMode(m: GenerationModeId) {
    setMode(m);
    // a Full Adventure needs a level with several areas: move to the preselected one when the current level has none
    if (m === "FULL" && !levelInfo.fullAllowed) setLevel(levels.defaults.FULL);
  }

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy || blocked) return;
    const form = new FormData(e.currentTarget);
    const get = (k: string) => String(form.get(k) ?? "").trim();
    const errs: Record<string, string> = {};
    const topic = library && topicId ? findTopic(topicId) : undefined;
    if (library && !topic) errs.topicId = t("topics.required");
    if (!extend && !library && !get("subject")) errs.subject = t("create.error.required");
    if (!library && !get("learningGoal")) errs.learningGoal = t("create.error.required");
    if (get("subject").length > INPUT_LIMITS.subjectMax) errs.subject = t("create.error.tooLong");
    if (get("learningGoal").length > INPUT_LIMITS.goalMax) errs.learningGoal = t("create.error.tooLong");
    if (get("notes").length > INPUT_LIMITS.notesMax) errs.notes = t("create.error.tooLong");
    if (get("material").length > INPUT_LIMITS.materialMax) errs.material = t("create.error.tooLong");
    if (extend && engineGame && !get("material")) errs.material = t("create.error.materialRequired");
    if (!extend && !library && noTemplates && !get("material")) errs.material = t("create.error.materialNeeded");
    setFieldErrors(errs);
    if (Object.keys(errs).length) {
      setError({ text: t("create.error.validation") });
      // keyboard and screen-reader users land on the first field that needs fixing (its message is read with it)
      const first = (["topicId", "subject", "learningGoal", "material", "notes"] as const).find((k) => errs[k]);
      const target = first === "topicId" ? e.currentTarget.querySelector<HTMLElement>('[data-testid="topic-search"]') : first ? e.currentTarget.elements.namedItem(first) : null;
      if (target instanceof HTMLElement) target.focus();
      return;
    }
    setBusy(true);
    setError(null);
    keyRef.current ??= newKey();
    const request = extend
      ? {
          mode,
          subject: selected?.subject ?? "extension",
          learningGoal: get("learningGoal"),
          difficulty: "intermediate",
          gameType: "adventure",
          contentLanguage: locale,
          notes: get("notes") || undefined,
          material: get("material") || undefined,
          targetGameId: gameId,
          extension: { addArea: true, addMissions, addChallenges, addMechanics },
        }
      : topic
        ? {
            // the server builds the game from the topic's own content; subject and goal are the topic's title and description
            mode,
            subject: get("contentLanguage") === "he" ? topic.he[0] : topic.en[0],
            learningGoal: get("contentLanguage") === "he" ? topic.he[1] : topic.en[1],
            difficulty: get("difficulty"),
            gameType: effectiveType,
            contentLanguage: get("contentLanguage"),
            level,
            topicId: topic.id,
            device: playDevice(),
          }
        : {
          mode,
          subject: get("subject"),
          learningGoal: get("learningGoal"),
          difficulty: get("difficulty"),
          gameType: effectiveType,
          contentLanguage: get("contentLanguage"),
          level,
          notes: get("notes") || undefined,
          material: get("material") || undefined,
          device: playDevice(),
        };
    try {
      const res = await fetch("/api/generations", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ idempotencyKey: keyRef.current, request }),
      });
      const json = (await res.json().catch(() => ({}))) as { jobId?: string; error?: { code?: string; details?: { jobId?: string | null; requiredPlan?: string } } };
      if (res.ok && json.jobId) {
        router.push(`/generate/${json.jobId}`);
        return;
      }
      keyRef.current = null; // the server gave a definitive answer; a corrected form is a new submission
      const code = json.error?.code;
      if (code === "ALLOWANCE_EXHAUSTED") setError({ text: t("create.error.exhausted") });
      else if (code === "JOB_IN_PROGRESS") setError({ text: t("create.error.inProgress"), jobId: json.error?.details?.jobId ?? undefined });
      else if (code === "EXTEND_BACKEND_MISMATCH") setError({ text: catalogGame ? t("create.error.catalogExtend") : t("create.error.mismatch") });
      else if (code === "FEATURE_TIER_LOCKED") setError({ text: t("create.error.tierLocked") });
      else if (code === "TOPIC_LOCKED") setError({ text: json.error?.details?.requiredPlan === "PRO" ? t("create.error.topicLockedPro") : t("create.error.topicLocked") });
      else if (code === "VALIDATION_ERROR") setError({ text: t("create.error.validation") });
      else if (code === "MATERIAL_REQUIRED") { setFieldErrors({ material: t("create.error.materialNeeded") }); setError({ text: t("create.error.materialNeeded") }); }
      else if (code === "RATE_LIMITED") setError({ text: t("common.error.rateLimited") });
      else if (code === "UNAUTHORIZED") router.push("/login?next=/create");
      else setError({ text: t("common.error.generic") });
    } catch {
      // Network failure: the outcome is unknown, so KEEP the key — pressing again can never create a second job.
      setError({ text: t("common.error.network") });
    } finally {
      setBusy(false);
    }
  }

  /** Fills the subject and goal from an example (the fields are uncontrolled, so the form element is written to directly). */
  function applyExample(n: (typeof EXAMPLES)[number]) {
    const form = formRef.current;
    if (!form) return;
    const set = (name: string, value: string) => {
      const el = form.elements.namedItem(name);
      if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) el.value = value;
    };
    set("subject", t(`create.example.${n}.subject` as DictKey));
    set("learningGoal", t(`create.example.${n}.goal` as DictKey));
    setFieldErrors(({ subject: _s, learningGoal: _g, ...rest }) => rest);
    form.querySelector<HTMLElement>("#learningGoal")?.focus();
  }

  function toggleMechanic(m: Mechanic) {
    setAddMechanics((cur) => (cur.includes(m) ? cur.filter((x) => x !== m) : [...cur, m]));
  }


  async function loadFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // choosing the same file again still triggers a change
    if (!file) return;
    try {
      if (file.size > 2_000_000) throw new Error("too big");
      const text = (await file.text()).replace(/\u0000/g, "");
      setMaterial(text.slice(0, INPUT_LIMITS.materialMax));
      setFileNote(text.length > INPUT_LIMITS.materialMax ? { tone: "info", text: t("create.material.file.trimmed", { max: INPUT_LIMITS.materialMax }) } : null);
    } catch {
      setFileNote({ tone: "error", text: t("create.material.file.error") });
    }
  }

  const materialField = (
    <Field label={t("create.material")} htmlFor="material" error={fieldErrors.material} hint={backend.kind === "ai" ? t("create.material.hint.ai") : noTemplates ? t("create.material.hint.engine") : t("create.material.hint.demo")}>
      <Textarea
        id="material" name="material" dir="auto" rows={8} maxLength={INPUT_LIMITS.materialMax} placeholder={t("create.material.placeholder")} data-testid="create-material"
        value={material} onChange={(e) => setMaterial(e.target.value)}
      />
      <span className="mt-1 flex flex-wrap items-center justify-between gap-2 text-xs text-muted">
        <label className="inline-flex min-h-10 cursor-pointer items-center gap-1.5 rounded-lg border border-line px-3 font-semibold text-neon hover:bg-text/5 focus-within:outline focus-within:outline-2 focus-within:outline-neon">
          <input type="file" accept=".txt,.md,.markdown,.csv,.tsv,text/plain,text/markdown,text/csv" onChange={loadFile} className="sr-only" data-testid="material-file" />
          {t("create.material.file")}
        </label>
        <span aria-live="off">{t("create.material.count", { n: material.length, max: INPUT_LIMITS.materialMax })}</span>
      </span>
      {fileNote && <span className={cx("mt-1 block text-xs", fileNote.tone === "error" ? "text-rose" : "text-muted")} data-testid="material-file-note">{fileNote.text}</span>}
      {backend.kind === "demo" && <div className="mt-2"><MaterialPreview material={material} full={mode === "FULL"} /></div>}
    </Field>
  );

  return (
    <form ref={formRef} onSubmit={submit} className="space-y-6" noValidate data-testid="create-form" data-hydrated={hydrated ? "1" : "0"}>
      <Alert tone={backend.kind === "demo" ? "warn" : backend.kind === "unavailable" ? "error" : "info"} data-testid="provider-banner" data-provider-kind={backend.kind}>
        {backend.kind === "ai" && t("create.provider.ai")}
        {backend.kind === "demo" && (noTemplates ? t("create.provider.engine") : t("create.provider.demo"))}
        {backend.kind === "unavailable" && t("create.provider.unavailable", { reason: backend.reason ?? "" })}
      </Alert>

      <fieldset className="space-y-3">
        <legend className="mb-2 text-sm font-semibold">{t("create.mode.title")}</legend>
        <div className="grid gap-3 md:grid-cols-3" role="radiogroup">
          {GENERATION_MODES.map((m) => {
            const locked = m !== "FAST" && !levels.fullAllowed;
            const disabled = (m === "EXTEND" && games.length === 0) || locked;
            return (
              <label
                key={m}
                className={cx(
                  "flex cursor-pointer flex-col gap-2 rounded-2xl border p-4 transition-colors",
                  mode === m ? "border-neon bg-neon/10" : "border-line bg-ink-800/60 hover:bg-text/5",
                  disabled && "cursor-not-allowed opacity-50",
                )}
              >
                <span className="flex items-center gap-2">
                  <input type="radio" name="mode" value={m} checked={mode === m} disabled={disabled} onChange={() => chooseMode(m)} className="size-4 accent-[var(--color-neon)]" data-testid={`mode-${m}`} />
                  <span className="font-semibold">{t(`mode.${m}`)}{locked && <span className="ms-2 text-xs font-normal text-amber" data-testid={`mode-locked-${m}`}>{t("create.locked.suffix", { plan: t(`plan.${levels.unlockPlan}` as DictKey) })}</span>}</span>
                </span>
                <span className="text-sm text-muted">{t(`create.mode.${m}.desc` as DictKey)}</span>
                {m === "EXTEND" && games.length === 0 && <span className="text-xs font-medium text-amber">{t("create.extend.none")}</span>}
              </label>
            );
          })}
        </div>
      </fieldset>
      {!extend && (
        <fieldset className="space-y-2" data-testid="create-level">
          <legend className="mb-1 text-sm font-semibold">{t("create.level.title")}</legend>
          <div className="grid gap-2 sm:grid-cols-3" role="radiogroup">
            {levels.options.map((o) => {
              const disabled = !levelUsable(o);
              return (
                <label
                  key={o.level}
                  className={cx(
                    "flex cursor-pointer flex-col gap-1 rounded-xl border px-3 py-2 text-sm",
                    level === o.level ? "border-neon bg-neon/10" : "border-line hover:bg-text/5",
                    disabled && "cursor-not-allowed opacity-50",
                  )}
                >
                  <span className="flex items-center gap-2">
                    <input type="radio" name="level" value={o.level} checked={level === o.level} disabled={disabled} onChange={() => setLevel(o.level)} className="size-4 accent-[var(--color-neon)]" data-testid={`level-${o.level}`} />
                    <span className="font-semibold">{t("create.level.option", { tier: o.level, share: o.share })}</span>
                  </span>
                  <span className="ms-6 text-xs text-muted" data-testid={`level-left-${o.level}`}>
                    {o.allowed && hasLeft(o) && (o.remaining === null || o.limit === null ? t("create.level.unlimited") : t("quota.left", { n: o.remaining, limit: o.limit }))}
                    {!o.allowed && o.unlockPlan && <span className="text-amber" data-testid={`level-locked-${o.level}`}>{t("create.locked.suffix", { plan: t(`plan.${o.unlockPlan}` as DictKey) })}</span>}
                    {o.allowed && !hasLeft(o) && <span className="text-amber" data-testid={`level-short-${o.level}`}>{leftText(t, o, resetsOn)}</span>}
                    {o.allowed && hasLeft(o) && mode === "FULL" && !o.fullAllowed && <span className="ms-1 text-amber">{t("create.locked.level", { level: levels.defaults.FULL })}</span>}
                  </span>
                </label>
              );
            })}
          </div>
          <p className="text-xs text-muted" data-testid="create-level-hint">{t("create.level.hint")}</p>
        </fieldset>
      )}
      {!extend && <p className="text-sm text-muted" data-testid="create-tier-note">{t("create.tier.note", { tier: levelInfo.level, share: levelInfo.share })}</p>}

      {extend ? (
        <Card className="space-y-4">
          {games.length === 0 ? (
            <p className="text-sm text-muted">{t("create.extend.none")}</p>
          ) : (
            <>
              <Field label={t("create.extend.game")} htmlFor="targetGameId">
                <Select id="targetGameId" value={gameId} onChange={(e) => setGameId(e.target.value)} data-testid="extend-game">
                  {games.map((g) => <option key={g.id} value={g.id}>{g.title} — {g.subject}</option>)}
                </Select>
              </Field>
              <p className="text-xs text-muted">{t("create.extend.keep")}</p>
              {selected && (
                <p className={cx("text-sm", extendProblem ? "text-amber" : "text-muted")} data-testid="extend-cost">
                  {extendProblem === "locked" ? t("create.extend.locked", { tier: selected.level })
                    : extendProblem === "single" ? t("create.extend.single", { tier: selected.level })
                    : extendProblem === "short" ? t("create.extend.short", { tier: selected.level, date: resetsOn })
                    : t("create.extend.cost", { tier: selected.level, left: selectedInfo ? leftText(t, selectedInfo, resetsOn) : "" })}
                </p>
              )}
              {mismatch && !catalogGame && <Alert tone="error">{t("create.error.mismatch")}</Alert>}
              {catalogGame && <Alert tone="info" data-testid="extend-catalog-note">{t("create.error.catalogExtend")}</Alert>}
              <Field label={t("create.extend.goal")} htmlFor="learningGoal" error={fieldErrors.learningGoal} required>
                <Textarea id="learningGoal" name="learningGoal" maxLength={INPUT_LIMITS.goalMax} rows={3} placeholder={t("create.goal.placeholder")} data-testid="create-goal" />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label={t("create.extend.addMissions")} htmlFor="addMissions">
                  <Select id="addMissions" value={addMissions} onChange={(e) => setAddMissions(Number(e.target.value))}>{[0, 1, 2, 3].map((n) => <option key={n} value={n}>{n}</option>)}</Select>
                </Field>
                <Field label={t("create.extend.addChallenges")} htmlFor="addChallenges">
                  <Select id="addChallenges" value={addChallenges} onChange={(e) => setAddChallenges(Number(e.target.value))}>{[0, 1, 2, 3, 4, 5, 6].map((n) => <option key={n} value={n}>{n}</option>)}</Select>
                </Field>
              </div>
              <fieldset className="space-y-2">
                <legend className="text-sm font-medium">{t("create.extend.mechanics")}</legend>
                <div className="flex flex-wrap gap-2">
                  {extensionMechanics.map((m) => (
                    <label key={m} className={cx("flex min-h-10 cursor-pointer items-center gap-2 rounded-xl border px-3 text-sm", addMechanics.includes(m) ? "border-neon bg-neon/10" : "border-line")}>
                      <input type="checkbox" checked={addMechanics.includes(m)} onChange={() => toggleMechanic(m)} className="accent-[var(--color-neon)]" />
                      {t(`mechanic.${m}` as DictKey)}
                    </label>
                  ))}
                </div>
                <p className="text-xs text-muted">{t("mechanic.hint")}</p>
              </fieldset>
              {(engineGame || backend.kind === "ai") && materialField}
              <Field label={t("create.notes")} htmlFor="notes" error={fieldErrors.notes}>
                <Textarea id="notes" name="notes" maxLength={INPUT_LIMITS.notesMax} rows={2} placeholder={t("create.notes.placeholder")} />
              </Field>
            </>
          )}
        </Card>
      ) : (
        <Card className="space-y-4">
          <fieldset className="space-y-2">
            <legend className="mb-1 text-sm font-semibold">{t("topics.source.title")}</legend>
            <div className="grid gap-2 sm:grid-cols-2">
              {(["own", "library"] as const).map((s) => (
                <label key={s} className={cx("flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium", source === s ? "border-neon bg-neon/10" : "border-line hover:bg-text/5")}>
                  <input type="radio" name="source" value={s} checked={source === s} onChange={() => setSource(s)} className="size-4 accent-[var(--color-neon)]" data-testid={`source-${s}`} />
                  {s === "own" ? t("topics.source.own") : t("topics.source.library")}
                </label>
              ))}
            </div>
          </fieldset>
          {library ? (
            <>
              <Alert tone="info" data-testid="topics-intro">{t("topics.intro", { n: TOPICS.length })}</Alert>
              <TopicPicker plan={allowance.plan as PlanId} value={topicId} onChange={(id) => { setTopicId(id); setFieldErrors(({ topicId: _x, ...rest }) => rest); }} error={fieldErrors.topicId} />
            </>
          ) : (
          <>
          <Field label={t("create.subject")} htmlFor="subject" error={fieldErrors.subject} required>
            <Input id="subject" name="subject" maxLength={INPUT_LIMITS.subjectMax} placeholder={t("create.subject.placeholder")} data-testid="create-subject" autoComplete="off" />
          </Field>
          {/* example subjects only make sense when a subject alone can make a game (AI, or the demo templates) */}
          {!noTemplates && <div role="group" aria-labelledby={examplesId} className="-mt-1 flex flex-wrap items-center gap-2" data-testid="create-examples">
            <span id={examplesId} className="text-xs text-muted">{t("create.examples")}</span>
            {EXAMPLES.map((n) => (
              <button key={n} type="button" onClick={() => applyExample(n)} className="min-h-10 rounded-full border border-line px-3 text-sm font-medium hover:border-neon/60 hover:bg-neon/10">
                {t(`create.example.${n}.subject` as DictKey)}
              </button>
            ))}
          </div>}
          <Field label={t("create.goal")} htmlFor="learningGoal" error={fieldErrors.learningGoal} required>
            <Textarea id="learningGoal" name="learningGoal" maxLength={INPUT_LIMITS.goalMax} rows={3} placeholder={t("create.goal.placeholder")} data-testid="create-goal" />
          </Field>
          </>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t("create.difficulty")} htmlFor="difficulty" hint={library ? t("topics.level.hint") : undefined}>
              <Select id="difficulty" name="difficulty" defaultValue="beginner" data-testid="create-difficulty">
                {DIFFICULTIES.map((d) => <option key={d} value={d}>{t(`difficulty.${d}`)}</option>)}
              </Select>
            </Field>
            <Field label={t("create.language")} htmlFor="contentLanguage" hint={t("create.language.hint")}>
              <Select id="contentLanguage" name="contentLanguage" defaultValue={locale} data-testid="create-language">
                {(backend.kind === "demo" || library ? CONTENT_LANGUAGES.filter((l) => l === "he" || l === "en") : CONTENT_LANGUAGES).map((l) => <option key={l} value={l}>{NATIVE_LANG[l]}</option>)}
              </Select>
            </Field>
          </div>
          <Field label={t("create.gameType")} htmlFor="gameType" hint={t("create.gameType.hint")}>
            <Select id="gameType" name="gameType" value={effectiveType} onChange={(e) => setGameType(e.target.value)} data-testid="create-gametype">
              {GAME_TYPES.map((g) => {
                const info = levelInfo.gameTypes.find((x) => x.id === g);
                // locked at this level: either a higher level of the same plan has it, or a higher plan does
                const unlock = info && !info.allowed ? levels.options.find((o) => o.level === info.level) : undefined;
                const suffix = !unlock ? "" : unlock.allowed ? t("create.locked.level", { level: unlock.level }) : t("create.locked.suffix", { plan: t(`plan.${unlock.unlockPlan ?? "PRO"}` as DictKey) });
                return <option key={g} value={g} disabled={info ? !info.allowed : false}>{t(`gameType.${g}`)}{suffix ? ` ${suffix}` : ""}</option>;
              })}
            </Select>
          </Field>
          {!library && materialField}
          {!library && (
            <Field label={t("create.notes")} htmlFor="notes" error={fieldErrors.notes}>
              <Textarea id="notes" name="notes" maxLength={INPUT_LIMITS.notesMax} rows={2} placeholder={t("create.notes.placeholder")} />
            </Field>
          )}
        </Card>
      )}

      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2 text-sm" data-testid="create-allowance">
          {badgeText && <Badge tone={exhausted || short ? "amber" : "lime"}>{badgeText}</Badge>}
          {(exhausted || short) && allowance.plan !== "PRO" && <Link href="/pricing" className="font-semibold text-neon hover:underline">{t("create.allowance.upgrade")} <Arrow /></Link>}
        </div>
        <p className="text-xs text-muted">{t("create.policy")}</p>
        {allowance.activeJobId && (
          <Alert tone="info">
            {t("create.error.inProgress")} <Link href={`/generate/${allowance.activeJobId}`} className="font-semibold text-neon hover:underline">{t("create.error.inProgress.cta")} <Arrow /></Link>
          </Alert>
        )}
        {error && (
          <Alert tone="error" data-testid="create-error">
            {error.text} {error.jobId && <Link href={`/generate/${error.jobId}`} className="font-semibold text-neon hover:underline">{t("create.error.inProgress.cta")} <Arrow /></Link>}
          </Alert>
        )}
        <Button type="submit" size="lg" disabled={busy || blocked || (extend && games.length === 0)} data-testid="create-submit" className="w-full sm:w-auto">
          {busy ? t("create.submitting") : extend ? t("create.submit.extend") : t("create.submit")}
        </Button>
      </div>
    </form>
  );
}
