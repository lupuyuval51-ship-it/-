"use client";

import { useDeferredValue, useMemo } from "react";
import { useT } from "@/components/I18nProvider";
import { Badge, cx } from "@/components/ui";
import { generateChallenges } from "@/lib/game/material/challenges";
import { parseMaterial } from "@/lib/game/material/parse";
import { hashText } from "@/lib/game/material/text";
import { MIN_CHALLENGES, MIN_MATERIAL_CHARS } from "@/lib/game/material/limits";
import { mulberry32 } from "@/lib/game/util/prng";

/**
 * Live "what the study engine found" summary under the material box. It runs the very same pure parser and
 * challenge builder the server uses, so the estimate matches what will be built (the server still decides).
 */
export function MaterialPreview({ material, full }: { material: string; full: boolean }) {
  const t = useT();
  const text = useDeferredValue(material);
  const result = useMemo(() => {
    if (text.trim().length === 0) return null;
    const k = parseMaterial(text);
    const gen = generateChallenges(k, { lang: "en", rnd: mulberry32(hashText(text)), max: full ? 10 : 4 });
    return {
      terms: k.definitions.length, steps: k.steps.length, facts: k.facts.length, qa: k.qa.length, sentences: k.sentences.length,
      challenges: gen.challenges.length,
      ok: text.trim().length >= MIN_MATERIAL_CHARS && gen.challenges.length >= MIN_CHALLENGES,
    };
  }, [text, full]);
  if (!result) return null;
  return (
    <div className={cx("space-y-1.5 rounded-xl border p-3 text-sm", result.ok ? "border-lime/40 bg-lime/5" : "border-amber/40 bg-amber/5")} data-testid="material-preview" data-ok={result.ok ? "1" : "0"} aria-live="polite">
      <p className="font-semibold">{t("create.material.preview.title")}</p>
      <div className="flex flex-wrap gap-1.5">
        <Badge>{t("create.material.preview.terms", { n: result.terms })}</Badge>
        <Badge>{t("create.material.preview.qa", { n: result.qa })}</Badge>
        <Badge>{t("create.material.preview.steps", { n: result.steps })}</Badge>
        <Badge>{t("create.material.preview.facts", { n: result.facts })}</Badge>
        <Badge>{t("create.material.preview.sentences", { n: result.sentences })}</Badge>
      </div>
      <p className={result.ok ? "text-lime" : "text-amber"} data-testid="material-preview-verdict">
        {result.ok ? t("create.material.preview.ok", { n: result.challenges }) : t("create.material.preview.low")}
      </p>
    </div>
  );
}
