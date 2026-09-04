/**
 * Audio extraction, main thread only (AudioContext is not available in workers).
 *
 * Whisper wants 16 kHz mono float samples. Two ways to get there:
 *   1. Web Audio - `decodeAudioData` on an AudioContext created at 16 kHz makes
 *      the browser resample while decoding, so memory stays at ~64 KB/second no
 *      matter how long the video is. Works for mp4/mov/webm/ogg/mp3/wav/m4a.
 *   2. ffmpeg.wasm - the fallback for containers and codecs the browser refuses
 *      (mkv, avi, wmv, flv, ac3 tracks...). Downloaded from a CDN on demand, so
 *      it costs nothing until it is actually needed.
 */

const SAMPLE_RATE = 16000;

import {
  FFMPEG_CORE_VERSION,
  FFMPEG_UTIL_VERSION,
  FFMPEG_VERSION,
  readConfig,
} from './config.js';

const CDN = readConfig(window.location.search).cdn;

export class AudioExtractionError extends Error {
  constructor(message, cause) {
    super(message);
    this.name = 'AudioExtractionError';
    this.cause = cause;
  }
}

/** Duration in seconds, read from the media element without decoding anything. */
export function probeDuration(url) {
  return new Promise((resolve) => {
    const probe = document.createElement('video');
    probe.preload = 'metadata';
    probe.muted = true;
    const done = (value) => {
      probe.removeAttribute('src');
      probe.load();
      resolve(value);
    };
    probe.addEventListener('loadedmetadata', () => done(Number.isFinite(probe.duration) ? probe.duration : 0));
    probe.addEventListener('error', () => done(0));
    probe.src = url;
  });
}

function mixToMono(audioBuffer) {
  const channels = audioBuffer.numberOfChannels;
  const first = audioBuffer.getChannelData(0);
  if (channels === 1) return first.slice();
  const mono = new Float32Array(first.length);
  for (let channel = 0; channel < channels; channel += 1) {
    const data = audioBuffer.getChannelData(channel);
    for (let i = 0; i < mono.length; i += 1) mono[i] += data[i];
  }
  for (let i = 0; i < mono.length; i += 1) mono[i] /= channels;
  return mono;
}

/** Linear resample, only used when a browser ignores the requested sample rate. */
function resample(samples, fromRate, toRate) {
  if (fromRate === toRate) return samples;
  const ratio = fromRate / toRate;
  const length = Math.floor(samples.length / ratio);
  const output = new Float32Array(length);
  for (let i = 0; i < length; i += 1) {
    const position = i * ratio;
    const index = Math.floor(position);
    const fraction = position - index;
    const next = Math.min(index + 1, samples.length - 1);
    output[i] = samples[index] * (1 - fraction) + samples[next] * fraction;
  }
  return output;
}

async function decodeWithWebAudio(file) {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) throw new AudioExtractionError('Web Audio is not available');

  const bytes = await file.arrayBuffer();
  let context;
  try {
    context = new AudioContextClass({ sampleRate: SAMPLE_RATE });
  } catch {
    context = new AudioContextClass();
  }
  try {
    const decoded = await context.decodeAudioData(bytes);
    const mono = mixToMono(decoded);
    return resample(mono, decoded.sampleRate, SAMPLE_RATE);
  } finally {
    context.close?.();
  }
}

let ffmpegPromise = null;

function loadScript(src) {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[data-src="${src}"]`);
    if (existing) {
      existing.dataset.loaded === 'yes'
        ? resolve()
        : existing.addEventListener('load', () => resolve(), { once: true });
      return;
    }
    const script = document.createElement('script');
    script.src = src;
    script.dataset.src = src;
    script.addEventListener('load', () => {
      script.dataset.loaded = 'yes';
      resolve();
    });
    script.addEventListener('error', () => reject(new AudioExtractionError(`Failed to load ${src}`)));
    document.head.appendChild(script);
  });
}

/**
 * Load the UMD build of ffmpeg.wasm. The ESM build spawns its worker from a
 * relative URL, which browsers refuse to do cross-origin, so the worker chunk is
 * turned into a same-origin blob URL first.
 */
async function getFFmpeg(onNotice) {
  if (ffmpegPromise) return ffmpegPromise;
  ffmpegPromise = (async () => {
    onNotice?.('ffmpeg');
    await loadScript(`${CDN}/@ffmpeg/ffmpeg@${FFMPEG_VERSION}/dist/umd/ffmpeg.js`);
    await loadScript(`${CDN}/@ffmpeg/util@${FFMPEG_UTIL_VERSION}/dist/umd/index.js`);
    const { FFmpeg } = window.FFmpegWASM ?? {};
    const { toBlobURL } = window.FFmpegUtil ?? {};
    if (!FFmpeg || !toBlobURL) throw new AudioExtractionError('ffmpeg.wasm did not load');

    const core = `${CDN}/@ffmpeg/core@${FFMPEG_CORE_VERSION}/dist/umd`;
    const instance = new FFmpeg();
    await instance.load({
      coreURL: await toBlobURL(`${core}/ffmpeg-core.js`, 'text/javascript'),
      wasmURL: await toBlobURL(`${core}/ffmpeg-core.wasm`, 'application/wasm'),
      classWorkerURL: await toBlobURL(
        `${CDN}/@ffmpeg/ffmpeg@${FFMPEG_VERSION}/dist/umd/814.ffmpeg.js`,
        'text/javascript',
      ),
    });
    return instance;
  })().catch((error) => {
    ffmpegPromise = null;
    throw error;
  });
  return ffmpegPromise;
}

async function decodeWithFFmpeg(file, { onProgress, onNotice } = {}) {
  const ffmpeg = await getFFmpeg(onNotice);
  const inputName = `input${(file.name.match(/\.[a-z0-9]+$/i) || ['.bin'])[0]}`;
  const outputName = 'audio.raw';

  const listener = ({ progress }) => {
    if (Number.isFinite(progress)) onProgress?.(Math.min(1, Math.max(0, progress)));
  };
  ffmpeg.on('progress', listener);
  try {
    await ffmpeg.writeFile(inputName, new Uint8Array(await file.arrayBuffer()));
    // Raw 32-bit floats: no WAV header to parse and no extra copy.
    const code = await ffmpeg.exec([
      '-i', inputName,
      '-vn',
      '-ac', '1',
      '-ar', String(SAMPLE_RATE),
      '-f', 'f32le',
      outputName,
    ]);
    if (code !== 0) throw new AudioExtractionError(`ffmpeg exited with code ${code}`);
    const data = await ffmpeg.readFile(outputName);
    const bytes = data instanceof Uint8Array ? data : new Uint8Array(data);
    // Copy into an aligned buffer; the wasm heap view may not start on a 4-byte boundary.
    const aligned = new Uint8Array(bytes.length - (bytes.length % 4));
    aligned.set(bytes.subarray(0, aligned.length));
    return new Float32Array(aligned.buffer);
  } finally {
    ffmpeg.off?.('progress', listener);
    await ffmpeg.deleteFile(inputName).catch(() => {});
    await ffmpeg.deleteFile(outputName).catch(() => {});
  }
}

/**
 * @param {File|Blob} file
 * @param {{onProgress?:(ratio:number)=>void, onNotice?:(kind:string)=>void}} [options]
 * @returns {Promise<Float32Array>} mono 16 kHz samples
 */
export async function extractAudio(file, options = {}) {
  if (!file || file.size === 0) throw new AudioExtractionError('empty file');
  try {
    options.onProgress?.(0.05);
    const samples = await decodeWithWebAudio(file);
    if (samples.length === 0) throw new AudioExtractionError('no audio track');
    options.onProgress?.(1);
    return samples;
  } catch (webAudioError) {
    try {
      const samples = await decodeWithFFmpeg(file, options);
      if (samples.length === 0) throw new AudioExtractionError('no audio track');
      options.onProgress?.(1);
      return samples;
    } catch (ffmpegError) {
      throw new AudioExtractionError(
        `Could not read the audio track (${webAudioError.message}; ${ffmpegError.message})`,
        ffmpegError,
      );
    }
  }
}

export const AUDIO_SAMPLE_RATE = SAMPLE_RATE;
