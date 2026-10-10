import type { ReactNode } from "react";
import { cx } from "./index";

type Kind = "empty" | "error" | "notfound";

/** Small branded illustrations drawn with theme colours (they follow light/dark like the rest of the UI). */
function Illustration({ kind }: { kind: Kind }) {
  const common = { fill: "none", strokeWidth: 3, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  return (
    <svg viewBox="0 0 160 120" className="mx-auto h-28 w-auto" aria-hidden>
      <ellipse cx="80" cy="104" rx="56" ry="8" className="fill-ink-700" />
      {/* the LEVEL UP triangle, as a portal / stage */}
      <path d="M80 14 128 98H32Z" {...common} className="stroke-neon" />
      {kind === "empty" && (
        <>
          <path d="M80 50v26M67 63h26" {...common} className="stroke-lime" />
          <circle cx="122" cy="30" r="4" className="fill-violet" />
          <circle cx="40" cy="40" r="3" className="fill-amber" />
        </>
      )}
      {kind === "error" && (
        <>
          <path d="M80 46v22" {...common} className="stroke-rose" />
          <circle cx="80" cy="80" r="3.5" className="fill-rose" />
          <path d="M118 26l10-6M124 34l12 0" {...common} className="stroke-amber" />
        </>
      )}
      {kind === "notfound" && (
        <>
          <circle cx="76" cy="62" r="13" {...common} className="stroke-violet" />
          <path d="M86 72l11 11" {...common} className="stroke-violet" />
          <path d="M71 58c2-4 8-4 10 0" {...common} className="stroke-muted" />
        </>
      )}
    </svg>
  );
}

/** Empty / error / not-found screen: illustration, what happened, and what to do next. */
export function StateView({ kind, title, text, actions, children, className, ...rest }: { kind: Kind; title: string; text?: ReactNode; actions?: ReactNode; children?: ReactNode; className?: string } & Record<`data-${string}`, string>) {
  return (
    <div {...rest} className={cx("mx-auto max-w-lg space-y-4 py-10 text-center", className)}>
      <Illustration kind={kind} />
      <h2 className="text-2xl font-bold">{title}</h2>
      {text && <p className="text-muted">{text}</p>}
      {children}
      {actions && <div className="flex flex-wrap justify-center gap-3">{actions}</div>}
    </div>
  );
}

export const primaryLink = "inline-flex min-h-11 items-center gap-2 rounded-xl bg-neon px-5 text-sm font-semibold text-ink-950 shadow-glow transition hover:brightness-110 active:scale-[0.98]";
export const secondaryLink = "inline-flex min-h-11 items-center gap-2 rounded-xl border border-line px-5 text-sm font-semibold transition hover:bg-text/10 active:scale-[0.98]";
