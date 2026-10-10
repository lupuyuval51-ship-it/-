import { useState } from "react";
import { MaterialPreview } from "@/components/create/MaterialPreview";
import { useLocale, useT } from "@/components/I18nProvider";
import { Alert, Arrow, Button, Field, Input, ProgressBar, Select, Textarea } from "@/components/ui";
import { INPUT_LIMITS } from "@/config/limits";
import { DIFFICULTIES, GAME_TYPES } from "@/lib/game/spec/constants";
import { generateOfflineWithProgress, OfflineGenerationError, type OfflineStage } from "@/lib/offline/generate";
import { store } from "../app-state";
import { EXAMPLE_NOTES } from "./examples";
import { navigate } from "../router";

export function CreatePage() {
  const t = useT();
  const locale = useLocale();
  const [subject, setSubject] = useState("");
  const [goal, setGoal] = useState("");
  const [material, setMaterial] = useState("");
  const [mode, setMode] = useState<"FAST" | "FULL">("FAST");
  const [difficulty, setDifficulty] = useState<(typeof DIFFICULTIES)[number]>("beginner");
  const [gameType, setGameType] = useState<(typeof GAME_TYPES)[number]>("adventure");
  const [language, setLanguage] = useState<"he" | "en">(locale);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<{ percent: number; stage: OfflineStage }>({ percent: 0, stage: "reading" });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!subject.trim()) { setError(t("create.error.required")); return; }
    setBusy(true);
    setError(null);
    setProgress({ percent: 0, stage: "reading" });
    try {
      const { spec } = await generateOfflineWithProgress({
        mode, subject: subject.trim(), learningGoal: goal.trim() || subject.trim(), difficulty, gameType, contentLanguage: language,
        material: material.trim() || undefined,
      }, (percent, stage) => setProgress({ percent, stage }));
      setProgress({ percent: 95, stage: "saving" });
      const game = store.addGame(spec);
      setProgress({ percent: 100, stage: "saving" });
      navigate(`/play/${game.id}`, true);
    } catch (err) {
      setError(err instanceof OfflineGenerationError && err.code === "MATERIAL_UNUSABLE" ? t("mob.create.error.material") : t("mob.create.error.generic"));
      setBusy(false);
    }
  }

  return (
    <form className="space-y-4 md:grid md:grid-cols-2 md:items-start md:gap-x-8 md:gap-y-4 md:space-y-0" onSubmit={submit} data-testid="mobile-create" noValidate aria-busy={busy}>
      <div className="space-y-4 md:col-span-2">
        <a href="#/" className="block text-sm text-muted"><Arrow back /> {t("mob.back")}</a>
        <h1 className="text-2xl font-extrabold">{t("mob.create.title")}</h1>
      </div>
      <div className="space-y-4" data-testid="create-notes-column">
      <Field label={t("create.subject")} htmlFor="subject" error={error && !subject.trim() ? t("create.error.required") : null}>
        <Input id="subject" value={subject} maxLength={INPUT_LIMITS.subjectMax} onChange={(e) => setSubject(e.target.value)} placeholder={t("create.subject.placeholder")} required />
      </Field>
      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" size="sm" variant="secondary" data-testid="example-notes" onClick={() => {
          const ex = EXAMPLE_NOTES[language];
          setSubject(ex.subject);
          setMaterial(ex.notes);
          setError(null);
        }}>{t("mob.create.example")}</Button>
        <details className="text-sm" data-testid="notes-help">
          <summary className="cursor-pointer font-medium text-neon">{t("mob.create.help.title")}</summary>
          <ul className="mt-2 list-disc space-y-1 ps-5 text-muted">
            <li>{t("mob.create.help.terms")}</li>
            <li>{t("mob.create.help.steps")}</li>
            <li>{t("mob.create.help.qa")}</li>
            <li>{t("mob.create.help.facts")}</li>
            <li>{t("mob.create.help.length")}</li>
          </ul>
        </details>
      </div>
      <Field label={t("create.material")} hint={t("mob.create.material.hint")} htmlFor="material">
        <Textarea id="material" dir="auto" rows={7} value={material} maxLength={INPUT_LIMITS.materialMax} onChange={(e) => setMaterial(e.target.value)} placeholder={t("create.material.placeholder")} />
      </Field>
      <MaterialPreview material={material} full={mode === "FULL"} />
      </div>
      <div className="space-y-4" data-testid="create-options-column">
      <Field label={t("create.goal")} htmlFor="goal">
        <Input id="goal" value={goal} maxLength={INPUT_LIMITS.goalMax} onChange={(e) => setGoal(e.target.value)} placeholder={t("create.goal.placeholder")} />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label={t("create.mode.title")} htmlFor="mode">
          <Select id="mode" value={mode} onChange={(e) => setMode(e.target.value as "FAST" | "FULL")}>
            <option value="FAST">{t("mode.FAST")}</option>
            <option value="FULL">{t("mode.FULL")}</option>
          </Select>
        </Field>
        <Field label={t("create.language")} htmlFor="language">
          <Select id="language" value={language} onChange={(e) => setLanguage(e.target.value as "he" | "en")}>
            <option value="he">{t("lang.he")}</option>
            <option value="en">{t("lang.en")}</option>
          </Select>
        </Field>
        <Field label={t("create.difficulty")} htmlFor="difficulty">
          <Select id="difficulty" value={difficulty} onChange={(e) => setDifficulty(e.target.value as typeof difficulty)}>
            {DIFFICULTIES.map((d) => <option key={d} value={d}>{t(`difficulty.${d}`)}</option>)}
          </Select>
        </Field>
        <Field label={t("create.gameType")} htmlFor="gameType">
          <Select id="gameType" value={gameType} onChange={(e) => setGameType(e.target.value as typeof gameType)}>
            {GAME_TYPES.map((g) => <option key={g} value={g}>{t(`gameType.${g}`)}</option>)}
          </Select>
        </Field>
      </div>
      {error && <Alert tone="error" data-testid="mobile-create-error">{error}</Alert>}
      {busy && (
        <div className="space-y-2" role="status" aria-live="polite" data-testid="mobile-progress" data-percent={progress.percent}>
          <p className="text-sm font-semibold">{t(`mob.stage.${progress.stage}`)} <span className="ltr-num">{progress.percent}%</span></p>
          <ProgressBar value={progress.percent} label={t("mob.create.building")} />
        </div>
      )}
      <Button type="submit" size="lg" className="w-full" disabled={busy} data-testid="mobile-create-submit">{busy ? t("mob.create.building") : t("create.submit")}</Button>
      </div>
    </form>
  );
}
