import assert from 'node:assert/strict';
import test from 'node:test';

import {
  appendSegments,
  cleanText,
  formatTime,
  normalizeChunks,
  segmentAt,
  splitLongSegments,
  toSRT,
  toTXT,
  toVTT,
  wrapText,
} from '../src/subtitles.js';
import { LANGUAGES, getLanguage, isRTL, sortedLanguages } from '../src/languages.js';

test('formatTime renders SRT and VTT timestamps', () => {
  assert.equal(formatTime(0), '00:00:00,000');
  assert.equal(formatTime(12.345), '00:00:12,345');
  assert.equal(formatTime(3671.5, '.'), '01:01:11.500');
  assert.equal(formatTime(-4), '00:00:00,000');
});

test('formatTime rolls over instead of emitting 1000 milliseconds', () => {
  assert.equal(formatTime(1.9999), '00:00:02,000');
  assert.equal(formatTime(59.9999), '00:01:00,000');
});

test('cleanText collapses whitespace and leading dashes', () => {
  assert.equal(cleanText('  - hello\n  world  '), 'hello world');
  assert.equal(cleanText(undefined), '');
});

test('wrapText splits on word boundaries within the line budget', () => {
  const wrapped = wrapText('the quick brown fox jumps over the lazy dog near the river bank', 30, 2);
  const lines = wrapped.split('\n');
  assert.equal(lines.length, 2);
  assert.ok(lines[0].length <= 30, lines[0]);
  assert.equal(wrapped.replace(/\n/g, ' '), 'the quick brown fox jumps over the lazy dog near the river bank');
});

test('normalizeChunks repairs missing and overlapping timestamps', () => {
  const segments = normalizeChunks(
    [
      { timestamp: [0, 2.5], text: ' Hello there. ' },
      { timestamp: [2.4, 2.4], text: 'General Kenobi.' },
      { timestamp: [6, null], text: 'You are a bold one.' },
      { timestamp: [9, 10], text: '   ' },
    ],
    { duration: 30 },
  );
  assert.equal(segments.length, 3);
  // The second chunk starts at 2.4, so the first cue is trimmed to remove the overlap.
  assert.deepEqual(segments[0], { start: 0, end: 2.4, text: 'Hello there.' });
  assert.ok(segments[1].end > segments[1].start, 'zero-length chunk gets a duration');
  assert.ok(segments[2].end > 6 && segments[2].end <= 14, 'null end is estimated');
  for (let i = 1; i < segments.length; i += 1) {
    assert.ok(segments[i].start >= segments[i - 1].start, 'segments stay ordered');
  }
});

test('normalizeChunks applies the block offset and duration clamp', () => {
  const segments = normalizeChunks([{ timestamp: [1, 3], text: 'late' }], { offset: 480, duration: 482 });
  assert.deepEqual(segments, [{ start: 481, end: 482, text: 'late' }]);
});

test('appendSegments drops the overlap between consecutive blocks', () => {
  const accumulator = [{ start: 0, end: 10, text: 'first block tail' }];
  appendSegments(accumulator, [
    { start: 7, end: 9.8, text: 'first block tail' },
    { start: 9.9, end: 13, text: 'new content' },
  ]);
  assert.equal(accumulator.length, 2);
  assert.equal(accumulator[1].text, 'new content');
  assert.equal(accumulator[1].start, 10, 'kept segment is clamped to the seam');
});

test('toSRT produces numbered cues', () => {
  const srt = toSRT([
    { start: 0, end: 1.5, text: 'שלום עולם' },
    { start: 1.5, end: 3, text: 'second' },
  ]);
  assert.match(srt, /^1\n00:00:00,000 --> 00:00:01,500\nשלום עולם\n\n2\n/);
  assert.ok(srt.endsWith('second\n\n'));
});

test('toVTT starts with the WEBVTT header and dotted timestamps', () => {
  const vtt = toVTT([{ start: 0, end: 1, text: 'hi' }]);
  assert.ok(vtt.startsWith('WEBVTT\n\n'));
  assert.match(vtt, /00:00:00\.000 --> 00:00:01\.000/);
});

test('toTXT keeps one caption per line', () => {
  assert.equal(toTXT([{ start: 0, end: 1, text: 'a' }, { start: 1, end: 2, text: 'b' }]), 'a\nb\n');
});

test('segmentAt finds the caption for a playback position', () => {
  const segments = [
    { start: 0, end: 2, text: 'a' },
    { start: 2.5, end: 4, text: 'b' },
    { start: 4, end: 9, text: 'c' },
  ];
  assert.equal(segmentAt(segments, 1), 0);
  assert.equal(segmentAt(segments, 3), 1);
  assert.equal(segmentAt(segments, 8.9), 2);
  assert.equal(segmentAt(segments, 2.2), -1);
  assert.equal(segmentAt(segments, 100), -1);
});

test('language table is consistent', () => {
  assert.ok(LANGUAGES.length >= 60);
  const codes = LANGUAGES.map((language) => language.code);
  assert.equal(new Set(codes).size, codes.length, 'no duplicate codes');
  for (const language of LANGUAGES) {
    assert.match(language.nllb, /^[a-z]{3}_[A-Z][a-z]{3}$/, `${language.code} has a FLORES-200 code`);
    assert.ok(language.he && language.en, `${language.code} has display names`);
  }
  assert.equal(getLanguage('he').nllb, 'heb_Hebr');
  assert.equal(getLanguage('nope'), null);
  assert.ok(isRTL('he') && isRTL('ar') && !isRTL('en'));
  assert.equal(sortedLanguages('he').length, LANGUAGES.length);
});

test('splitLongSegments keeps short captions untouched', () => {
  const input = [{ start: 0, end: 2, text: 'short enough' }];
  assert.deepEqual(splitLongSegments(input), input);
});

test('splitLongSegments divides a long caption and its duration', () => {
  const long =
    'And so my fellow Americans ask not what your country can do for you ask what you can do for your country';
  const parts = splitLongSegments([{ start: 10, end: 20, text: long }], 60);

  assert.ok(parts.length >= 2, 'long caption is split');
  assert.equal(parts.map((part) => part.text).join(' '), long, 'no words are lost');
  assert.equal(parts[0].start, 10);
  assert.equal(parts.at(-1).end, 20);
  for (const part of parts) {
    assert.ok(part.text.length <= 60, `piece too long: ${part.text}`);
    assert.ok(part.end > part.start, 'each piece has a duration');
  }
  for (let i = 1; i < parts.length; i += 1) {
    assert.equal(parts[i].start, parts[i - 1].end, 'pieces are contiguous');
  }
});

test('splitLongSegments prefers sentence boundaries', () => {
  const parts = splitLongSegments(
    [{ start: 0, end: 8, text: 'This is the first sentence. And this is the second one that follows it.' }],
    50,
  );
  assert.equal(parts[0].text, 'This is the first sentence.');
});

test('splitLongSegments drops empty captions', () => {
  assert.deepEqual(splitLongSegments([{ start: 0, end: 1, text: '   ' }]), []);
});
