import { BookOpen, Calculator, Code2, Coins, FlaskConical, Globe2, HeartPulse, Landmark, Languages, Lightbulb, Mountain, Palette, Timer, Zap } from "lucide-react";
import { lazy, Suspense, useEffect, useRef, useState, type ReactNode } from "react";
import { useT } from "@/components/I18nProvider";
import { Brand } from "@/components/ui/Brand";
import { TOPIC_CATEGORIES, type TopicCategory } from "@/lib/game/topics/types";
import type { Locale } from "@/lib/i18n";
import { MINUTES_CHOICES } from "@/lib/offline/first-run";
import { setSettings, useSettings } from "../app-state";
import { SCREEN_BACK_EVENT } from "../back";
import { showPlans } from "../features";

const PlanStep = lazy(() => import("./FirstSetupPlan").then((m) => ({ default: m.PlanStep })));

const ALL_STEPS = ["language", "topics", "time", "plan"] as const;
type Step = (typeof ALL_STEPS)[number];
/** The plan step (country for prices and the plan wanted) is off: prices are in shekels for everybody and the plans live on their own screen (Settings → Plans). Build with VITE_SETUP_PLAN=1 to ask again. */
const STEPS: readonly Step[] = showPlans() && import.meta.env.VITE_SETUP_PLAN === "1" ? ALL_STEPS : ALL_STEPS.filter((s) => s !== "plan");
const LANGS: readonly Locale[] = ["en", "he", "es"];

type Icon = typeof Calculator;
type Tone = "neon" | "lime" | "amber" | "rose" | "violet";
/** A drawn icon on a coloured tile per category and per time choice (decorative: the text says everything). */
const CATEGORY_ICON: Record<TopicCategory, [Icon, Tone]> = {
  math: [Calculator, "neon"], science: [FlaskConical, "lime"], history: [Landmark, "amber"], geography: [Globe2, "lime"], languages: [Languages, "rose"],
  computing: [Code2, "violet"], economy: [Coins, "neon"], health: [HeartPulse, "rose"], arts: [Palette, "amber"], thinking: [Lightbulb, "violet"],
};
const MINUTES_ICON: Record<(typeof MINUTES_CHOICES)[number], [Icon, Tone]> = { 5: [Zap, "neon"], 10: [Timer, "lime"], 20: [BookOpen, "amber"], 30: [Mountain, "rose"] };
const TILE: Record<Tone, string> = {
  neon: "bg-neon/15 text-neon", lime: "bg-lime/15 text-lime", amber: "bg-amber/15 text-amber", rose: "bg-rose/15 text-rose", violet: "bg-violet/15 text-violet-soft",
};

/** A large tap target: a real radio or checkbox inside its label, so TalkBack reads it as one control. */
function Choice({ type, name, checked, onChange, testId, icon, children, lang }: {
  type: "radio" | "checkbox"; name: string; checked: boolean; onChange: () => void; testId: string; icon?: [Icon, Tone]; children: ReactNode; lang?: string;
}) {
  const Mark = icon?.[0];
  return (
    <label className={`flex min-h-14 cursor-pointer items-center gap-3 rounded-2xl border-2 px-4 py-3 text-base font-semibold transition-colors ${checked ? "border-neon bg-neon/10" : "border-line bg-ink-800/60"}`}>
      {type === "radio"
        ? <input type="radio" name={name} checked={checked} onChange={onChange} className="size-5 shrink-0 accent-[var(--color-neon)]" data-testid={testId} lang={lang} />
        : <input type="checkbox" name={name} checked={checked} onChange={onChange} className="size-5 shrink-0 accent-[var(--color-neon)]" data-testid={testId} lang={lang} />}
      {Mark && <span aria-hidden className={`grid size-9 shrink-0 place-items-center rounded-xl ${TILE[icon[1]]}`}><Mark className="size-5" strokeWidth={2.25} /></span>}
      <span lang={lang} className="min-w-0">{children}</span>
    </label>
  );
}

/**
 * The first thing a new install shows, full screen: a short questionnaire. 1) the language (Hebrew preselected; the screen
 * switches at once), 2) what the learner wants to learn (topic-library categories), 3) how much time a day, and, only when the
 * plans are shown (`features.ts`, off in a normal build), 4) the country for prices and the plan they would like.
 * Everything stays on the phone and can be changed in Settings; "Skip" keeps the defaults. The plan is a preference only:
 * nothing is bought here and it unlocks nothing (the plan the phone uses comes from Google Play Billing, sold on Settings → Plans;
 * a new install is Free until Play says otherwise).
 */
export function FirstSetup() {
  const t = useT();
  const s = useSettings();
  const [step, setStep] = useState<Step>("language");
  const index = STEPS.indexOf(step);
  const last = index === STEPS.length - 1;
  const heading = useRef<HTMLHeadingElement>(null);
  // a new step starts at the top, with the screen-reader cursor on its title
  useEffect(() => { window.scrollTo(0, 0); heading.current?.focus({ preventScroll: true }); }, [step]);
  const finish = () => setSettings({ setupDone: true });
  const next = () => (last ? finish() : setStep(STEPS[index + 1]!));
  // the Android Back key goes one step back, like the Back button below (on the first step it leaves the app)
  useEffect(() => {
    if (index === 0) return;
    const onBack = (e: Event) => { e.preventDefault(); setStep(STEPS[index - 1]!); };
    window.addEventListener(SCREEN_BACK_EVENT, onBack);
    return () => window.removeEventListener(SCREEN_BACK_EVENT, onBack);
  }, [index]);
  const toggleInterest = (c: TopicCategory) => setSettings({ interests: s.interests.includes(c) ? s.interests.filter((x) => x !== c) : [...s.interests, c] });

  return (
    <main
      className="mx-auto flex min-h-dvh max-w-xl flex-col px-4"
      style={{ paddingTop: "max(1rem, env(safe-area-inset-top))", paddingLeft: "max(1rem, env(safe-area-inset-left))", paddingRight: "max(1rem, env(safe-area-inset-right))" }}
      data-testid="first-setup" data-step={step} aria-labelledby="setup-title"
    >
      <header className="space-y-3 pb-4">
        <div className="flex items-center justify-between gap-3">
          <p><Brand size="sm" /></p>
          {index > 0 && <button type="button" onClick={finish} className="min-h-11 rounded-xl px-3 text-sm font-semibold text-muted hover:bg-text/10" data-testid="setup-skip">{t("mob.setup.skip")}</button>}
        </div>
        <div className="flex gap-1.5" aria-hidden>
          {STEPS.map((x, i) => <span key={x} className={`h-1.5 flex-1 rounded-full ${i <= index ? "bg-neon" : "bg-line"}`} />)}
        </div>
        <p className="text-xs font-medium text-muted" data-testid="setup-progress">{t("mob.setup.progress", { n: index + 1, total: STEPS.length })}</p>
        <h1 id="setup-title" ref={heading} tabIndex={-1} className="text-3xl font-extrabold leading-tight outline-none">{t(`mob.setup.${step}.title`)}</h1>
        {step === "language" && <p className="text-muted">{t("mob.setup.language.hint")}</p>}
        {step === "topics" && <p className="text-muted">{t("mob.setup.topics.hint")}</p>}
        {step === "time" && <p className="text-muted">{t("mob.setup.time.hint")}</p>}
      </header>

      <div className="flex-1 pb-32">
        {step === "language" && (
          <fieldset className="space-y-3" data-testid="setup-language">
            <legend className="sr-only">{t("mob.settings.language")}</legend>
            {LANGS.map((l) => (
              <Choice key={l} type="radio" name="setup-locale" checked={s.locale === l} onChange={() => setSettings({ locale: l })} testId={`setup-lang-${l}`} lang={l}>
                {t(`lang.${l}`)}
              </Choice>
            ))}
            {s.locale === "es" && <p className="text-sm text-muted" data-testid="setup-es-note">{t("mob.setup.language.esNote")}</p>}
          </fieldset>
        )}

        {step === "topics" && (
          <fieldset data-testid="setup-topics">
            <legend className="sr-only">{t("mob.setup.topics.title")}</legend>
            <div className="grid grid-cols-1 gap-3 min-[400px]:grid-cols-2">
              {TOPIC_CATEGORIES.map((c) => (
                <Choice key={c} type="checkbox" name="setup-topics" checked={s.interests.includes(c)} onChange={() => toggleInterest(c)} testId={`setup-topic-${c}`} icon={CATEGORY_ICON[c]}>
                  {t(`topics.cat.${c}`)}
                </Choice>
              ))}
            </div>
          </fieldset>
        )}

        {step === "time" && (
          <fieldset className="space-y-3" data-testid="setup-time">
            <legend className="sr-only">{t("mob.setup.time.title")}</legend>
            {MINUTES_CHOICES.map((m, i) => (
              <Choice key={m} type="radio" name="setup-minutes" checked={s.minutesPerDay === m} onChange={() => setSettings({ minutesPerDay: m })} testId={`setup-minutes-${m}`} icon={MINUTES_ICON[m]}>
                {i === MINUTES_CHOICES.length - 1 ? t("mob.setup.time.more", { n: m }) : t("mob.setup.time.minutes", { n: m })}
              </Choice>
            ))}
          </fieldset>
        )}

        {/* the plan step (only with the plans shown) is its own chunk: it carries the prices and the topic catalogue */}
        {step === "plan" && <Suspense fallback={null}><PlanStep /></Suspense>}
      </div>

      {/* The actions stay under the thumb: a bar fixed to the bottom of the screen, above the system navigation. */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-ink-950/95 backdrop-blur" style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}>
        <div className="mx-auto flex max-w-xl gap-3 px-4 pt-3">
          {index > 0 && (
            <button type="button" onClick={() => setStep(STEPS[index - 1]!)} className="min-h-14 rounded-2xl border-2 border-line px-5 text-base font-bold" data-testid="setup-back">{t("common.back")}</button>
          )}
          <button type="button" onClick={next} className="min-h-14 flex-1 rounded-2xl bg-neon px-5 text-lg font-extrabold text-ink-950 shadow-glow" data-testid="setup-next">
            {last ? t("mob.setup.finish") : t("mob.setup.continue")}
          </button>
        </div>
      </div>
    </main>
  );
}
