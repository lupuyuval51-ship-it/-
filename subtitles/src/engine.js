/**
 * Recognition + translation engine.
 *
 * The build concatenates this file after the shared module (config, languages,
 * subtitle helpers) and after a one-line preamble that defines ENGINE_SEARCH,
 * so the whole thing becomes a single JavaScript module. That module is used
 * two ways:
 *
 *   - as a Web Worker, the normal path: the bootstrap at the bottom wires the
 *     message port to an engine instance;
 *   - imported directly by the page, the fallback for `file://` pages where
 *     browsers refuse to start a worker from a blob URL. Then the page calls
 *     `createEngine()` itself and talks to it through plain function calls.
 *
 * Everything runs on the user's own machine, over WebGPU when it is usable and
 * WASM otherwise. Models are fetched once and then served from the browser
 * cache, so repeat runs cost nothing and work offline.
 */

import { TRANSFORMERS_VERSION, readConfig } from './config.js';
import { appendSegments, normalizeChunks, splitLongSegments } from './subtitles.js';

const config = readConfig(ENGINE_SEARCH);

const SAMPLE_RATE = 16000;
/** Audio is transcribed in blocks so progress and partial results keep flowing. */
const BLOCK_SECONDS = 120;
/** Blocks overlap so a word spoken across a seam is not lost. */
const OVERLAP_SECONDS = 4;

const TRANSLATION_MODEL = 'Xenova/nllb-200-distilled-600M';
const TRANSLATION_BATCH = 4;

/**
 * Precision candidates per backend, best first. Not every model repository
 * ships every variant and not every runtime accepts every graph, so a failed
 * session falls through to the next candidate instead of failing the run.
 */
const DTYPES = {
  webgpu: [{ encoder_model: 'fp32', decoder_model_merged: 'q4' }, 'fp32', 'q8'],
  wasm: ['q8', 'fp32'],
};

/**
 * transformers.js is loaded on first use rather than at module evaluation, so
 * an engine is ready to receive messages while its library is still arriving.
 * Shared across engines on purpose: it is the model sessions that must stay
 * apart, not the library itself.
 */
let libraryPromise = null;
function loadLibrary() {
  libraryPromise ??= import(
    `${config.cdn}/@huggingface/transformers@${TRANSFORMERS_VERSION}/dist/transformers.min.js`
  ).then((library) => {
    library.env.allowLocalModels = false;
    if (config.models) library.env.remoteHost = config.models;
    if (config.customCDN) {
      // The ONNX runtime resolves its own WASM binaries against jsDelivr; point
      // those at the mirror too, otherwise a self-hosted install still reaches out.
      const onnx = library.env.backends?.onnx;
      if (onnx?.wasm) {
        onnx.wasm.wasmPaths = `${config.cdn}/@huggingface/transformers@${TRANSFORMERS_VERSION}/dist/`;
      }
    }
    return library;
  });
  return libraryPromise;
}

/**
 * @param {(message: object, transfer?: Transferable[]) => void} post
 * @returns {(request: object) => Promise<void>} handler for one request
 */
export function createEngine(post) {
  const state = { audio: null, asr: null, asrKey: '', translator: null };

  function downloadReporter() {
    return (report) => {
      if (report?.status === 'progress') {
        post({
          type: 'download',
          file: report.file,
          progress: report.progress ?? 0,
          loaded: report.loaded ?? 0,
          total: report.total ?? 0,
        });
      } else if (report?.status === 'ready' || report?.status === 'done') {
        post({ type: 'download', file: report.file, progress: 100 });
      }
    };
  }

  async function disposeRecognizer() {
    if (!state.asr) return;
    try {
      await state.asr.dispose?.();
    } catch {
      /* a half-initialised pipeline can refuse to dispose; drop it either way */
    }
    state.asr = null;
    state.asrKey = '';
  }

  async function getRecognizer(model, device) {
    const key = `${model}|${device}`;
    if (state.asr && state.asrKey === key) return state.asr;
    await disposeRecognizer();

    const { pipeline } = await loadLibrary();
    post({ type: 'stage', stage: 'model', detail: model });

    const candidates = DTYPES[device] ?? DTYPES.wasm;
    let lastError;
    for (const dtype of candidates) {
      try {
        state.asr = await pipeline('automatic-speech-recognition', model, {
          device,
          dtype,
          progress_callback: downloadReporter(),
        });
        state.asrKey = key;
        return state.asr;
      } catch (error) {
        lastError = error;
        post({ type: 'notice', message: `${JSON.stringify(dtype)} → ${error.message}` });
      }
    }
    throw lastError ?? new Error('could not load the model');
  }

  async function getTranslator() {
    if (state.translator) return state.translator;
    // When one engine serves both jobs (the no-worker fallback), the speech
    // model has to go before the translation model arrives: two of them in one
    // 32-bit WASM heap is what makes a run stall.
    await disposeRecognizer();

    const { pipeline } = await loadLibrary();
    post({ type: 'stage', stage: 'model', detail: TRANSLATION_MODEL });
    state.translator = await pipeline('translation', TRANSLATION_MODEL, {
      dtype: 'q8',
      progress_callback: downloadReporter(),
    });
    return state.translator;
  }

  async function transcribe({ model, device, language }) {
    const audio = state.audio;
    if (!audio || audio.length === 0) throw new Error('no audio loaded');

    const recognizer = await getRecognizer(model, device);
    const duration = audio.length / SAMPLE_RATE;
    const blockSamples = BLOCK_SECONDS * SAMPLE_RATE;
    const overlapSamples = OVERLAP_SECONDS * SAMPLE_RATE;
    const step = blockSamples - overlapSamples;

    post({ type: 'stage', stage: 'transcribe', detail: '' });

    const segments = [];
    for (let offset = 0; offset < audio.length; offset += step) {
      const end = Math.min(offset + blockSamples, audio.length);
      // A sliver shorter than the overlap holds nothing the previous block missed.
      if (offset > 0 && end - offset < overlapSamples) break;

      const options = { chunk_length_s: 30, stride_length_s: 5, return_timestamps: true };
      if (language) options.language = language;

      const output = await recognizer(audio.subarray(offset, end), options);
      const chunks =
        Array.isArray(output?.chunks) && output.chunks.length > 0
          ? output.chunks
          : [{ timestamp: [0, (end - offset) / SAMPLE_RATE], text: output?.text ?? '' }];

      const blockSegments = splitLongSegments(
        normalizeChunks(chunks, { offset: offset / SAMPLE_RATE, duration }),
      );
      const before = segments.length;
      appendSegments(segments, blockSegments);

      post({ type: 'partial', segments: segments.slice(before) });
      post({ type: 'progress', value: Math.min(1, end / audio.length) });

      if (end >= audio.length) break;
    }

    return segments;
  }

  async function translate({ texts, src, tgt }) {
    const translator = await getTranslator();
    post({ type: 'stage', stage: 'translate', detail: `${src} → ${tgt}` });

    const results = [];
    for (let i = 0; i < texts.length; i += TRANSLATION_BATCH) {
      const batch = texts.slice(i, i + TRANSLATION_BATCH);
      let output;
      try {
        output = await translator(batch, { src_lang: src, tgt_lang: tgt, max_new_tokens: 256 });
      } catch {
        // Padding a mixed-length batch can fail on some backends; fall back to one at a time.
        output = [];
        for (const text of batch) {
          const single = await translator(text, { src_lang: src, tgt_lang: tgt, max_new_tokens: 256 });
          output.push(Array.isArray(single) ? single[0] : single);
        }
      }
      const list = Array.isArray(output) ? output : [output];
      for (let j = 0; j < batch.length; j += 1) {
        results.push(list[j]?.translation_text ?? batch[j]);
      }
      post({ type: 'progress', value: Math.min(1, results.length / texts.length) });
    }
    return results;
  }

  return async function handle(request = {}) {
    try {
      switch (request.type) {
        case 'load-audio':
          state.audio = new Float32Array(request.audio);
          post({ type: 'audio-loaded', id: request.id, samples: state.audio.length });
          break;
        case 'transcribe':
          post({ type: 'transcribed', id: request.id, segments: await transcribe(request) });
          break;
        case 'translate':
          post({ type: 'translated', id: request.id, texts: await translate(request) });
          break;
        case 'release':
          await disposeRecognizer();
          state.audio = null;
          post({ type: 'released', id: request.id });
          break;
        default:
          throw new Error(`unknown request: ${request.type}`);
      }
    } catch (error) {
      post({ type: 'error', id: request.id, message: error?.message ?? String(error) });
    }
  };
}

// Worker bootstrap. Skipped when the page imports this module directly.
if (typeof WorkerGlobalScope !== 'undefined' && self instanceof WorkerGlobalScope) {
  const handle = createEngine((message, transfer) => self.postMessage(message, transfer ?? []));
  self.addEventListener('message', (event) => handle(event.data));
  self.postMessage({ type: 'ready' });
}
