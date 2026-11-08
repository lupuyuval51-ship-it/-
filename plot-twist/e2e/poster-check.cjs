/**
 * Poster renderer check (real Chromium via the pre-installed Playwright).
 *
 * Starts nothing: expects a dev server serving the lab, e.g.
 *   npx vite --port 5199 --strictPort        (from plot-twist/)
 *   node e2e/poster-check.cjs
 *
 * Checks
 *   1. posterToBlob → valid PNG (signature, IHDR 1080×1620, CRCs, IEND)
 *   2. determinism (same input → identical data URL) and variation
 *      (seed / firstChoiceIndex / weirdness each change the image)
 *   3. every motif × palette renders without errors, < MAX_DRAW_MS at 1080 wide,
 *      text inside the safe margin, title ≤ 3 lines, text contrast
 *   4. screenshots of the lab + full-size posters → e2e/artifacts/ (dpr 1)
 */
'use strict';

const { chromium } = require('playwright');
const fs = require('node:fs');
const path = require('node:path');

const LAB_URL = process.env.POSTER_LAB_URL || 'http://localhost:5199/poster-lab.html';
const OUT = path.join(__dirname, 'artifacts');
const MAX_DRAW_MS = Number(process.env.POSTER_MAX_MS || 400);

let failures = 0;
const log = [];
function check(name, ok, detail = '') {
  if (!ok) failures++;
  const line = `${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`;
  log.push(line);
  console.log(line);
}

// ── PNG parsing ───────────────────────────────────────────────────────

const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();
function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function inspectPng(buf) {
  const SIG = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  const out = { signature: SIG.every((b, i) => buf[i] === b), chunks: [], crcOk: true };
  let off = 8;
  while (off + 12 <= buf.length) {
    const len = buf.readUInt32BE(off);
    const type = buf.toString('ascii', off + 4, off + 8);
    const body = buf.subarray(off + 4, off + 8 + len);
    const crc = buf.readUInt32BE(off + 8 + len);
    if (crc32(body) !== crc) out.crcOk = false;
    out.chunks.push(type);
    if (type === 'IHDR') {
      out.width = buf.readUInt32BE(off + 8);
      out.height = buf.readUInt32BE(off + 12);
      out.bitDepth = buf[off + 16];
      out.colorType = buf[off + 17];
    }
    off += 12 + len;
    if (type === 'IEND') break;
  }
  out.firstChunk = out.chunks[0];
  out.lastChunk = out.chunks[out.chunks.length - 1];
  return out;
}

// ── colour maths for the contrast check ───────────────────────────────

function hexToRgb(hex) {
  const h = hex.replace('#', '');
  const n = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function lum(hex) {
  const [r, g, b] = hexToRgb(hex).map((v) => {
    const s = v / 255;
    return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
function contrast(a, b) {
  const x = lum(a);
  const y = lum(b);
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}

function layoutProblems(layout) {
  const problems = [];
  const { safe } = layout;
  const tol = 0.75;
  for (const b of layout.boxes) {
    if (b.x < safe.x - tol || b.x + b.w > safe.x + safe.w + tol || b.y < safe.y - tol || b.y + b.h > safe.y + safe.h + tol) {
      problems.push(`"${b.text}" (${b.id}) outside safe area [${b.x.toFixed(1)},${b.y.toFixed(1)} ${b.w.toFixed(1)}×${b.h.toFixed(1)}]`);
    }
    const ratio = contrast(b.color, b.background);
    const min = b.size >= 40 * layout.scale ? 3 : 4.5;
    if (ratio < min) problems.push(`"${b.text}" (${b.id}) contrast ${ratio.toFixed(2)} < ${min}`);
  }
  const p = layout.plate;
  for (const b of layout.boxes) {
    const overlaps = b.x < p.x + p.w && b.x + b.w > p.x && b.y < p.y + p.h && b.y + b.h > p.y;
    if (overlaps) problems.push(`"${b.text}" (${b.id}) overlaps the art plate`);
  }
  if (layout.titleLines.length > 3) problems.push(`title has ${layout.titleLines.length} lines`);
  if (layout.motifError) problems.push(`motif error: ${layout.motifError}`);
  return problems;
}

// ── main ──────────────────────────────────────────────────────────────

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 1400, height: 1000 }, deviceScaleFactor: 1 });
  const page = await context.newPage();
  const pageErrors = [];
  page.on('pageerror', (e) => pageErrors.push(String(e && e.stack ? e.stack : e)));
  page.on('console', (msg) => {
    if (msg.type() === 'error') pageErrors.push(msg.text());
  });

  try {
    const resp = await page.goto(LAB_URL, { waitUntil: 'load', timeout: 60_000 });
    check('lab page loads', !!resp && resp.ok(), `${LAB_URL} → ${resp && resp.status()}`);
    await page.waitForFunction(() => window.posterLab && window.posterLab.ready === true, null, { timeout: 120_000 });
    const labError = await page.evaluate(() => window.posterLab.error);
    check('lab renders every sample without throwing', !labError, labError || '');
    check('poster web fonts are loaded (Fraunces, Instrument Sans, JetBrains Mono)', await page.evaluate(() => window.posterLab.fontsReady()));

    // 1) PNG validity
    const png = await page.evaluate(() => window.posterLab.png());
    const buf = Buffer.from(png.base64, 'base64');
    const info = inspectPng(buf);
    check('posterToBlob type is image/png', png.type === 'image/png', png.type);
    check('PNG signature 89 50 4E 47 0D 0A 1A 0A', info.signature, buf.subarray(0, 8).toString('hex'));
    check('first chunk is IHDR', info.firstChunk === 'IHDR', info.firstChunk);
    check('IHDR 1080 × 1620', info.width === 1080 && info.height === 1620, `${info.width} × ${info.height}, depth ${info.bitDepth}, colour type ${info.colorType}`);
    check('all chunk CRCs valid, ends with IEND', info.crcOk && info.lastChunk === 'IEND', `${info.chunks.length} chunks`);
    check('PNG size is reasonable (< 3 MB)', png.bytes < 3 * 1024 * 1024, `${(png.bytes / 1024).toFixed(0)} KB, render+encode ${png.ms.toFixed(0)} ms`);
    fs.writeFileSync(path.join(OUT, 'poster-base-1080.png'), buf);

    // 2) determinism + variation
    const det = await page.evaluate(async () => {
      const L = window.posterLab;
      const base = L.base;
      const a = await L.dataURL(base);
      const b = await L.dataURL({ ...base });
      const variants = {
        seed: await L.dataURL({ ...base, seed: base.seed + 1 }),
        firstChoiceIndex: await L.dataURL({ ...base, firstChoiceIndex: 1 }),
        weirdness: await L.dataURL({ ...base, weirdness: 3 }),
        alternatesUsed: await L.dataURL({ ...base, alternatesUsed: 2 }),
        choiceLabels: await L.dataURL({ ...base, choiceLabels: ['Invent the legend'] }),
      };
      const out = { same: a === b, length: a.length, differs: {} };
      for (const [k, url] of Object.entries(variants)) out.differs[k] = url !== a;
      return out;
    });
    check('determinism: same input → identical data URL', det.same, `${(det.length / 1024).toFixed(0)} KB data URL`);
    for (const [k, differs] of Object.entries(det.differs)) check(`variation: changing ${k} changes the image`, differs);

    // 3) every motif × palette — errors, timing, layout
    const matrix = await page.evaluate(async (max) => {
      const L = window.posterLab;
      const rows = [];
      for (const input of L.matrix()) {
        try {
          const { drawMs, layout } = await L.time(input, 1080);
          rows.push({ palette: input.palette, motif: input.motif, weirdness: input.weirdness, choice: input.firstChoiceIndex, drawMs, layout });
        } catch (e) {
          rows.push({ palette: input.palette, motif: input.motif, error: String(e && e.stack ? e.stack : e) });
        }
      }
      return { rows, max };
    }, MAX_DRAW_MS);
    const errored = matrix.rows.filter((r) => r.error);
    check('all 100 motif × palette combinations render without throwing', errored.length === 0, errored.map((r) => `${r.palette}/${r.motif}: ${r.error}`).join('; '));
    const timed = matrix.rows.filter((r) => !r.error);
    const times = timed.map((r) => r.drawMs).sort((a, b) => a - b);
    const slow = timed.filter((r) => r.drawMs >= MAX_DRAW_MS);
    const pct = (q) => times[Math.min(times.length - 1, Math.floor(q * times.length))] || 0;
    check(
      `every poster draws in < ${MAX_DRAW_MS} ms at 1080 wide`,
      slow.length === 0,
      `min ${times[0]?.toFixed(1)} · median ${pct(0.5).toFixed(1)} · p90 ${pct(0.9).toFixed(1)} · max ${times[times.length - 1]?.toFixed(1)} ms` +
        (slow.length ? ` · slow: ${slow.map((r) => `${r.palette}/${r.motif} ${r.drawMs.toFixed(0)}ms`).join(', ')}` : ''),
    );
    const byMotif = {};
    for (const r of timed) (byMotif[r.motif] = byMotif[r.motif] || []).push(r.drawMs);
    console.log('      per motif (mean ms): ' + Object.entries(byMotif).map(([k, v]) => `${k} ${(v.reduce((a, b) => a + b, 0) / v.length).toFixed(1)}`).join(' · '));
    const layoutIssues = [];
    for (const r of timed) for (const p of layoutProblems(r.layout)) layoutIssues.push(`${r.palette}/${r.motif}: ${p}`);
    check('matrix: text inside safe margin, off the plate, title ≤ 3 lines, contrast OK', layoutIssues.length === 0, layoutIssues.slice(0, 8).join(' | '));

    // Named samples (edge cases: long titles, long closing lines, notes, RTL…)
    const samples = await page.evaluate(async () => {
      const L = window.posterLab;
      const out = [];
      for (const s of L.samples) {
        const { drawMs, layout } = await L.time(s.input, 1080);
        out.push({ name: s.name, drawMs, layout });
      }
      return out;
    });
    const sampleIssues = [];
    for (const s of samples) for (const p of layoutProblems(s.layout)) sampleIssues.push(`${s.name}: ${p}`);
    check(`samples (${samples.length}): text inside safe margin, contrast, ≤ 3 title lines`, sampleIssues.length === 0, sampleIssues.slice(0, 8).join(' | '));
    for (const s of samples) {
      console.log(
        `      ${s.name.padEnd(58)} ${s.drawMs.toFixed(1).padStart(6)} ms · title ${s.layout.titleLines.length}×${s.layout.titleSize.toFixed(0)}px · plate ${(s.layout.plate.h / s.layout.height * 100).toFixed(0)}% · notes ${s.layout.notesShown} · closing ${s.layout.closingLines.length} lines`,
      );
    }

    // Layout safety at thumbnail and retina widths too (everything scales with width).
    const widths = await page.evaluate(async () => {
      const L = window.posterLab;
      const out = [];
      for (const width of [360, 2160]) {
        for (const s of L.samples.filter((_, i) => i % 4 === 0)) {
          const { layout } = await L.time(s.input, width);
          out.push({ name: `${s.name} @${width}`, layout });
        }
      }
      return out;
    });
    const widthIssues = [];
    for (const s of widths) for (const p of layoutProblems(s.layout)) widthIssues.push(`${s.name}: ${p}`);
    check(`layout holds at 360 px and 2160 px wide (${widths.length} renders)`, widthIssues.length === 0, widthIssues.slice(0, 6).join(' | '));

    // Seeded fuzz: random lengths and content across every palette / motif / weirdness / kind / width.
    const fuzz = await page.evaluate(async () => {
      const L = window.posterLab;
      let a = 0x2f6b3b;
      const rnd = () => {
        a = (a + 0x6d2b79f5) >>> 0;
        let t = a;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
      };
      const pick = (xs) => xs[Math.floor(rnd() * xs.length)];
      const words = ['the', 'of', 'a', 'Secret', 'Pigeon', 'Treaty', 'Midnight', 'Walk', 'Extraordinarily', 'Unbelievable', 'café', 'Ø', 'and', 'Tiny', 'Odyssey', 'Hum', "Nobody's", '“quoted”', 'Supercalifragilisticexpialidocious', 'דלת', 'כחולה'];
      const sentence = (n) => Array.from({ length: n }, () => pick(words)).join(' ');
      const clip = (t, max) => (t.length > max ? t.slice(0, max) : t);
      const palettes = ['ember', 'noir', 'tide', 'neon', 'citrus', 'moss', 'dusk', 'paper', 'cobalt', 'rose'];
      const motifs = ['orbits', 'grid', 'rays', 'waves', 'shards', 'stairs', 'dots', 'arches', 'stripes', 'maze'];
      const kinds = ['detective', 'maker', 'wanderer', 'social', 'ritual', 'game'];
      const out = [];
      for (let i = 0; i < 120; i++) {
        const input = {
          ...L.base,
          title: clip(sentence(1 + Math.floor(rnd() * 9)), 56) || 'X',
          episodeNumber: Math.floor(rnd() * 400),
          seriesName: rnd() < 0.5 ? null : clip(sentence(1 + Math.floor(rnd() * 8)), 48),
          palette: pick(palettes),
          motif: pick(motifs),
          seed: Math.floor(rnd() * 4294967296),
          weirdness: 1 + Math.floor(rnd() * 3),
          kind: pick(kinds),
          endingTitle: clip(sentence(Math.floor(rnd() * 8)), 56),
          closingLine: clip(sentence(Math.floor(rnd() * 34)), 180),
          notes: Array.from({ length: Math.floor(rnd() * 5) }, () => clip(sentence(1 + Math.floor(rnd() * 14)), 80)),
          choiceLabels: Array.from({ length: Math.floor(rnd() * 3) }, () => sentence(2)),
          firstChoiceIndex: Math.floor(rnd() * 3),
          alternatesUsed: Math.floor(rnd() * 4),
          minutes: 1 + Math.floor(rnd() * 240),
          source: rnd() < 0.5 ? 'ai' : 'curated',
          narrator: rnd() < 0.3 ? undefined : clip(sentence(1 + Math.floor(rnd() * 7)), 48),
        };
        const width = pick([360, 720, 1080, 1080, 1440]);
        try {
          const { drawMs, layout } = await L.time(input, width);
          out.push({ i, width, title: input.title, drawMs, layout });
        } catch (e) {
          out.push({ i, width, title: input.title, error: String(e && e.stack ? e.stack : e) });
        }
      }
      return out;
    });
    const fuzzIssues = [];
    for (const f of fuzz) {
      if (f.error) fuzzIssues.push(`#${f.i} "${f.title}" threw: ${f.error}`);
      else for (const p of layoutProblems(f.layout)) fuzzIssues.push(`#${f.i} @${f.width} "${f.title}": ${p}`);
    }
    const fuzzMax = Math.max(...fuzz.filter((f) => !f.error).map((f) => f.drawMs));
    check(`fuzz: ${fuzz.length} random posters render inside the safe area with legible contrast`, fuzzIssues.length === 0, fuzzIssues.slice(0, 6).join(' | ') || `max ${fuzzMax.toFixed(1)} ms`);

    // File name contract
    const names = await page.evaluate(() => {
      const L = window.posterLab;
      return [
        L.fileName(L.base),
        L.fileName({ ...L.base, title: '¡Café & Crème: Part II!', episodeNumber: 123 }),
        L.fileName({ ...L.base, title: 'העיר האיטית', episodeNumber: 7 }),
      ];
    });
    check('posterFileName', names[0] === 'plot-twist-ep04-the-undercover-tourist.png', names[0]);
    check(
      'posterFileName slugs accents/symbols and falls back for non-Latin titles',
      names[1] === 'plot-twist-ep123-cafe-and-creme-part-ii.png' && names[2] === 'plot-twist-ep07-episode.png',
      `${names[1]} · ${names[2]}`,
    );

    // posterInputFromEpisode contract (synthetic episodes)
    const mapped = await page.evaluate(() => {
      const L = window.posterLab;
      const award = { points: { curiosity: 2, creativity: 1, boldness: 1, connection: 0 }, lines: [] };
      const prefs = { minutes: 30, budget: 0, setting: 'outside', company: 'solo', mood: 'curious', weirdness: 2 };
      const step = (stage, nodeId, extra) => ({ stage, nodeId, title: nodeId, action: 'do the thing', usedAlternative: false, ...extra });
      const curated = {
        id: 'run-qa-1', episodeNumber: 4, adventureId: 'undercover-tourist', source: 'curated', title: 'The Undercover Tourist',
        tagline: 't', kind: 'detective', palette: 'ember', motif: 'grid', weirdness: 2, narrator: 'The Tourist Board (unofficial)',
        minutesEstimate: 30, prefs, startedAt: L.localTime(2026, 10, 8, 11), completedAt: L.localTime(2026, 10, 8, 12),
        elapsedMs: 31.4 * 60000,
        steps: [
          step(1, 'arrive', { choicePrompt: 'How?', choiceLabel: 'Invent the legend', note: '  a door \n painted   the wrong blue ' }),
          step(2, 'legend-maker', { usedAlternative: true, note: 'The Lamp Post That Saw Too Much' }),
          step(3, 'gift-shop', { usedAlternative: true, note: '' }),
        ],
        endingId: 'unofficial-historian', endingTitle: 'The Unofficial Historian', twist: 'x', closingLine: 'Leaf, c. this morning.',
        notes: { detail: 'a door painted the wrong blue', legend: 'The Lamp Post That Saw Too Much', a: 'one', b: 'two', c: 'three' },
        award, journal: '', posterSeed: 123456,
      };
      const ai = {
        ...curated, id: 'run-qa-2', adventureId: 'ai-something-1a2b', source: 'ai', narrator: undefined,
        steps: [step(1, 's1', { choiceLabel: 'Go left' }), step(2, 's2-b'), step(3, 's3-b')], notes: {}, elapsedMs: 5000,
      };
      const unknown = { ...curated, id: 'run-qa-3', adventureId: 'no-such-adventure', steps: [step(1, 'n1', { choiceLabel: 'Hm' }), step(2, 'n2')] };
      return {
        curated: L.fromEpisode(curated, '  The   Slow City '),
        ai: L.fromEpisode(ai, null),
        unknown: L.fromEpisode(unknown, ''),
      };
    });
    const c = mapped.curated;
    check(
      'fromEpisode: date (local), minutes, seed, series, narrator',
      c.dateISO === '2026-11-08' && c.minutes === 31 && c.seed === 123456 && c.seriesName === 'The Slow City' && c.narrator === 'The Tourist Board (unofficial)',
      `${c.dateISO} · ${c.minutes} min · seed ${c.seed} · "${c.seriesName}" · ${c.narrator}`,
    );
    check(
      'fromEpisode: notes cleaned, de-duplicated, ≤ 4, path order first',
      JSON.stringify(c.notes) === JSON.stringify(['a door painted the wrong blue', 'The Lamp Post That Saw Too Much', 'one', 'two']),
      JSON.stringify(c.notes),
    );
    check(
      'fromEpisode: choice labels, alternates, first-choice index from the curated library',
      JSON.stringify(c.choiceLabels) === '["Invent the legend"]' && c.alternatesUsed === 2 && c.firstChoiceIndex === 1,
      `${JSON.stringify(c.choiceLabels)} · alternates ${c.alternatesUsed} · index ${c.firstChoiceIndex}`,
    );
    check('fromEpisode: AI topology (s2-b → 1), min 1 minute, null series', mapped.ai.firstChoiceIndex === 1 && mapped.ai.minutes === 1 && mapped.ai.seriesName === null && !('narrator' in mapped.ai), JSON.stringify({ i: mapped.ai.firstChoiceIndex, m: mapped.ai.minutes }));
    check('fromEpisode: unknown adventure → index 0, blank series → null', mapped.unknown.firstChoiceIndex === 0 && mapped.unknown.seriesName === null);

    // 4) screenshots + full-size posters
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({ path: path.join(OUT, 'poster-lab-full.png'), fullPage: true });
    const sections = await page.$$('section');
    for (let i = 0; i < sections.length; i++) {
      await sections[i].screenshot({ path: path.join(OUT, `poster-lab-section-${i + 1}.png`) });
    }
    const exportNames = [];
    const picks = await page.evaluate(() => window.posterLab.samples.map((s, i) => ({ i, name: s.name })));
    const wanted = picks.filter((p) => /^(ember · grid|noir · shards|citrus · rays|moss · stairs|paper · maze|neon · dots|dusk · arches|rose · orbits|tide · waves|cobalt · stripes)|longest title|RTL|minimal/.test(p.name));
    for (const p of wanted) {
      const res = await page.evaluate(async (i) => {
        const L = window.posterLab;
        return L.png(L.samples[i].input, 1080);
      }, p.i);
      const file = `poster-${p.name.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase()}.png`;
      fs.writeFileSync(path.join(OUT, file), Buffer.from(res.base64, 'base64'));
      exportNames.push(`${file} (${(res.bytes / 1024).toFixed(0)} KB, ${res.ms.toFixed(0)} ms)`);
    }
    console.log(`      wrote ${exportNames.length} full-size posters:\n        ${exportNames.join('\n        ')}`);

    check('no page errors', pageErrors.length === 0, pageErrors.slice(0, 5).join(' | '));
  } catch (err) {
    check('poster check ran to completion', false, String(err && err.stack ? err.stack : err));
  } finally {
    await browser.close();
  }

  fs.writeFileSync(path.join(OUT, 'poster-check.log'), `${log.join('\n')}\n`);
  console.log(`\n${failures === 0 ? 'ALL POSTER CHECKS PASSED' : `${failures} POSTER CHECK(S) FAILED`}`);
  process.exit(failures === 0 ? 0 : 1);
})();
