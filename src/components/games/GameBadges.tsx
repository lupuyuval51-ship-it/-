import { Badge } from "@/components/ui";
import type { TFn } from "@/lib/i18n";

/**
 * Honest provenance label: "AI-generated" only for real model output, "Demo template" for predefined templates,
 * "From your material" for the study engine and "Topic library" for the curated topic library (neither is AI).
 */
export function GeneratorBadge({ kind, t }: { kind: string; provider?: string; t: TFn }) {
  if (kind === "engine") return <Badge tone="lime" title={t("engine.badge.hint")} data-testid="badge-engine">{t("engine.badge")}</Badge>;
  if (kind === "catalog") return <Badge tone="neon" title={t("catalog.badge.hint")} data-testid="badge-catalog">{t("catalog.badge")}</Badge>;
  return kind === "demo" ? (
    <Badge tone="amber" title={t("demo.badge.hint")} data-testid="badge-demo">{t("demo.badge")}</Badge>
  ) : (
    <Badge tone="violet" title={t("ai.badge.hint")} data-testid="badge-ai">{t("ai.badge")}</Badge>
  );
}
