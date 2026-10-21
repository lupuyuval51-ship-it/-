/**
 * Reading a notes file the learner picked, shared by the website's create form and the Android app's (pure: no DOM besides
 * `TextDecoder`, which both have).
 */

/**
 * The text of a picked file's bytes. `File.text()` always reads UTF-8, so notes that Windows Notepad saved as "Unicode"
 * (UTF-16 with a byte-order mark) or as Hebrew "ANSI" (windows-1255, the old Israeli default) came out as garbage and
 * were refused. UTF-8 is tried first; a legacy Hebrew file is recognised by its letters (bytes 0xE0–0xFA hold א–ת);
 * anything else is read as UTF-8 with replacement characters, which `looksLikeBinary` then catches.
 */
export function decodeTextFile(bytes: Uint8Array): string {
  if ((bytes[0] === 0xff && bytes[1] === 0xfe) || (bytes[0] === 0xfe && bytes[1] === 0xff)) {
    return new TextDecoder(bytes[0] === 0xff ? "utf-16le" : "utf-16be").decode(bytes);
  }
  try { return new TextDecoder("utf-8", { fatal: true }).decode(bytes); } catch { /* not UTF-8 */ }
  let high = 0;
  let hebrew = 0;
  for (const b of bytes) {
    if (b < 0x80) continue;
    high++;
    if (b >= 0xe0 && b <= 0xfa) hebrew++;
  }
  if (hebrew / Math.max(1, high) >= 0.6) {
    try { return new TextDecoder("windows-1255").decode(bytes); } catch { /* a WebView without the legacy encodings */ }
  }
  return new TextDecoder("utf-8").decode(bytes);
}

/** A file that does not read as text (a PDF or a Word file picked by mistake decodes to NULs and replacement characters). */
export function looksLikeBinary(raw: string): boolean {
  const broken = (raw.match(/[\u0000�]/g) ?? []).length;
  return broken > Math.max(2, raw.length * 0.01);
}
