/**
 * Speech recognition + translation worker.
 *
 * Everything here runs on the user's own machine through WebGPU (or WASM as a
 * fallback). Models are downloaded once from the Hugging Face CDN and then kept
 * in the browser cache, so repeat runs are offline and always free.
 */

import { TRANSFORMERS_VERSION, readConfig } from './config.js';
import { appendSegments, normalizeChunks, splitLongSegments } from './subtitles.js';

const config = readConfig(self.location.search);

/**
 * transformers.js is loaded lazily so the message handler below is registered
 * synchronously: nothing sent by the page can be missed while the library (and
 * its WASM backend) is still downloading.
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

const SAMPLE_RATE = 16000;
/** Audio is transcribed in blocks so progress and partial results keep flowing. */
const BLOCK_SECONDS = 120;
/** Blocks overlap so a word spoken across a seam is not lost. */
const OVERLAP_SECONDS = 4;

const TRANSLATION_MODEL = 'Xenova/nllb-200-distilled-600M';
const TRANSLATION_BATCH = 4;

const state = {
  audio: null,
  asr: null,
  asrKey: '',
  translator: null,
};

function post(message, transfer) {
  self.postMessage(message, transfer ?? []);
}

function downloadReporter(label) {
  return (report) => {
    if (report?.status === 'progress') {
      post({
        type: 'download',
        label,
        file: report.file,
        progress: report.progress ?? 0,
        loaded: report.loaded ?? 0,
        total: report.total ?? 0,
      });
    } else if (report?.status === 'ready' || report?.status === 'done') {
      post({ type: 'download', label, file: report.file, progress: 100 });
    }
  };
}

/**
 * Precision candidates per backend, best first. Not every model repository
 * ships every variant and not every runtime accepts every graph, so a failed
 * session falls through to the next candidate instead of failing the run.
 */
const DTYPES = {
  webgpu: [{ encoder_model: 'fp32', decoder_model_merged: 'q4' }, 'fp32', 'q8'],
  wasm: ['q8', 'fp32'],
};

async function getRecognizer(model, device) {
  const key = `${model}|${device}`;
  if (state.asr && state.asrKey === key) return state.asr;
  if (state.asr) {
    try {
      await state.asr.dispose?.();
    } catch {
      /* a half-initialised pipeline can refuse to dispose; drop it either way */
    }
    state.asr = null;
  }
  const { pipeline } = await loadLibrary();
  post({ type: 'stage', stage: 'model', detail: model });

  const candidates = DTYPES[device] ?? DTYPES.wasm;
  let lastError;
  for (const dtype of candidates) {
    try {
      state.asr = await pipeline('automatic-speech-recognition', model, {
        device,
        dtype,
        progress_callback: downloadReporter('asr'),
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
  const { pipeline } = await loadLibrary();
  post({ type: 'stage', stage: 'model', detail: TRANSLATION_MODEL });
  state.translator = await pipeline('translation', TRANSLATION_MODEL, {
    dtype: 'q8',
    progress_callback: downloadReporter('mt'),
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

    const block = audio.subarray(offset, end);
    const options = {
      chunk_length_s: 30,
      stride_length_s: 5,
      return_timestamps: true,
    };
    if (language) options.language = language;

    const output = await recognizer(block, options);
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

self.addEventListener('message', async (event) => {
  const request = event.data ?? {};
  try {
    switch (request.type) {
      case 'load-audio': {
        state.audio = new Float32Array(request.audio);
        post({ type: 'audio-loaded', id: request.id, samples: state.audio.length });
        break;
      }
      case 'transcribe': {
        const segments = await transcribe(request);
        post({ type: 'transcribed', id: request.id, segments });
        break;
      }
      case 'translate': {
        const texts = await translate(request);
        post({ type: 'translated', id: request.id, texts });
        break;
      }
      case 'release-audio': {
        state.audio = null;
        post({ type: 'released', id: request.id });
        break;
      }
      default:
        throw new Error(`unknown request: ${request.type}`);
    }
  } catch (error) {
    post({ type: 'error', id: request.id, message: error?.message ?? String(error) });
  }
});

post({ type: 'ready', webgpu: typeof navigator !== 'undefined' && 'gpu' in navigator });
