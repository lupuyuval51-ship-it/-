"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, useSyncExternalStore } from "react";
import { useLocale, useT } from "@/components/I18nProvider";
import { Alert, Arrow, Badge, Button, Card, Field, Input, Select, Textarea, cx } from "@/components/ui";
import { INPUT_LIMITS } from "@/config/limits";
import { CONTENT_LANGUAGES, DIFFICULTIES, GAME_TYPES, GENERATION_MODES, type GenerationModeId, type Mechanic } from "@/lib/game/spec/constants";
import type { DictKey } from "@/lib/i18n";
import { formatDate } from "@/lib/format";
import { MaterialPreview } from "./MaterialPreview";

export interface CreateFormProps {
  backend: { kind: "ai" | "demo" | "unavailable"; provider: string; label: string; reason?: string };
  allowance: { remaining: number; limit: number; periodEnd: string; plan: string; activeJobId: string | null };
  games: { id: string; title: string; subject: string; generatorKind: string }[];
  /** Mechanics the user can ask an extension to add. */
  extensionMechanics: readonly Mechanic[];
  initialMode?: GenerationModeId;
  initialGameId?: string;
}

const NATIVE_LANG: Record<string, string> = { he: "עברית", en: "English", ar: "العربية", es: "Español", fr: "Français", de: "Deutsch", ru: "Русский" };

const noopSubscribe = () => () => undefined;

/** Client-side idempotency key: one per form submission attempt, so a double click or a retry never double-charges. */
function newKey(): string {
  const bytes = new Uint8Array(18);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

export function CreateForm({ backend, allowance, games, extensionMechanics, initialMode = "FAST", initialGameId }: CreateFormProps) {
  const t = useT();
  const locale = useLocale();
  const router = useRouter();
  const [mode, setMode] = useState<GenerationModeId>(initialMode === "EXTEND" && games.length === 0 ? "FAST" : initialMode);
  const [gameId, setGameId] = useState(initialGameId && games.some((g) => g.id === initialGameId) ? initialGameId : (games[0]?.id ?? ""));
  const [addMissions, setAddMissions] = useState(1);
  const [addChallenges, setAddChallenges] = useState(3);
  const [addMechanics, setAddMechanics] = useState<Mechanic[]>([]);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<{ text: string; jobId?: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const keyRef = useRef<string | null>(null);
  // false while the server-rendered form is still inert, true once React handles events (tests wait for it)
  const hydrated = useSyncExternalStore(noopSubscribe, () => true, () => false);

  const extend = mode === "EXTEND";
  const selected = games.find((g) => g.id === gameId);
  const engineGame = selected?.generatorKind === "engine";
  const mismatch = extend && selected !== undefined && backend.kind !== "unavailable" && selected.generatorKind !== backend.kind && !(engineGame && backend.kind === "demo");
  const [material, setMaterial] = useState("");
  const [fileNote, setFileNote] = useState<{ tone: "info" | "error"; text: string } | null>(null);
  const exhausted = allowance.remaining <= 0;
  const blocked = backend.kind === "unavailable" || exhausted || Boolean(allowance.activeJobId) || mismatch;

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy || blocked) return;
    const form = new FormData(e.currentTarget);
    const get = (k: string) => String(form.get(k) ?? "").trim();
    const errs: Record<string, string> = {};
    if (!extend && !get("subject")) errs.subject = t("create.error.required");
    if (!get("learningGoal")) errs.learningGoal = t("create.error.required");
    if (get("subject").length > INPUT_LIMITS.subjectMax) errs.subject = t("create.error.tooLong");
    if (get("learningGoal").length > INPUT_LIMITS.goalMax) errs.learningGoal = t("create.error.tooLong");
    if (get("notes").length > INPUT_LIMITS.notesMax) errs.notes = t("create.error.tooLong");
    if (get("material").length > INPUT_LIMITS.materialMax) errs.material = t("create.error.tooLong");
    if (extend && engineGame && !get("material")) errs.material = t("create.error.materialRequired");
    setFieldErrors(errs);
    if (Object.keys(errs).length) {
      setError({ text: t("create.error.validation") });
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
      : {
          mode,
          subject: get("subject"),
          learningGoal: get("learningGoal"),
          difficulty: get("difficulty"),
          gameType: get("gameType"),
          contentLanguage: get("contentLanguage"),
          notes: get("notes") || undefined,
          material: get("material") || undefined,
        };
    try {
      const res = await fetch("/api/generations", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ idempotencyKey: keyRef.current, request }),
      });
      const json = (await res.json().catch(() => ({}))) as { jobId?: string; error?: { code?: string; details?: { jobId?: string | null } } };
      if (res.ok && json.jobId) {
        router.push(`/generate/${json.jobId}`);
        return;
      }
      keyRef.current = null; // the server gave a definitive answer; a corrected form is a new submission
      const code = json.error?.code;
      if (code === "ALLOWANCE_EXHAUSTED") setError({ text: t("create.error.exhausted") });
      else if (code === "JOB_IN_PROGRESS") setError({ text: t("create.error.inProgress"), jobId: json.error?.details?.jobId ?? undefined });
      else if (code === "EXTEND_BACKEND_MISMATCH") setError({ text: t("create.error.mismatch") });
      else if (code === "VALIDATION_ERROR") setError({ text: t("create.error.validation") });
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
    <Field label={t("create.material")} htmlFor="material" error={fieldErrors.material} hint={backend.kind === "ai" ? t("create.material.hint.ai") : t("create.material.hint.demo")}>
      <Textarea
        id="material" name="material" dir="auto" rows={8} maxLength={INPUT_LIMITS.materialMax} placeholder={t("create.material.placeholder")} data-testid="create-material"
        value={material} onChange={(e) => setMaterial(e.target.value)}
      />
      <span className="mt-1 flex flex-wrap items-center justify-between gap-2 text-xs text-muted">
        <label className="inline-flex min-h-10 cursor-pointer items-center gap-1.5 rounded-lg border border-line px-3 font-semibold text-neon hover:bg-white/5 focus-within:outline focus-within:outline-2 focus-within:outline-neon">
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
    <form onSubmit={submit} className="space-y-6" noValidate data-testid="create-form" data-hydrated={hydrated ? "1" : "0"}>
      <Alert tone={backend.kind === "demo" ? "warn" : backend.kind === "unavailable" ? "error" : "info"} data-testid="provider-banner" data-provider-kind={backend.kind}>
        {backend.kind === "ai" && t("create.provider.ai", { provider: backend.label })}
        {backend.kind === "demo" && t("create.provider.demo")}
        {backend.kind === "unavailable" && t("create.provider.unavailable", { reason: backend.reason ?? "" })}
      </Alert>

      <fieldset className="space-y-3">
        <legend className="mb-2 text-sm font-semibold">{t("create.mode.title")}</legend>
        <div className="grid gap-3 md:grid-cols-3" role="radiogroup">
          {GENERATION_MODES.map((m) => {
            const disabled = m === "EXTEND" && games.length === 0;
            return (
              <label
                key={m}
                className={cx(
                  "flex cursor-pointer flex-col gap-2 rounded-2xl border p-4 transition-colors",
                  mode === m ? "border-neon bg-neon/10" : "border-line bg-ink-800/60 hover:bg-white/5",
                  disabled && "cursor-not-allowed opacity-50",
                )}
              >
                <span className="flex items-center gap-2">
                  <input type="radio" name="mode" value={m} checked={mode === m} disabled={disabled} onChange={() => setMode(m)} className="size-4 accent-[var(--color-neon)]" data-testid={`mode-${m}`} />
                  <span className="font-semibold">{t(`mode.${m}`)}</span>
                </span>
                <span className="text-sm text-muted">{t(`create.mode.${m}.desc` as DictKey)}</span>
              </label>
            );
          })}
        </div>
      </fieldset>

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
              {mismatch && <Alert tone="error">{t("create.error.mismatch")}</Alert>}
              <Field label={t("create.extend.goal")} htmlFor="learningGoal" error={fieldErrors.learningGoal}>
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
          <Field label={t("create.subject")} htmlFor="subject" error={fieldErrors.subject}>
            <Input id="subject" name="subject" maxLength={INPUT_LIMITS.subjectMax} placeholder={t("create.subject.placeholder")} data-testid="create-subject" autoComplete="off" />
          </Field>
          <Field label={t("create.goal")} htmlFor="learningGoal" error={fieldErrors.learningGoal}>
            <Textarea id="learningGoal" name="learningGoal" maxLength={INPUT_LIMITS.goalMax} rows={3} placeholder={t("create.goal.placeholder")} data-testid="create-goal" />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t("create.difficulty")} htmlFor="difficulty">
              <Select id="difficulty" name="difficulty" defaultValue="beginner" data-testid="create-difficulty">
                {DIFFICULTIES.map((d) => <option key={d} value={d}>{t(`difficulty.${d}`)}</option>)}
              </Select>
            </Field>
            <Field label={t("create.language")} htmlFor="contentLanguage" hint={t("create.language.hint")}>
              <Select id="contentLanguage" name="contentLanguage" defaultValue={locale} data-testid="create-language">
                {(backend.kind === "demo" ? CONTENT_LANGUAGES.filter((l) => l === "he" || l === "en") : CONTENT_LANGUAGES).map((l) => <option key={l} value={l}>{NATIVE_LANG[l]}</option>)}
              </Select>
            </Field>
          </div>
          <Field label={t("create.gameType")} htmlFor="gameType" hint={t("create.gameType.hint")}>
            <Select id="gameType" name="gameType" defaultValue="adventure" data-testid="create-gametype">
              {GAME_TYPES.map((g) => <option key={g} value={g}>{t(`gameType.${g}`)}</option>)}
            </Select>
          </Field>
          {materialField}
          <Field label={t("create.notes")} htmlFor="notes" error={fieldErrors.notes}>
            <Textarea id="notes" name="notes" maxLength={INPUT_LIMITS.notesMax} rows={2} placeholder={t("create.notes.placeholder")} />
          </Field>
        </Card>
      )}

      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2 text-sm" data-testid="create-allowance">
          <Badge tone={exhausted ? "amber" : "lime"}>{exhausted ? t("create.allowance.none", { date: formatDate(allowance.periodEnd, locale) }) : t("create.allowance", { n: allowance.remaining, limit: allowance.limit })}</Badge>
          {exhausted && allowance.plan !== "PRO" && <Link href="/pricing" className="font-semibold text-neon hover:underline">{t("create.allowance.upgrade")} <Arrow /></Link>}
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
