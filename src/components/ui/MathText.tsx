import { Fragment } from "react";
import { mathRuns } from "@/lib/i18n/bidi";

/** Text in which every maths expression inside a Hebrew line is drawn left-to-right, as in a textbook (see `bidi.ts`). */
export function MathText({ text }: { text: string }) {
  const parts = mathRuns(text);
  if (!parts.some((p) => p.math)) return <>{text}</>;
  return <>{parts.map((p, i) => (p.math ? <bdi key={i} dir="ltr">{p.text}</bdi> : <Fragment key={i}>{p.text}</Fragment>))}</>;
}
