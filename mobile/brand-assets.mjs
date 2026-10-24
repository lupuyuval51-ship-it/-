// Regenerates the app's brand images from one drawing of the mark (a ball hopping up three steps, as in src/components/ui/Brand.tsx):
// Android launcher icons (adaptive foreground + legacy square/round), splash screens and the web icon, all drawn here with sharp.
// The Play Store icon (512) and feature graphic (1024 x 500) are cut from the two artworks in mobile/store/brand-source/ (the
// logo mark on the squared board, and the logo with its name and tagline), so they are exactly the brand artwork.
//   Run from the repo root:  node mobile/brand-assets.mjs
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import sharp from "sharp";

const BOARD = "#0e1b17"; // --color-ink-950 (dark theme): the chalkboard
const CHALK = "#ffd23f"; // --color-neon (dark theme): yellow chalk
const LINE = "rgba(243,240,228,0.08)"; // the faint squared-paper grid of the app's background

/** The mark (a ball hopping up three steps, as LogoMark draws it in a 1084 x 895 box) centred on (cx, cy), `size` wide. */
function mark(cx, cy, size, color = CHALK) {
  const k = size / 1084;
  return `<g transform="translate(${(cx - 542 * k).toFixed(2)} ${(cy - 447.5 * k).toFixed(2)}) scale(${k.toFixed(5)})" fill="${color}">`
    + `<path d="M32 545H407V300A32 32 0 0 1 439 268H698V32A32 32 0 0 1 730 0H1052A32 32 0 0 1 1084 32V863A32 32 0 0 1 1052 895H32A32 32 0 0 1 0 863V577A32 32 0 0 1 32 545Z"/><circle cx="231" cy="325" r="108"/></g>`;
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
  return `<defs><clipPath id="c">${clip}</clipPath></defs><g clip-path="url(#c)"><rect width="${s}" height="${s}" fill="${BOARD}"/>${grid(s, s, s / 8)}${mark(s / 2, s / 2 + s * 0.035, s * 0.54)}</g>`;
};

const RES = "android/app/src/main/res";
const DENSITIES = { mdpi: 1, hdpi: 1.5, xhdpi: 2, xxhdpi: 3, xxxhdpi: 4 };
const jobs = [];
for (const [d, k] of Object.entries(DENSITIES)) {
  const legacy = 48 * k, fg = 108 * k;
  jobs.push(png(`${RES}/mipmap-${d}/ic_launcher.png`, legacy, legacy, fullIcon(legacy)));
  jobs.push(png(`${RES}/mipmap-${d}/ic_launcher_round.png`, legacy, legacy, fullIcon(legacy, "round")));
  // adaptive foreground: transparent, the mark inside the 66 dp safe circle of the 108 dp canvas
  jobs.push(png(`${RES}/mipmap-${d}/ic_launcher_foreground.png`, fg, fg, mark(fg / 2, fg / 2 + fg * 0.012, fg * 0.44)));
}
const splash = (w, h) => `<rect width="${w}" height="${h}" fill="${BOARD}"/>${grid(w, h, Math.round(Math.min(w, h) / 9))}${mark(w / 2, h / 2, Math.min(w, h) * 0.3)}`;
const SPLASH = {
  drawable: [480, 320], "drawable-land-mdpi": [480, 320], "drawable-land-hdpi": [800, 480], "drawable-land-xhdpi": [1280, 720], "drawable-land-xxhdpi": [1600, 960], "drawable-land-xxxhdpi": [1920, 1280],
  "drawable-port-mdpi": [320, 480], "drawable-port-hdpi": [480, 800], "drawable-port-xhdpi": [720, 1280], "drawable-port-xxhdpi": [960, 1600], "drawable-port-xxxhdpi": [1280, 1920],
};
for (const [dir, [w, h]] of Object.entries(SPLASH)) jobs.push(png(`${RES}/${dir}/splash.png`, w, h, splash(w, h)));
jobs.push(sharp("mobile/store/brand-source/logo-mark-2000x2000.jpg").resize(512, 512).png().toFile("mobile/store/play-icon-512.png"));
// Feature graphic 1024 x 500, cut from the logo-with-name artwork (2000 x 985): scaled to the width, the 4 spare rows are trimmed.
jobs.push(sharp("mobile/store/brand-source/logo-with-name-2000x985.jpg").resize(1024, 500, { fit: "cover" }).png().toFile("mobile/store/feature-graphic-1024x500.png"));
writeFileSync("mobile/public/icon.svg", svg(512, 512, fullIcon(512)).toString() + "\n");
await Promise.all(jobs);

console.log("brand assets written");
