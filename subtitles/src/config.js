/**
 * Where the app fetches its runtime pieces from.
 *
 * By default everything comes from public CDNs, which is what makes the app a
 * single static folder anyone can host for free. Both bases can be overridden
 * with query parameters so the whole thing can also run fully self-hosted or
 * air-gapped:
 *
 *   index.html?cdn=/vendor&models=/models/
 *
 *   cdn    - base URL that mirrors the npm registry layout
 *            (<cdn>/@huggingface/transformers@<version>/dist/transformers.min.js)
 *   models - base URL for model repositories, Hugging Face layout
 *            (<models><repo>/resolve/main/<file>)
 */

// Pinned deliberately: the onnxruntime build bundled with transformers.js 4.x
// fails to create a Whisper session on the WASM backend
// ("TransposeDQWeightsForMatMulNBits: missing required scale"), which is the
// backend every browser without WebGPU falls back to.
export const TRANSFORMERS_VERSION = '3.8.1';
export const FFMPEG_VERSION = '0.12.15';
export const FFMPEG_CORE_VERSION = '0.12.10';
export const FFMPEG_UTIL_VERSION = '0.12.2';

const DEFAULT_CDN = 'https://cdn.jsdelivr.net/npm';

function stripTrailingSlash(value) {
  return value.replace(/\/+$/, '');
}

export function readConfig(search = '') {
  const params = new URLSearchParams(search);
  return {
    cdn: stripTrailingSlash(params.get('cdn') || DEFAULT_CDN),
    customCDN: Boolean(params.get('cdn')),
    // transformers.js expects a trailing slash on the model host.
    models: params.get('models') ? `${stripTrailingSlash(params.get('models'))}/` : '',
  };
}
