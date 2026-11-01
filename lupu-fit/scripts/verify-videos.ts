#!/usr/bin/env tsx
/** Independent verification: every exercise has a clip + poster; own MP4 validator AND ffprobe agree; sha256 matches the manifest. */
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { EXERCISES_ALL } from '../shared/src/content/sources.ts';
import { validateMp4 } from '../server/src/media/mp4Validator.ts';

const dir = join(resolve(import.meta.dirname, '..'), 'client/public/media/exercises');
const manifest = JSON.parse(readFileSync(join(dir, 'media-manifest.json'), 'utf8')) as { items: { id: string; sha256: string; fidelity: string }[] };
const byId = new Map(manifest.items.map((m) => [m.id, m]));
const errors: string[] = [];
let bytes = 0; let priorityABytes = 0;
for (const e of EXERCISES_ALL) {
  const mp4 = join(dir, `${e.id}.mp4`); const jpg = join(dir, `${e.id}.jpg`);
  if (!existsSync(mp4) || !existsSync(jpg)) { errors.push(`${e.id}: missing clip or poster`); continue; }
  const buf = readFileSync(mp4); bytes += buf.length; if (e.videoPriority === 'A') priorityABytes += buf.length;
  const own = validateMp4(new Uint8Array(buf));
  if (!own.ok) errors.push(`${e.id}: own validator: ${own.errors.join('; ')}`);
  if (statSync(jpg).size > 60 * 1024) errors.push(`${e.id}: poster ${statSync(jpg).size} B > 60 KB`);
  if (byId.get(e.id)?.sha256 !== createHash('sha256').update(buf).digest('hex')) errors.push(`${e.id}: sha256 differs from manifest`);
  const probe = JSON.parse(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'stream=codec_type,codec_name,width,height,nb_frames:format=duration', '-of', 'json', mp4], { encoding: 'utf8' })) as { streams: { codec_type: string; codec_name: string; width: number; height: number; nb_frames: string }[]; format: { duration: string } };
  const v = probe.streams.filter((s) => s.codec_type === 'video'); const a = probe.streams.filter((s) => s.codec_type === 'audio');
  const dur = Number(probe.format.duration);
  if (v.length !== 1 || v[0]?.codec_name !== 'h264') errors.push(`${e.id}: ffprobe video stream not h264`);
  if (a.length) errors.push(`${e.id}: ffprobe found audio`);
  if (v[0]?.width !== 720 || v[0]?.height !== 720) errors.push(`${e.id}: ffprobe size ${v[0]?.width}x${v[0]?.height}`);
  if (!(dur >= 6 && dur <= 10)) errors.push(`${e.id}: ffprobe duration ${dur}`);
}
console.log(`${EXERCISES_ALL.length} exercises, ${(bytes / 1e6).toFixed(1)} MB total, priority-A offline set ${(priorityABytes / 1e6).toFixed(1)} MB`);
if (errors.length) { for (const x of errors.slice(0, 40)) console.error('ERROR', x); console.error(`verify-videos: ${errors.length} error(s)`); process.exit(1); }
console.log('verify-videos: 0 errors');
