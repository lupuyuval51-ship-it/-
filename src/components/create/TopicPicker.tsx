"use client";

import { useId, useMemo, useState } from "react";
import { useLocale, useT } from "@/components/I18nProvider";
import { Input, cx } from "@/components/ui";
import { contentLangOf, type DictKey } from "@/lib/i18n";
import type { PlanId } from "@/config/plans";
import { premiumTopicsPlan, topicOpenFor } from "@/lib/game/topics/premium";
import { TOPICS, TOPIC_CATEGORIES, searchTopics, type TopicCategory } from "@/lib/game/topics/catalog";

/**
 * The topic library picker (website create form and the Android app's create screen): search box, category chips and a
 * list of topic cards as native radio buttons (arrow keys move between them, screen readers announce "n of m").
 * Only the catalogue (titles and descriptions) lives here; a topic's content is loaded when the game is built.
 */
export function TopicPicker({ value, onChange, disabled = false, error, initialCategory, plan }: { value: string | null; onChange: (id: string) => void; disabled?: boolean; error?: string | null; /** opens on this category (e.g. the learner's first interest) */ initialCategory?: TopicCategory; /** the learner's plan: premium topics are locked unless it opens them (the server enforces) */ plan?: PlanId }) {
  const t = useT();
  // topic content exists in Hebrew and English; a Spanish interface shows the English titles
  const locale = contentLangOf(useLocale());
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState<TopicCategory | "all">(initialCategory ?? "all");
  const listId = useId();
  const searchId = useId();
  const errorId = useId();
  const shown = useMemo(() => searchTopics(query, cat), [query, cat]);
  const other = locale === "he" ? "en" : "he";
  const selected = value ? TOPICS.find((x) => x.id === value) : undefined;

  return (
    <div className="space-y-3" data-testid="topic-picker">
      <div className="space-y-1">
        <label htmlFor={searchId} className="text-sm font-medium">{t("topics.search")}</label>
        <Input id={searchId} type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t("topics.search.placeholder")} disabled={disabled} autoComplete="off" className="min-h-11" data-testid="topic-search" aria-controls={listId} />
      </div>
      <div role="group" aria-label={t("topics.categories")} className="flex flex-wrap gap-2" data-testid="topic-categories">
        {(["all", ...TOPIC_CATEGORIES] as const).map((c) => (
          <button
            key={c} type="button" disabled={disabled} aria-pressed={cat === c} onClick={() => setCat(c)} data-testid={`topic-cat-${c}`}
            className={cx("min-h-11 rounded-full border px-3 text-sm font-medium", cat === c ? "border-neon bg-neon/15 text-text" : "border-line hover:border-neon/60 hover:bg-neon/10")}
          >
            {t(`topics.cat.${c}` as DictKey)}
          </button>
        ))}
      </div>
      <p className="text-xs text-muted" aria-live="polite" data-testid="topic-count">{shown.length === 0 ? t("topics.none") : t("topics.count", { n: shown.length })}</p>
      <div
        id={listId} role="radiogroup" aria-label={t("topics.source.library")} aria-invalid={error ? true : undefined} aria-describedby={error ? errorId : undefined}
        className="max-h-[26rem] space-y-2 overflow-y-auto overscroll-contain rounded-2xl border border-line p-2" data-testid="topic-list"
      >
        {shown.map((x) => {
          const [title, desc] = x[locale];
          const checked = value === x.id;
          const locked = plan !== undefined && !topicOpenFor(plan, x.id);
          return (
            <label
              key={x.id} data-testid={`topic-${x.id}`}
              className={cx("flex min-h-11 cursor-pointer gap-3 rounded-xl border p-3", checked ? "border-neon bg-neon/10" : "border-transparent hover:bg-text/5", (disabled || locked) && "cursor-not-allowed opacity-60")}
            >
              <input type="radio" name="topicId" value={x.id} checked={checked} disabled={disabled || locked} onChange={() => onChange(x.id)} className="mt-1 size-4 shrink-0 accent-[var(--color-neon)]" />
              <span className="min-w-0 space-y-0.5">
                <span className="block font-semibold">{title} {locked && <span className="ms-1 rounded-full border border-amber/40 bg-amber/10 px-2 py-0.5 text-xs font-medium text-amber" data-testid={`topic-locked-${x.id}`}>{t("topics.locked", { plan: t(`plan.${premiumTopicsPlan()}` as DictKey) })}</span>} <span lang={other} dir="auto" className="text-xs font-normal text-muted">· {x[other][0]}</span></span>
                <span className="block text-sm text-muted">{desc}</span>
                <span className="block text-xs text-muted">{t(`topics.cat.${x.cat}` as DictKey)} · <span className="ltr-num">{t("topics.ages", { from: x.ages[0], to: x.ages[1] })}</span></span>
              </span>
            </label>
          );
        })}
      </div>
      {selected && <p className="text-sm font-medium" data-testid="topic-selected">{t("topics.selected", { title: selected[locale][0] })}</p>}
      {error && <p id={errorId} role="alert" className="text-sm font-medium text-rose" data-testid="topic-error">{error}</p>}
    </div>
  );
}
