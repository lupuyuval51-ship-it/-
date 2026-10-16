// Regenerates the app's brand images from one drawing of the mark (a ball hopping up three steps, as in src/components/ui/Brand.tsx):
// Android launcher icons (adaptive foreground + legacy square/round), splash screens, the web icon and the Play Store icon
// and feature graphic.   Run from the repo root:  node mobile/brand-assets.mjs
// The feature graphic needs a browser for the bundled Rubik font (Playwright's Chromium); everything else uses sharp.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import sharp from "sharp";

const BOARD = "#0e1b17"; // --color-ink-950 (dark theme): the chalkboard
const CHALK = "#ffd23f"; // --color-neon (dark theme): yellow chalk
const LINE = "rgba(243,240,228,0.06)"; // the faint squared-paper grid of the app's background

/** The mark (a ball hopping up three steps, as LogoMark draws it in a 32-unit box) centred on (cx, cy), `size` wide. */
function mark(cx, cy, size, color = CHALK) {
  const k = size / 28;
  return `<g transform="translate(${(cx - 16 * k).toFixed(2)} ${(cy - 18.5 * k).toFixed(2)}) scale(${k.toFixed(4)})" fill="${color}">`
    + `<path d="M3 29v-7h10.5v-7H21V8h8v21z" stroke="${color}" stroke-width="2" stroke-linejoin="round"/><circle cx="8" cy="15.5" r="2.8"/></g>`;
}
function grid(w, h, step) {
  let d = "";
  for (let x = step; x < w; x += step) d += `M${x} 0V${h}`;
  for (let y = step; y < h; y += step) d += `M0 ${y}H${w}`;
  return `<path d="${d}" stroke="${LINE}" stroke-width="${Math.max(1, step / 28)}" fill="none"/>`;
}
const svg = (w, h, body) => Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${body}</svg>`);
const png = (file, w, h, body) => { mkdirSync(path.dirname(file), { recursive: true }); return sharp(svg(w, h, body)).png().toFile(file); };

/** The full icon: chalkboard tile with the grid and the mark (`shape`: square with rounded corners, or round). */
const fullIcon = (s, shape = "square") => {
  const clip = shape === "round" ? `<circle cx="${s / 2}" cy="${s / 2}" r="${s / 2}"/>` : `<rect width="${s}" height="${s}" rx="${s * 0.22}"/>`;
  return `<defs><clipPath id="c">${clip}</clipPath></defs><g clip-path="url(#c)"><rect width="${s}" height="${s}" fill="${BOARD}"/>${grid(s, s, s / 8)}${mark(s / 2, s / 2 + s * 0.01, s * 0.54)}</g>`;
};

const RES = "android/app/src/main/res";
const DENSITIES = { mdpi: 1, hdpi: 1.5, xhdpi: 2, xxhdpi: 3, xxxhdpi: 4 };
const jobs = [];
for (const [d, k] of Object.entries(DENSITIES)) {
  const legacy = 48 * k, fg = 108 * k;
  jobs.push(png(`${RES}/mipmap-${d}/ic_launcher.png`, legacy, legacy, fullIcon(legacy)));
  jobs.push(png(`${RES}/mipmap-${d}/ic_launcher_round.png`, legacy, legacy, fullIcon(legacy, "round")));
  // adaptive foreground: transparent, the mark inside the 66 dp safe circle of the 108 dp canvas
  jobs.push(png(`${RES}/mipmap-${d}/ic_launcher_foreground.png`, fg, fg, mark(fg / 2, fg / 2 + fg * 0.01, fg * 0.46)));
}
const splash = (w, h) => `<rect width="${w}" height="${h}" fill="${BOARD}"/>${grid(w, h, Math.round(Math.min(w, h) / 9))}${mark(w / 2, h / 2, Math.min(w, h) * 0.24)}`;
const SPLASH = {
  drawable: [480, 320], "drawable-land-mdpi": [480, 320], "drawable-land-hdpi": [800, 480], "drawable-land-xhdpi": [1280, 720], "drawable-land-xxhdpi": [1600, 960], "drawable-land-xxxhdpi": [1920, 1280],
  "drawable-port-mdpi": [320, 480], "drawable-port-hdpi": [480, 800], "drawable-port-xhdpi": [720, 1280], "drawable-port-xxhdpi": [960, 1600], "drawable-port-xxxhdpi": [1280, 1920],
};
for (const [dir, [w, h]] of Object.entries(SPLASH)) jobs.push(png(`${RES}/${dir}/splash.png`, w, h, splash(w, h)));
jobs.push(png("mobile/store/play-icon-512.png", 512, 512, `<rect width="512" height="512" fill="${BOARD}"/>${grid(512, 512, 64)}${mark(256, 261, 276)}`));
writeFileSync("mobile/public/icon.svg", svg(512, 512, fullIcon(512)).toString() + "\n");
await Promise.all(jobs);

// Feature graphic 1024 × 500: rendered by a browser so the wordmark uses the app's own font.
const { chromium } = await import("@playwright/test");
const font = (f) => `data:font/woff2;base64,${readFileSync(`node_modules/@fontsource-variable/rubik/files/${f}`).toString("base64")}`;
const browser = await chromium.launch({ executablePath: process.env.PW_CHROMIUM_PATH ?? "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
const page = await browser.newPage({ viewport: { width: 1024, height: 500 } });
await page.setContent(`<!doctype html><html><head><style>
  @font-face { font-family: Rubik; font-weight: 300 900; src: url(${font("rubik-latin-wght-normal.woff2")}) format("woff2"); }
  html, body { margin: 0; width: 1024px; height: 500px; overflow: hidden; }
  body { background: ${BOARD}; font-family: Rubik, sans-serif; color: #f3f0e4; display: flex; align-items: center; gap: 56px; padding-inline: 110px; box-sizing: border-box;
    background-image: linear-gradient(${LINE} 2px, transparent 2px), linear-gradient(90deg, ${LINE} 2px, transparent 2px); background-size: 62.5px 62.5px; }
  .tile { width: 200px; height: 200px; border-radius: 44px; background: ${CHALK}; display: grid; place-items: center; box-shadow: 0 12px 0 0 #8c7322; flex: none; }
  h1 { margin: 0; font-size: 104px; font-weight: 800; letter-spacing: -0.02em; line-height: 1; }
  p { margin: 18px 0 0; font-size: 38px; font-weight: 500; color: ${CHALK}; }
</style></head><body>
  <div class="tile">${svg(130, 130, mark(65, 65, 124, BOARD))}</div>
  <div><h1>LEVEL UP</h1><p>Learn by playing in 3D</p></div>
</body></html>`);
await page.evaluate(() => document.fonts.ready);
await page.screenshot({ path: "mobile/store/feature-graphic-1024x500.png" });
await browser.close();
console.log("brand assets written");
