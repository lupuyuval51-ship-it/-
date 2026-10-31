/** Colour theme preference. `system` follows `prefers-color-scheme`; the 3D play screen is always dark. */
export const THEMES = ["system", "light", "dark"] as const;
export type ThemePref = (typeof THEMES)[number];
export const THEME_COOKIE = "lu-theme";
export const isThemePref = (v: unknown): v is ThemePref => v === "system" || v === "light" || v === "dark";

/** Applies a preference to <html>: an explicit choice sets data-theme, `system` removes it (CSS media query decides). */
export function applyTheme(pref: ThemePref, root: HTMLElement = document.documentElement): void {
  if (pref === "system") root.removeAttribute("data-theme");
  else root.setAttribute("data-theme", pref);
}
