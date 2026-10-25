import { Fragment } from "react";
import { mathRuns } from "@/lib/i18n/bidi";

/** A short expression ("2 × 8 = 16") is kept on one line; a long one (a line of code) may still wrap on a narrow phone. */
export const NOWRAP_MAX = 24;

/** Text in which every maths expression inside a Hebrew line is drawn left-to-right, as in a textbook (see `bidi.ts`). */
export function MathText({ text }: { text: string }) {
  const parts = mathRuns(text);
  if (!parts.some((p) => p.math)) return <>{text}</>;
  return <>{parts.map((p, i) => (p.math ? <bdi key={i} dir="ltr" className={p.text.length <= NOWRAP_MAX ? "whitespace-nowrap" : undefined}>{p.text}</bdi> : <Fragment key={i}>{p.text}</Fragment>))}</>;
}
