/**
 * Free Subtitles — application shell.
 *
 * Pipeline: file -> 16 kHz mono samples (main thread, Web Audio or ffmpeg.wasm)
 * -> worker (Whisper) -> segments -> optional translation (browser built-in
 * translator, or NLLB in the worker) -> editable cues -> SRT/VTT/TXT.
 */

import { AUDIO_SAMPLE_RATE, extractAudio, probeDuration } from './audio.js';
import { forwardConfig } from './config.js';
import { detectLanguage } from './detect.js';
import { applyTranslations, getUILanguage, setUILanguage, t } from './i18n.js';
import { getLanguage, isRTL, languageName, sortedLanguages } from './languages.js';
import { FORMATS, formatTime, segmentAt, toSRT } from './subtitles.js';
import { createBuiltinTranslator, detectWithBrowser } from './translate.js';

const MODELS = [
  { id: 'onnx-community/whisper-tiny', he: 'זעיר — הכי מהיר, כ‑45MB', en: 'Tiny — fastest (~45MB)' },
  { id: 'onnx-community/whisper-base', he: 'בסיסי — מהיר ומדויק סביר, כ‑85MB', en: 'Base — fast, decent (~85MB)' },
  { id: 'onnx-community/whisper-small', he: 'בינוני — מומלץ, כ‑250MB', en: 'Small — recommended (~250MB)' },
  {
    id: 'onnx-community/whisper-large-v3-turbo',
    he: 'גדול Turbo — הכי מדויק, כ‑800MB, עדיף WebGPU',
    en: 'Large v3 Turbo — most accurate (~800MB, WebGPU preferred)',
  },
];

const SETTINGS_KEY = 'free-subtitles:settings';
const PHASE = { audio: [0, 0.1], transcribe: [0.1, 0.6], translate: [0.6, 1] };

const dom = {};
const state = {
  file: null,
  fileURL: '',
  duration: 0,
  audioLoaded: false,
  asrKey: '',
  sourceCode: 'en',
  tracks: new Map(),
  activeTrack: '',
  targets: new Set(['en']),
  running: false,
  cancelled: false,
  webgpu: false,
};

/* ------------------------------------------------------------------ worker */

/**
 * Two workers, not one. Speech recognition and translation each load a model
 * into a WASM heap of their own; sharing a single worker makes the second model
 * fight the first for a 32-bit address space and the run stalls.
 */
const workers = { asr: null, mt: null };
let nextRequestId = 1;
const pending = new Map();
const hooks = { progress: null, partial: null };

function ensureWorker(kind) {
  if (workers[kind]) return workers[kind];
  const url = forwardConfig(new URL('./worker.js', import.meta.url), window.location.search);
  const worker = new Worker(url, { type: 'module', name: kind });
  worker.addEventListener('message', onWorkerMessage);
  worker.addEventListener('error', (event) => {
    event.preventDefault();
    failAll(new Error(event.message || 'worker crashed'));
  });
  workers[kind] = worker;
  return worker;
}

function failAll(error) {
  for (const { reject } of pending.values()) reject(error);
  pending.clear();
}

function settle(id, value, error) {
  const entry = pending.get(id);
  if (!entry) return;
  pending.delete(id);
  error ? entry.reject(error) : entry.resolve(value);
}

function onWorkerMessage(event) {
  const message = event.data ?? {};
  switch (message.type) {
    case 'download':
      reportDownload(message);
      break;
    case 'stage':
      setStage(message.stage, message.detail);
      break;
    case 'notice':
      log(`⚠ ${message.message}`);
      break;
    case 'progress':
      hooks.progress?.(message.value);
      break;
    case 'partial':
      hooks.partial?.(message.segments ?? []);
      break;
    case 'audio-loaded':
    case 'released':
      settle(message.id, true);
      break;
    case 'transcribed':
      settle(message.id, message.segments ?? []);
      break;
    case 'translated':
      settle(message.id, message.texts ?? []);
      break;
    case 'error':
      settle(message.id, null, new Error(message.message));
      break;
    default:
      break;
  }
}

function requestFromWorker(kind, message, transfer) {
  const id = nextRequestId++;
  return new Promise((resolve, reject) => {
    pending.set(id, { resolve, reject });
    ensureWorker(kind).postMessage({ ...message, id }, transfer ?? []);
  });
}

function stopWorkers() {
  let stopped = false;
  for (const kind of Object.keys(workers)) {
    if (!workers[kind]) continue;
    workers[kind].terminate();
    workers[kind] = null;
    stopped = true;
  }
  if (!stopped) return;
  failAll(new Error('cancelled'));
  state.audioLoaded = false;
  state.asrKey = '';
}

/* -------------------------------------------------------------- ui helpers */

function log(text) {
  const item = document.createElement('li');
  item.textContent = text;
  dom.log.appendChild(item);
  dom.log.scrollTop = dom.log.scrollHeight;
}

function setStatus(text, kind = '') {
  dom.status.textContent = text;
  dom.status.className = `status ${kind}`.trim();
}

function setStage(stage, detail = '') {
  const key = `stage.${stage}`;
  dom.stageLabel.textContent = detail ? `${t(key)} ${detail}` : t(key);
}

function setProgress(value, indeterminate = false) {
  dom.barFill.classList.toggle('indeterminate', indeterminate);
  if (indeterminate) {
    dom.percent.textContent = '';
    return;
  }
  const percent = Math.round(Math.min(1, Math.max(0, value)) * 100);
  dom.barFill.style.width = `${percent}%`;
  dom.percent.textContent = `${percent}%`;
}

function phaseProgress(phase, ratio, slice = [0, 1]) {
  const [phaseStart, phaseEnd] = PHASE[phase];
  const span = phaseEnd - phaseStart;
  const start = phaseStart + span * slice[0];
  const end = phaseStart + span * slice[1];
  setProgress(start + (end - start) * Math.min(1, Math.max(0, ratio)));
}

const downloadTotals = new Map();

function reportDownload({ file, progress, loaded, total }) {
  if (!file) return;
  const percent = Math.round(progress ?? 0);
  const previous = downloadTotals.get(file) ?? -1;
  // One log line per 20% so a multi-file download stays readable.
  if (percent >= 100 && previous < 100) {
    downloadTotals.set(file, 100);
    log(`✓ ${file}`);
  } else if (percent - previous >= 20) {
    downloadTotals.set(file, percent);
    const mb = total ? ` (${(loaded / 1048576).toFixed(0)}/${(total / 1048576).toFixed(0)} MB)` : '';
    log(`⬇ ${file} — ${percent}%${mb}`);
  }
  setProgress(0, true);
}

function formatBytes(bytes) {
  const units = ['B', 'KB', 'MB', 'GB'];
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  return `${value.toFixed(value >= 10 || unit === 0 ? 0 : 1)} ${units[unit]}`;
}

function formatDuration(seconds) {
  if (!Number.isFinite(seconds) || seconds <= 0) return '—';
  const total = Math.round(seconds);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return h > 0
    ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
    : `${m}:${String(s).padStart(2, '0')}`;
}

/* ---------------------------------------------------------------- settings */

function loadSettings() {
  try {
    return JSON.parse(localStorage.getItem(SETTINGS_KEY)) ?? {};
  } catch {
    return {};
  }
}

function saveSettings() {
  try {
    localStorage.setItem(
      SETTINGS_KEY,
      JSON.stringify({
        ui: getUILanguage(),
        model: dom.model.value,
        sourceLang: dom.sourceLang.value,
        device: dom.device.value,
        targets: [...state.targets],
      }),
    );
  } catch {
    /* private mode: settings simply do not persist */
  }
}

/* ------------------------------------------------------------- form build  */

function fillModels() {
  const ui = getUILanguage();
  const selected = dom.model.value;
  dom.model.replaceChildren(
    ...MODELS.map((model) => {
      const option = document.createElement('option');
      option.value = model.id;
      option.textContent = ui === 'he' ? model.he : model.en;
      return option;
    }),
  );
  if (selected) dom.model.value = selected;
}

function fillSourceLanguages() {
  const ui = getUILanguage();
  const selected = dom.sourceLang.value;
  const auto = document.createElement('option');
  auto.value = '';
  auto.textContent = t('options.source.auto');
  dom.sourceLang.replaceChildren(
    auto,
    ...sortedLanguages(ui).map((language) => {
      const option = document.createElement('option');
      option.value = language.code;
      option.textContent = ui === 'he' ? language.he : language.en;
      return option;
    }),
  );
  dom.sourceLang.value = selected;
}

function fillDevices() {
  const selected = dom.device.value;
  dom.device.replaceChildren(
    ...[
      ['auto', t('options.engine.auto')],
      ['webgpu', t('options.engine.webgpu')],
      ['wasm', t('options.engine.wasm')],
    ].map(([value, label]) => {
      const option = document.createElement('option');
      option.value = value;
      option.textContent = label;
      return option;
    }),
  );
  dom.device.value = selected || 'auto';
}

/** `navigator.gpu` can exist while no adapter is actually available. */
async function probeWebGPU() {
  try {
    state.webgpu = Boolean(await navigator.gpu?.requestAdapter());
  } catch {
    state.webgpu = false;
  }
  updateDeviceNote();
}

function updateDeviceNote() {
  dom.deviceNote.textContent = state.webgpu ? 'WebGPU ✓' : 'WebGPU ✗ — WASM';
}

function renderTargets() {
  const ui = getUILanguage();
  const query = dom.targetSearch.value.trim().toLowerCase();
  const languages = sortedLanguages(ui).filter((language) => {
    if (!query) return true;
    return (
      language.he.toLowerCase().includes(query) ||
      language.en.toLowerCase().includes(query) ||
      language.code.includes(query)
    );
  });

  dom.targetList.replaceChildren(
    ...languages.map((language) => {
      const label = document.createElement('label');
      label.className = 'target-option';
      const input = document.createElement('input');
      input.type = 'checkbox';
      input.value = language.code;
      input.checked = state.targets.has(language.code);
      input.addEventListener('change', () => {
        input.checked ? state.targets.add(language.code) : state.targets.delete(language.code);
        renderChips();
        saveSettings();
      });
      const name = document.createElement('span');
      name.textContent = ui === 'he' ? language.he : language.en;
      const code = document.createElement('span');
      code.className = 'code';
      code.textContent = language.code;
      label.append(input, name, code);
      return label;
    }),
  );
  renderChips();
}

function renderChips() {
  const ui = getUILanguage();
  if (state.targets.size === 0) {
    const empty = document.createElement('span');
    empty.className = 'hint';
    empty.textContent = t('options.targets.empty');
    dom.targetChips.replaceChildren(empty);
    return;
  }
  dom.targetChips.replaceChildren(
    ...[...state.targets].map((code) => {
      const chip = document.createElement('span');
      chip.className = 'chip';
      chip.textContent = languageName(code, ui);
      const remove = document.createElement('button');
      remove.type = 'button';
      remove.textContent = '×';
      remove.setAttribute('aria-label', `${languageName(code, ui)} ✕`);
      remove.addEventListener('click', () => {
        state.targets.delete(code);
        renderTargets();
        saveSettings();
      });
      chip.appendChild(remove);
      return chip;
    }),
  );
}

/* -------------------------------------------------------------- file input */

async function acceptFile(file) {
  if (!file) return;
  if (state.fileURL) URL.revokeObjectURL(state.fileURL);

  state.file = file;
  state.fileURL = URL.createObjectURL(file);
  state.audioLoaded = false;
  state.asrKey = '';
  state.tracks.clear();
  stopWorkers();

  dom.fileName.textContent = file.name;
  dom.fileCard.hidden = false;
  dom.results.hidden = true;
  setStatus('');

  dom.player.src = state.fileURL;
  state.duration = await probeDuration(state.fileURL);
  dom.fileInfo.textContent = `${t('file.duration')}: ${formatDuration(state.duration)} · ${t('file.size')}: ${formatBytes(file.size)}`;
}

/* ---------------------------------------------------------------- pipeline */

function resolveDevice() {
  const choice = dom.device.value;
  if (choice === 'auto') return state.webgpu ? 'webgpu' : 'wasm';
  return choice;
}

async function translateSegments(segments, sourceCode, targetCode, slice) {
  const source = getLanguage(sourceCode);
  const target = getLanguage(targetCode);
  if (!target) return null;

  setStage('translate', `${languageName(sourceCode)} → ${languageName(targetCode)}`);
  const texts = segments.map((segment) => segment.text);

  const builtin = await createBuiltinTranslator(sourceCode, targetCode, () => setProgress(0, true));
  if (builtin) {
    log(`${t('note.translator.builtin')}: ${sourceCode} → ${targetCode}`);
    const translated = [];
    for (const text of texts) {
      if (state.cancelled) throw new Error('cancelled');
      translated.push(await builtin.translate(text));
      phaseProgress('translate', translated.length / texts.length, slice);
    }
    builtin.destroy();
    return segments.map((segment, index) => ({ ...segment, text: translated[index] }));
  }

  log(`${t('note.translator.model')}: ${sourceCode} → ${targetCode}`);
  hooks.progress = (value) => phaseProgress('translate', value, slice);
  const translated = await requestFromWorker('mt', {
    type: 'translate',
    texts,
    src: source?.nllb ?? 'eng_Latn',
    tgt: target.nllb,
  });
  hooks.progress = null;
  return segments.map((segment, index) => ({ ...segment, text: translated[index] ?? segment.text }));
}

async function generate() {
  if (state.running) return;
  if (!state.file) {
    setStatus(t('error.nofile'), 'error');
    return;
  }

  state.running = true;
  state.cancelled = false;
  dom.generate.disabled = true;
  dom.cancel.hidden = false;
  dom.progressPanel.hidden = false;
  dom.log.replaceChildren();
  downloadTotals.clear();
  setStatus('');
  setProgress(0);

  try {
    if (!state.audioLoaded) {
      setStage('audio');
      const samples = await extractAudio(state.file, {
        onProgress: (ratio) => phaseProgress('audio', ratio),
        onNotice: (kind) => {
          if (kind === 'ffmpeg') {
            setStage('ffmpeg');
            log('ffmpeg.wasm');
          }
        },
      });
      state.duration = samples.length / AUDIO_SAMPLE_RATE;
      log(`🎧 ${formatDuration(state.duration)}`);
      await requestFromWorker('asr', { type: 'load-audio', audio: samples.buffer }, [samples.buffer]);
      state.audioLoaded = true;
    }

    const model = dom.model.value;
    const sourceChoice = dom.sourceLang.value;
    const device = resolveDevice();
    const asrKey = `${model}|${sourceChoice}|${device}`;

    if (state.asrKey !== asrKey || !state.tracks.has(state.sourceCode)) {
      setStage('transcribe');
      const preview = [];
      hooks.progress = (value) => phaseProgress('transcribe', value);
      hooks.partial = (segments) => {
        preview.push(...segments);
        setStatus(preview.slice(-1)[0]?.text ?? '');
      };
      let segments;
      try {
        segments = await requestFromWorker('asr', {
          type: 'transcribe',
          model,
          device,
          language: sourceChoice || undefined,
        });
      } catch (error) {
        // WebGPU can be present but unusable (driver, memory, shader limits).
        // An automatic choice retries on WASM rather than failing the run.
        if (device !== 'webgpu' || dom.device.value !== 'auto' || state.cancelled) throw error;
        state.webgpu = false;
        updateDeviceNote();
        log(`⚠ WebGPU → WASM (${error.message})`);
        segments = await requestFromWorker('asr', {
          type: 'transcribe',
          model,
          device: 'wasm',
          language: sourceChoice || undefined,
        });
      }
      hooks.progress = null;
      hooks.partial = null;
      if (segments.length === 0) throw new Error(t('error.audio'));

      const transcriptSample = segments
        .slice(0, 60)
        .map((segment) => segment.text)
        .join(' ');
      if (sourceChoice) {
        state.sourceCode = sourceChoice;
      } else {
        setStage('detect');
        const fromBrowser = await detectWithBrowser(transcriptSample);
        state.sourceCode = getLanguage(fromBrowser) ? fromBrowser : detectLanguage(transcriptSample);
      }

      state.tracks.clear();
      state.tracks.set(state.sourceCode, segments);
      state.activeTrack = state.sourceCode;
      state.asrKey = asrKey;
      log(`📝 ${segments.length} ${t('result.segments')} · ${languageName(state.sourceCode)}`);
      renderResults();
    }

    const originals = state.tracks.get(state.sourceCode) ?? [];
    const targets = [...state.targets].filter((code) => code !== state.sourceCode && !state.tracks.has(code));

    for (let index = 0; index < targets.length; index += 1) {
      if (state.cancelled) throw new Error('cancelled');
      const slice = [index / targets.length, (index + 1) / targets.length];
      const translated = await translateSegments(originals, state.sourceCode, targets[index], slice);
      if (translated) {
        state.tracks.set(targets[index], translated);
        log(`🌍 ${languageName(targets[index])}`);
        renderResults();
      }
    }

    setProgress(1);
    setStage('done');
    setStatus(t('stage.done'), 'done');
    dom.generate.textContent = t('action.again');
  } catch (error) {
    if (state.cancelled || error?.message === 'cancelled') {
      setStage('cancelled');
      setStatus(t('stage.cancelled'));
    } else {
      console.error(error);
      setStatus(`${t('error.generic')}: ${error?.message ?? error}`, 'error');
    }
  } finally {
    hooks.progress = null;
    hooks.partial = null;
    state.running = false;
    dom.generate.disabled = false;
    dom.cancel.hidden = true;
  }
}

function cancel() {
  if (!state.running) return;
  state.cancelled = true;
  stopWorkers();
}

/* ----------------------------------------------------------------- results */

function activeSegments() {
  return state.tracks.get(state.activeTrack) ?? [];
}

/** "12:34" for short media, "01:12:34" once the hour matters. */
function shortTime(seconds) {
  const full = formatTime(seconds, '.').slice(0, 8);
  return seconds >= 3600 ? full : full.slice(3);
}

function renderResults() {
  if (state.tracks.size === 0) return;
  dom.results.hidden = false;
  if (!state.tracks.has(state.activeTrack)) state.activeTrack = [...state.tracks.keys()][0];

  const ui = getUILanguage();
  dom.tabs.replaceChildren(
    ...[...state.tracks.keys()].map((code) => {
      const tab = document.createElement('button');
      tab.type = 'button';
      tab.className = 'tab';
      tab.role = 'tab';
      tab.setAttribute('aria-selected', String(code === state.activeTrack));
      const suffix = code === state.sourceCode ? ` · ${t('result.original')}` : '';
      tab.textContent = `${languageName(code, ui)}${suffix}`;
      tab.addEventListener('click', () => {
        state.activeTrack = code;
        renderResults();
      });
      return tab;
    }),
  );

  const segments = activeSegments();
  const rtl = isRTL(state.activeTrack);
  dom.overlay.dir = rtl ? 'rtl' : 'ltr';

  dom.cues.replaceChildren(
    ...segments.map((segment, index) => {
      const item = document.createElement('li');
      item.className = 'cue';
      item.dataset.index = String(index);

      const time = document.createElement('button');
      time.type = 'button';
      time.className = 'cue-time';
      // A time range always reads left to right, even inside an RTL page.
      time.dir = 'ltr';
      time.textContent = `${shortTime(segment.start)} → ${shortTime(segment.end)}`;
      time.addEventListener('click', () => {
        dom.player.currentTime = segment.start;
        dom.player.play().catch(() => {});
      });

      const text = document.createElement('textarea');
      text.value = segment.text;
      text.rows = 2;
      text.dir = rtl ? 'rtl' : 'ltr';
      text.addEventListener('input', () => {
        segment.text = text.value;
      });

      item.append(time, text);
      return item;
    }),
  );
}

function downloadBlob(content, filename, mime) {
  const url = URL.createObjectURL(new Blob([content], { type: mime }));
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

function baseName() {
  return (state.file?.name ?? 'subtitles').replace(/\.[^.]+$/, '');
}

function download(format) {
  const segments = activeSegments();
  if (segments.length === 0) return;
  const spec = FORMATS[format];
  downloadBlob(spec.build(segments), `${baseName()}.${state.activeTrack}.${spec.extension}`, spec.mime);
}

async function downloadEveryLanguage() {
  for (const [code, segments] of state.tracks) {
    downloadBlob(toSRT(segments), `${baseName()}.${code}.srt`, FORMATS.srt.mime);
    await new Promise((resolve) => setTimeout(resolve, 350));
  }
}

async function copyActive() {
  const segments = activeSegments();
  if (segments.length === 0) return;
  try {
    await navigator.clipboard.writeText(toSRT(segments));
    const original = dom.copy.textContent;
    dom.copy.textContent = t('copied');
    setTimeout(() => {
      dom.copy.textContent = original;
    }, 1500);
  } catch {
    setStatus(t('error.generic'), 'error');
  }
}

/* --------------------------------------------------------- subtitle overlay */

let overlayFrame = 0;
let lastCueIndex = -1;

function syncOverlay() {
  const segments = activeSegments();
  const index = segmentAt(segments, dom.player.currentTime);
  if (index !== lastCueIndex) {
    lastCueIndex = index;
    dom.overlay.textContent = index >= 0 ? segments[index].text : '';
    for (const node of dom.cues.children) node.classList.remove('active');
    if (index >= 0) {
      const row = dom.cues.children[index];
      row?.classList.add('active');
      // Only follow along during playback, so editing is never yanked away.
      if (!dom.player.paused) row?.scrollIntoView({ block: 'nearest' });
    }
  }
  overlayFrame = requestAnimationFrame(syncOverlay);
}

/* --------------------------------------------------------------- bootstrap */

function switchUILanguage() {
  const next = getUILanguage() === 'he' ? 'en' : 'he';
  setUILanguage(next);
  document.documentElement.lang = next;
  document.documentElement.dir = next === 'he' ? 'rtl' : 'ltr';
  applyTranslations();
  fillModels();
  fillSourceLanguages();
  fillDevices();
  renderTargets();
  if (state.tracks.size) renderResults();
  if (state.file) {
    dom.fileInfo.textContent = `${t('file.duration')}: ${formatDuration(state.duration)} · ${t('file.size')}: ${formatBytes(state.file.size)}`;
  }
  saveSettings();
}

function bindDropzone() {
  const stop = (event) => {
    event.preventDefault();
    event.stopPropagation();
  };
  for (const type of ['dragenter', 'dragover']) {
    dom.drop.addEventListener(type, (event) => {
      stop(event);
      dom.drop.classList.add('dragging');
    });
  }
  for (const type of ['dragleave', 'drop']) {
    dom.drop.addEventListener(type, (event) => {
      stop(event);
      dom.drop.classList.remove('dragging');
    });
  }
  dom.drop.addEventListener('drop', (event) => acceptFile(event.dataTransfer?.files?.[0]));
  dom.drop.addEventListener('click', () => dom.fileInput.click());
  dom.drop.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      dom.fileInput.click();
    }
  });
  dom.fileReplace.addEventListener('click', () => dom.fileInput.click());
  dom.fileInput.addEventListener('change', () => acceptFile(dom.fileInput.files?.[0]));
}

function init() {
  Object.assign(dom, {
    uiLang: document.getElementById('ui-lang'),
    drop: document.getElementById('drop'),
    fileInput: document.getElementById('file-input'),
    fileCard: document.getElementById('file-card'),
    fileName: document.getElementById('file-name'),
    fileInfo: document.getElementById('file-info'),
    fileReplace: document.getElementById('file-replace'),
    model: document.getElementById('model'),
    sourceLang: document.getElementById('source-lang'),
    device: document.getElementById('device'),
    deviceNote: document.getElementById('device-note'),
    targetSearch: document.getElementById('target-search'),
    targetList: document.getElementById('target-list'),
    targetChips: document.getElementById('target-chips'),
    generate: document.getElementById('generate'),
    cancel: document.getElementById('cancel'),
    progressPanel: document.getElementById('progress-panel'),
    stageLabel: document.getElementById('stage-label'),
    percent: document.getElementById('progress-percent'),
    barFill: document.getElementById('bar-fill'),
    log: document.getElementById('log'),
    status: document.getElementById('status'),
    results: document.getElementById('results'),
    player: document.getElementById('player'),
    overlay: document.getElementById('overlay'),
    tabs: document.getElementById('tabs'),
    cues: document.getElementById('cues'),
    copy: document.getElementById('copy'),
  });

  const saved = loadSettings();
  setUILanguage(saved.ui ?? 'he');
  document.documentElement.lang = getUILanguage();
  document.documentElement.dir = getUILanguage() === 'he' ? 'rtl' : 'ltr';
  if (Array.isArray(saved.targets)) state.targets = new Set(saved.targets.filter(getLanguage));

  applyTranslations();
  fillModels();
  fillSourceLanguages();
  fillDevices();

  dom.model.value = saved.model ?? ('gpu' in navigator ? 'onnx-community/whisper-small' : 'onnx-community/whisper-base');
  if (!dom.model.value) dom.model.value = MODELS[1].id;
  dom.sourceLang.value = saved.sourceLang ?? '';
  dom.device.value = saved.device ?? 'auto';
  probeWebGPU();
  renderTargets();

  bindDropzone();
  dom.uiLang.addEventListener('click', switchUILanguage);
  dom.targetSearch.addEventListener('input', renderTargets);
  dom.generate.addEventListener('click', generate);
  dom.cancel.addEventListener('click', cancel);
  dom.model.addEventListener('change', saveSettings);
  dom.sourceLang.addEventListener('change', saveSettings);
  dom.device.addEventListener('change', saveSettings);
  document.getElementById('download-srt').addEventListener('click', () => download('srt'));
  document.getElementById('download-vtt').addEventListener('click', () => download('vtt'));
  document.getElementById('download-txt').addEventListener('click', () => download('txt'));
  document.getElementById('download-all').addEventListener('click', downloadEveryLanguage);
  dom.copy.addEventListener('click', copyActive);

  cancelAnimationFrame(overlayFrame);
  overlayFrame = requestAnimationFrame(syncOverlay);

  // Warm the recognition worker so its library is ready before the first run.
  ensureWorker('asr');
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init, { once: true });
} else {
  init();
}
