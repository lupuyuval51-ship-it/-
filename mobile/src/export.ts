/**
 * Text files (the backup JSON) that the Android shell can hand to the native share sheet (`FilesPlugin.java`, wired in
 * `native.ts`). The limit mirrors the plugin's, so the page never sends more than it will accept.
 */
export const MAX_SHARE_CHARS = 20_000_000;

export function isShareableText(type: string, size: number): boolean {
  return (type === "application/json" || type.startsWith("text/")) && size <= MAX_SHARE_CHARS;
}
