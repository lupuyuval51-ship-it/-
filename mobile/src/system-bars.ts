/**
 * Which page colour the Android shell should show behind the (transparent, Android 15+) system bars. Pure, so it is
 * unit-tested; the wiring is in `native.ts`, the native side in `SystemBarsPlugin.java`.
 *
 * The two colours are the page backgrounds `--color-ink-950` of the dark and the light theme in `src/app/globals.css`;
 * `tests/unit/android-shell.test.ts` fails if they drift apart from the CSS or from MainActivity.java.
 */
export const PAGE_DARK = "#0e1b17";
export const PAGE_LIGHT = "#f6f1e7";

export interface PageColorInput {
  /** Current hash route, e.g. "/play/abc". */
  path: string;
  /** `data-theme` on <html>: "light" | "dark", or null when the theme follows the system. */
  themeAttr: string | null;
  /** `matchMedia("(prefers-color-scheme: light)").matches` */
  systemLight: boolean;
}

export function pageColor({ path, themeAttr, systemLight }: PageColorInput): string {
  if (path.startsWith("/play/")) return PAGE_DARK; // the 3D play screen is always dark
  const light = themeAttr === "light" || (themeAttr !== "dark" && systemLight);
  return light ? PAGE_LIGHT : PAGE_DARK;
}
