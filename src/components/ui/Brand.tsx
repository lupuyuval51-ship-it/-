import { cx } from "./index";

/**
 * The LEVEL UP mark: a ball hopping up a flight of three steps. The steps have softly rounded outer corners, the ball is a plain
 * disc, and the whole drawing sits in a 1084 × 895 box. It is drawn with `currentColor`, so it takes the colour of its tile.
 * The same drawing is what `mobile/brand-assets.mjs` uses for the launcher icons and the splash screens.
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 1084 895" aria-hidden className={className} fill="currentColor">
      <path d="M32 545H407V300A32 32 0 0 1 439 268H698V32A32 32 0 0 1 730 0H1052A32 32 0 0 1 1084 32V863A32 32 0 0 1 1052 895H32A32 32 0 0 1 0 863V577A32 32 0 0 1 32 545Z" />
      <circle cx="231" cy="325" r="108" />
    </svg>
  );
}

/**
 * The mark on its tile, followed by the name. The tile is a soft, pressable-looking block (a highlight on its top edge and a solid
 * ledge under it, like the primary buttons) with the mark cut out of it in the page colour; the name is a heavy rounded wordmark.
 * The name is plain text, so screen readers read "LEVEL UP".
 */
export function Brand({ size = "md", className }: { size?: "sm" | "md" | "lg"; className?: string }) {
  const tile = {
    sm: "size-7 rounded-[22%] shadow-[0_2px_0_0_color-mix(in_oklab,var(--color-neon)_55%,#000),inset_0_1px_0_rgb(255_255_255/0.4)]",
    md: "size-8 rounded-[22%] shadow-[0_2px_0_0_color-mix(in_oklab,var(--color-neon)_55%,#000),inset_0_1px_0_rgb(255_255_255/0.4)]",
    lg: "size-10 rounded-[22%] shadow-[0_3px_0_0_color-mix(in_oklab,var(--color-neon)_55%,#000),inset_0_1px_0_rgb(255_255_255/0.4)]",
  }[size];
  const text = { sm: "text-base", md: "text-lg", lg: "text-3xl" }[size];
  return (
    <span className={cx("inline-flex items-center gap-2.5", className)}>
      <span aria-hidden className={cx("mb-[3px] grid shrink-0 place-items-center bg-neon text-ink-950", tile)}><LogoMark className="w-[62%]" /></span>
      <span dir="ltr" className={cx("font-extrabold tracking-[-0.01em] [text-shadow:0_1px_0_rgb(255_255_255/0.18),0_0.03em_0.03em_rgb(0_0_0/0.26)]", text)}>LEVEL UP</span>
    </span>
  );
}
