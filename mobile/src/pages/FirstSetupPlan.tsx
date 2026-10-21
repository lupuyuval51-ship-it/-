import { useT } from "@/components/I18nProvider";
import { Alert, Field, Select } from "@/components/ui";
import { planHasTierA, planPriceText } from "@/components/pricing/PlanPrice";
import { PLAN_IDS, type PlanId } from "@/config/plans";
import { REGION_CHOICES } from "@/lib/offline/first-run";
import { regionLabel } from "@/lib/regions";
import { setSettings, useSettings } from "../app-state";
import { chooseFrom, tracksText } from "./Plans";

/**
 * The questionnaire's last step, shown only with the plans shown (`features.ts`) and VITE_SETUP_PLAN=1: the country for prices and
 * the plan the learner would like (a preference only: nothing is bought here; the plans are sold through Google Play Billing on
 * Settings → Plans). Each plan is described as the app gives it, the same lines as that screen (library topics per half-year,
 * `APP_TRACKS`), not with the website's games per level. Its own chunk, so the prices and the topic catalogue are not in the
 * app's first bundle.
 */
export function PlanStep() {
  const t = useT();
  const s = useSettings();
  return (
    <div className="space-y-4">
    <Field label={t("mob.setup.country")} hint={t("mob.setup.country.hint")} htmlFor="setup-region">
      <Select id="setup-region" className="min-h-12 text-base" value={s.region} onChange={(e) => setSettings({ region: e.target.value })} data-testid="setup-region">
        {REGION_CHOICES.map((c) => <option key={c} value={c}>{regionLabel(c, s.locale)}</option>)}
      </Select>
    </Field>
    <fieldset className="space-y-3" data-testid="setup-plan">
      <legend className="mb-1 text-base font-bold">{t("mob.setup.plan.question")}</legend>
      {PLAN_IDS.map((plan: PlanId) => {
        const price = planPriceText(plan, s.region === "OTHER" ? null : s.region);
        return (
          <label key={plan} className={`block cursor-pointer space-y-1.5 rounded-2xl border-2 px-4 py-3 ${s.planChoice === plan ? "border-neon bg-neon/10" : "border-line bg-ink-800/60"}`}>
            <span className="flex items-center gap-3">
              <input type="radio" name="setup-plan" checked={s.planChoice === plan} onChange={() => setSettings({ planChoice: plan })} className="size-5 shrink-0 accent-[var(--color-neon)]" data-testid={`setup-plan-${plan}`} />
              <span className="text-lg font-bold">{t(`plan.${plan}`)}</span>
              <span className="ms-auto text-lg font-extrabold" data-testid={`setup-price-${plan}`}><span className="ltr-num">{price.isFree ? t("pricing.free.price") : price.text}</span>{!price.isFree && <span className="text-sm font-normal text-muted"> {t("pricing.per")}</span>}</span>
            </span>
            <span className="block text-sm text-muted" data-testid={`setup-tracks-${plan}`}>{tracksText(t, plan)}</span>
            <span className="block text-xs text-muted">{chooseFrom(t, plan)} · {planHasTierA(plan) ? t("pricing.graphics.A") : t("pricing.graphics.BC")}</span>
          </label>
        );
      })}
    </fieldset>
    {/* not the website's "every feature is open, free": the app starts on Free and sells Plus and Pro through Google Play */}
    <Alert tone="info" data-testid="setup-open-now">{t("mob.plans.fineprint")}</Alert>
          </div>
  );
}
