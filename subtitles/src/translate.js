/**
 * Browser-native translation, used when the platform offers it.
 *
 * Chrome ships an on-device Translator (and LanguageDetector) behind
 * `window.Translator`. When it is available for a language pair it is the best
 * option by far: no 850 MB model download and near-instant per-line output. The
 * worker's NLLB model is the portable fallback for everyone else.
 *
 * Both entry points are time-boxed. `Translator.create()` may block while the
 * browser fetches its own translation pack — that download can be slow, can
 * need a user gesture, and never reports failure — so a run that waits on it
 * would simply hang. When the budget runs out we fall back instead of waiting.
 */

const CREATE_TIMEOUT_MS = 25000;
const DETECT_TIMEOUT_MS = 10000;

/** Resolves to `null` if `promise` has not settled within `ms`. */
function withTimeout(promise, ms) {
  return Promise.race([
    promise,
    new Promise((resolve) => setTimeout(() => resolve(null), ms)),
  ]);
}

function hasTranslator() {
  return typeof globalThis.Translator?.availability === 'function';
}

async function buildTranslator(source, target, onDownload) {
  const availability = await globalThis.Translator.availability({
    sourceLanguage: source,
    targetLanguage: target,
  });
  if (!availability || availability === 'unavailable') return null;

  const instance = await globalThis.Translator.create({
    sourceLanguage: source,
    targetLanguage: target,
    monitor(monitor) {
      monitor.addEventListener('downloadprogress', (event) => onDownload?.(event.loaded ?? 0));
    },
  });
  // Prove the pair really works before the caller commits a whole track to it.
  await instance.translate('ok');
  return instance;
}

/**
 * @returns {Promise<null | {translate(text:string):Promise<string>, destroy():void}>}
 *          null when the platform cannot translate this pair on-device.
 */
export async function createBuiltinTranslator(source, target, onDownload) {
  if (!hasTranslator() || source === target) return null;
  let instance = null;
  try {
    instance = await withTimeout(buildTranslator(source, target, onDownload), CREATE_TIMEOUT_MS);
  } catch {
    return null;
  }
  if (!instance) return null;

  return {
    async translate(text) {
      const output = await instance.translate(text);
      return typeof output === 'string' && output ? output : text;
    },
    destroy() {
      instance.destroy?.();
    },
  };
}

/** Best-effort language identification through the platform, if it has one. */
export async function detectWithBrowser(text) {
  try {
    const Detector = globalThis.LanguageDetector;
    if (typeof Detector?.availability !== 'function') return null;

    const best = await withTimeout(
      (async () => {
        if ((await Detector.availability()) !== 'available') return null;
        const detector = await Detector.create();
        const results = await detector.detect(text.slice(0, 2000));
        detector.destroy?.();
        return results?.[0] ?? null;
      })(),
      DETECT_TIMEOUT_MS,
    );

    if (!best || best.confidence < 0.5) return null;
    return String(best.detectedLanguage).split('-')[0];
  } catch {
    return null;
  }
}
