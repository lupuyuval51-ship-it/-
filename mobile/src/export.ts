/**
 * Text files (the backup JSON) that the Android shell can hand to the native share sheet (`FilesPlugin.java`, wired in
 * `native.ts`). The limit mirrors the plugin's, so the page never sends more than it will accept. Only these types are
 * remembered: worker scripts and media blobs, which the 3D runtime may also create, are left alone.
 */
export const MAX_SHARE_CHARS = 20_000_000;
const SHAREABLE_TYPES = new Set(["application/json", "text/plain", "text/csv", "text/markdown"]);

export function isShareableText(type: string, size: number): boolean {
  return SHAREABLE_TYPES.has(type) && size <= MAX_SHARE_CHARS;
}
