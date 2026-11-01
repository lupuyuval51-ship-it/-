#!/usr/bin/env node
/** Generates Android launcher/adaptive-icon mipmaps from client/public/icons/adaptive-*.png (run via android-build.sh; idempotent). */
import { mkdirSync, writeFileSync, readFileSync, rmSync, existsSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { createCanvas, loadImage } from '@napi-rs/canvas';

const root = resolve(import.meta.dirname, '..');
const icons = join(root, 'client/public/icons');
const res = join(root, 'android/app/src/main/res');
const BG = '#0B0B0D';
const layerPx = { mdpi: 108, hdpi: 162, xhdpi: 216, xxhdpi: 324, xxxhdpi: 432 }; // 108dp adaptive layers
const legacyPx = { mdpi: 48, hdpi: 72, xhdpi: 96, xxhdpi: 144, xxxhdpi: 192 };     // 48dp legacy icons

const fg = await loadImage(readFileSync(join(icons, 'adaptive-foreground-432.png')));
const mono = await loadImage(readFileSync(join(icons, 'adaptive-monochrome-432.png')));
const save = (dir, name, cv) => { mkdirSync(dir, { recursive: true }); writeFileSync(join(dir, name), cv.toBuffer('image/png')); };

for (const d of Object.keys(layerPx)) {
  const dir = join(res, `mipmap-${d}`);
  for (const [name, img] of [['ic_launcher_foreground.png', fg], ['ic_launcher_monochrome.png', mono]]) {
    const n = layerPx[d]; const cv = createCanvas(n, n); cv.getContext('2d').drawImage(img, 0, 0, n, n); save(dir, name, cv);
  }
  // Legacy (pre-API 26) icons: dark plate + mark scaled into the visible 72/108 area; round variant is circle-clipped.
  const n = legacyPx[d];
  for (const [name, round] of [['ic_launcher.png', false], ['ic_launcher_round.png', true]]) {
    const cv = createCanvas(n, n); const c = cv.getContext('2d');
    c.save(); c.beginPath(); if (round) c.arc(n / 2, n / 2, n / 2, 0, Math.PI * 2); else c.roundRect(0, 0, n, n, n * 0.18); c.clip();
    c.fillStyle = BG; c.fillRect(0, 0, n, n);
    const s = n * (108 / 72); c.drawImage(fg, (n - s) / 2, (n - s) / 2, s, s); c.restore(); save(dir, name, cv);
  }
}
const mk = (p, s) => { mkdirSync(join(p, '..'), { recursive: true }); writeFileSync(p, s); };
mk(join(res, 'mipmap-anydpi-v26/ic_launcher.xml'), `<?xml version="1.0" encoding="utf-8"?>\n<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">\n    <background android:drawable="@color/ic_launcher_background"/>\n    <foreground android:drawable="@mipmap/ic_launcher_foreground"/>\n    <monochrome android:drawable="@mipmap/ic_launcher_monochrome"/>\n</adaptive-icon>\n`);
mk(join(res, 'mipmap-anydpi-v26/ic_launcher_round.xml'), readFileSync(join(res, 'mipmap-anydpi-v26/ic_launcher.xml'), 'utf8'));
mk(join(res, 'values/ic_launcher_background.xml'), `<?xml version="1.0" encoding="utf-8"?>\n<resources>\n    <color name="ic_launcher_background">${BG}</color>\n</resources>\n`);
// Unused Capacitor template leftovers: vector foreground and bitmap splash images (splash is a solid #0B0B0D + the mark).
rmSync(join(res, 'drawable-v24'), { recursive: true, force: true });
for (const e of readdirSync(res)) if (/^drawable-(land|port)-/.test(e)) rmSync(join(res, e), { recursive: true, force: true });
if (existsSync(join(res, 'drawable/splash.png'))) rmSync(join(res, 'drawable/splash.png'));
console.log('android icons generated');
