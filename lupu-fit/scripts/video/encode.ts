import { spawn } from 'node:child_process';
import type { SKRSContext2D } from '@napi-rs/canvas';
import { SIZE } from './render.ts';

export const FPS = 30;

/** Pipes RGBA frames into ffmpeg: silent H.264, yuv420p, +faststart. `draw(i)` must paint frame i on ctx. */
export async function encodeMp4(out: string, frames: number, ctx: SKRSContext2D, draw: (i: number) => void): Promise<void> {
  const args = ['-y', '-loglevel', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgba', '-s', `${SIZE}x${SIZE}`, '-r', String(FPS), '-i', '-',
    '-an', '-c:v', 'libx264', '-profile:v', 'high', '-pix_fmt', 'yuv420p', '-preset', 'medium', '-crf', '27', '-tune', 'animation',
    '-g', String(FPS), '-threads', '1', '-movflags', '+faststart', out];
  const ff = spawn('ffmpeg', args, { stdio: ['pipe', 'ignore', 'pipe'] });
  let stderr = '';
  ff.stderr.on('data', (d: Buffer) => { stderr += d.toString(); });
  const done = new Promise<void>((res, rej) => {
    ff.on('error', rej);
    ff.on('close', (code) => (code === 0 ? res() : rej(new Error(`ffmpeg exited ${code}: ${stderr}`))));
  });
  for (let i = 0; i < frames; i++) {
    draw(i);
    const img = ctx.getImageData(0, 0, SIZE, SIZE);
    const ok = ff.stdin.write(Buffer.from(img.data.buffer, img.data.byteOffset, img.data.byteLength));
    if (!ok) await new Promise<void>((r) => ff.stdin.once('drain', () => r()));
  }
  ff.stdin.end();
  await done;
}
