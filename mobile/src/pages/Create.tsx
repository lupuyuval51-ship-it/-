import { useEffect, useMemo, useReducer, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { MaterialPreview } from "@/components/create/MaterialPreview";
import { TopicPicker } from "@/components/create/TopicPicker";
import { TOPICS, findTopic } from "@/lib/game/topics/catalog";
import { useLocale, useT } from "@/components/I18nProvider";
import { contentLangOf } from "@/lib/i18n";
import { Alert, Arrow, Button, Field, Input, ProgressBar, Select, Textarea } from "@/components/ui";
import { INPUT_LIMITS } from "@/config/limits";
import { DIFFICULTIES, GAME_TYPES } from "@/lib/game/spec/constants";
import { gameTypeAllowed, modeAllowed } from "@/lib/game/spec/tier";
import { getOfflinePlan, getOfflineTier } from "@/lib/offline/entitlement";
import { canStartTopic, halfYear, loadTracks, recordTopic, tracksLeft } from "@/lib/offline/tracks";
import { APP_TRACKS } from "@/config/plans";
import { generateOfflineWithProgress, type OfflineStage } from "@/lib/offline/generate";
import { hashQuery } from "@/lib/offline/onboarding";
import { AiError, generateWithAi, type AiFailure } from "../cloud/ai";
import { useAccount } from "../cloud/account";
import { getSettings, store } from "../app-state";
import { modeForMinutes } from "@/lib/offline/first-run";
import {
  anyLocked, classifyGenerationError, classifySaveError, cleanPastedText, clearDraft, createReducer, decodeTextFile, detectScript, draftStorage, isBlankForm, loadDraft, MAX_FILE_BYTES, materialFromFileText, saveDraft, startState, subjectFromFileName,
  type ContentLang, type CreateAction, type CreateFormValues,
} from "./createForm";
import { EXAMPLES } from "./examples";
import { navigate } from "../router";

const STAGES: readonly OfflineStage[] = ["reading", "building", "checking", "saving"];
/** Wait this long after the last keystroke before writing the draft (it is also written when the screen is left or hidden). */
const DRAFT_DEBOUNCE_MS = 400;
/** Show the character counter once the text is this close to the limit. */
const COUNT_FROM = Math.floor(INPUT_LIMITS.materialMax * 0.7);

/**
 * Enter in a one-line field moves on instead of submitting the form: with only a subject typed, "Go" on the phone's
 * keyboard would otherwise build a demo game by accident. A null `next` just closes the keyboard.
 */
function nextOnEnter(e: React.KeyboardEvent<HTMLInputElement>, next: string | null) {
  if (e.key !== "Enter" || e.nativeEvent.isComposing) return;
  e.preventDefault();
  if (next) document.getElementById(next)?.focus();
  else e.currentTarget.blur();
}

/** The mode the first-run answers suggest (20+ minutes a day: a full adventure), when the tier can build it. */
function suggestedMode(tier: ReturnType<typeof getOfflineTier>): "FAST" | "FULL" {
  const m = modeForMinutes(getSettings().minutesPerDay);
  return modeAllowed(tier, m) ? m : "FAST";
}

/** The phone's storage, or a do-nothing stand-in when it is blocked (the track history is then not kept). */
function localStorageOrNull(): { getItem(k: string): string | null; setItem(k: string, v: string): void } {
  try { if (typeof localStorage !== "undefined") return localStorage; } catch { /* blocked */ }
  return { getItem: () => null, setItem: () => undefined };
}

const formatDay = (ms: number, locale: string): string => new Date(ms).toLocaleDateString(locale === "he" ? "he-IL" : locale === "es" ? "es-ES" : "en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });

/** The clock at the moment a game is saved (a submit handler runs long after the render that made it). */
const clockNow = (): number => Date.now();

export function CreatePage() {
  const t = useT();
  const locale = useLocale();
  const tier = getOfflineTier();
  // The library topics ("tracks") this phone started in this half-year (`tracks.ts`): Free 1, Plus 4, Pro 7.
  const plan = getOfflinePlan();
  // read once when the screen opens (the half-year does not change while a game is being made)
  const [now] = useState(() => Date.now());
  const tracks = useMemo(() => loadTracks(localStorageOrNull(), now), [now]);
  const storage = useMemo(() => draftStorage(), []);

  // Start from the unfinished draft, if any; `#/create?example=1` (from the welcome / empty library) opens with the example notes.
  const [state, dispatch] = useReducer(createReducer, undefined, () =>
    startState(loadDraft(storage, tier, contentLangOf(locale)), { locale: contentLangOf(locale), tier, example: hashQuery(window.location.hash).get("example") === "1", mode: suggestedMode(tier) }));
  const { form, restored, undo, problem } = state;
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<{ percent: number; stage: OfflineStage }>({ percent: 0, stage: "reading" });
  const [langKept, setLangKept] = useState<ContentLang | null>(null);
  const [fileNote, setFileNote] = useState<{ tone: "info" | "error"; text: string } | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  /** "library": a ready topic from the topic library (built on the device, no AI); "notes": the learner's own subject and notes. */
  // (`#/create?source=library` from the empty library's "ready-made topics" suggestion opens on the topic library.)
  const [source, setSource] = useState<"notes" | "library" | "ai">(() => (hashQuery(window.location.hash).get("source") === "library" ? "library" : "notes"));
  // The mode, game type, level and language are folded away at first: the subject (and notes) are the only decisions that matter
  // on first view, the rest has good defaults (the first-run answers) and is summarised in one line.
  const [optionsOpen, setOptionsOpen] = useState(false);
  const [topicId, setTopicId] = useState<string | null>(null);
  const [topicError, setTopicError] = useState(false);
  const library = source === "library";
  const useAi = source === "ai";
  const account = useAccount();
  const signedIn = Boolean(account.session);
  const [aiFailure, setAiFailure] = useState<AiFailure | null>(null);
  const alertBox = useRef<HTMLDivElement>(null);

  // ── the draft: written while typing, when the app is hidden and when the screen is left; dropped once a game exists
  const latest = useRef(form);
  useEffect(() => { latest.current = form; }, [form]);
  const finished = useRef(false);
  // Leaving the screen while a game is being built cancels it: nothing is saved and nobody is navigated away from where they went.
  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    return () => { alive.current = false; };
  }, []);
  useEffect(() => {
    if (finished.current) return;
    const id = window.setTimeout(() => saveDraft(storage, form), DRAFT_DEBOUNCE_MS);
    return () => window.clearTimeout(id);
  }, [form, storage]);
  useEffect(() => {
    const flush = () => { if (!finished.current) saveDraft(storage, latest.current); };
    const onHide = () => { if (document.visibilityState === "hidden") flush(); };
    window.addEventListener("pagehide", flush);
    document.addEventListener("visibilitychange", onHide);
    return () => {
      window.removeEventListener("pagehide", flush);
      document.removeEventListener("visibilitychange", onHide);
      flush();
    };
  }, [storage]);

  // After a failed attempt, take the learner to what needs attention (the field, or the message for everything else).
  useEffect(() => {
    if (!problem) return;
    const id = problem.kind === "required" ? "subject" : problem.kind === "material" || problem.kind === "notes" ? "material" : problem.kind === "tier" ? (problem.mode ? "mode" : "gameType") : null;
    const el = id ? document.getElementById(id) : alertBox.current;
    el?.scrollIntoView?.({ block: "center" });
    if (id) el?.focus?.();
  }, [problem]);

  const change = <K extends keyof CreateFormValues>(key: K, value: CreateFormValues[K]) => dispatch({ type: "change", key, value } as CreateAction);

  /** Notes saved as a text file on the phone: read here, on the device, like pasted text. */
  async function loadFile(file: File) {
    try {
      if (file.size > MAX_FILE_BYTES) throw new Error("too big");
      // decoded by the bytes, not as UTF-8 only: a Hebrew note saved by an old Windows editor (windows-1255) or as UTF-16 loads too
      const loaded = materialFromFileText(decodeTextFile(new Uint8Array(await file.arrayBuffer())));
      if (!loaded.ok) throw new Error("not text");
      dispatch({ type: "file", text: loaded.text, subject: subjectFromFileName(file.name) });
      setFileNote(loaded.trimmed
        ? { tone: "info", text: t("create.material.file.trimmed", { max: INPUT_LIMITS.materialMax }) }
        : { tone: "info", text: t("mob.create.file.loaded", { name: file.name }) });
    } catch {
      setFileNote({ tone: "error", text: t("create.material.file.error") });
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    const topic = library && topicId ? findTopic(topicId) : undefined;
    if (library && !topic) {
      setTopicError(true);
      document.querySelector<HTMLElement>('[data-testid="topic-search"]')?.focus();
      return;
    }
    const subject = topic ? topic[form.language][0] : cleanPastedText(form.subject).trim();
    if (!subject) { dispatch({ type: "problem", problem: { kind: "required" } }); return; }
    // Without notes a subject alone used to make a demo-template game; now the notes are needed (or a ready topic from the library).
    if (!topic && !useAi && !cleanPastedText(form.material).trim()) { dispatch({ type: "problem", problem: { kind: "notes" } }); return; }
    if (useAi && !account.session) { setAiFailure("SIGN_IN"); return; }
    if (topic && !canStartTopic(plan, tracks, topic.id)) { dispatch({ type: "problem", problem: { kind: "limit" } }); return; }
    setBusy(true);
    setAiFailure(null);
    dispatch({ type: "problem", problem: null });
    setProgress({ percent: 0, stage: "reading" });
    let spec;
    try {
      if (useAi) {
        // LEVEL UP AI: only on this tap, only for a signed-in learner; the answer is validated and checked to be labelled AI before it is kept
        setProgress({ percent: 25, stage: "building" });
        spec = await generateWithAi({
          mode: form.mode, subject, learningGoal: cleanPastedText(form.goal).trim() || subject, difficulty: form.difficulty, gameType: form.gameType, contentLanguage: form.language,
          material: cleanPastedText(form.material).trim() || undefined, device: "phone",
        }, account.session!.access_token, undefined, undefined, tier);
      } else
      ({ spec } = await generateOfflineWithProgress(topic
        ? { mode: form.mode, subject, learningGoal: topic[form.language][1], difficulty: form.difficulty, gameType: form.gameType, contentLanguage: form.language, topicId: topic.id, device: "phone" }
        : {
          mode: form.mode, subject, learningGoal: cleanPastedText(form.goal).trim() || subject, difficulty: form.difficulty, gameType: form.gameType, contentLanguage: form.language,
          material: cleanPastedText(form.material).trim() || undefined,
          device: "phone", // this app only runs on phones and tablets: fit the game to a touch screen
        }, (percent, stage) => setProgress({ percent, stage }), new Date(), tier));
    } catch (err) {
      if (err instanceof AiError) setAiFailure(err.failure);
      else dispatch({ type: "problem", problem: classifyGenerationError(err, tier, form, topic?.id) });
      setBusy(false);
      return;
    }
    if (!alive.current) return;
    setProgress({ percent: 95, stage: "saving" });
    // (a topic-library game leaves the learner's own draft untouched)
    let id: string;
    try {
      id = store.addGame(spec).id;
      if (topic) recordTopic(localStorageOrNull(), topic.id, clockNow());
    } catch (err) {
      dispatch({ type: "problem", problem: classifySaveError(err) });
      setBusy(false);
      return;
    }
    if (!topic) {
      finished.current = true;
      clearDraft(storage);
    }
    setProgress({ percent: 100, stage: "saving" });
    navigate(`/play/${id}`, true);
  }

  // ── what to say about a problem
  const typeName = t(`gameType.${form.gameType}`);
  const modeName = t(`mode.${form.mode}`);
  const alertText = ((): string | null => {
    if (!problem) return null;
    switch (problem.kind) {
      case "required":
      case "material": return t("create.error.validation");
      case "notes": return t("mob.create.error.notes");
      case "limit": return t("mob.create.error.limit");
      case "topic": return t("mob.create.error.topic");
      case "tier": return problem.mode && problem.gameType
        ? t("mob.create.error.tier.both", { mode: modeName, type: typeName })
        : problem.mode ? t("mob.create.error.tier.mode", { mode: modeName, other: t("mode.FAST") }) : t("mob.create.error.tier.type", { type: typeName });
      case "storage": return t("mob.create.error.storage");
      case "generic": return t("mob.create.error.generic");
    }
  })();
  const materialError = problem?.kind === "material" ? (problem.detail && form.language === locale ? problem.detail : t("mob.create.error.material"))
    : problem?.kind === "notes" ? t("mob.create.error.notes.field") : null;
  const lockedField = t("mob.create.field.locked");
  const lockedLabel = (label: string, ok: boolean) => (ok ? label : `${label} (${t("mob.create.locked")})`);

  // a problem with the mode or the game type opens the options so that the field it names can be shown and focused
  const optionsVisible = optionsOpen || problem?.kind === "tier";
  const optionsSummary = [modeName, typeName, t(`difficulty.${form.difficulty}`), t(`lang.${form.language}`)].join(" · ");
  const hasMaterial = form.material.trim().length > 0;
  const script = detectScript(form.material);
  const showLangHint = script !== null && script !== form.language && langKept !== script;
  const stageIndex = Math.max(0, STAGES.indexOf(progress.stage));

  return (
    <form className="space-y-4 md:grid md:grid-cols-2 md:items-start md:gap-x-8 md:gap-y-4 md:space-y-0" onSubmit={submit} data-testid="mobile-create" noValidate aria-busy={busy}>
      <div className="space-y-4 md:col-span-2">
        <a href="#/" className="inline-flex min-h-11 items-center gap-1 text-sm text-muted"><Arrow back /> {t("mob.back")}</a>
        <h1 className="text-2xl font-extrabold">{t("mob.create.title")}</h1>
        <fieldset className="space-y-2" data-testid="create-source">
          <legend className="mb-1 text-sm font-semibold">{t("topics.source.title")}</legend>
          <div className="grid grid-cols-2 gap-2">
            {(["notes", "library", "ai"] as const).map((s) => (
              <label key={s} className={`flex min-h-14 cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold leading-snug text-balance transition last:odd:col-span-2 focus-within:ring-2 focus-within:ring-neon/50 ${source === s ? "border-neon bg-neon/15 shadow-e1" : "border-line text-muted"}`}>
                <input type="radio" name="source" value={s} checked={source === s} disabled={busy} onChange={() => setSource(s)} className="size-4 accent-[var(--color-neon)]" data-testid={`source-${s}`} />
                {s === "notes" ? t("topics.source.own") : s === "library" ? t("topics.source.library") : t("mob.create.source.ai")}
              </label>
            ))}
          </div>
          {useAi && !signedIn && <Alert tone="info" data-testid="create-ai-signin">{t("mob.create.ai.signin")}</Alert>}
          {useAi && signedIn && <p className="text-sm text-muted" data-testid="create-ai-note">{t("mob.create.ai.note")}</p>}
        </fieldset>
      </div>
      {library ? (
        <div className="min-w-0 space-y-4" data-testid="create-topics-column">
          <Alert tone="info" data-testid="topics-intro">{t("topics.intro.mobile", { n: TOPICS.length })}</Alert>
          <p className="text-sm text-muted" data-testid="tracks-left">{t("mob.tracks.left", { left: tracksLeft(plan, tracks), total: APP_TRACKS[plan], date: formatDay(halfYear(now).end, locale) })}</p>
          <TopicPicker plan={getOfflinePlan()} initialCategory={getSettings().interests[0]} value={topicId} onChange={(id) => { setTopicId(id); setTopicError(false); }} disabled={busy} error={topicError ? t("topics.required") : null} />
        </div>
      ) : (
      <div className="min-w-0 space-y-4" data-testid="create-notes-column">
      <Field label={t("create.subject")} htmlFor="subject" error={problem?.kind === "required" ? t("create.error.required") : null}>
        <Input id="subject" className="min-h-11 text-ellipsis" value={form.subject} maxLength={INPUT_LIMITS.subjectMax} disabled={busy} enterKeyHint="next" onKeyDown={(e) => nextOnEnter(e, "material")} onChange={(e) => change("subject", e.target.value)} placeholder={t("create.subject.placeholder")} required />
      </Field>
      <div className="space-y-2">
        <p className="text-sm font-medium" id="example-label">{t("mob.create.example")}</p>
        <div className="flex flex-wrap gap-2" role="group" aria-labelledby="example-label" data-testid="example-list">
          {EXAMPLES.map((ex, i) => (
            <Button key={ex.id} type="button" size="sm" variant="secondary" disabled={busy} data-testid={i === 0 ? "example-notes" : `example-notes-${ex.id}`} onClick={() => dispatch({ type: "example", id: ex.id })}>
              {ex[form.language].subject}
            </Button>
          ))}
        </div>
        <p className="text-xs text-muted">{t("mob.create.example.hint")}</p>
        <details className="text-sm" data-testid="notes-help">
          <summary className="cursor-pointer py-3 font-medium text-neon">{t("mob.create.help.title")}</summary>
          <ul className="mb-2 list-disc space-y-1 ps-5 text-muted">
            <li>{t("mob.create.help.terms")}</li>
            <li>{t("mob.create.help.steps")}</li>
            <li>{t("mob.create.help.qa")}</li>
            <li>{t("mob.create.help.facts")}</li>
            <li>{t("mob.create.help.length")}</li>
          </ul>
        </details>
      </div>
      {undo ? (
        <Alert tone="info" className="flex flex-wrap items-center justify-between gap-2" data-testid="create-undo">
          <span>{t(undo.reason === "example" ? "mob.create.undo.example" : undo.reason === "file" ? "mob.create.undo.file" : "mob.create.undo.cleared")}</span>
          <Button type="button" size="sm" variant="secondary" disabled={busy} onClick={() => dispatch({ type: "undo" })}>{t("mob.create.undo")}</Button>
        </Alert>
      ) : restored ? (
        <Alert tone="info" data-testid="create-restored">{t("mob.create.draft.restored")}</Alert>
      ) : null}
      <Field label={t("mob.create.material.label")} hint={hasMaterial ? t("mob.create.material.hint.filled") : t("mob.create.material.hint.needed")} error={materialError} htmlFor="material">
        <Textarea id="material" dir="auto" rows={7} value={form.material} maxLength={INPUT_LIMITS.materialMax} disabled={busy} onChange={(e) => change("material", e.target.value)} placeholder={t("create.material.placeholder")} />
      </Field>
      <div className="space-y-1">
        <Button type="button" size="sm" variant="secondary" disabled={busy} onClick={() => fileInput.current?.click()} data-testid="material-file-button">{t("create.material.file")}</Button>
        <input
          ref={fileInput} type="file" className="hidden" tabIndex={-1} data-testid="material-file" accept=".txt,.md,.markdown,.csv,.tsv,text/plain,text/markdown,text/csv"
          onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ""; if (f) void loadFile(f); }}
        />
        {fileNote && <p className={fileNote.tone === "error" ? "text-xs font-medium text-rose" : "text-xs text-muted"} role={fileNote.tone === "error" ? "alert" : "status"} data-testid="material-file-note">{fileNote.text}</p>}
      </div>
      {form.material.length >= COUNT_FROM && (
        <p className={form.material.length >= INPUT_LIMITS.materialMax ? "text-xs font-medium text-amber" : "text-xs text-muted"} data-testid="material-count">
          {t("create.material.count", { n: form.material.length, max: INPUT_LIMITS.materialMax })}
          {form.material.length >= INPUT_LIMITS.materialMax && <> {t("mob.create.material.cut")}</>}
        </p>
      )}
      {showLangHint && script && (
        <Alert tone="warn" className="space-y-2" data-testid="create-lang-hint">
          <p>{t(script === "en" ? "mob.create.langHint.en" : "mob.create.langHint.he")}</p>
          <div className="flex flex-wrap gap-2">
            <Button type="button" size="sm" variant="secondary" disabled={busy} onClick={() => change("language", script)}>{t("mob.create.langHint.apply")}</Button>
            <Button type="button" size="sm" variant="ghost" disabled={busy} onClick={() => setLangKept(script)}>{t("mob.create.langHint.keep")}</Button>
          </div>
        </Alert>
      )}
      <MaterialPreview material={form.material} full={form.mode === "FULL"} />
      </div>
      )}
      <div className="min-w-0 space-y-4" data-testid="create-options-column">
      <section className="rounded-2xl border border-line bg-ink-900/60" data-testid="create-options">
        <h2>
          <button
            type="button" id="create-options-toggle" data-testid="create-options-toggle" aria-expanded={optionsVisible} aria-controls="create-options-body"
            onClick={() => setOptionsOpen(!optionsVisible)}
            className="flex min-h-14 w-full items-center gap-3 rounded-2xl px-4 py-2 text-start"
          >
            <span className="min-w-0 flex-1">
              <span className="block text-base font-semibold">{t("mob.create.options.title")}</span>
              <span className="sr-only">{t("mob.create.options.summary", { summary: optionsSummary })}</span>
              <span aria-hidden className="block text-xs font-normal text-muted">{optionsSummary}</span>
            </span>
            <ChevronDown aria-hidden className={`size-5 shrink-0 text-muted transition-transform ${optionsVisible ? "rotate-180" : ""}`} />
          </button>
        </h2>
        <div id="create-options-body" hidden={!optionsVisible} className="space-y-4 border-t border-line p-4" data-testid="create-options-body">
      {!library && (
        <Field label={t("create.goal")} hint={t("mob.create.goal.hint")} htmlFor="goal">
          <Input id="goal" className="min-h-11" value={form.goal} maxLength={INPUT_LIMITS.goalMax} disabled={busy} enterKeyHint="done" onKeyDown={(e) => nextOnEnter(e, null)} onChange={(e) => change("goal", e.target.value)} placeholder={t("create.goal.placeholder")} />
        </Field>
      )}
      <Field label={t("create.mode.title")} htmlFor="mode" hint={t(`mob.create.mode.${form.mode}.desc`)} error={problem?.kind === "tier" && problem.mode ? lockedField : null}>
        <Select id="mode" className="min-h-11" value={form.mode} disabled={busy} onChange={(e) => change("mode", e.target.value as CreateFormValues["mode"])}>
          {(["FAST", "FULL"] as const).map((m) => {
            const ok = modeAllowed(tier, m);
            return <option key={m} value={m} disabled={!ok}>{lockedLabel(t(`mode.${m}`), ok)}</option>;
          })}
        </Select>
      </Field>
      <Field label={t("create.gameType")} htmlFor="gameType" hint={t("create.gameType.hint")} error={problem?.kind === "tier" && problem.gameType ? lockedField : null}>
        <Select id="gameType" className="min-h-11" value={form.gameType} disabled={busy} onChange={(e) => change("gameType", e.target.value as CreateFormValues["gameType"])}>
          {GAME_TYPES.map((g) => {
            const ok = gameTypeAllowed(tier, g);
            return <option key={g} value={g} disabled={!ok}>{lockedLabel(t(`gameType.${g}`), ok)}</option>;
          })}
        </Select>
      </Field>
      {anyLocked(tier) && <p className="text-xs text-muted" data-testid="create-locked-note">{t("mob.create.locked.note")}</p>}
      <div className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-2">
        <Field label={t("create.difficulty")} htmlFor="difficulty" hint={library ? t("topics.level.hint") : undefined}>
          <Select id="difficulty" className="min-h-11" value={form.difficulty} disabled={busy} onChange={(e) => change("difficulty", e.target.value as CreateFormValues["difficulty"])}>
            {DIFFICULTIES.map((d) => <option key={d} value={d}>{t(`difficulty.${d}`)}</option>)}
          </Select>
        </Field>
        <Field label={t("create.language")} htmlFor="language">
          <Select id="language" className="min-h-11" value={form.language} disabled={busy} onChange={(e) => change("language", e.target.value as ContentLang)}>
            <option value="he">{t("lang.he")}</option>
            <option value="en">{t("lang.en")}</option>
          </Select>
        </Field>
      </div>
        </div>
      </section>
      <div ref={alertBox} className="scroll-mt-4">
        {alertText && (
          <Alert tone="error" data-testid="mobile-create-error" className="space-y-2">
            <p>{alertText}</p>
            {(problem?.kind === "limit" || problem?.kind === "topic") && <Button type="button" size="sm" variant="secondary" onClick={() => navigate("/plans")} data-testid="create-to-plans">{t("mob.create.error.limit.cta")}</Button>}
            {problem?.kind === "notes" && <Button type="button" size="sm" variant="secondary" onClick={() => { dispatch({ type: "problem", problem: null }); setSource("library"); }} data-testid="create-to-library">{t("mob.create.toLibrary")}</Button>}
          </Alert>
        )}
        {aiFailure && <Alert tone="error" data-testid="mobile-create-ai-error">{t(`mob.create.ai.error.${aiFailure}`)}</Alert>}
      </div>
      {!library && !isBlankForm(form) && !busy && (
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1" data-testid="create-draft">
          <p className="min-w-0 flex-1 text-xs text-muted">{t("mob.create.draft.note")}</p>
          <Button type="button" size="sm" variant="ghost" onClick={() => dispatch({ type: "clear" })}>{t("mob.create.draft.clear")}</Button>
        </div>
      )}
      </div>
      {/* The main action stays on screen, just above the tab bar, while the form scrolls; the build progress is shown with it.
          A direct child of the form: a sticky element cannot leave its parent, so inside a column it would only stick once that column came into view. */}
      <div className="sticky bottom-[calc(57px+env(safe-area-inset-bottom))] z-20 -mx-4 md:col-span-2 space-y-2 border-t border-line bg-ink-950/90 px-4 pb-3 pt-3 backdrop-blur" data-testid="create-actions">
        {busy && (
          <div className="space-y-1.5" role="status" aria-live="polite" data-testid="mobile-progress" data-percent={progress.percent} data-stage={progress.stage}>
            <p className="text-sm font-semibold">{t(`mob.stage.${progress.stage}`)} <span className="ltr-num">{progress.percent}%</span></p>
            <ProgressBar value={progress.percent} label={t("mob.create.building")} />
            <p className="text-xs text-muted">{t("mob.create.step", { n: stageIndex + 1, total: STAGES.length })}</p>
          </div>
        )}
        <Button type="submit" size="lg" className="min-h-14 w-full" disabled={busy} data-testid="mobile-create-submit">{busy ? t("mob.create.building") : t("create.submit")}</Button>
      </div>
    </form>
  );
}
