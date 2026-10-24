/** The app's name, which is also the title of the page the app is built from (`mobile/index.html`). */
export const APP_TITLE = "LEVEL UP";

/**
 * The document title for a screen, from the text of its heading ("Settings · LEVEL UP"). The home screen's heading is the app's
 * name itself, and the play screen has no heading, so both are just "LEVEL UP". Whitespace is collapsed, and a heading that is
 * empty gives the plain app name. Hash routes never reload the page, so without this the WebView's title stays "LEVEL UP" on
 * every screen (history, the task switcher and assistive technology that read the title cannot tell the screens apart).
 */
export function screenTitle(heading: string | null | undefined): string {
  const h = (heading ?? "").replace(/\s+/g, " ").trim();
  return h && h !== APP_TITLE ? `${h} · ${APP_TITLE}` : APP_TITLE;
}
