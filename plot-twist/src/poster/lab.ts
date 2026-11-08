/**
 * Poster QA lab (dev only): /poster-lab.html
 *
 * Renders sample posters covering every palette, motif, weirdness level and
 * first-choice index, plus edge cases (long/short titles, long closing lines,
 * notes / no notes, series / no series, RTL notes). Exposes `window.posterLab`
 * for the Playwright check in e2e/poster-check.cjs.
 */
import '../fonts.ts';
import { MOTIFS, PALETTE_NAMES, KINDS } from '../../shared/constants.ts';
import type { Kind, Motif, PaletteName, Weirdness } from '../../shared/types.ts';
import type { CompletedEpisode } from '../engine/types.ts';
import { downloadBlob, posterFileName } from './export.ts';
import { posterInputFromEpisode } from './fromEpisode.ts';
import {
  drawPosterWithLayout,
  ensurePosterFonts,
  posterFontsReady,
  posterText,
  posterToBlob,
  posterToDataURL,
  renderPosterCanvas,
  type PosterLayout,
} from './render.ts';
import { POSTER_HEIGHT, POSTER_WIDTH, type PosterInput } from './types.ts';

const BASE: PosterInput = {
  title: 'The Undercover Tourist',
  episodeNumber: 4,
  dateISO: '2026-11-08',
  seriesName: 'The Slow City',
  palette: 'ember',
  motif: 'grid',
  seed: 0x5eed1234,
  weirdness: 2,
  kind: 'detective',
  endingTitle: 'The Quiet Detective',
  closingLine: 'This street keeps its secrets above eye level.',
  notes: ['a door painted the wrong blue', 'a mailbox from another century'],
  choiceLabels: ['Follow the details'],
  firstChoiceIndex: 0,
  alternatesUsed: 0,
  minutes: 31,
  source: 'curated',
  narrator: 'The Tourist Board (unofficial)',
};

const v = (patch: Partial<PosterInput>): PosterInput => ({ ...BASE, ...patch });

interface Sample {
  name: string;
  input: PosterInput;
}

const HERO: Sample[] = [
  { name: 'ember · grid · w2 · detective', input: v({}) },
  {
    name: 'noir · shards · w1 · detective',
    input: v({
      title: 'The Case of the Missing Tuesday',
      palette: 'noir',
      motif: 'shards',
      weirdness: 1,
      firstChoiceIndex: 1,
      episodeNumber: 7,
      seed: 912_003,
      endingTitle: 'Case Closed, Mostly',
      closingLine: 'Every alibi you had was true. That was the problem.',
      notes: ['the clock above the bakery is four minutes fast', 'a single glove left on the bench'],
      choiceLabels: ['Trust the witness'],
      narrator: 'Inspector Nobody',
      seriesName: 'Night Files',
      minutes: 44,
    }),
  },
  {
    name: 'tide · waves · w2 · wanderer',
    input: v({
      title: 'Low Tide Protocol',
      palette: 'tide',
      motif: 'waves',
      kind: 'wanderer',
      episodeNumber: 2,
      seed: 77_102,
      endingTitle: 'The Long Way Home',
      closingLine: "The sea doesn't hurry, and today neither did you.",
      notes: ['three gulls arguing over one fry'],
      choiceLabels: ['Follow the shoreline'],
      narrator: 'The Harbour Master',
      seriesName: null,
      alternatesUsed: 1,
      minutes: 58,
    }),
  },
  {
    name: 'neon · dots · w3 · game (ai)',
    input: v({
      title: 'Main Character Arcade',
      palette: 'neon',
      motif: 'dots',
      kind: 'game',
      weirdness: 3,
      firstChoiceIndex: 1,
      episodeNumber: 11,
      seed: 4_040_404,
      endingTitle: 'High Score',
      closingLine: 'Insert coin. The city is the joystick now.',
      notes: ['a vending machine that only sells grape soda', 'pigeon #3 is clearly the boss'],
      choiceLabels: ['Play the side quest', 'Go for the bonus round'],
      source: 'ai',
      narrator: 'Player Two',
      minutes: 27,
    }),
  },
  {
    name: 'citrus · rays · w2 · maker (light)',
    input: v({
      title: 'Breakfast at the End of the World',
      palette: 'citrus',
      motif: 'rays',
      kind: 'maker',
      episodeNumber: 3,
      seed: 30_303,
      endingTitle: 'Sunny Side Up',
      closingLine: 'You made something nobody asked for. It was perfect.',
      notes: ['toast, but architectural'],
      choiceLabels: ['Cook with what you have'],
      seriesName: 'Kitchen Table Odyssey',
      narrator: 'The Breakfast Oracle',
      minutes: 36,
    }),
  },
  {
    name: 'moss · stairs · w1 · ritual (short title, no notes)',
    input: v({
      title: 'Moss',
      palette: 'moss',
      motif: 'stairs',
      kind: 'ritual',
      weirdness: 1,
      firstChoiceIndex: 1,
      episodeNumber: 1,
      seed: 1_111,
      endingTitle: 'The Long Exhale',
      closingLine: 'Some things grow only when nobody is watching.',
      notes: [],
      choiceLabels: ['Stay still'],
      seriesName: null,
      narrator: undefined,
      minutes: 14,
    }),
  },
  {
    name: 'dusk · arches · w2 · social (centre door)',
    input: v({
      title: 'Three Doors on Allenby Street',
      palette: 'dusk',
      motif: 'arches',
      kind: 'social',
      firstChoiceIndex: 2,
      episodeNumber: 9,
      seed: 99_909,
      endingTitle: 'The Open Door',
      closingLine: "You knocked. Somebody answered. That's the whole story.",
      notes: ['the florist knows everyone by their dog', 'free lemons on a windowsill', 'a sign that just says NO'],
      choiceLabels: ['Knock on the middle one'],
      narrator: 'The Neighbourhood Committee',
      minutes: 63,
    }),
  },
  {
    name: 'paper · maze · w3 · detective (light, long title, 4 notes)',
    input: v({
      title: 'A Field Guide to Things That Hum After Midnight',
      palette: 'paper',
      motif: 'maze',
      kind: 'detective',
      weirdness: 3,
      episodeNumber: 15,
      seed: 15_015,
      endingTitle: 'The Night Shift',
      closingLine: 'The hum was the fridge. The mystery was you, awake and paying attention.',
      notes: [
        'the streetlight that flickers in morse',
        'a cat with a schedule',
        'someone practising trumpet at 11:48',
        'the fridge, obviously',
      ],
      choiceLabels: ['Follow the sound', 'Write it down'],
      alternatesUsed: 2,
      narrator: 'The Insomniac Society',
      minutes: 92,
    }),
  },
  {
    name: 'cobalt · stripes · w2 · game',
    input: v({
      title: 'Blue Hour Gambit',
      palette: 'cobalt',
      motif: 'stripes',
      kind: 'game',
      firstChoiceIndex: 1,
      episodeNumber: 6,
      seed: 6_066,
      endingTitle: 'Checkmate in Three Streets',
      closingLine: 'The board was the neighbourhood. You were never a pawn.',
      notes: ['a chalk hopscotch with eleven squares'],
      choiceLabels: ['Sacrifice the shortcut'],
      source: 'ai',
      narrator: 'The Grandmaster of the Bench',
      minutes: 41,
    }),
  },
  {
    name: 'rose · orbits · w3 · social',
    input: v({
      title: 'The Orbit of Small Kindnesses',
      palette: 'rose',
      motif: 'orbits',
      kind: 'social',
      weirdness: 3,
      episodeNumber: 12,
      seed: 12_012,
      endingTitle: 'Gravity',
      closingLine: 'Everything you gave away came back around.',
      notes: ['a compliment for the bus driver', 'held the door for a stranger and their tuba'],
      choiceLabels: ['Pass it on'],
      seriesName: 'Tiny Heroics',
      narrator: 'The Universe (part-time)',
      minutes: 33,
    }),
  },
];

/** Every palette paired with a second motif, so each palette is seen twice and each motif twice. */
const SECOND: Sample[] = PALETTE_NAMES.map((palette, i) => {
  const motif = MOTIFS[(i + 5) % MOTIFS.length];
  const weirdness = (((i + 1) % 3) + 1) as Weirdness;
  return {
    name: `${palette} · ${motif} · w${weirdness}`,
    input: v({
      palette,
      motif,
      weirdness,
      kind: KINDS[i % KINDS.length],
      firstChoiceIndex: i % 3,
      seed: 2_000 + i * 7919,
      episodeNumber: 20 + i,
      title: ['Static on Channel Nine', 'The Bench Treaty', 'Lost & Found & Lost', 'Soft Launch', 'The Pigeon Accord'][i % 5],
      endingTitle: ['The Signal', 'Peace in Our Time', 'Finders Keepers', 'Encore', 'Truce'][i % 5],
      choiceLabels: [['Tune in', 'Stay'], ['Sign it'], ['Keep it'], ['Go big'], ['Negotiate']][i % 5],
    }),
  };
});

const WEIRDNESS: Sample[] = ([1, 2, 3] as Weirdness[]).map((weirdness) => ({
  name: `weirdness ${weirdness} (dusk · orbits)`,
  input: v({ palette: 'dusk', motif: 'orbits', weirdness, title: 'Gravity Assist', endingTitle: 'Slingshot', seed: 424_242 }),
}));

const CHOICE: Sample[] = [0, 1, 2].map((firstChoiceIndex) => ({
  name: `first choice ${firstChoiceIndex} (ember · arches)`,
  input: v({ palette: 'ember', motif: 'arches', firstChoiceIndex, title: 'Pick a Door', endingTitle: 'Behind Door Number One', seed: 31_337 }),
}));

const EDGE: Sample[] = [
  {
    name: 'longest title (56) + long closing',
    input: v({
      title: 'The Secret Society of People Who Wave at Passing Trains',
      palette: 'tide',
      motif: 'rays',
      closingLine:
        'You walked out looking for a story and walked back realising the story had been following you all week, politely, waiting for you to turn around and say hello.',
      notes: ['the 7:42 always honks twice'],
      seed: 56_056,
    }),
  },
  {
    name: 'one enormous word',
    input: v({ title: 'Supercalifragilisticexpialidociousness', palette: 'rose', motif: 'grid', seed: 38_038 }),
  },
  {
    name: '4 maximum-length notes',
    input: v({
      palette: 'cobalt',
      motif: 'maze',
      weirdness: 1,
      notes: [
        'a door painted exactly the wrong shade of blue, which somehow makes it the right one',
        'a mailbox from another century that still has a working flag and a very strong opinion',
        'the bakery clock runs four minutes fast and everyone in the street has quietly adjusted',
        'a cat on the third balcony who watches the street like it is paying the rent around here',
      ].map((n) => (n.length > 80 ? `${n.slice(0, 79).trimEnd()}…` : n)),
      seed: 4_444,
    }),
  },
  {
    name: 'long series + narrator (billing wraps)',
    input: v({
      palette: 'paper',
      motif: 'orbits',
      weirdness: 1,
      seriesName: 'The Extremely Long and Winding Chronicles of Me',
      narrator: 'The Department of Unofficial Municipal Wonders',
      source: 'ai',
      seed: 5_151,
    }),
  },
  {
    name: 'RTL notes + Hebrew series',
    input: v({
      palette: 'neon',
      motif: 'stripes',
      notes: ['דלת צבועה בכחול הלא נכון', 'תיבת דואר מהמאה הקודמת'],
      seriesName: 'העיר האיטית',
      seed: 7_777,
    }),
  },
  {
    name: 'minimal (no notes / series / narrator)',
    input: v({
      title: 'Untitled Walk',
      palette: 'citrus',
      motif: 'waves',
      weirdness: 3,
      notes: [],
      seriesName: null,
      narrator: undefined,
      endingTitle: 'Fin',
      closingLine: 'Nothing happened. It was great.',
      episodeNumber: 123,
      minutes: 240,
      alternatesUsed: 3,
      seed: 1,
    }),
  },
];

const SECTIONS: { title: string; note: string; samples: Sample[]; width: number }[] = [
  { title: 'Hero set', note: 'one per palette, each with its own motif', samples: HERO, width: 540 },
  { title: 'Second pass', note: 'every palette again, with a different motif and weirdness', samples: SECOND, width: 540 },
  { title: 'Weirdness 1 · 2 · 3', note: 'same episode, calm → chaotic', samples: WEIRDNESS, width: 540 },
  { title: 'First choice 0 · 1 · 2', note: 'composition follows the door you picked', samples: CHOICE, width: 540 },
  { title: 'Edge cases', note: 'long, short, empty and RTL content', samples: EDGE, width: 540 },
];

export function matrixInputs(): PosterInput[] {
  const out: PosterInput[] = [];
  PALETTE_NAMES.forEach((palette: PaletteName, p) => {
    MOTIFS.forEach((motif: Motif, mi) => {
      out.push(
        v({
          palette,
          motif,
          weirdness: (((p + mi) % 3) + 1) as Weirdness,
          firstChoiceIndex: (p * 3 + mi) % 3,
          kind: KINDS[(p + mi) % KINDS.length] as Kind,
          alternatesUsed: (p + 2 * mi) % 3,
          seed: 10_000 + p * 101 + mi * 13,
          episodeNumber: p * 10 + mi + 1,
        }),
      );
    });
  });
  return out;
}

// ── page ──────────────────────────────────────────────────────────────

function el<K extends keyof HTMLElementTagNameMap>(tag: K, className?: string, text?: string): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

async function card(sample: Sample, width: number): Promise<HTMLElement> {
  const wrap = el('figure', 'card');
  const t0 = performance.now();
  const canvas = await renderPosterCanvas(sample.input, { width });
  const ms = performance.now() - t0;
  canvas.className = 'poster';
  canvas.setAttribute('role', 'img');
  canvas.setAttribute('aria-label', `${sample.input.title} poster`);
  const cap = el('figcaption');
  cap.append(el('span', 'name', sample.name), el('span', 'ms', `${ms.toFixed(0)} ms @${width}`));
  const button = el('button', 'download', 'Download PNG');
  button.type = 'button';
  button.addEventListener('click', async () => {
    button.disabled = true;
    try {
      const blob = await posterToBlob(sample.input);
      downloadBlob(blob, posterFileName(sample.input));
    } finally {
      button.disabled = false;
    }
  });
  cap.append(button);
  wrap.append(canvas, cap);
  return wrap;
}

async function build(): Promise<void> {
  const root = document.getElementById('lab');
  if (!root) return;
  await ensurePosterFonts(SECTIONS.flatMap((s) => s.samples.map((x) => posterText(x.input))).join(' '));
  const status = document.getElementById('status');
  for (const section of SECTIONS) {
    const sec = el('section');
    sec.append(el('h2', '', section.title), el('p', 'note', section.note));
    const gridEl = el('div', 'grid');
    sec.append(gridEl);
    root.append(sec);
    for (const sample of section.samples) gridEl.append(await card(sample, section.width));
  }
  const matrix = el('section');
  matrix.append(el('h2', '', 'Matrix · 10 palettes × 10 motifs'), el('p', 'note', 'rows = palettes, columns = motifs'));
  const mgrid = el('div', 'matrix');
  matrix.append(mgrid);
  root.append(matrix);
  for (const input of matrixInputs()) {
    const c = await renderPosterCanvas(input, { width: 216 });
    c.className = 'thumb';
    c.title = `${input.palette} · ${input.motif} · w${input.weirdness} · choice ${input.firstChoiceIndex} · ${input.kind}`;
    mgrid.append(c);
  }
  if (status) status.textContent = `fonts ready: ${posterFontsReady() ? 'yes' : 'NO'} · ${document.querySelectorAll('canvas').length} posters`;
}

// ── QA hooks (Playwright) ─────────────────────────────────────────────

export interface PosterLabApi {
  ready: boolean;
  error: string | null;
  base: PosterInput;
  samples: Sample[];
  matrix: () => PosterInput[];
  fontsReady: () => boolean;
  /** PNG from posterToBlob, base64-encoded, plus timing. */
  png: (input?: PosterInput, width?: number) => Promise<{ base64: string; bytes: number; ms: number; type: string }>;
  dataURL: (input: PosterInput, width?: number) => Promise<string>;
  /** Draw on a fresh 1080 canvas; returns draw time (incl. a pixel read-back to flush) and the layout. */
  time: (input: PosterInput, width?: number) => Promise<{ drawMs: number; layout: PosterLayout }>;
  fileName: (input: PosterInput) => string;
  /** posterInputFromEpisode, for contract checks with synthetic episodes. */
  fromEpisode: (ep: CompletedEpisode, seriesName: string | null) => PosterInput;
  /** Local-time epoch ms for a calendar date (so date checks are timezone-proof). */
  localTime: (y: number, monthIndex: number, d: number, h: number) => number;
}

async function blobToBase64(blob: Blob): Promise<string> {
  const buf = new Uint8Array(await blob.arrayBuffer());
  let bin = '';
  for (let i = 0; i < buf.length; i += 0x8000) bin += String.fromCharCode(...buf.subarray(i, i + 0x8000));
  return btoa(bin);
}

const api: PosterLabApi = {
  ready: false,
  error: null,
  base: BASE,
  samples: [...HERO, ...SECOND, ...WEIRDNESS, ...CHOICE, ...EDGE],
  matrix: matrixInputs,
  fontsReady: posterFontsReady,
  async png(input = BASE, width = POSTER_WIDTH) {
    const t0 = performance.now();
    const blob = await posterToBlob(input, { width });
    const ms = performance.now() - t0;
    return { base64: await blobToBase64(blob), bytes: blob.size, ms, type: blob.type };
  },
  dataURL: (input, width = POSTER_WIDTH) => posterToDataURL(input, { width }),
  async time(input, width = POSTER_WIDTH) {
    await ensurePosterFonts(posterText(input));
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = Math.round((width * POSTER_HEIGHT) / POSTER_WIDTH);
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) throw new Error('no 2d context');
    const t0 = performance.now();
    const layout = drawPosterWithLayout(ctx, input, canvas.width, canvas.height);
    ctx.getImageData(0, 0, 1, 1); // force rasterisation so the timing is honest
    const drawMs = performance.now() - t0;
    canvas.width = 0;
    canvas.height = 0;
    return { drawMs, layout };
  },
  fileName: (input) => posterFileName(input),
  fromEpisode: (ep, seriesName) => posterInputFromEpisode(ep, seriesName),
  localTime: (y, monthIndex, d, h) => new Date(y, monthIndex, d, h).getTime(),
};

declare global {
  interface Window {
    posterLab?: PosterLabApi;
  }
}

window.posterLab = api;
build()
  .then(() => {
    api.ready = true;
  })
  .catch((err: unknown) => {
    api.error = err instanceof Error ? `${err.message}\n${err.stack ?? ''}` : String(err);
    api.ready = true;
    const status = document.getElementById('status');
    if (status) status.textContent = `ERROR: ${api.error}`;
  });
