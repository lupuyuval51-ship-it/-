import { Badge } from "@/components/ui";
import type { TFn } from "@/lib/i18n";

/** Honest provenance label: "AI-generated" only for real model output, "Demo template" for predefined templates. */
export function GeneratorBadge({ kind, provider, t }: { kind: string; provider: string; t: TFn }) {
  if (kind === "engine") return <Badge tone="lime" title={t("engine.badge.hint")} data-testid="badge-engine">{t("engine.badge")}</Badge>;
  return kind === "demo" ? (
    <Badge tone="amber" title={t("demo.badge.hint")} data-testid="badge-demo">{t("demo.badge")}</Badge>
  ) : (
    <Badge tone="violet" title={t("ai.badge.hint", { provider })} data-testid="badge-ai">{t("ai.badge")}</Badge>
  );
}
