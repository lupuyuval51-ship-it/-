import { useEffect, useMemo, useReducer, useRef, useState } from "react";
import { MaterialPreview } from "@/components/create/MaterialPreview";
import { useLocale, useT } from "@/components/I18nProvider";
import { Alert, Arrow, Button, Field, Input, ProgressBar, Select, Textarea } from "@/components/ui";
import { INPUT_LIMITS } from "@/config/limits";
import { DIFFICULTIES, GAME_TYPES } from "@/lib/game/spec/constants";
import { gameTypeAllowed, modeAllowed } from "@/lib/game/spec/tier";
import { getOfflineTier } from "@/lib/offline/entitlement";
import { generateOfflineWithProgress, type OfflineStage } from "@/lib/offline/generate";
import { hashQuery } from "@/lib/offline/onboarding";
import { store } from "../app-state";
import {
  anyLocked, classifyGenerationError, classifySaveError, cleanPastedText, clearDraft, createReducer, detectScript, draftStorage, isBlankForm, loadDraft, saveDraft, startState,
  type ContentLang, type CreateAction, type CreateFormValues,
} from "./createForm";
import { EXAMPLES } from "./examples";
import { navigate } from "../router";

const STAGES: readonly OfflineStage[] = ["reading", "building", "checking", "saving"];
/** Wait this long after the last keystroke before writing the draft (it is also written when the screen is left or hidden). */
const DRAFT_DEBOUNCE_MS = 400;
/** Show the character counter once the text is this close to the limit. */
const COUNT_FROM = Math.floor(INPUT_LIMITS.materialMax * 0.7);

export function CreatePage() {
  const t = useT();
  const locale = useLocale();
  const tier = getOfflineTier();
  const storage = useMemo(() => draftStorage(), []);

  // Start from the unfinished draft, if any; `#/create?example=1` (from the welcome / empty library) opens with the example notes.
  const [state, dispatch] = useReducer(createReducer, undefined, () =>
    startState(loadDraft(storage, tier, locale), { locale, tier, example: hashQuery(window.location.hash).get("example") === "1" }));
  const { form, restored, undo, problem } = state;
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<{ percent: number; stage: OfflineStage }>({ percent: 0, stage: "reading" });
  const [langKept, setLangKept] = useState<ContentLang | null>(null);
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
    const id = problem.kind === "required" ? "subject" : problem.kind === "material" ? "material" : problem.kind === "tier" ? (problem.mode ? "mode" : "gameType") : null;
    const el = id ? document.getElementById(id) : alertBox.current;
    el?.scrollIntoView?.({ block: "center" });
    if (id) el?.focus?.();
  }, [problem]);

  const change = <K extends keyof CreateFormValues>(key: K, value: CreateFormValues[K]) => dispatch({ type: "change", key, value } as CreateAction);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    const subject = cleanPastedText(form.subject).trim();
    if (!subject) { dispatch({ type: "problem", problem: { kind: "required" } }); return; }
    setBusy(true);
    dispatch({ type: "problem", problem: null });
    setProgress({ percent: 0, stage: "reading" });
    let spec;
    try {
      ({ spec } = await generateOfflineWithProgress({
        mode: form.mode, subject, learningGoal: cleanPastedText(form.goal).trim() || subject, difficulty: form.difficulty, gameType: form.gameType, contentLanguage: form.language,
        material: cleanPastedText(form.material).trim() || undefined,
      }, (percent, stage) => setProgress({ percent, stage }), new Date(), tier));
    } catch (err) {
      dispatch({ type: "problem", problem: classifyGenerationError(err, tier, form) });
      setBusy(false);
      return;
    }
    if (!alive.current) return;
    setProgress({ percent: 95, stage: "saving" });
    let id: string;
    try {
      id = store.addGame(spec).id;
    } catch (err) {
      dispatch({ type: "problem", problem: classifySaveError(err) });
      setBusy(false);
      return;
    }
    finished.current = true;
    clearDraft(storage);
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
      case "tier": return problem.mode && problem.gameType
        ? t("mob.create.error.tier.both", { mode: modeName, type: typeName })
        : problem.mode ? t("mob.create.error.tier.mode", { mode: modeName, other: t("mode.FAST") }) : t("mob.create.error.tier.type", { type: typeName });
      case "storage": return t("mob.create.error.storage");
      case "generic": return t("mob.create.error.generic");
    }
  })();
  const materialError = problem?.kind === "material" ? (problem.detail && form.language === locale ? problem.detail : t("mob.create.error.material")) : null;
  const lockedField = t("mob.create.field.locked");
  const lockedLabel = (label: string, ok: boolean) => (ok ? label : `${label} (${t("mob.create.locked")})`);

  const hasMaterial = form.material.trim().length > 0;
  const script = detectScript(form.material);
  const showLangHint = script !== null && script !== form.language && langKept !== script;
  const stageIndex = Math.max(0, STAGES.indexOf(progress.stage));

  return (
    <form className="space-y-4 md:grid md:grid-cols-2 md:items-start md:gap-x-8 md:gap-y-4 md:space-y-0" onSubmit={submit} data-testid="mobile-create" noValidate aria-busy={busy}>
      <div className="space-y-4 md:col-span-2">
        <a href="#/" className="inline-flex min-h-11 items-center gap-1 text-sm text-muted"><Arrow back /> {t("mob.back")}</a>
        <h1 className="text-2xl font-extrabold">{t("mob.create.title")}</h1>
      </div>
      <div className="min-w-0 space-y-4" data-testid="create-notes-column">
      <Field label={t("create.subject")} htmlFor="subject" error={problem?.kind === "required" ? t("create.error.required") : null}>
        <Input id="subject" className="min-h-11" value={form.subject} maxLength={INPUT_LIMITS.subjectMax} disabled={busy} onChange={(e) => change("subject", e.target.value)} placeholder={t("create.subject.placeholder")} required />
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
          <span>{t(undo.reason === "example" ? "mob.create.undo.example" : "mob.create.undo.cleared")}</span>
          <Button type="button" size="sm" variant="secondary" disabled={busy} onClick={() => dispatch({ type: "undo" })}>{t("mob.create.undo")}</Button>
        </Alert>
      ) : restored ? (
        <Alert tone="info" data-testid="create-restored">{t("mob.create.draft.restored")}</Alert>
      ) : null}
      <Field label={t("create.material")} hint={hasMaterial ? t("mob.create.material.hint.filled") : t("mob.create.material.hint.empty")} error={materialError} htmlFor="material">
        <Textarea id="material" dir="auto" rows={7} value={form.material} maxLength={INPUT_LIMITS.materialMax} disabled={busy} onChange={(e) => change("material", e.target.value)} placeholder={t("create.material.placeholder")} />
      </Field>
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
      <div className="min-w-0 space-y-4" data-testid="create-options-column">
      <Field label={t("create.goal")} hint={t("mob.create.goal.hint")} htmlFor="goal">
        <Input id="goal" className="min-h-11" value={form.goal} maxLength={INPUT_LIMITS.goalMax} disabled={busy} onChange={(e) => change("goal", e.target.value)} placeholder={t("create.goal.placeholder")} />
      </Field>
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
        <Field label={t("create.difficulty")} htmlFor="difficulty">
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
      <div ref={alertBox} className="scroll-mt-4">
        {alertText && <Alert tone="error" data-testid="mobile-create-error">{alertText}</Alert>}
      </div>
      {busy && (
        <div className="space-y-2" role="status" aria-live="polite" data-testid="mobile-progress" data-percent={progress.percent} data-stage={progress.stage}>
          <p className="text-sm font-semibold">{t(`mob.stage.${progress.stage}`)} <span className="ltr-num">{progress.percent}%</span></p>
          <ProgressBar value={progress.percent} label={t("mob.create.building")} />
          <p className="text-xs text-muted">{t("mob.create.step", { n: stageIndex + 1, total: STAGES.length })}</p>
        </div>
      )}
      <Button type="submit" size="lg" className="w-full" disabled={busy} data-testid="mobile-create-submit">{busy ? t("mob.create.building") : t("create.submit")}</Button>
      {!isBlankForm(form) && !busy && (
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1" data-testid="create-draft">
          <p className="min-w-0 flex-1 text-xs text-muted">{t("mob.create.draft.note")}</p>
          <Button type="button" size="sm" variant="ghost" onClick={() => dispatch({ type: "clear" })}>{t("mob.create.draft.clear")}</Button>
        </div>
      )}
      </div>
    </form>
  );
}
