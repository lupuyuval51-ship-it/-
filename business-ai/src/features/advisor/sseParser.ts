/**
 * Incremental Server-Sent Events frame parser (WHATWG "event stream interpretation"), plus a
 * streaming UTF-8 decoder. Pure — no React, no network — so it is unit tested in isolation.
 *
 * Handles: frames split at any chunk boundary, LF / CRLF / CR line endings (including a CRLF
 * split across two chunks), multi-line `data:` fields, comments / heartbeats (`: ping`),
 * fields without a colon, a single optional space after the colon, a leading BOM, `id:` and
 * `retry:` fields, and multi-byte UTF-8 characters (Hebrew, emoji) split across chunks.
 */

export interface SseFrame {
  /** `event:` field, or 'message' when the frame had none. */
  event: string;
  /** All `data:` lines joined with '\n'. */
  data: string;
  /** Last event id seen on the stream (empty when none). */
  id: string;
}

export interface SseParser {
  /** Feeds decoded text. Complete frames are emitted synchronously through `onFrame`. */
  push(text: string): void;
  /**
   * Signals the end of the stream. A trailing frame that was never terminated by a blank line is
   * still emitted when it carries data (lenient: a server that forgets the final "\n\n" must not
   * lose its last event). Further pushes are ignored.
   */
  end(): void;
}

const LF = 10;
const CR = 13;

export function createSseParser(onFrame: (frame: SseFrame) => void): SseParser {
  let buffer = '';
  /** Index in `buffer` from which no line terminator has been seen yet. */
  let scanFrom = 0;
  let started = false;
  let ended = false;
  /** The previous chunk ended in CR: a LF at the start of the next chunk belongs to it. */
  let skipLeadingLF = false;

  let eventType = '';
  let dataLines: string[] = [];
  let hasData = false;
  let lastEventId = '';

  function dispatch() {
    if (!hasData) {
      eventType = '';
      return;
    }
    const frame: SseFrame = { event: eventType || 'message', data: dataLines.join('\n'), id: lastEventId };
    eventType = '';
    dataLines = [];
    hasData = false;
    onFrame(frame);
  }

  function processLine(line: string) {
    if (line === '') {
      dispatch();
      return;
    }
    if (line.charCodeAt(0) === 58 /* ':' */) return; // comment / heartbeat
    const colon = line.indexOf(':');
    let field: string;
    let value: string;
    if (colon === -1) {
      field = line;
      value = '';
    } else {
      field = line.slice(0, colon);
      value = line.slice(colon + 1);
      if (value.charCodeAt(0) === 32 /* ' ' */) value = value.slice(1);
    }
    switch (field) {
      case 'event':
        eventType = value;
        break;
      case 'data':
        dataLines.push(value);
        hasData = true;
        break;
      case 'id':
        if (!value.includes('\u0000')) lastEventId = value;
        break;
      default:
        // `retry` and unknown fields are ignored (this client never auto-reconnects).
        break;
    }
  }

  function push(text: string) {
    if (ended || text.length === 0) return;
    let chunk = text;
    if (!started) {
      started = true;
      if (chunk.charCodeAt(0) === 0xfeff) chunk = chunk.slice(1);
    }
    if (skipLeadingLF) {
      skipLeadingLF = false;
      if (chunk.charCodeAt(0) === LF) chunk = chunk.slice(1);
    }
    if (chunk.length === 0) return;
    buffer += chunk;

    let lineStart = 0;
    for (let i = scanFrom; i < buffer.length; i++) {
      const c = buffer.charCodeAt(i);
      if (c !== LF && c !== CR) continue;
      processLine(buffer.slice(lineStart, i));
      if (c === CR) {
        if (i + 1 < buffer.length) {
          if (buffer.charCodeAt(i + 1) === LF) i++;
        } else {
          skipLeadingLF = true;
        }
      }
      lineStart = i + 1;
    }
    buffer = buffer.slice(lineStart);
    scanFrom = buffer.length;
  }

  function end() {
    if (ended) return;
    if (buffer.length > 0) processLine(buffer);
    buffer = '';
    scanFrom = 0;
    dispatch();
    ended = true;
  }

  return { push, end };
}

/* ------------------------------------------------------------------ */
/* UTF-8                                                               */
/* ------------------------------------------------------------------ */

export interface Utf8StreamDecoder {
  /** Decodes a chunk; bytes of a character split at the chunk end are kept for the next call. */
  decode(chunk: Uint8Array): string;
  /** Ends the stream; an incomplete trailing sequence becomes U+FFFD. */
  flush(): string;
}

const REPLACEMENT = 0xfffd;

function codeUnitsToString(units: number[]): string {
  let out = '';
  for (let i = 0; i < units.length; i += 4096) {
    out += String.fromCharCode(...units.slice(i, i + 4096));
  }
  return out;
}

/**
 * Streaming UTF-8 → string decoder (WHATWG semantics, replacement on errors).
 *
 * The app ships its own instead of `new TextDecoder().decode(chunk, { stream: true })` because
 * not every JS engine we target honours `stream: true`; a Hebrew letter split across two network
 * chunks must never turn into "��".
 */
export function createUtf8Decoder(): Utf8StreamDecoder {
  let pending: number[] = [];

  function run(chunk: Uint8Array, final: boolean): string {
    let input: Uint8Array = chunk;
    if (pending.length > 0) {
      const merged = new Uint8Array(pending.length + chunk.length);
      merged.set(pending, 0);
      merged.set(chunk, pending.length);
      input = merged;
      pending = [];
    }
    const units: number[] = [];
    let i = 0;
    const n = input.length;
    while (i < n) {
      const b0 = input[i]!;
      if (b0 < 0x80) {
        units.push(b0);
        i++;
        continue;
      }
      let need: number;
      let cp: number;
      let lower = 0x80;
      let upper = 0xbf;
      if (b0 >= 0xc2 && b0 <= 0xdf) {
        need = 1;
        cp = b0 & 0x1f;
      } else if (b0 >= 0xe0 && b0 <= 0xef) {
        need = 2;
        cp = b0 & 0x0f;
        if (b0 === 0xe0) lower = 0xa0;
        if (b0 === 0xed) upper = 0x9f; // no UTF-16 surrogates
      } else if (b0 >= 0xf0 && b0 <= 0xf4) {
        need = 3;
        cp = b0 & 0x07;
        if (b0 === 0xf0) lower = 0x90;
        if (b0 === 0xf4) upper = 0x8f; // ≤ U+10FFFF
      } else {
        units.push(REPLACEMENT);
        i++;
        continue;
      }

      let consumed = 1;
      let state: 'ok' | 'invalid' | 'incomplete' = 'ok';
      while (consumed <= need) {
        if (i + consumed >= n) {
          state = 'incomplete';
          break;
        }
        const b = input[i + consumed]!;
        const lo = consumed === 1 ? lower : 0x80;
        const hi = consumed === 1 ? upper : 0xbf;
        if (b < lo || b > hi) {
          state = 'invalid';
          break;
        }
        cp = (cp << 6) | (b & 0x3f);
        consumed++;
      }

      if (state === 'incomplete') {
        if (final) {
          units.push(REPLACEMENT);
        } else {
          pending = Array.from(input.subarray(i));
        }
        break;
      }
      if (state === 'invalid') {
        // Maximal subpart replaced by one U+FFFD; the offending byte is re-read as a new lead.
        units.push(REPLACEMENT);
        i += consumed;
        continue;
      }
      if (cp > 0xffff) {
        const v = cp - 0x10000;
        units.push(0xd800 + (v >> 10), 0xdc00 + (v & 0x3ff));
      } else {
        units.push(cp);
      }
      i += need + 1;
    }
    return codeUnitsToString(units);
  }

  return {
    decode: (chunk) => run(chunk, false),
    flush: () => (pending.length > 0 ? run(new Uint8Array(0), true) : ''),
  };
}
