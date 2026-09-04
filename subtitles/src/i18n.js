/** Interface strings. Hebrew/RTL is the default; English/LTR stays functional. */
export const STRINGS = {
  he: {
    'app.title': 'כתוביות חינם',
    'app.tagline': 'העלו סרטון, קבלו כתוביות מדויקות בכל שפה — בחינם לגמרי',
    'badge.free': '100% חינם',
    'badge.private': 'הכל רץ בדפדפן שלכם',
    'badge.nokey': 'בלי הרשמה ובלי מפתח API',
    'lang.toggle': 'English',

    'step.1': 'שלב 1 · בחירת סרטון',
    'step.2': 'שלב 2 · הגדרות',
    'step.3': 'שלב 3 · יצירת הכתוביות',

    'drop.title': 'גררו לכאן סרטון או קובץ אודיו',
    'drop.hint': 'MP4, MOV, MKV, AVI, WEBM, MP3, WAV, M4A ועוד · הקובץ לא נשלח לשום שרת',
    'drop.button': 'בחירת קובץ',
    'file.replace': 'החלפת קובץ',
    'file.duration': 'אורך',
    'file.size': 'גודל',

    'options.model': 'מודל התמלול',
    'options.model.hint': 'מודל גדול יותר = דיוק גבוה יותר וזמן עיבוד ארוך יותר',
    'options.source': 'שפת הדיבור בסרטון',
    'options.source.auto': 'זיהוי אוטומטי',
    'options.targets': 'שפות הכתוביות',
    'options.targets.hint': 'אפשר לבחור כמה שפות בבת אחת. השפה המקורית תמיד נשמרת. תרגום ללא מתרגם מובנה בדפדפן מוריד מודל מקומי פעם אחת בגודל כ‑850MB.',
    'options.targets.search': 'חיפוש שפה…',
    'options.targets.empty': 'לא נבחרו שפות תרגום — תופק רק תמלול בשפת המקור',
    'options.engine': 'מנוע חישוב',
    'options.engine.auto': 'אוטומטי (מומלץ)',
    'options.engine.webgpu': 'WebGPU (מהיר)',
    'options.engine.wasm': 'WASM (תואם לכל דפדפן)',

    'action.generate': 'יצירת כתוביות',
    'action.cancel': 'ביטול',
    'action.again': 'הפקה מחדש',

    'stage.audio': 'מחלץ את פס הקול…',
    'stage.ffmpeg': 'טוען ממיר אודיו מורחב…',
    'stage.model': 'מוריד את המודל (פעם אחת בלבד, נשמר בדפדפן)…',
    'stage.transcribe': 'מתמלל את הסרטון…',
    'stage.detect': 'מזהה את שפת הדיבור…',
    'stage.translate': 'מתרגם כתוביות…',
    'stage.done': 'הכתוביות מוכנות',
    'stage.cancelled': 'הפעולה בוטלה',

    'result.title': 'תוצאות',
    'result.preview': 'תצוגה מקדימה',
    'result.original': 'שפת המקור',
    'result.segments': 'שורות',
    'result.edit.hint': 'אפשר לערוך כל שורה — ההורדה תכלול את השינויים',
    'download.srt': 'הורדת SRT',
    'download.vtt': 'הורדת VTT',
    'download.txt': 'הורדת טקסט',
    'download.all': 'הורדת כל השפות (SRT)',
    'copy': 'העתקה',
    'copied': 'הועתק',

    'error.nofile': 'קודם בחרו קובץ סרטון או אודיו',
    'error.generic': 'משהו השתבש',
    'error.audio': 'לא הצלחנו לקרוא את פס הקול מהקובץ',
    'note.translator.builtin': 'משתמש במתרגם המובנה של הדפדפן',
    'note.translator.model': 'משתמש במודל תרגום מקומי (הורדה חד-פעמית)',
    'note.first': 'ההורדה הראשונה של המודל לוקחת זמן. אחריה הכל עובד גם בלי אינטרנט.',
    'note.inline': 'הדפדפן לא מאפשר Web Worker כאן (קורה כשפותחים את הקובץ ישירות מהדיסק) — העיבוד ירוץ בתוך הדף, והממשק עלול להיראות תקוע בזמן העבודה.',
    'footer': 'נבנה עם Whisper ו-NLLB דרך transformers.js. שום קובץ לא עוזב את המחשב שלכם.',
  },
  en: {
    'app.title': 'Free Subtitles',
    'app.tagline': 'Upload a video, get accurate subtitles in any language — completely free',
    'badge.free': '100% free',
    'badge.private': 'Runs entirely in your browser',
    'badge.nokey': 'No sign-up, no API key',
    'lang.toggle': 'עברית',

    'step.1': 'Step 1 · Pick a video',
    'step.2': 'Step 2 · Settings',
    'step.3': 'Step 3 · Generate',

    'drop.title': 'Drop a video or audio file here',
    'drop.hint': 'MP4, MOV, MKV, AVI, WEBM, MP3, WAV, M4A and more · nothing is uploaded anywhere',
    'drop.button': 'Choose a file',
    'file.replace': 'Replace file',
    'file.duration': 'Duration',
    'file.size': 'Size',

    'options.model': 'Transcription model',
    'options.model.hint': 'Bigger model = better accuracy, longer processing',
    'options.source': 'Spoken language',
    'options.source.auto': 'Detect automatically',
    'options.targets': 'Subtitle languages',
    'options.targets.hint': 'Pick as many as you like. The original language is always kept. Without a built-in browser translator, a local model is downloaded once (~850MB).',
    'options.targets.search': 'Search a language…',
    'options.targets.empty': 'No translation selected — only the original transcript will be produced',
    'options.engine': 'Compute engine',
    'options.engine.auto': 'Automatic (recommended)',
    'options.engine.webgpu': 'WebGPU (fast)',
    'options.engine.wasm': 'WASM (works everywhere)',

    'action.generate': 'Generate subtitles',
    'action.cancel': 'Cancel',
    'action.again': 'Run again',

    'stage.audio': 'Extracting the audio track…',
    'stage.ffmpeg': 'Loading the extended audio converter…',
    'stage.model': 'Downloading the model (once only, then cached)…',
    'stage.transcribe': 'Transcribing…',
    'stage.detect': 'Detecting the spoken language…',
    'stage.translate': 'Translating subtitles…',
    'stage.done': 'Subtitles are ready',
    'stage.cancelled': 'Cancelled',

    'result.title': 'Results',
    'result.preview': 'Preview',
    'result.original': 'Original language',
    'result.segments': 'lines',
    'result.edit.hint': 'Edit any line — downloads include your changes',
    'download.srt': 'Download SRT',
    'download.vtt': 'Download VTT',
    'download.txt': 'Download text',
    'download.all': 'Download every language (SRT)',
    'copy': 'Copy',
    'copied': 'Copied',

    'error.nofile': 'Choose a video or audio file first',
    'error.generic': 'Something went wrong',
    'error.audio': 'Could not read the audio track from this file',
    'note.translator.builtin': 'Using the browser built-in translator',
    'note.translator.model': 'Using a local translation model (one-time download)',
    'note.first': 'The first model download takes a while. After that it works offline too.',
    'note.inline': 'This browser will not start a Web Worker here (typical when the file is opened straight from disk) — processing runs inside the page, so the interface may look frozen while it works.',
    'footer': 'Built with Whisper and NLLB through transformers.js. No file ever leaves your device.',
  },
};

let current = 'he';

export function setUILanguage(code) {
  current = STRINGS[code] ? code : 'he';
  return current;
}

export function getUILanguage() {
  return current;
}

export function t(key) {
  return STRINGS[current][key] ?? STRINGS.he[key] ?? key;
}

/** Fill every [data-i18n] element and [data-i18n-placeholder] input on the page. */
export function applyTranslations(root = document) {
  for (const node of root.querySelectorAll('[data-i18n]')) {
    node.textContent = t(node.dataset.i18n);
  }
  for (const node of root.querySelectorAll('[data-i18n-placeholder]')) {
    node.placeholder = t(node.dataset.i18nPlaceholder);
  }
  for (const node of root.querySelectorAll('[data-i18n-label]')) {
    node.setAttribute('aria-label', t(node.dataset.i18nLabel));
  }
}
