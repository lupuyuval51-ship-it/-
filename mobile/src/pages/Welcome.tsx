import { useT } from "@/components/I18nProvider";
import { Button, Card } from "@/components/ui";
import { WELCOME_STEPS } from "@/lib/offline/onboarding";
import { navigate } from "../router";

/**
 * First-launch intro on ONE screen: the three steps are visible together (no carousel to page through), one clear
 * primary action ("Try an example", about a minute to a first game) and one alternative ("Use my own notes").
 * Inline, not a blocking modal, so the library stays usable; dismissing it is remembered.
 */
export function Welcome({ onDone }: { onDone: () => void }) {
  const t = useT();
  const go = (to: string) => { onDone(); navigate(to); };
  return (
    <Card className="space-y-4 border-neon/40" data-testid="welcome" role="region" aria-labelledby="welcome-title">
      <div className="flex items-start justify-between gap-3">
        <h2 id="welcome-title" className="min-w-0 text-xl font-bold">{t("mob.welcome.heading")}</h2>
        <Button variant="ghost" size="sm" className="-me-2 shrink-0" onClick={onDone} data-testid="welcome-skip">{t("mob.welcome.skip")}</Button>
      </div>
      <ol className="space-y-3">
        {WELCOME_STEPS.map((step, n) => (
          <li key={step} className="flex items-start gap-3" data-testid={`welcome-step-${step}`}>
            <span aria-hidden className="grid size-8 shrink-0 place-items-center rounded-full bg-neon/15 text-sm font-bold text-neon">{n + 1}</span>
            <div className="min-w-0">
              <p className="font-semibold">{t(`mob.welcome.${step}.title`)}</p>
              <p className="text-sm text-muted">{t(`mob.welcome.${step}.short`)}</p>
            </div>
          </li>
        ))}
      </ol>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Button className="sm:flex-1" onClick={() => go("/create?example=1")} data-testid="welcome-start">{t("mob.welcome.example")}</Button>
        <Button variant="secondary" className="sm:flex-1" onClick={() => go("/create")} data-testid="welcome-own">{t("mob.welcome.own")}</Button>
      </div>
    </Card>
  );
}
