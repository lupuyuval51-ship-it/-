import Link from "next/link";
import { Arrow, Badge, Card } from "@/components/ui";
import type { TFn } from "@/lib/i18n";
import type { ReviewItem } from "@/lib/game/state/review";

/** Review of mistakes. Presentational only: shared by the web review page and the offline app. */
export function ReviewView({ t, id, sessionId, review }: { t: TFn; id: string; sessionId: string; review: readonly ReviewItem[] }) {
  const r = { review };
  return (
    <div className="mx-auto max-w-3xl space-y-6" data-testid="review">
      <Link href={`/games/${id}/results/${sessionId}`} className="text-sm text-muted hover:text-text"><Arrow back /> {t("rev.back")}</Link>
      <header className="space-y-2">
        <h1 className="text-3xl font-extrabold">{t("rev.title")}</h1>
        <p className="text-sm text-muted">{t("rev.intro")}</p>
      </header>
      {r.review.length === 0 ? (
        <Card><p data-testid="review-empty">{t("rev.empty")}</p></Card>
      ) : (
        <ol className="space-y-4">
          {r.review.map((x, i) => (
            <li key={x.challengeId}>
              <Card className="space-y-3" data-testid="review-item">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="grid size-7 place-items-center rounded-full bg-ink-700 text-xs font-bold">{i + 1}</span>
                  <h2 dir="auto" className="font-semibold">{x.title}</h2>
                  <Badge tone="neon">{x.concept}</Badge>
                  <Badge tone={x.revealed ? "rose" : "amber"}>{x.revealed ? t("rev.revealed") : t("rev.misses", { n: x.wrong })}</Badge>
                  {x.hints > 0 && <Badge>{t("rev.hints", { n: x.hints })}</Badge>}
                </div>
                <div className="space-y-1 text-sm">
                  <p className="text-xs font-semibold uppercase tracking-wide rtl:tracking-normal text-muted">{t("rev.question")}</p>
                  <p dir="auto" className="whitespace-pre-wrap">{x.prompt}</p>
                </div>
                {x.answer && (
                  <div className="space-y-1 rounded-xl border border-lime/40 bg-lime/5 p-3 text-sm">
                    <p className="text-xs font-semibold uppercase tracking-wide rtl:tracking-normal text-lime">{t("rev.answer")}</p>
                    <p dir="auto" className="whitespace-pre-wrap" data-testid="review-answer">{x.answer}</p>
                  </div>
                )}
                <div className="space-y-1 text-sm">
                  <p className="text-xs font-semibold uppercase tracking-wide rtl:tracking-normal text-muted">{t("rev.why")}</p>
                  <p dir="auto">{x.explanation}</p>
                </div>
              </Card>
            </li>
          ))}
        </ol>
      )}
      <div className="flex flex-wrap justify-center gap-3">
        {r.review.length > 0 && (
          <Link href={`/games/${id}/results/${sessionId}/practice`} data-testid="practice-start" className="inline-flex min-h-12 items-center rounded-xl bg-neon px-6 font-semibold text-ink-950 hover:brightness-110">{t("rev.practice.only")} <Arrow /></Link>
        )}
        <Link href={`/play/${id}`} className="inline-flex min-h-12 items-center rounded-xl border border-line px-6 font-semibold hover:bg-text/10">{t("rev.practice")}</Link>
      </div>
    </div>
  );
}
