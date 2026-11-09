/**
 * Accessibility and layout regression checks from the third independent QA round, against the
 * PRODUCTION build without an AI key (run-all's "curated" server):
 *
 *   import { a11yRound3Suite } from './a11ySuite.mjs';
 *   await a11yRound3Suite(browser, 'http://127.0.0.1:8790/', check);
 *
 * Covers: the envelope focus ring (pixel-sampled against the page in every vibe), the letter's
 * actions in short viewports, the home dock at 200–400% zoom, the marquee pause control, chip
 * radios inside their own chips, forced-colors backgrounds, the "Main character energy" chip
 * colours and press feedback, the envelope header at 320px, and the busy-button look.
 *
 * Each section runs on its own: one that crashes is reported as a failed check, and the rest
 * still run. Pixel checks decode Playwright's PNG screenshots in Node (zlib, no dependencies).
 * The optional 4th argument `{ artifacts }` changes where screenshots go (default e2e/artifacts).
 */
import { inflateSync } from 'node:zlib';
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const DEFAULT_ART = join(dirname(fileURLToPath(import.meta.url)), 'artifacts');
const VIBES = { 1: 'chill', 2: 'surprise', 3: 'main' };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Minimal PNG decoder for Playwright screenshots: 8-bit RGB or RGBA, not interlaced. */
function decodePng(buf) {
  let pos = 8;
  let width = 0;
  let height = 0;
  let colorType = 0;
  const idat = [];
  while (pos < buf.length) {
    const len = buf.readUInt32BE(pos);
    const type = buf.toString('ascii', pos + 4, pos + 8);
    const data = buf.subarray(pos + 8, pos + 8 + len);
    if (type === 'IHDR') {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      colorType = data[9];
      if (data[8] !== 8 || data[12] !== 0 || (colorType !== 2 && colorType !== 6)) throw new Error(`unsupported PNG (depth ${data[8]}, color type ${colorType}, interlace ${data[12]})`);
    } else if (type === 'IDAT') idat.push(data);
    else if (type === 'IEND') break;
    pos += 12 + len;
  }
  const bpp = colorType === 6 ? 4 : 3;
  const stride = width * bpp;
  const raw = inflateSync(Buffer.concat(idat));
  const out = Buffer.alloc(height * stride);
  for (let y = 0; y < height; y++) {
    const filter = raw[y * (stride + 1)];
    const line = raw.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1));
    const cur = out.subarray(y * stride, (y + 1) * stride);
    const prev = y > 0 ? out.subarray((y - 1) * stride, y * stride) : null;
    for (let x = 0; x < stride; x++) {
      const a = x >= bpp ? cur[x - bpp] : 0;
      const b = prev ? prev[x] : 0;
      const c = prev && x >= bpp ? prev[x - bpp] : 0;
      let v = line[x];
      if (filter === 1) v += a;
      else if (filter === 2) v += b;
      else if (filter === 3) v += (a + b) >> 1;
      else if (filter === 4) {
        const p = a + b - c;
        const pa = Math.abs(p - a);
        const pb = Math.abs(p - b);
        const pc = Math.abs(p - c);
        v += pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
      }
      cur[x] = v & 255;
    }
  }
  const px = (x, y) => {
    const i = (Math.min(height - 1, Math.max(0, y)) * width + Math.min(width - 1, Math.max(0, x))) * bpp;
    return [out[i], out[i + 1], out[i + 2]];
  };
  return { width, height, px };
}

function luminance(rgb) {
  const [r, g, b] = rgb.map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
function contrast(a, b) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}
const fmt = (n) => (Math.round(n * 100) / 100).toFixed(2);

async function setVibe(page, weirdness) {
  await page.locator('input.dial').fill(String(weirdness));
  await page.waitForFunction((v) => document.documentElement.dataset.vibe === v, VIBES[weirdness]);
}

async function drawEnvelopes(page) {
  await page.getByRole('button', { name: /give me a plot twist/i }).click();
  await page.waitForURL(/#\/envelopes/);
  await page.locator('button.envelope').nth(2).waitFor();
}

/** Tabs until `test()` holds in the page (keyboard focus, so :focus-visible applies). */
async function tabTo(page, test, max = 20) {
  for (let i = 0; i < max; i++) {
    await page.keyboard.press('Tab');
    if (await page.evaluate(test)) return true;
  }
  return false;
}

const trackX = (page) =>
  page.evaluate(() => {
    const t = getComputedStyle(document.querySelector('.marquee-track')).transform;
    return t === 'none' ? 0 : new DOMMatrix(t).m41;
  });

/**
 * Max contrast against the page found left of the focused envelope's edge, at its mid-height
 * (where the ring is drawn, outside the card), and the page colour it was measured against.
 */
async function ringContrastLeftOfFocus(page) {
  // A hovered envelope straightens up (.envelope:hover): keep the pointer off the cards.
  await page.mouse.move(1, 1);
  await page.evaluate(() => document.activeElement.scrollIntoView({ block: 'center' }));
  await sleep(150);
  const geo = await page.evaluate(() => {
    const el = document.activeElement;
    const r = el.getBoundingClientRect();
    const t = getComputedStyle(el).transform;
    const m = t === 'none' ? new DOMMatrix() : new DOMMatrix(t);
    const angle = Math.atan2(m.b, m.a);
    const half = el.offsetWidth / 2;
    // The card's left edge at its own mid-height (cards are tilted in some vibes).
    return { edgeX: r.left + r.width / 2 - half * Math.cos(angle), edgeY: r.top + r.height / 2 - half * Math.sin(angle) };
  });
  const png = decodePng(await page.screenshot());
  const y = Math.round(geo.edgeY);
  const pageColor = [0, 1, 2].map((k) => Math.round([2, 3, 4].reduce((s, x) => s + [-2, 0, 2].reduce((t, dy) => t + png.px(x, y + dy)[k], 0), 0) / 9));
  let best = { c: 1, rgb: pageColor, x: 0 };
  for (let x = 5; x <= Math.floor(geo.edgeX) - 2; x++) {
    for (let dy = -3; dy <= 3; dy++) {
      const rgb = png.px(x, y + dy);
      const c = contrast(rgb, pageColor);
      if (c > best.c) best = { c, rgb, x };
    }
  }
  return { ...best, pageColor, edgeX: Math.round(geo.edgeX) };
}

export async function a11yRound3Suite(browser, baseUrl, check, { artifacts = DEFAULT_ART } = {}) {
  console.log('\n▶ a11y round 3 (focus rings, short viewports, marquee, chips, forced colors)');
  const base = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
  mkdirSync(artifacts, { recursive: true });

  const open = new Set();
  const newContext = async (options) => {
    const ctx = await browser.newContext({ deviceScaleFactor: 1, ...options });
    open.add(ctx);
    return ctx;
  };
  /** A phone (isMobile + hasTouch) with an empty series, on the home screen. */
  const freshPage = async ({ width = 390, height = 844, ...options } = {}) => {
    const ctx = await newContext({ viewport: { width, height }, isMobile: true, hasTouch: true, reducedMotion: 'reduce', ...options });
    const page = await ctx.newPage();
    await page.goto(base, { waitUntil: 'networkidle' });
    await page.evaluate(() => localStorage.clear());
    await page.reload({ waitUntil: 'networkidle' });
    return page;
  };
  const section = async (name, run) => {
    try {
      await run();
    } catch (err) {
      check(`${name}: crashed`, false, String(err?.message ?? err).split('\n')[0]);
    } finally {
      for (const ctx of open) await ctx.close().catch(() => {});
      open.clear();
    }
  };

  // 1. Envelope focus ring: drawn outside the card on the ink page, ≥ 3:1 in every vibe.
  for (const w of [1, 2, 3]) {
    const vibe = VIBES[w];
    await section(`${vibe} envelope ring`, async () => {
      const page = await freshPage();
      await setVibe(page, w);
      await drawEnvelopes(page);
      await page.locator('main h1').focus();
      const reached = await tabTo(page, () => /^Envelope B/.test(document.activeElement?.getAttribute('aria-label') ?? ''));
      const visible = await page.evaluate(() => document.activeElement.matches(':focus-visible'));
      const ring = await ringContrastLeftOfFocus(page);
      await page.screenshot({ path: join(artifacts, `a3-envelope-ring-${vibe}.png`) });
      await page.locator('main h1').focus();
      const unfocused = await ringContrastLeftOfFocus(page);
      check(
        `${vibe}: a keyboard-focused envelope has a ring ≥ 3:1 against the page`,
        reached && visible && ring.c >= 3 && unfocused.c < 1.5,
        `ring rgb(${ring.rgb}) vs page rgb(${ring.pageColor}) = ${fmt(ring.c)}:1 at x=${ring.x} (card edge ${ring.edgeX}); unfocused ${fmt(unfocused.c)}:1`,
      );
    });
  }

  // 2. The letter: in short viewports its actions end the letter instead of covering it, so the
  //    focused title is fully visible; tall phones keep the sticky thumb-zone actions.
  for (const [width, height] of [[640, 360], [568, 320], [320, 256], [390, 844]]) {
    const tall = height > 600;
    const name = tall ? `letter ${width}×${height}: actions stay sticky in the thumb zone` : `letter ${width}×${height}: the focused title is fully visible, not under the actions`;
    await section(name, async () => {
      const page = await freshPage({ width, height });
      await drawEnvelopes(page);
      await page.locator('button.envelope').first().focus();
      await page.keyboard.press('Enter');
      await page.getByRole('dialog').waitFor();
      await page.waitForFunction(() => document.activeElement?.tagName === 'H3', null, { timeout: 3000 }).catch(() => {});
      // The sheet rises (and the letter fades up) before it is measured.
      await page.waitForFunction(() => document.querySelector('[role=dialog]').getAnimations({ subtree: true }).every((a) => a.playState === 'finished'), null, { timeout: 3000 }).catch(() => {});
      const m = await page.evaluate(() => {
        const dialog = document.querySelector('[role=dialog]');
        const d = dialog.getBoundingClientRect();
        const h3 = document.activeElement;
        const h = h3.getBoundingClientRect();
        const barEl = dialog.querySelector('.letter-actions');
        if (!barEl) return { missing: 'no .letter-actions in the letter' };
        const bar = barEl.getBoundingClientRect();
        const points = [[h.left + 4, h.top + 4], [h.left + h.width / 2, h.top + h.height / 2], [h.right - 4, h.bottom - 4]];
        const uncovered = points.every(([x, y]) => {
          const hit = document.elementFromPoint(x, y);
          return hit === h3 || h3.contains(hit);
        });
        return { tag: h3.tagName, sheet: [d.top, d.bottom].map(Math.round), title: [h.top, h.bottom].map(Math.round), bar: [bar.top, bar.bottom].map(Math.round), position: getComputedStyle(barEl).position, uncovered };
      });
      const inSheet = !m.missing && m.title[0] >= m.sheet[0] && m.title[1] <= m.sheet[1];
      const clearOfBar = !m.missing && (m.title[1] <= m.bar[0] || m.title[0] >= m.bar[1]);
      const position = tall ? m.position === 'sticky' : m.position === 'static';
      check(name, m.tag === 'H3' && inSheet && clearOfBar && m.uncovered && position, JSON.stringify(m));
      if (width === 640) await page.screenshot({ path: join(artifacts, 'a3-letter-640x360.png') });
    });
  }

  // 3. The home dock at 200–400% zoom: it ends the form instead of covering the screen, and an
  //    episode in progress can be resumed from its card.
  for (const [width, height] of [[640, 360], [320, 256]]) {
    const name = `home ${width}×${height}: the dock flows at the end of the form (no fixed overlay)`;
    await section(name, async () => {
      const page = await freshPage({ width, height });
      const fresh = await page.evaluate(() => ({ position: getComputedStyle(document.querySelector('.dock')).position, sw: document.documentElement.scrollWidth }));
      await drawEnvelopes(page);
      await page.locator('button.envelope').first().click();
      await page.getByRole('button', { name: /start episode/i }).click();
      await page.waitForURL(/#\/play/);
      await page.getByRole('button', { name: /save & exit/i }).click();
      await page.waitForURL(/#\/$/);
      await page.locator('[aria-label="Episode in progress"]').waitFor();
      const run = await page.evaluate(() => {
        const shown = (el) => getComputedStyle(el).display !== 'none';
        const resume = [...document.querySelectorAll('main button')].filter((b) => /^Resume Episode/.test(b.textContent.trim()) && shown(b));
        return { position: getComputedStyle(document.querySelector('.dock')).position, resume: resume.map((b) => (b.closest('.dock') ? 'dock' : 'card')) };
      });
      check(
        name,
        fresh.position === 'static' && run.position === 'static' && fresh.sw <= width && run.resume.length === 1 && run.resume[0] === 'card',
        `fresh ${fresh.position}, with a run ${run.position}, Resume shown on: ${run.resume.join(', ') || 'nothing'}`,
      );
    });
  }

  // 4. Marquee: Play resumes at once while the button keeps focus; no toggle where it never moves.
  await section('marquee', async () => {
    const page = await freshPage({ reducedMotion: 'no-preference' });
    const toggle = page.locator('.marquee button');
    await toggle.tap();
    await sleep(250);
    const p1 = await trackX(page);
    await sleep(700);
    const p2 = await trackX(page);
    const pausedLabel = await toggle.getAttribute('aria-label');
    check('marquee: Pause stops the titles', p1 === p2 && pausedLabel === 'Play the title marquee', `${fmt(p1)} → ${fmt(p2)}, "${pausedLabel}"`);
    await toggle.tap();
    const focused = await page.evaluate(() => document.activeElement === document.querySelector('.marquee button'));
    const a = await trackX(page);
    await sleep(1000);
    const b = await trackX(page);
    check('marquee: Play resumes at once while the button keeps focus', focused && Math.abs(b - a) > 5, `focused ${focused}, track ${fmt(a)} → ${fmt(b)} in 1 s`);

    // Keyboard: focusing the control no longer pauses; its ring is inside the button, unclipped.
    await page.locator('header button[aria-label^="My Series"]').focus();
    await page.keyboard.press('Tab');
    const kb = await page.evaluate(() => {
      const el = document.activeElement;
      // The marquee clips without being a scroll container, so nothing can carry the button away.
      el.scrollIntoView({ block: 'nearest', inline: 'start' });
      const cs = getComputedStyle(el);
      const r = el.getBoundingClientRect();
      const hit = document.elementFromPoint(r.right - 2, r.top + r.height / 2);
      return { onToggle: el === document.querySelector('.marquee button'), visible: el.matches(':focus-visible'), inside: parseFloat(cs.outlineOffset) + parseFloat(cs.outlineWidth) <= 0, rightEdgeHit: hit === el || el.contains(hit), atRightEdge: Math.round(r.right) === innerWidth, right: r.right, cy: r.top + r.height / 2 };
    });
    const k1 = await trackX(page);
    await sleep(800);
    const k2 = await trackX(page);
    const png = decodePng(await page.screenshot());
    const ringPx = png.px(Math.round(kb.right) - 3, Math.round(kb.cy));
    const fillPx = png.px(Math.round(kb.right) - 9, Math.round(kb.cy));
    check(
      'marquee: keyboard focus keeps it moving and shows the whole ring (inset, ≥ 3:1)',
      kb.onToggle && kb.visible && kb.inside && kb.rightEdgeHit && kb.atRightEdge && Math.abs(k2 - k1) > 3 && contrast(ringPx, fillPx) >= 3,
      `track ${fmt(k1)} → ${fmt(k2)}, ring right side rgb(${ringPx}) vs rgb(${fillPx}) = ${fmt(contrast(ringPx, fillPx))}:1, ${JSON.stringify(kb)}`,
    );

    await setVibe(page, 1);
    await sleep(200);
    const c1 = await trackX(page);
    await sleep(800);
    const c2 = await trackX(page);
    const display = await page.evaluate(() => getComputedStyle(document.querySelector('.marquee button')).display);
    await page.locator('header button[aria-label^="My Series"]').focus();
    await page.keyboard.press('Tab');
    const tabStop = await page.evaluate(() => document.activeElement === document.querySelector('.marquee button'));
    check('chill: the still marquee has no pause toggle (hidden, not a tab stop)', display === 'none' && !tabStop && c1 === c2, `toggle display ${display}, tab stop ${tabStop}, track ${fmt(c1)} → ${fmt(c2)}`);
  });
  await section('reduced motion marquee', async () => {
    const page = await freshPage({ reducedMotion: 'reduce' });
    const display = await page.evaluate(() => getComputedStyle(document.querySelector('.marquee button')).display);
    check('reduced motion: no pause toggle for the still marquee', display === 'none', `display ${display}`);
  });

  // 5. Chip groups: every hidden radio covers its own chip, so arrowing scrolls that chip into view.
  await section('chip radios', async () => {
    const page = await freshPage();
    const misplaced = await page.evaluate(() =>
      [...document.querySelectorAll('form input.chip-input')]
        .map((input) => {
          const i = input.getBoundingClientRect();
          const l = input.nextElementSibling.getBoundingClientRect();
          const inside = i.left >= l.left - 0.5 && i.right <= l.right + 0.5 && i.top >= l.top - 0.5 && i.bottom <= l.bottom + 0.5;
          return inside ? null : `${input.name}=${input.value} radio [${Math.round(i.left)},${Math.round(i.top)}] chip [${Math.round(l.left)},${Math.round(l.top)}]`;
        })
        .filter(Boolean),
    );
    const total = await page.locator('form input.chip-input').count();
    check('every chip radio sits inside its own chip', total >= 15 && misplaced.length === 0, misplaced.slice(0, 3).join(' | ') || `${total} radios`);
    // The reviewer's case: the Mood grid's first row just inside the area focus scrolls into
    // (above the scroll padding kept for the dock), its second row under the dock's button. Arrow
    // from "Curious" (row 1) to "Social" (row 2): the browser scrolls the focused radio into view,
    // which only helps if that radio is where its chip is.
    const start = await page.evaluate(() => {
      const curious = document.querySelector('input[name=mood][value=curious]');
      const roomBottom = innerHeight - parseFloat(getComputedStyle(document.documentElement).scrollPaddingBottom);
      window.scrollBy(0, curious.nextElementSibling.getBoundingClientRect().top - (roomBottom - 14));
      curious.focus({ preventScroll: true });
      const social = document.querySelector('input[name=mood][value=social]').nextElementSibling.getBoundingClientRect();
      return { socialBottom: Math.round(social.bottom), ctaTop: Math.round(document.querySelector('.dock button').getBoundingClientRect().top) };
    });
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowRight');
    await sleep(300);
    const seen = await page.evaluate(() => {
      const label = document.activeElement.nextElementSibling;
      const l = label.getBoundingClientRect();
      const cta = document.querySelector('.dock button').getBoundingClientRect();
      return { chip: label.textContent.trim(), top: Math.round(l.top), bottom: Math.round(l.bottom), ctaTop: Math.round(cta.top) };
    });
    check(
      'arrowing to a chip under the dock scrolls it into view',
      start.socialBottom > start.ctaTop && seen.chip === 'Social' && seen.top >= 0 && seen.bottom <= seen.ctaTop,
      `before: Social bottom ${start.socialBottom} vs dock button top ${start.ctaTop}; after: ${JSON.stringify(seen)}`,
    );
  });

  // 6. Forced colors: gradient-only backgrounds get an opaque Canvas.
  await section('forced colors', async () => {
    // Motion allowed, so the marquee toggle is shown.
    const page = await freshPage({ forcedColors: 'active', colorScheme: 'dark', reducedMotion: 'no-preference' });
    const alpha = (c) => (c.startsWith('rgba') ? parseFloat(c.split(',')[3]) : c.startsWith('rgb') ? 1 : 0);
    const scene = await page.evaluate(() => ({ dock: getComputedStyle(document.querySelector('.dock')).backgroundColor, toggle: getComputedStyle(document.querySelector('.marquee button')).backgroundColor }));
    check('forced colors: the dock has an opaque background', alpha(scene.dock) === 1, scene.dock);
    await drawEnvelopes(page);
    await page.locator('button.envelope').first().click();
    await page.getByRole('dialog').waitFor();
    const letter = await page.evaluate(() => {
      const bar = document.querySelector('[role=dialog] .letter-actions');
      return bar ? getComputedStyle(bar).backgroundColor : 'no .letter-actions';
    });
    check('forced colors: the letter actions and the marquee toggle are opaque', alpha(letter) === 1 && alpha(scene.toggle) === 1, `letter ${letter}, toggle ${scene.toggle}`);
  });

  // 7. Main character energy: colours by question, and the tilt combines with the press scale.
  await section('main vibe chips', async () => {
    // A mouse (for :active), and reduced motion so colour and scale transitions finish at once.
    const ctx = await newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
    const page = await ctx.newPage();
    await page.goto(base, { waitUntil: 'networkidle' });
    await page.evaluate(() => localStorage.clear());
    await page.reload({ waitUntil: 'networkidle' });
    await setVibe(page, 3);
    await sleep(100);
    const colours = await page.evaluate(() =>
      Object.fromEntries(['minutes', 'budget', 'setting', 'company', 'mood'].map((n) => [n, getComputedStyle(document.querySelector(`input[name=${n}]:checked + .chip`)).backgroundColor])),
    );
    const pink = 'rgb(255, 79, 154)';
    const sun = 'rgb(255, 210, 63)';
    const teal = 'rgb(31, 199, 176)';
    check(
      'main: each question keeps its own sticker colour',
      colours.minutes === pink && colours.budget === sun && colours.setting === teal && colours.company === pink && colours.mood === teal,
      JSON.stringify(colours),
    );
    const chip = page.locator('label', { hasText: 'Creative' });
    await chip.scrollIntoViewIfNeeded();
    const box = await chip.boundingBox();
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    const idle = await chip.evaluate((el) => `${getComputedStyle(el).rotate} / ${getComputedStyle(el).scale}`);
    await page.mouse.down();
    await sleep(250);
    const pressed = await chip.evaluate((el) => `${getComputedStyle(el).rotate} / ${getComputedStyle(el).scale}`);
    await page.mouse.up();
    check('main: a pressed chip keeps its tilt and gets the press scale', idle.startsWith('1.2deg') && pressed === '1.2deg / 0.97', `idle ${idle}, pressed ${pressed}`);
  });

  // 8. 320px: no sideways scroll on the scene and envelopes in any vibe, envelope codes on one
  //    line, and a written-for-you stamp clear of the postmark.
  for (const w of [1, 2, 3]) {
    const vibe = VIBES[w];
    const name = `${vibe} at 320px: no sideways scroll, envelope codes on one line${w === 2 ? ', the stamp clear of the postmark' : ''}`;
    await section(name, async () => {
      const page = await freshPage({ width: 320, height: 640, reducedMotion: 'no-preference' });
      await setVibe(page, w);
      const sceneOk = await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth);
      await page.getByRole('button', { name: /give me a plot twist/i }).click();
      await page.waitForURL(/#\/envelopes/);
      let widest = 0;
      for (let i = 0; i < 20; i++) {
        widest = Math.max(widest, await page.evaluate(() => document.documentElement.scrollWidth));
        await sleep(50);
      }
      await page.locator('button.envelope').nth(2).waitFor();
      if (w === 2) {
        // Re-deal the third envelope as written for you (only its source changes), then reload.
        await page.waitForFunction(() => JSON.parse(localStorage.getItem('plot-twist:v1') || 'null')?.draw?.envelopes?.length === 3);
        await page.evaluate(() => {
          const s = JSON.parse(localStorage.getItem('plot-twist:v1'));
          s.draw.envelopes[2].source = 'ai';
          localStorage.setItem('plot-twist:v1', JSON.stringify(s));
        });
        await page.reload({ waitUntil: 'networkidle' });
        await page.locator('button.envelope .stamp').waitFor();
      }
      const head = await page.evaluate(() =>
        [...document.querySelectorAll('button.envelope')].map((b) => {
          const code = b.querySelector('span.t-kicker');
          const lines = Math.round(code.getBoundingClientRect().height / parseFloat(getComputedStyle(code).lineHeight));
          const pm = b.querySelector('.postmark');
          const p = pm.getBoundingClientRect();
          const cx = p.left + p.width / 2;
          const cy = p.top + p.height / 2;
          const radius = pm.offsetWidth / 2 + 1; // a (rotated) dashed circle
          const stamp = b.querySelector('.stamp');
          let clearance = null;
          if (stamp) {
            const q = stamp.getBoundingClientRect();
            clearance = Math.hypot(Math.max(q.left - cx, 0, cx - q.right), Math.max(q.top - cy, 0, cy - q.bottom)) - radius;
          }
          return { lines, clearance };
        }),
      );
      const stampClear = head.every((h) => h.clearance === null || h.clearance > 0) && (w !== 2 || head.some((h) => h.clearance !== null));
      check(
        name,
        sceneOk && widest <= 320 && head.every((h) => h.lines === 1) && stampClear,
        `scene ${sceneOk ? 'ok' : 'scrolls'}, envelopes width ${widest}, code lines ${head.map((h) => h.lines).join('/')}${w === 2 ? `, stamp clearance ${head.map((h) => (h.clearance === null ? '-' : fmt(h.clearance))).join('/')} px` : ''}`,
      );
      if (w === 2) await page.screenshot({ path: join(artifacts, 'a3-envelopes-320-ai-stamp.png') });
    });
  }

  // 9. Busy buttons use aria-disabled (they keep focus) and look like disabled ones.
  await section('busy button', async () => {
    const page = await freshPage();
    await drawEnvelopes(page);
    const drawAgain = page.getByRole('button', { name: /draw again/i });
    await drawAgain.evaluate((el) => el.setAttribute('aria-disabled', 'true'));
    await sleep(100);
    const look = await drawAgain.evaluate((el) => ({ opacity: getComputedStyle(el).opacity, cursor: getComputedStyle(el).cursor }));
    check('a busy .btn (aria-disabled) looks disabled', look.opacity === '0.45' && look.cursor === 'not-allowed', JSON.stringify(look));
  });
}
