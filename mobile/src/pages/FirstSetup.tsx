import { useState } from "react";
import { useT } from "@/components/I18nProvider";
import { Alert, Button, Card, Field, Select } from "@/components/ui";
import { offerText, planHasTierA, planPriceText } from "@/components/pricing/PlanPrice";
import { PLAN_IDS, type PlanId } from "@/config/plans";
import { TOPIC_CATEGORIES, type TopicCategory } from "@/lib/game/topics/types";
import type { Locale } from "@/lib/i18n";
import { MINUTES_CHOICES, REGION_CHOICES } from "@/lib/offline/first-run";
import { regionLabel } from "@/lib/regions";
import { setSettings, useSettings } from "../app-state";

const STEPS = ["language", "topics", "time", "plan"] as const;
type Step = (typeof STEPS)[number];
const LANGS: readonly Locale[] = ["en", "he", "es"];

/** A choice drawn as a large tap target (a real radio or checkbox inside its label, so TalkBack reads it as one). */
function Choice({ type, name, checked, onChange, testId, children, lang }: { type: "radio" | "checkbox"; name: string; checked: boolean; onChange: () => void; testId: string; children: React.ReactNode; lang?: string }) {
  return (
    <label className={`flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium ${checked ? "border-neon bg-neon/10" : "border-line"}`}>
      <input type={type} name={name} checked={checked} onChange={onChange} className="size-4 shrink-0 accent-[var(--color-neon)]" data-testid={testId} lang={lang} />
      <span lang={lang} className="min-w-0">{children}</span>
    </label>
  );
}

/**
 * First launch, before the welcome: a short questionnaire. 1) the language (English preselected; the page switches at once),
 * 2) what the learner wants to learn (topic-library categories), 3) how much time a day, 4) the country for prices and the
 * plan they want. Everything stays on the phone and can be changed in Settings. The plan is a preference only: the app sells
 * nothing and every feature is open (paid features in a Google Play app may only use Google Play Billing).
 */
export function FirstSetup() {
  const t = useT();
  const s = useSettings();
  const [step, setStep] = useState<Step>("language");
  const index = STEPS.indexOf(step);
  const next = () => (index === STEPS.length - 1 ? setSettings({ setupDone: true }) : setStep(STEPS[index + 1]!));
  const toggleInterest = (c: TopicCategory) => setSettings({ interests: s.interests.includes(c) ? s.interests.filter((x) => x !== c) : [...s.interests, c] });

  return (
    <Card className="space-y-4 border-neon/40" data-testid="first-setup" data-step={step} role="region" aria-labelledby="setup-title">
      <div className="flex items-center justify-between gap-3">
        <h2 id="setup-title" className="min-w-0 text-xl font-bold">{t(`mob.setup.${step}.title`)}</h2>
        <span className="shrink-0 text-xs text-muted" data-testid="setup-progress">{t("mob.setup.progress", { n: index + 1, total: STEPS.length })}</span>
      </div>

      {step === "language" && (
        <fieldset className="space-y-2" data-testid="setup-language">
          <legend className="sr-only">{t("mob.settings.language")}</legend>
          {LANGS.map((l) => (
            <Choice key={l} type="radio" name="setup-locale" checked={s.locale === l} onChange={() => setSettings({ locale: l })} testId={`setup-lang-${l}`} lang={l}>
              {t(`lang.${l}`)}
            </Choice>
          ))}
          {s.locale === "es" && <p className="text-xs text-muted" data-testid="setup-es-note">{t("mob.setup.language.esNote")}</p>}
        </fieldset>
      )}

      {step === "topics" && (
        <fieldset className="space-y-2" data-testid="setup-topics">
          <legend className="mb-1 text-sm text-muted">{t("mob.setup.topics.hint")}</legend>
          <div className="grid grid-cols-1 gap-2 min-[400px]:grid-cols-2">
            {TOPIC_CATEGORIES.map((c) => (
              <Choice key={c} type="checkbox" name="setup-topics" checked={s.interests.includes(c)} onChange={() => toggleInterest(c)} testId={`setup-topic-${c}`}>
                {t(`topics.cat.${c}`)}
              </Choice>
            ))}
          </div>
        </fieldset>
      )}

      {step === "time" && (
        <fieldset className="space-y-2" data-testid="setup-time">
          <legend className="mb-1 text-sm text-muted">{t("mob.setup.time.hint")}</legend>
          {MINUTES_CHOICES.map((m, i) => (
            <Choice key={m} type="radio" name="setup-minutes" checked={s.minutesPerDay === m} onChange={() => setSettings({ minutesPerDay: m })} testId={`setup-minutes-${m}`}>
              {i === MINUTES_CHOICES.length - 1 ? t("mob.setup.time.more", { n: m }) : t("mob.setup.time.minutes", { n: m })}
            </Choice>
          ))}
        </fieldset>
      )}

      {step === "plan" && (
        <div className="space-y-3">
          <Field label={t("mob.setup.country")} hint={t("mob.setup.country.hint")} htmlFor="setup-region">
            <Select id="setup-region" className="min-h-11" value={s.region} onChange={(e) => setSettings({ region: e.target.value })} data-testid="setup-region">
              {REGION_CHOICES.map((c) => <option key={c} value={c}>{regionLabel(c, s.locale)}</option>)}
            </Select>
          </Field>
          <fieldset className="space-y-2" data-testid="setup-plan">
            <legend className="mb-1 text-sm font-semibold">{t("mob.setup.plan.question")}</legend>
            {PLAN_IDS.map((plan: PlanId) => {
              const price = planPriceText(plan, s.region === "OTHER" ? null : s.region);
              return (
                <label key={plan} className={`block cursor-pointer space-y-1 rounded-xl border px-3 py-2.5 text-sm ${s.planChoice === plan ? "border-neon bg-neon/10" : "border-line"}`}>
                  <span className="flex items-center gap-2">
                    <input type="radio" name="setup-plan" checked={s.planChoice === plan} onChange={() => setSettings({ planChoice: plan })} className="size-4 shrink-0 accent-[var(--color-neon)]" data-testid={`setup-plan-${plan}`} />
                    <span className="font-semibold">{t(`plan.${plan}`)}</span>
                    <span className="ms-auto font-bold" data-testid={`setup-price-${plan}`}><span className="ltr-num">{price.isFree ? t("pricing.free.price") : price.text}</span>{!price.isFree && <span className="font-normal text-muted"> {t("pricing.per")}</span>}</span>
                  </span>
                  <span className="block text-xs text-muted">{offerText(t, plan)} · {planHasTierA(plan) ? t("pricing.graphics.A") : t("pricing.graphics.BC")}</span>
                </label>
              );
            })}
          </fieldset>
          <Alert tone="info" data-testid="setup-open-now">{t("pricing.open.now")}</Alert>
        </div>
      )}

      <div className="flex gap-2">
        {index > 0 && <Button variant="secondary" onClick={() => setStep(STEPS[index - 1]!)} data-testid="setup-back">{t("common.back")}</Button>}
        <Button className="flex-1" onClick={next} data-testid="setup-next">{index === STEPS.length - 1 ? t("mob.setup.finish") : t("mob.setup.continue")}</Button>
      </div>
    </Card>
  );
}
