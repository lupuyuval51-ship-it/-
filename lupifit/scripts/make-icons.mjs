// Regenerates the PNG app icons from the logo (run: node scripts/make-icons.mjs). Needs Playwright's Chromium.

import { chromium } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
const out = path.resolve(import.meta.dirname, '../client/public');
const svg = (inset, radius) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="${radius}" fill="#0b1120"/><g transform="translate(${inset} ${inset}) scale(${(64 - 2 * inset) / 64})"><path d="M14 26h6v12h-6zM44 26h6v12h-6zM20 22h5v20h-5zM39 22h5v20h-5zM25 30h14v4H25z" fill="#22c55e"/></g></svg>`;
const browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_BROWSERS_PATH + '/chromium' });
const page = await browser.newPage();
async function render(name, size, inset, radius) {
  await page.setViewportSize({ width: size, height: size });
  await page.setContent(`<body style="margin:0;background:transparent"><img style="width:${size}px;height:${size}px;display:block" src="data:image/svg+xml;utf8,${encodeURIComponent(svg(inset, radius))}"></body>`);
  await page.screenshot({ path: `${out}/${name}`, omitBackground: true, clip: { x: 0, y: 0, width: size, height: size } });
}
await render('icon-192.png', 192, 0, 14);
await render('icon-512.png', 512, 0, 14);
await render('icon-maskable-512.png', 512, 9, 0); // full-bleed with a safe zone for platform masks
await render('apple-touch-icon.png', 180, 6, 0); // iOS applies its own rounding
await browser.close();
console.log(fs.readdirSync(out));
