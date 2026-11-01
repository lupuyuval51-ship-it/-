/** Catalogue of languages offered for machine translation. `native` is the endonym (data only); `en` is the English name. */
export interface LangInfo { code: string; native: string; en: string; rtl?: true }

export const LANGUAGES_LIST: LangInfo[] = [
  { code: 'ar', native: 'العربية', en: 'Arabic', rtl: true }, { code: 'fa', native: 'فارسی', en: 'Persian', rtl: true }, { code: 'ur', native: 'اردو', en: 'Urdu', rtl: true },
  { code: 'yi', native: 'ייִדיש', en: 'Yiddish', rtl: true }, { code: 'ps', native: 'پښتو', en: 'Pashto', rtl: true }, { code: 'ckb', native: 'کوردیی ناوەندی', en: 'Central Kurdish (Sorani)', rtl: true },
  { code: 'es', native: 'Español', en: 'Spanish' }, { code: 'fr', native: 'Français', en: 'French' }, { code: 'de', native: 'Deutsch', en: 'German' }, { code: 'it', native: 'Italiano', en: 'Italian' },
  { code: 'pt', native: 'Português', en: 'Portuguese' }, { code: 'tr', native: 'Türkçe', en: 'Turkish' }, { code: 'pl', native: 'Polski', en: 'Polish' }, { code: 'uk', native: 'Українська', en: 'Ukrainian' },
  { code: 'ru', native: 'Русский', en: 'Russian' }, { code: 'nl', native: 'Nederlands', en: 'Dutch' }, { code: 'sv', native: 'Svenska', en: 'Swedish' }, { code: 'no', native: 'Norsk', en: 'Norwegian' },
  { code: 'da', native: 'Dansk', en: 'Danish' }, { code: 'fi', native: 'Suomi', en: 'Finnish' }, { code: 'cs', native: 'Čeština', en: 'Czech' }, { code: 'sk', native: 'Slovenčina', en: 'Slovak' },
  { code: 'hu', native: 'Magyar', en: 'Hungarian' }, { code: 'ro', native: 'Română', en: 'Romanian' }, { code: 'bg', native: 'Български', en: 'Bulgarian' }, { code: 'el', native: 'Ελληνικά', en: 'Greek' },
  { code: 'sr', native: 'Српски', en: 'Serbian' }, { code: 'hr', native: 'Hrvatski', en: 'Croatian' }, { code: 'sl', native: 'Slovenščina', en: 'Slovenian' }, { code: 'lt', native: 'Lietuvių', en: 'Lithuanian' },
  { code: 'lv', native: 'Latviešu', en: 'Latvian' }, { code: 'et', native: 'Eesti', en: 'Estonian' }, { code: 'ka', native: 'ქართული', en: 'Georgian' }, { code: 'hy', native: 'Հայերեն', en: 'Armenian' },
  { code: 'az', native: 'Azərbaycanca', en: 'Azerbaijani' }, { code: 'kk', native: 'Қазақша', en: 'Kazakh' }, { code: 'uz', native: 'Oʻzbekcha', en: 'Uzbek' },
  { code: 'hi', native: 'हिन्दी', en: 'Hindi' }, { code: 'bn', native: 'বাংলা', en: 'Bengali' }, { code: 'pa', native: 'ਪੰਜਾਬੀ', en: 'Punjabi' }, { code: 'gu', native: 'ગુજરાતી', en: 'Gujarati' },
  { code: 'mr', native: 'मराठी', en: 'Marathi' }, { code: 'ta', native: 'தமிழ்', en: 'Tamil' }, { code: 'te', native: 'తెలుగు', en: 'Telugu' }, { code: 'kn', native: 'ಕನ್ನಡ', en: 'Kannada' },
  { code: 'ml', native: 'മലയാളം', en: 'Malayalam' }, { code: 'ne', native: 'नेपाली', en: 'Nepali' }, { code: 'si', native: 'සිංහල', en: 'Sinhala' },
  { code: 'zh', native: '中文（简体）', en: 'Chinese (Simplified)' }, { code: 'zh-TW', native: '中文（繁體）', en: 'Chinese (Traditional)' }, { code: 'ja', native: '日本語', en: 'Japanese' }, { code: 'ko', native: '한국어', en: 'Korean' },
  { code: 'th', native: 'ไทย', en: 'Thai' }, { code: 'vi', native: 'Tiếng Việt', en: 'Vietnamese' }, { code: 'id', native: 'Bahasa Indonesia', en: 'Indonesian' }, { code: 'ms', native: 'Bahasa Melayu', en: 'Malay' },
  { code: 'fil', native: 'Filipino', en: 'Filipino' }, { code: 'km', native: 'ខ្មែរ', en: 'Khmer' }, { code: 'my', native: 'မြန်မာ', en: 'Burmese' },
  { code: 'sw', native: 'Kiswahili', en: 'Swahili' }, { code: 'am', native: 'አማርኛ', en: 'Amharic' }, { code: 'af', native: 'Afrikaans', en: 'Afrikaans' }, { code: 'zu', native: 'isiZulu', en: 'Zulu' },
  { code: 'ha', native: 'Hausa', en: 'Hausa' }, { code: 'ca', native: 'Català', en: 'Catalan' }, { code: 'eu', native: 'Euskara', en: 'Basque' }, { code: 'gl', native: 'Galego', en: 'Galician' },
  { code: 'is', native: 'Íslenska', en: 'Icelandic' }, { code: 'ga', native: 'Gaeilge', en: 'Irish' }, { code: 'cy', native: 'Cymraeg', en: 'Welsh' }, { code: 'sq', native: 'Shqip', en: 'Albanian' },
  { code: 'mk', native: 'Македонски', en: 'Macedonian' }, { code: 'be', native: 'Беларуская', en: 'Belarusian' }, { code: 'mn', native: 'Монгол', en: 'Mongolian' },
];

const RTL_PRIMARY = new Set(['ar', 'fa', 'ur', 'yi', 'ps', 'ckb', 'he', 'sd', 'ug', 'dv', 'ku']);
export const isRtlCode = (code: string): boolean => RTL_PRIMARY.has(code.toLowerCase().split('-')[0] ?? '');
export const dirFor = (code: string): 'rtl' | 'ltr' => (isRtlCode(code) ? 'rtl' : 'ltr');

const norm = (s: string): string => s.normalize('NFKD').replace(/\p{M}+/gu, '').toLowerCase().trim();
export function searchLanguages(q: string, list: LangInfo[] = LANGUAGES_LIST): LangInfo[] {
  const n = norm(q);
  if (!n) return list;
  return list.filter((l) => norm(l.native).includes(n) || norm(l.en).includes(n) || l.code.toLowerCase().startsWith(n));
}

/** Free-text language names get a stable `x-<slug>` code (letters of any script kept). Returns null when the name is unusable. */
export function customCode(name: string): { code: string; name: string } | null {
  const clean = name.trim().replace(/\s+/g, ' ');
  if (!/^[\p{L}\p{M}\p{N} .'()-]{2,60}$/u.test(clean)) return null;
  const ascii = norm(clean).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 30);
  let h = 0; for (const ch of clean.toLowerCase()) h = (Math.imul(h, 31) + ch.codePointAt(0)!) >>> 0;
  return { code: `x-${ascii ? `${ascii}-` : ''}${h.toString(36)}`.slice(0, 42), name: clean };
}
