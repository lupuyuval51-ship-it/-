import { cx } from "./index";

/** The LEVEL UP mark: a ball hopping up a flight of three steps. Drawn with `currentColor`, so it takes the colour of its tile. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 2.5 32 32" aria-hidden className={className} fill="currentColor">
      <path d="M3 29v-7h10.5v-7H21V8h8v21z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <circle cx="8" cy="15.5" r="2.8" />
    </svg>
  );
}

/** The mark on its tile, followed by the name. The name is plain text, so screen readers read "LEVEL UP". */
export function Brand({ size = "md", className }: { size?: "sm" | "md" | "lg"; className?: string }) {
  const tile = { sm: "size-7 rounded-lg", md: "size-8 rounded-lg", lg: "size-10 rounded-xl" }[size];
  const mark = { sm: "size-4", md: "size-5", lg: "size-6" }[size];
  const text = { sm: "text-base", md: "text-lg", lg: "text-3xl" }[size];
  return (
    <span className={cx("inline-flex items-center gap-2.5", className)}>
      <span aria-hidden className={cx("grid shrink-0 place-items-center bg-neon text-ink-950", tile)}><LogoMark className={mark} /></span>
      <span dir="ltr" className={cx("font-extrabold tracking-tight", text)}>LEVEL UP</span>
    </span>
  );
}
