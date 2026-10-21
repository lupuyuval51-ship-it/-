/**
 * Reading a notes file the learner picked, shared by the website's create form and the Android app's (pure: no DOM besides
 * `TextDecoder`, which both have).
 */

/**
 * The text of a picked file's bytes. `File.text()` always reads UTF-8, so notes that Windows Notepad saved as "Unicode"
 * (UTF-16 with a byte-order mark) or as Hebrew "ANSI" (windows-1255, the old Israeli default) came out as garbage and
 * were refused. UTF-8 is tried first; a legacy Hebrew file is recognised by its letters (bytes 0xE0–0xFA hold א–ת, and Hebrew
 * text is mostly such bytes); a legacy Latin file (Spanish or French "ANSI" notes: a few accented letters among plain ones, whose
 * bytes are the same 0xE0–0xFA) is read as windows-1252, so "fotosíntesis" never turns into "fotosםntesis". Bytes with control
 * characters in them are no text: they are read as UTF-8, and `looksLikeBinary` catches the replacement characters.
 */
export function decodeTextFile(bytes: Uint8Array): string {
  if ((bytes[0] === 0xff && bytes[1] === 0xfe) || (bytes[0] === 0xfe && bytes[1] === 0xff)) {
    return new TextDecoder(bytes[0] === 0xff ? "utf-16le" : "utf-16be").decode(bytes);
  }
  try { return new TextDecoder("utf-8", { fatal: true }).decode(bytes); } catch { /* not UTF-8 */ }
  let high = 0;
  let hebrew = 0;
  let latin = 0;
  let control = 0;
  for (const b of bytes) {
    if (b < 0x80) {
      if ((b | 0x20) >= 0x61 && (b | 0x20) <= 0x7a) latin++;
      else if ((b < 0x20 && b !== 0x09 && b !== 0x0a && b !== 0x0d) || b === 0x7f) control++;
      continue;
    }
    high++;
    if (b >= 0xe0 && b <= 0xfa) hebrew++;
  }
  // text has (almost) no control bytes; anything else is read as UTF-8, whose replacement characters mark it as binary
  if (control <= Math.max(2, bytes.length * 0.01)) {
    const legacy = hebrew / Math.max(1, high) >= 0.6 && high / Math.max(1, high + latin) >= 0.5 ? "windows-1255" : "windows-1252";
    try { return new TextDecoder(legacy).decode(bytes); } catch { /* a WebView without the legacy encodings */ }
  }
  return new TextDecoder("utf-8").decode(bytes);
}

/** A file that does not read as text (a PDF or a Word file picked by mistake decodes to NULs and replacement characters). */
export function looksLikeBinary(raw: string): boolean {
  const broken = (raw.match(/[\u0000�]/g) ?? []).length;
  return broken > Math.max(2, raw.length * 0.01);
}
