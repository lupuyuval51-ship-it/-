import { useT } from "@/components/I18nProvider";
import { Button, Card, Field, Select } from "@/components/ui";
import { REGION_CHOICES } from "@/lib/offline/first-run";
import { regionLabel } from "@/lib/regions";
import { setSettings, useSettings } from "../app-state";

/**
 * First launch, before the welcome: the learner picks the language (English is preselected; the page switches at once) and
 * the country the prices are shown for. Both are saved on the phone only and can be changed later in Settings.
 */
export function FirstSetup() {
  const t = useT();
  const s = useSettings();
  return (
    <Card className="space-y-4 border-neon/40" data-testid="first-setup" role="region" aria-labelledby="setup-title">
      <h2 id="setup-title" className="text-xl font-bold">{t("mob.setup.title")}</h2>
      <fieldset className="space-y-2" data-testid="setup-language">
        <legend className="mb-1 text-sm font-semibold">{t("mob.settings.language")}</legend>
        <div className="grid grid-cols-2 gap-2">
          {(["en", "he"] as const).map((l) => (
            <label key={l} className={`flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium ${s.locale === l ? "border-neon bg-neon/10" : "border-line"}`}>
              <input type="radio" name="setup-locale" value={l} checked={s.locale === l} onChange={() => setSettings({ locale: l })} className="size-4 accent-[var(--color-neon)]" data-testid={`setup-lang-${l}`} lang={l} />
              <span lang={l}>{t(`lang.${l}`)}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <Field label={t("mob.setup.country")} hint={t("mob.setup.country.hint")} htmlFor="setup-region">
        <Select id="setup-region" className="min-h-11" value={s.region} onChange={(e) => setSettings({ region: e.target.value })} data-testid="setup-region">
          {REGION_CHOICES.map((c) => <option key={c} value={c}>{regionLabel(c, s.locale)}</option>)}
        </Select>
      </Field>
      <Button className="w-full" onClick={() => setSettings({ setupDone: true })} data-testid="setup-continue">{t("mob.setup.continue")}</Button>
    </Card>
  );
}
