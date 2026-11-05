import { createSseParser, createUtf8Decoder, type SseFrame } from '../sseParser';
import { parseAdvisorFrame } from '../events';

function collect(chunks: string[], { end = true } = {}): SseFrame[] {
  const frames: SseFrame[] = [];
  const parser = createSseParser((f) => frames.push(f));
  for (const c of chunks) parser.push(c);
  if (end) parser.end();
  return frames;
}

/** Splits `text` into pieces at every listed offset. */
function splitAt(text: string, offsets: number[]): string[] {
  const out: string[] = [];
  let prev = 0;
  for (const o of offsets) {
    out.push(text.slice(prev, o));
    prev = o;
  }
  out.push(text.slice(prev));
  return out;
}

const STREAM =
  'event: meta\ndata: {"conversationId":"c1","userMessageId":"u1"}\n\n' +
  'event: delta\ndata: {"text":"שלום "}\n\n' +
  ': heartbeat\n\n' +
  'event: delta\ndata: {"text":"עולם"}\n\n' +
  'event: done\ndata: {"assistantMessageId":"a1"}\n\n';

const EXPECTED: SseFrame[] = [
  { event: 'meta', data: '{"conversationId":"c1","userMessageId":"u1"}', id: '' },
  { event: 'delta', data: '{"text":"שלום "}', id: '' },
  { event: 'delta', data: '{"text":"עולם"}', id: '' },
  { event: 'done', data: '{"assistantMessageId":"a1"}', id: '' },
];

describe('createSseParser', () => {
  it('parses a complete stream in one chunk', () => {
    expect(collect([STREAM])).toEqual(EXPECTED);
  });

  it('produces identical frames for every possible single split point', () => {
    for (let i = 0; i <= STREAM.length; i++) {
      expect(collect(splitAt(STREAM, [i]))).toEqual(EXPECTED);
    }
  });

  it('handles one character per chunk', () => {
    expect(collect(STREAM.split(''))).toEqual(EXPECTED);
  });

  it('handles CRLF line endings, including a CRLF split across chunks', () => {
    const crlf = STREAM.replace(/\n/g, '\r\n');
    expect(collect([crlf])).toEqual(EXPECTED);
    for (let i = 0; i <= crlf.length; i++) {
      expect(collect(splitAt(crlf, [i]))).toEqual(EXPECTED);
    }
  });

  it('handles bare CR line endings', () => {
    expect(collect([STREAM.replace(/\n/g, '\r')])).toEqual(EXPECTED);
  });

  it('joins multi-line data with newlines and strips only one leading space', () => {
    const frames = collect(['data: line one\ndata:line two\ndata:   indented\ndata\n\n']);
    expect(frames).toEqual([{ event: 'message', data: 'line one\nline two\n  indented\n', id: '' }]);
  });

  it('ignores comments, unknown fields, retry and frames without data', () => {
    const frames = collect([':ok\n\nretry: 3000\n\nevent: ping\n\nfoo: bar\nevent: delta\ndata: {"text":"x"}\n\n']);
    expect(frames).toEqual([{ event: 'delta', data: '{"text":"x"}', id: '' }]);
  });

  it('does not leak the event type of a data-less frame into the next frame', () => {
    const frames = collect(['event: ping\n\ndata: {}\n\n']);
    expect(frames).toEqual([{ event: 'message', data: '{}', id: '' }]);
  });

  it('tracks the last event id', () => {
    const frames = collect(['id: 7\nevent: delta\ndata: {"text":"a"}\n\nevent: delta\ndata: {"text":"b"}\n\n']);
    expect(frames.map((f) => f.id)).toEqual(['7', '7']);
  });

  it('strips a leading BOM', () => {
    expect(collect(['﻿' + STREAM])).toEqual(EXPECTED);
  });

  it('emits a trailing unterminated frame on end(), and nothing more after end()', () => {
    const frames: SseFrame[] = [];
    const parser = createSseParser((f) => frames.push(f));
    parser.push('event: done\ndata: {"assistantMessageId":"a1"}');
    expect(frames).toHaveLength(0);
    parser.end();
    expect(frames).toEqual([{ event: 'done', data: '{"assistantMessageId":"a1"}', id: '' }]);
    parser.push('data: late\n\n');
    parser.end();
    expect(frames).toHaveLength(1);
  });

  it('does not emit an incomplete frame before end()', () => {
    expect(collect(['event: delta\ndata: {"text":"a"}\n'], { end: false })).toEqual([]);
  });
});

describe('createUtf8Decoder', () => {
  const encoder = new TextEncoder();

  function decodeChunks(chunks: Uint8Array[]): string {
    const d = createUtf8Decoder();
    return chunks.map((c) => d.decode(c)).join('') + d.flush();
  }

  it('decodes Hebrew, emoji and CJK split at every byte offset', () => {
    const text = 'תוכנית עסקית — ₪1,200 ✓ 😀 漢字';
    const bytes = encoder.encode(text);
    for (let i = 0; i <= bytes.length; i++) {
      expect(decodeChunks([bytes.subarray(0, i), bytes.subarray(i)])).toBe(text);
    }
  });

  it('decodes one byte per chunk', () => {
    const text = 'שלום 👋🏽 עולם';
    const bytes = encoder.encode(text);
    const chunks = Array.from(bytes, (b) => Uint8Array.of(b));
    expect(decodeChunks(chunks)).toBe(text);
  });

  it('matches the platform TextDecoder on invalid input', () => {
    const cases = [
      [0xff, 0x41],
      [0xc0, 0x80],
      [0xe0, 0x80, 0x80],
      [0xed, 0xa0, 0x80],
      [0xf4, 0x90, 0x80, 0x80],
      [0xe2, 0x82, 0x41],
      [0xf0, 0x9f, 0x98],
      [0x80, 0x80, 0x41],
    ];
    for (const bytes of cases) {
      const input = Uint8Array.from(bytes);
      expect(decodeChunks([input])).toBe(new TextDecoder('utf-8').decode(input));
    }
  });

  it('replaces an incomplete trailing sequence on flush', () => {
    const d = createUtf8Decoder();
    const bytes = encoder.encode('ש');
    expect(d.decode(bytes.subarray(0, 1))).toBe('');
    expect(d.flush()).toBe('�');
  });

  it('round-trips a full advisor stream split mid-character into the same events', () => {
    const bytes = encoder.encode(STREAM);
    // Find a split point in the middle of a Hebrew letter (2-byte sequence).
    const hebrewStart = bytes.findIndex((b) => b === 0xd7);
    for (const cut of [hebrewStart + 1, hebrewStart + 3, bytes.length - 3]) {
      const d = createUtf8Decoder();
      const frames: SseFrame[] = [];
      const parser = createSseParser((f) => frames.push(f));
      parser.push(d.decode(bytes.subarray(0, cut)));
      parser.push(d.decode(bytes.subarray(cut)));
      parser.push(d.flush());
      parser.end();
      expect(frames).toEqual(EXPECTED);
    }
  });
});

describe('parseAdvisorFrame', () => {
  it('decodes the contract events', () => {
    expect(parseAdvisorFrame(EXPECTED[0]!)).toEqual({ event: 'meta', data: { conversationId: 'c1', userMessageId: 'u1' } });
    expect(parseAdvisorFrame(EXPECTED[1]!)).toEqual({ event: 'delta', data: { text: 'שלום ' } });
    expect(parseAdvisorFrame(EXPECTED[3]!)).toEqual({ event: 'done', data: { assistantMessageId: 'a1' } });
  });

  it('drops invalid actions individually and sanitizes follow-ups', () => {
    const data = JSON.stringify({
      actions: [
        {
          type: 'add_task',
          id: 't1',
          label: 'Add task',
          title: 'Call three suppliers',
          description: '',
          phase: 'days_30',
          priority: 'high',
          dueInDays: 7,
        },
        { type: 'delete_everything', id: 'x' },
        { type: 'add_startup_cost', id: 's1', label: 'Oven', costLabel: 'Oven', amountMinor: -5 },
      ],
      followUps: ['  What next?  ', '', 42, 'What next?'],
    });
    const event = parseAdvisorFrame({ event: 'actions', data, id: '' });
    expect(event?.event).toBe('actions');
    if (event?.event !== 'actions') return;
    expect(event.data.actions.map((a) => a.id)).toEqual(['t1']);
    expect(event.data.followUps).toEqual(['What next?']);
  });

  it('maps unknown error codes to internal and ignores unknown events or bad JSON', () => {
    expect(parseAdvisorFrame({ event: 'error', data: '{"code":"weird","message":"x"}', id: '' })).toEqual({
      event: 'error',
      data: { code: 'internal', message: 'x' },
    });
    expect(parseAdvisorFrame({ event: 'error', data: '{"code":"quota_exceeded","message":"m"}', id: '' })).toEqual({
      event: 'error',
      data: { code: 'quota_exceeded', message: 'm' },
    });
    expect(parseAdvisorFrame({ event: 'ping', data: '{}', id: '' })).toBeNull();
    expect(parseAdvisorFrame({ event: 'delta', data: '{"text":', id: '' })).toBeNull();
  });
});
