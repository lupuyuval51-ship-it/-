import { Card } from "@/components/ui";
import { OPEN_SOURCE_CREDITS } from "@/config/credits";
import type { TFn } from "@/lib/i18n";

/** The About / Credits content, shared by the website's `/about` page and the Android app. Presentational: no hooks, so it renders on the server too. */
export function Credits({ t, version }: { t: TFn; version?: string | null }) {
  const labels = [
    { id: "catalog", badge: t("catalog.badge"), text: t("about.labels.catalog.text") },
    { id: "ai", badge: t("ai.badge"), text: t("about.labels.ai.text") },
    { id: "engine", badge: t("engine.badge"), text: t("about.labels.engine.text") },
    { id: "demo", badge: t("demo.badge"), text: t("about.labels.demo.text") },
  ];
  return (
    <div className="space-y-8" data-testid="credits">
      <header className="space-y-1">
        <h1 className="text-3xl font-extrabold">{t("about.title")}</h1>
        <p className="text-lg" data-testid="credits-madeby">{t("about.madeBy")}</p>
        {version ? <p className="text-sm text-muted" data-testid="credits-version">{t("about.version", { version })}</p> : null}
      </header>

      <section aria-labelledby="about-labels" className="space-y-3">
        <h2 id="about-labels" className="text-lg font-semibold">{t("about.labels.title")}</h2>
        <p className="text-sm text-muted">{t("about.labels.intro")}</p>
        <Card className="space-y-3">
          <ul className="space-y-3 text-sm">
            {labels.map((l) => (
              <li key={l.id} data-testid={`credits-label-${l.id}`}>
                <span className="font-semibold">{l.badge}</span>
                <span className="text-muted"> — {l.text}</span>
              </li>
            ))}
          </ul>
        </Card>
      </section>

      <section aria-labelledby="about-built" className="space-y-3">
        <h2 id="about-built" className="text-lg font-semibold">{t("about.built.title")}</h2>
        <p className="text-sm text-muted">{t("about.built.intro")}</p>
        <Card>
          <ul className="divide-y divide-line text-sm" data-testid="credits-oss">
            {OPEN_SOURCE_CREDITS.map((c) => (
              <li key={c.pkg} className="flex flex-wrap items-center justify-between gap-2 py-2">
                <span className="font-medium" dir="ltr">{c.name}</span>
                <span className="text-muted" dir="ltr">{c.license}</span>
              </li>
            ))}
          </ul>
        </Card>
      </section>
    </div>
  );
}
