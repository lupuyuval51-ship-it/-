// Builds the Claude artifact page from index.html: the part between the @artifact markers,
// with VIDEO_MAP filled from videos-map.json (exercise id -> uploaded asset URL) when that file exists.
// Usage: node tools/build-artifact.mjs <out.html>
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = process.argv[2];
if (!out) { console.error('usage: node tools/build-artifact.mjs <out.html>'); process.exit(1); }

const src = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const a = src.indexOf('<!-- @artifact-start -->'), b = src.indexOf('<!-- @artifact-end -->');
if (a < 0 || b < 0) throw new Error('artifact markers not found');
let page = src.slice(a + '<!-- @artifact-start -->'.length, b).replace(/^\n/, '');

const mapFile = path.join(root, 'videos-map.json');
if (fs.existsSync(mapFile)) {
  const map = JSON.parse(fs.readFileSync(mapFile, 'utf8'));
  if (!page.includes('/*@video-map*/null')) throw new Error('VIDEO_MAP placeholder not found');
  page = page.replace('/*@video-map*/null', JSON.stringify(map));
  console.log(Object.keys(map).length + ' videos mapped');
} else { page = page.replace('/*@video-map*/null', '{}'); console.log('no videos-map.json: the artifact will have no videos'); }

const foodFile = path.join(root, 'food-map.json');
if (fs.existsSync(foodFile)) {
  const fmap = JSON.parse(fs.readFileSync(foodFile, 'utf8'));
  if (!page.includes('/*@food-map*/null')) throw new Error('FOOD_MAP placeholder not found');
  page = page.replace('/*@food-map*/null', JSON.stringify(fmap));
  console.log(Object.keys(fmap).length + ' food photos mapped');
} else page = page.replace('/*@food-map*/null', '{}');

// Workout cover photos and exercise photos: id -> uploaded asset URL (optional files)
for (const [file, token, label] of [['work-map.json', '/*@work-map*/null', 'workout covers'], ['ex-map.json', '/*@ex-map*/null', 'exercise photos']]) {
  const f = path.join(root, file);
  if (!page.includes(token)) throw new Error(token + ' placeholder not found');
  if (fs.existsSync(f)) { const m = JSON.parse(fs.readFileSync(f, 'utf8')); page = page.replace(token, JSON.stringify(m)); console.log(Object.keys(m).length + ' ' + label + ' mapped'); }
  else page = page.replace(token, '{}');
}

fs.writeFileSync(out, page);
console.log('wrote ' + out + ' (' + Buffer.byteLength(page) + ' bytes)');
