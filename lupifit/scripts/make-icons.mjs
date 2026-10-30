// Regenerates the PNG app icons from the logo (run: node scripts/make-icons.mjs). Needs Playwright's Chromium.

import { chromium } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
const out = path.resolve(import.meta.dirname, '../client/public');
const MARK = '<g transform="translate(8 8) scale(2)"><g fill="#f5f5f5"><rect x="4" y="4" width="2.25" height="16"/><rect x="8.5" y="4" width="2.25" height="16"/><rect x="13" y="4" width="2.25" height="16"/><rect x="17.5" y="4" width="2.25" height="16"/></g><line x1="1.5" y1="17.5" x2="22.5" y2="6.5" stroke="#ff6a00" stroke-width="2.5"/></g>';
const svg = (inset, radius) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="${radius}" fill="#0b0b0d"/><g transform="translate(${inset} ${inset}) scale(${(64 - 2 * inset) / 64})">${MARK}</g></svg>`;
const browser = await chromium.launch({ executablePath: (process.env.PLAYWRIGHT_BROWSERS_PATH ?? '/opt/pw-browsers') + '/chromium' });
const page = await browser.newPage();
async function render(name, size, inset, radius) {
  await page.setViewportSize({ width: size, height: size });
  await page.setContent(`<body style="margin:0;background:transparent"><img style="width:${size}px;height:${size}px;display:block" src="data:image/svg+xml;utf8,${encodeURIComponent(svg(inset, radius))}"></body>`);
  await page.screenshot({ path: `${out}/${name}`, omitBackground: true, clip: { x: 0, y: 0, width: size, height: size } });
}
await render('icon-192.png', 192, 0, 10);
await render('icon-512.png', 512, 0, 10);
await render('icon-maskable-512.png', 512, 9, 0); // full-bleed with a safe zone for platform masks
await render('apple-touch-icon.png', 180, 6, 0); // iOS applies its own rounding
await browser.close();
console.log(fs.readdirSync(out));
