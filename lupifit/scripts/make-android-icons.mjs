// Regenerates the Android app's icons from the logo in client/public/favicon.svg
// (run: node scripts/make-android-icons.mjs). Needs Playwright's Chromium, like make-icons.mjs.
//
// Writes into android/app/src/main/res:
//   mipmap-*/ic_launcher.png             legacy launcher icon (Android 7.x), rounded square
//   mipmap-*/ic_launcher_round.png       legacy round launcher icon
//   mipmap-*/ic_launcher_foreground.png  adaptive icon foreground (108 dp, logo inside the 66 dp safe zone);
//                                        also the splash screen icon (Android 12+ and the compat splash)
//   mipmap-*/ic_launcher_monochrome.png  themed icon (Android 13+): the logo as one colour, the system tints it
//   drawable-*/ic_stat_lupufit.png       notification icon: white silhouette on transparent (Android tints it)
// The adaptive icon background is the colour @color/lupufit_background (#0b0b0d) in values/colors.xml.

import { chromium } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const res = path.join(root, 'android/app/src/main/res');
const favicon = fs.readFileSync(path.join(root, 'client/public/favicon.svg'), 'utf8');

// The logo mark in its 24-unit coordinate space: the four bars and the orange slash.
const markMatch = /<g transform="translate\(8 8\) scale\(2\)">(.*)<\/g><\/svg>/.exec(favicon);
if (!markMatch) throw new Error('client/public/favicon.svg no longer has the expected logo mark group');
const MARK = markMatch[1];
const BG = '#0b0b0d';
if (!favicon.includes(`fill="${BG}"`)) throw new Error(`favicon.svg background is no longer ${BG}: update values/colors.xml too`);

/** The mark centred in a square canvas of `size` units, `markUnits` wide (the mark is 24 units). */
const placed = (size, markUnits, inner) => {
  const scale = markUnits / 24;
  const offset = (size - markUnits) / 2;
  return `<g transform="translate(${offset} ${offset}) scale(${scale})">${inner}</g>`;
};

// One-colour mark: bars with a gap cut around the slash, so the silhouette stays readable when tinted.
const silhouette = (color) => {
  const bars = /<g fill="[^"]+">(.*?)<\/g>/.exec(MARK)?.[1];
  const line = /<line [^>]*\/>/.exec(MARK)?.[0];
  if (!bars || !line) throw new Error('unexpected logo mark structure');
  const gap = line.replace(/stroke="[^"]+"/, 'stroke="black"').replace(/stroke-width="[^"]+"/, 'stroke-width="5"');
  const slash = line.replace(/stroke="[^"]+"/, `stroke="${color}"`);
  return `<mask id="gap" maskUnits="userSpaceOnUse" x="-4" y="-4" width="32" height="32"><rect x="-4" y="-4" width="32" height="32" fill="white"/>${gap}</mask><g fill="${color}" mask="url(#gap)">${bars}</g>${slash}`;
};

const svgDoc = (size, body) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">${body}</svg>`;

const DENSITIES = { mdpi: 1, hdpi: 1.5, xhdpi: 2, xxhdpi: 3, xxxhdpi: 4 };

const browser = await chromium.launch({ executablePath: (process.env.PLAYWRIGHT_BROWSERS_PATH ?? '/opt/pw-browsers') + '/chromium' });
const page = await browser.newPage();
const written = [];
async function render(file, px, svg) {
  await page.setViewportSize({ width: px, height: px });
  await page.setContent(
    `<body style="margin:0;background:transparent"><img style="width:${px}px;height:${px}px;display:block" src="data:image/svg+xml;utf8,${encodeURIComponent(svg)}"></body>`,
  );
  await page.waitForFunction(() => document.images[0]?.complete);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  await page.screenshot({ path: file, omitBackground: true, clip: { x: 0, y: 0, width: px, height: px } });
  written.push(path.relative(root, file));
}

for (const [density, f] of Object.entries(DENSITIES)) {
  const mipmap = path.join(res, `mipmap-${density}`);
  // Legacy icons: 48 dp with the system's 1 dp margin baked in (the logo's own rounded square / a circle).
  await render(path.join(mipmap, 'ic_launcher.png'), 48 * f, svgDoc(48, `<rect x="2" y="2" width="44" height="44" rx="7" fill="${BG}"/>${placed(48, 30, MARK)}`));
  await render(path.join(mipmap, 'ic_launcher_round.png'), 48 * f, svgDoc(48, `<circle cx="24" cy="24" r="22" fill="${BG}"/>${placed(48, 28, MARK)}`));
  // Adaptive layers: 108 dp; launchers show the centre 72 dp and keep the 66 dp circle (the logo is 52 dp wide).
  await render(path.join(mipmap, 'ic_launcher_foreground.png'), 108 * f, svgDoc(108, placed(108, 52, MARK)));
  await render(path.join(mipmap, 'ic_launcher_monochrome.png'), 108 * f, svgDoc(108, placed(108, 52, silhouette('#ffffff'))));
  // Notification icon: 24 dp, 22 dp live area.
  await render(path.join(res, `drawable-${density}`, 'ic_stat_lupufit.png'), 24 * f, svgDoc(24, placed(24, 22, silhouette('#ffffff'))));
}
await browser.close();
console.log(written.join('\n'));
