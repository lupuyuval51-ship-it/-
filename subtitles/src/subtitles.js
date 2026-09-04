/**
 * Pure helpers for turning raw Whisper output into subtitle files.
 * No DOM access here, so the logic is unit-testable under Node.
 */

const MIN_DURATION = 0.4;
const MAX_DURATION = 8;

/** 12.345 -> "00:00:12,345" (SRT) or "00:00:12.345" (WebVTT). */
export function formatTime(seconds, msSeparator = ',') {
  const total = Math.max(0, Number.isFinite(seconds) ? seconds : 0);
  const ms = Math.round((total - Math.floor(total)) * 1000);
  // Rounding up to 1000ms must roll over into the next second.
  const carry = ms === 1000 ? 1 : 0;
  const whole = Math.floor(total) + carry;
  const h = String(Math.floor(whole / 3600)).padStart(2, '0');
  const m = String(Math.floor((whole % 3600) / 60)).padStart(2, '0');
  const s = String(whole % 60).padStart(2, '0');
  return `${h}:${m}:${s}${msSeparator}${String(carry ? 0 : ms).padStart(3, '0')}`;
}

/** Collapse whitespace and strip the artefacts Whisper sometimes emits. */
export function cleanText(text) {
  return String(text ?? '')
    .replace(/\s+/g, ' ')
    .replace(/^[\s\-–—]+/, '')
    .trim();
}

/**
 * Break a caption into at most `maxLines` lines of ~`maxChars` characters,
 * preferring word boundaries. Longer captions keep their extra words on the
 * last line rather than losing them.
 */
export function wrapText(text, maxChars = 42, maxLines = 2) {
  const words = cleanText(text).split(' ').filter(Boolean);
  if (words.length === 0) return '';
  const lines = [];
  let line = '';
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (candidate.length > maxChars && line && lines.length < maxLines - 1) {
      lines.push(line);
      line = word;
    } else {
      line = candidate;
    }
  }
  lines.push(line);
  return lines.join('\n');
}

/**
 * Turn the `chunks` array of an ASR pipeline result into clean segments.
 * Whisper leaves the final timestamp as `null` and can emit zero-length or
 * overlapping chunks, so every segment is repaired against its neighbours.
 *
 * @param {Array<{timestamp:[number, number|null], text:string}>} chunks
 * @param {{offset?:number, duration?:number}} [options] offset is added to
 *        every timestamp, so a long file can be transcribed block by block.
 */
export function normalizeChunks(chunks, options = {}) {
  const offset = options.offset ?? 0;
  const duration = options.duration ?? Infinity;
  const raw = [];

  for (const chunk of Array.isArray(chunks) ? chunks : []) {
    const text = cleanText(chunk?.text);
    if (!text) continue;
    const [rawStart, rawEnd] = chunk?.timestamp ?? [];
    const start = Number.isFinite(rawStart) ? rawStart : null;
    if (start === null) continue;
    raw.push({ start: start + offset, end: Number.isFinite(rawEnd) ? rawEnd + offset : null, text });
  }

  const segments = [];
  for (let i = 0; i < raw.length; i += 1) {
    const current = raw[i];
    const next = raw[i + 1];
    let end = current.end;
    if (end === null || end <= current.start) {
      // Estimate from reading speed (~14 characters per second), then clamp.
      const estimated = current.start + Math.min(MAX_DURATION, current.text.length / 14 + 0.6);
      end = next ? Math.min(estimated, next.start) : estimated;
    }
    if (next && end > next.start) end = next.start;
    end = Math.min(end, duration);
    if (end - current.start < MIN_DURATION) end = current.start + MIN_DURATION;
    if (current.start >= duration) continue;
    segments.push({ start: current.start, end, text: current.text });
  }
  return segments;
}

/**
 * Split a caption that is too long to read into several cues.
 *
 * Whisper emits one chunk per sentence, and a long sentence would otherwise
 * become a wall of text on screen. Sentence-ending punctuation is preferred as
 * the cut point, then word boundaries; the original duration is divided between
 * the pieces in proportion to their length.
 */
export function splitLongSegments(segments, maxChars = 84) {
  const result = [];
  for (const segment of segments) {
    const text = cleanText(segment.text);
    if (!text) continue;
    if (text.length <= maxChars) {
      result.push({ ...segment, text });
      continue;
    }

    const pieces = splitReadable(text, maxChars);
    const characters = pieces.reduce((total, piece) => total + piece.length, 0) || 1;
    const span = segment.end - segment.start;
    let cursor = segment.start;
    for (const piece of pieces) {
      const share = span * (piece.length / characters);
      const end = Math.min(segment.end, cursor + share);
      result.push({ ...segment, start: cursor, end, text: piece });
      cursor = end;
    }
  }
  return result;
}

function splitReadable(text, maxChars) {
  const words = text.split(' ');
  const pieces = [];
  let current = '';
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length > maxChars && current) {
      pieces.push(current);
      current = word;
    } else {
      current = candidate;
      // A sentence boundary is a better cut than a word boundary, as long as
      // the piece is already worth showing on its own.
      if (/[.!?۔。！？…]$/.test(word) && current.length >= maxChars * 0.45) {
        pieces.push(current);
        current = '';
      }
    }
  }
  if (current) pieces.push(current);
  return pieces;
}

/**
 * Append a freshly transcribed block to the running list, dropping anything the
 * previous block already covered (blocks overlap on purpose so words are not
 * cut in half at the seam).
 */
export function appendSegments(accumulator, incoming) {
  const lastEnd = accumulator.length ? accumulator[accumulator.length - 1].end : 0;
  for (const segment of incoming) {
    const middle = (segment.start + segment.end) / 2;
    if (middle <= lastEnd + 0.05) continue;
    const start = Math.max(segment.start, lastEnd);
    if (segment.end - start < 0.15) continue;
    accumulator.push({ ...segment, start });
  }
  return accumulator;
}

export function toSRT(segments) {
  return (
    segments
      .map((segment, index) => {
        const from = formatTime(segment.start, ',');
        const to = formatTime(segment.end, ',');
        return `${index + 1}\n${from} --> ${to}\n${wrapText(segment.text)}\n`;
      })
      .join('\n') + '\n'
  );
}

export function toVTT(segments) {
  const cues = segments
    .map((segment, index) => {
      const from = formatTime(segment.start, '.');
      const to = formatTime(segment.end, '.');
      return `${index + 1}\n${from} --> ${to}\n${wrapText(segment.text)}\n`;
    })
    .join('\n');
  return `WEBVTT\n\n${cues}`;
}

export function toTXT(segments) {
  return segments.map((segment) => cleanText(segment.text)).join('\n') + '\n';
}

export const FORMATS = {
  srt: { extension: 'srt', mime: 'text/plain;charset=utf-8', build: toSRT },
  vtt: { extension: 'vtt', mime: 'text/vtt;charset=utf-8', build: toVTT },
  txt: { extension: 'txt', mime: 'text/plain;charset=utf-8', build: toTXT },
};

/** Index of the segment covering `time`, or -1. Binary search for smooth playback. */
export function segmentAt(segments, time) {
  let low = 0;
  let high = segments.length - 1;
  while (low <= high) {
    const mid = (low + high) >> 1;
    const segment = segments[mid];
    if (time < segment.start) high = mid - 1;
    else if (time > segment.end) low = mid + 1;
    else return mid;
  }
  return -1;
}
