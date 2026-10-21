"use client";

import Link from "next/link";
import { Check, PartyPopper } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useLocale, useT } from "@/components/I18nProvider";
import { Alert, Arrow, Badge, Card, ProgressBar, Spinner, cx } from "@/components/ui";
import type { DictKey } from "@/lib/i18n";

interface JobView {
  id: string;
  mode: "FAST" | "FULL" | "EXTEND";
  /** The game's level: the job used one game of this level's own quota. */
  level: "A" | "B" | "C";
  status: "PENDING" | "RUNNING" | "SUCCEEDED" | "FAILED";
  stage: string;
  gameId: string | null;
  attempts: number;
  source: "demo" | "ai" | "engine" | "catalog" | null;
  warnings: string[];
  error: { code: string | null; message: string | null } | null;
  /** Games left per level once the job is done (`remaining` null = unlimited). */
  allowance?: { levels: Record<"A" | "B" | "C", { remaining: number | null }> };
}

/** The visible pipeline per creation mode — the three modes really do run different stages. */
const STEPS: Record<JobView["mode"], string[]> = {
  FAST: ["starting", "generate", "validate", "save"],
  FULL: ["starting", "blueprint", "content", "validate", "save"],
  EXTEND: ["starting", "extend", "validate", "save"],
};

function stepIndex(job: JobView): number {
  if (job.status === "SUCCEEDED") return STEPS[job.mode].length;
  const stage = job.stage.startsWith("repair") ? "validate" : job.stage;
  const i = STEPS[job.mode].indexOf(stage);
  return i < 0 ? 0 : i;
}

export function GenerationProgress({ initial }: { initial: JobView }) {
  const t = useT();
  const locale = useLocale();
  const router = useRouter();
  const [job, setJob] = useState<JobView>(initial);
  const [pollError, setPollError] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const startRef = useRef<number | null>(null);
  const done = job.status === "SUCCEEDED" || job.status === "FAILED";

  useEffect(() => {
    if (done) return;
    let stopped = false;
    let timer: ReturnType<typeof setTimeout>;
    let delay = 1200;
    const poll = async () => {
      try {
        const res = await fetch(`/api/generations/${initial.id}`, { cache: "no-store" });
        if (res.status === 401) {
          router.push(`/login?next=/generate/${initial.id}`);
          return;
        }
        if (res.ok) {
          const next = (await res.json()) as JobView;
          if (!stopped) {
            setJob(next);
            setPollError(false);
          }
          delay = 1200;
          if (next.status === "SUCCEEDED" || next.status === "FAILED") return;
        } else {
          setPollError(true);
          delay = Math.min(delay * 1.6, 8000);
        }
      } catch {
        if (!stopped) setPollError(true);
        delay = Math.min(delay * 1.6, 8000);
      }
      if (!stopped) timer = setTimeout(poll, delay);
    };
    timer = setTimeout(poll, 600);
    return () => {
      stopped = true;
      clearTimeout(timer);
    };
  }, [done, initial.id, router]);

  useEffect(() => {
    if (done) return;
    startRef.current ??= Date.now();
    const id = setInterval(() => setElapsed(Math.floor((Date.now() - (startRef.current ?? Date.now())) / 1000)), 1000);
    return () => clearInterval(id);
  }, [done]);

  const steps = STEPS[job.mode];
  const idx = stepIndex(job);
  const stageKey = (s: string): DictKey => `gen.stage.${s}` as DictKey;
  const currentStage = job.stage.startsWith("repair") ? "repair" : job.stage;
  // games left at the level this game used (every level is counted on its own)
  const levelLeft = job.allowance?.levels[job.level];
  const leftAfter: number | null = levelLeft ? levelLeft.remaining : 0;

  return (
    <div className="mx-auto max-w-2xl space-y-6" data-testid="generation-progress" data-status={job.status}>
      <header className="space-y-1">
        <h1 className="text-3xl font-extrabold">{t("gen.title")}</h1>
        <p className="text-muted">{t("gen.subtitle")}</p>
      </header>

      {job.status === "SUCCEEDED" && (
        <Card className="space-y-4 border-lime/50 text-center" data-testid="gen-success" role="status">
          <PartyPopper aria-hidden className="mx-auto size-10 text-lime" />
          <h2 className="text-2xl font-bold">{t("gen.success.title")}</h2>
          <p className="text-sm text-muted" data-testid="gen-left">{leftAfter === null ? t("gen.success.unlimited", { level: job.level }) : t("gen.success.text", { left: leftAfter, level: job.level })}</p>
          <div className="flex justify-center">{job.source && <Badge tone={job.source === "demo" ? "amber" : job.source === "engine" ? "lime" : job.source === "catalog" ? "neon" : "violet"} data-testid="gen-source">{t(`gen.source.${job.source}`)}</Badge>}</div>
          <div className="flex flex-wrap justify-center gap-3">
            {job.gameId && <Link href={`/play/${job.gameId}`} data-testid="gen-play" className="inline-flex min-h-12 items-center rounded-xl bg-neon px-6 font-semibold text-ink-950 hover:brightness-110">{t("gen.play")}</Link>}
            {job.gameId && <Link href={`/games/${job.gameId}`} className="inline-flex min-h-12 items-center rounded-xl border border-line px-6 font-semibold hover:bg-text/10">{t("gen.details")}</Link>}
          </div>
        </Card>
      )}

      {job.status === "FAILED" && (
        <Card className="space-y-4 border-rose/50" data-testid="gen-failed">
          <h2 className="text-2xl font-bold">{t("gen.failed.title")}</h2>
          <Alert tone="error">{failureText(job.error, t)}</Alert>
          <p className="text-sm text-lime" data-testid="gen-not-charged">{t("gen.failed.notCharged")}</p>
          <Link href="/create" className="inline-flex min-h-11 items-center rounded-xl bg-neon px-5 text-sm font-semibold text-ink-950 hover:brightness-110">{t("gen.retry")}</Link>
        </Card>
      )}

      {!done && (
        <Card className="space-y-5">
          <div className="flex items-center gap-3">
            <Spinner />
            <p className="font-semibold" data-testid="gen-stage" role="status">{t(stageKey(currentStage))}</p>
          </div>
          <ProgressBar value={idx} max={steps.length} label={t(stageKey(currentStage))} />
          <ol className="space-y-2 text-sm">
            {steps.map((s, i) => (
              <li key={s} aria-current={i === idx ? "step" : undefined} className={cx("flex items-center gap-2", i < idx ? "text-lime" : i === idx ? "text-text" : "text-muted")}>
                <span aria-hidden className="grid size-5 place-items-center rounded-full border border-current text-xs">{i < idx ? <Check className="size-3" /> : i + 1}</span>
                {t(stageKey(s))}
              </li>
            ))}
          </ol>
          <div className="flex flex-wrap items-center gap-3 text-xs text-muted">
            <span>{t("gen.elapsed", { s: elapsed })}</span>
            {job.attempts > 0 && <span>{t("gen.attempts", { n: job.attempts })}</span>}
            {job.source && <Badge tone={job.source === "demo" ? "amber" : job.source === "engine" ? "lime" : job.source === "catalog" ? "neon" : "violet"}>{t(`gen.source.${job.source}`)}</Badge>}
          </div>
          {pollError && <Alert tone="warn">{t("gen.poll.error")}</Alert>}
        </Card>
      )}

      {job.warnings.length > 0 && (
        <details className="rounded-xl border border-line bg-ink-800/50 p-4 text-sm">
          <summary className="cursor-pointer py-3 font-medium">{t("gen.warnings")} ({job.warnings.length})</summary>
          <ul className="mt-2 list-disc space-y-1 ps-5 text-muted" dir={locale === "he" ? "ltr" : undefined}>
            {job.warnings.map((w, i) => <li key={i}>{w}</li>)}
          </ul>
        </details>
      )}
      {done && <Link href="/dashboard" className="inline-block text-sm text-muted hover:text-text"><Arrow back /> {t("nav.dashboard")}</Link>}
    </div>
  );
}

/** The server's failure text is in English; for the failures we know, the player gets it in the interface language. */
const LOCALIZED_FAILURES = ["PROVIDER_UNAVAILABLE", "PROVIDER_TIMEOUT", "PROVIDER_AUTH", "PROVIDER_RATE_LIMITED", "PROVIDER_REFUSED", "PROVIDER_BAD_REQUEST", "OUTPUT_TRUNCATED", "INVALID_OUTPUT", "TIMEOUT", "TIER_BUILD_FAILED", "INTERNAL_ERROR"] as const;
/** Codes that say the same as one above: `AI_UNAVAILABLE` (the runner found no usable AI provider) is the server's configuration, like `PROVIDER_AUTH`. */
const SAME_AS: Record<string, (typeof LOCALIZED_FAILURES)[number]> = { AI_UNAVAILABLE: "PROVIDER_AUTH" };
export function failureText(error: { code: string | null; message: string | null } | null, t: ReturnType<typeof useT>): string {
  const wanted = error?.code && Object.hasOwn(SAME_AS, error.code) ? SAME_AS[error.code] : error?.code;
  const code = LOCALIZED_FAILURES.find((c) => c === wanted);
  return code ? t(`gen.err.${code}` as const) : (error?.message ?? t("common.error.generic"));
}
