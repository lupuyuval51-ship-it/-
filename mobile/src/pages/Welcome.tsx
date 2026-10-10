import { useState } from "react";
import { useT } from "@/components/I18nProvider";
import { Button, Card } from "@/components/ui";
import { isLastStep, stepIndex, WELCOME_STEPS } from "@/lib/offline/onboarding";
import { navigate } from "../router";

/** Short, skippable 3-step intro shown once on first launch. Inline (not a blocking modal) so the library stays usable. */
export function Welcome({ onDone }: { onDone: () => void }) {
  const t = useT();
  const [i, setI] = useState(0);
  const step = WELCOME_STEPS[stepIndex(i)]!;
  const last = isLastStep(i);
  const go = (to: string) => { onDone(); navigate(to); };
  return (
    <Card className="space-y-3 border-neon/40" data-testid="welcome" data-step={step} role="region" aria-label={t("mob.welcome.label")}>
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-bold uppercase tracking-wide text-neon">{t("mob.welcome.step", { n: stepIndex(i) + 1, total: WELCOME_STEPS.length })}</p>
        <Button variant="ghost" size="sm" onClick={onDone} data-testid="welcome-skip">{t("mob.welcome.skip")}</Button>
      </div>
      <div className="space-y-1" aria-live="polite">
        <h2 className="text-xl font-bold">{t(`mob.welcome.${step}.title`)}</h2>
        <p className="text-sm text-muted">{t(`mob.welcome.${step}.text`)}</p>
      </div>
      <div className="flex justify-center gap-1.5" aria-hidden>
        {WELCOME_STEPS.map((s, n) => <span key={s} className={`h-1.5 w-6 rounded-full ${n === stepIndex(i) ? "bg-neon" : "bg-line"}`} />)}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {i > 0 && <Button variant="secondary" size="sm" onClick={() => setI(i - 1)} data-testid="welcome-prev">{t("mob.welcome.prev")}</Button>}
        {!last && <Button size="sm" className="ms-auto" onClick={() => setI(i + 1)} data-testid="welcome-next">{t("mob.welcome.next")}</Button>}
        {step === "notes" && <Button variant="secondary" size="sm" onClick={() => go("/create?example=1")} data-testid="welcome-example">{t("mob.welcome.example")}</Button>}
        {last && (
          <>
            <Button variant="secondary" size="sm" className="ms-auto" onClick={() => go("/create")} data-testid="welcome-own">{t("mob.welcome.own")}</Button>
            <Button size="sm" onClick={() => go("/create?example=1")} data-testid="welcome-start">{t("mob.welcome.example")}</Button>
          </>
        )}
      </div>
    </Card>
  );
}
