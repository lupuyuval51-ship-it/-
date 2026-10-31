import { Fragment } from "react";
import { mathRuns } from "@/lib/i18n/bidi";

/**
 * A short piece of pure maths ("2 × 8 = 16") is kept on one line. Anything else may still wrap: a long run, a run of several
 * lines (a sequence answer on the review screen), and Latin words, URLs or code, which fill whole cards in a narrow column.
 */
export const NOWRAP_MAX = 20;
export const keepWhole = (run: string): boolean => run.length <= NOWRAP_MAX && !run.includes("\n") && !/[A-Za-z]{2}/.test(run);

/** Text in which every maths expression inside a Hebrew line is drawn left-to-right, as in a textbook (see `bidi.ts`). */
export function MathText({ text }: { text: string }) {
  const parts = mathRuns(text);
  if (!parts.some((p) => p.math)) return <>{text}</>;
  return <>{parts.map((p, i) => (p.math ? <bdi key={i} dir="ltr" className={keepWhole(p.text) ? "whitespace-nowrap" : undefined}>{p.text}</bdi> : <Fragment key={i}>{p.text}</Fragment>))}</>;
}
