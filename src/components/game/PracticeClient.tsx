"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useT } from "@/components/I18nProvider";
import { Arrow, Card, Spinner } from "@/components/ui";
import type { Answer, PublicChallenge } from "@/lib/game/challenges/grade";
import { ChallengePanel, type AnswerResult } from "./hud/ChallengePanel";
import { httpTransport, type PlayTransport } from "./transport";

/** A hint as it came back, with the question it was asked for. */
export interface PracticeHint { challengeId: string; text: string | null }

/**
 * The hint to show with the question on screen. A hint asked for just before moving on arrives while the next question is up:
 * it belongs to the question it was asked for and is never shown with another one.
 */
export function shownHint(hint: PracticeHint | null, challengeId: string): string | null {
  return hint && hint.challengeId === challengeId ? hint.text : null;
}

/** The missed questions again, one by one: unscored, answers graded by the server, ends with a short summary. */
export function PracticeClient({ gameId, sessionId, transport = httpTransport, backHref, reviewHref }: { gameId: string; sessionId: string; transport?: PlayTransport; backHref?: string; reviewHref?: string | null }) {
  const back = backHref ?? `/games/${gameId}/results/${sessionId}`;
  const reviewLink = reviewHref === undefined ? `/games/${gameId}/results/${sessionId}/review` : reviewHref;
  const t = useT();
  const call = transport.practice;
  const [items, setItems] = useState<PublicChallenge[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [index, setIndex] = useState(0);
  const [result, setResult] = useState<AnswerResult | null>(null);
  const [hint, setHint] = useState<PracticeHint | null>(null);
  const [busy, setBusy] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [outcomes, setOutcomes] = useState<("first" | "later" | "missed" | "skipped")[]>([]);

  useEffect(() => {
    let live = true;
    call<{ items: PublicChallenge[] }>(sessionId, { action: "start" }).then((r) => live && setItems(r.items)).catch(() => live && setFailed(true));
    return () => { live = false; };
  }, [sessionId, call]);

  const next = useCallback((outcome: "first" | "later" | "missed" | "skipped") => {
    setOutcomes((o) => [...o, outcome]);
    setIndex((i) => i + 1);
    setResult(null);
    setHint(null);
    setAttempt(0);
  }, []);

  if (failed) return <p role="alert" className="mx-auto max-w-xl p-6 text-center">{t("common.error.generic")}</p>;
  if (!items) return <div className="grid min-h-[50dvh] place-items-center"><Spinner label={t("common.loading")} /></div>;

  const current = items[index];
  if (!current) {
    const right = outcomes.filter((o) => o === "first" || o === "later").length;
    return (
      <div className="mx-auto max-w-xl space-y-5 text-center" data-testid="practice-done">
        <h1 className="text-3xl font-extrabold">{t("prac.done.title")}</h1>
        <p className="text-xl" data-testid="practice-score">{t("prac.done.score", { right, total: items.length })}</p>
        <Card className="text-sm text-muted">{right === items.length ? t("prac.done.great") : t("prac.done.more")}</Card>
        <div className="flex flex-wrap justify-center gap-3">
          {reviewLink && <Link href={reviewLink} className="inline-flex min-h-12 items-center rounded-xl bg-neon px-6 font-semibold text-ink-950 hover:brightness-110">{t("prac.done.review")}</Link>}
          <Link href={back} className="inline-flex min-h-12 items-center rounded-xl border border-line px-6 font-semibold hover:bg-text/10"><Arrow back /> {t("rev.back")}</Link>
        </div>
      </div>
    );
  }

  async function submit(answer: Answer) {
    if (!current) return;
    setBusy(true);
    const n = attempt + 1;
    try {
      const res = await call<{ result: AnswerResult }>(sessionId, { action: "answer", challengeId: current.id, answer, attempt: n });
      setAttempt(n);
      setResult(res.result);
    } catch {
      setFailed(true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3" data-testid="practice">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Link href={reviewLink ?? back} className="text-sm text-muted hover:text-text"><Arrow back /> {t("rev.back")}</Link>
        <p className="text-sm font-semibold" data-testid="practice-progress">{t("prac.progress", { n: index + 1, total: items.length })}</p>
      </div>
      <p className="text-xs text-muted">{t("prac.note")}</p>
      <div className="relative min-h-[80dvh] overflow-hidden rounded-3xl border border-line">
        <ChallengePanel
          key={current.id}
          embedded
          challenge={current}
          stationLabel={t("prac.label")}
          result={result}
          hint={shownHint(hint, current.id)}
          busy={busy}
          onSubmit={(a) => void submit(a)}
          onHint={() => {
            const challengeId = current.id;
            void call<{ hint: string | null }>(sessionId, { action: "hint", challengeId }).then((r) => setHint({ challengeId, text: r.hint })).catch(() => undefined);
          }}
          onClose={() => next(result?.resolved ? (result.correct ? (attempt === 1 ? "first" : "later") : "missed") : "skipped")}
        />
      </div>
      <p className="text-center text-xs text-muted">{t("prac.skip")}</p>
    </div>
  );
}
