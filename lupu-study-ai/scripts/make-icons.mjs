// מייצר אייקוני PNG (PWA / iOS) מתוך public/icons/icon.svg באמצעות Chromium של Playwright
import { chromium } from "playwright";
import { readFileSync } from "node:fs";

const svg = readFileSync("public/icons/icon.svg", "utf8");
const browser = await chromium.launch();
const sizes = [
  ["icon-192.png", 192, false],
  ["icon-512.png", 512, false],
  ["icon-maskable-512.png", 512, true],
  ["apple-touch-icon.png", 180, true],
];
for (const [file, size, padded] of sizes) {
  const page = await browser.newPage({ viewport: { width: size, height: size } });
  const inner = padded ? Math.round(size * 0.72) : size;
  await page.setContent(`<body style="margin:0;background:${padded ? "#5b3df5" : "transparent"};display:grid;place-items:center;width:${size}px;height:${size}px"><div style="width:${inner}px;height:${inner}px">${svg.replace("<svg ", `<svg width="${inner}" height="${inner}" `)}</div></body>`);
  await page.screenshot({ path: `public/icons/${file}`, omitBackground: !padded });
  await page.close();
}
await browser.close();
console.log("icons ready");
