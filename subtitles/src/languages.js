/**
 * Language table.
 *
 * `code`  - ISO-639-1 code used by Whisper for transcription and by the browser's
 *           built-in Translator API (BCP-47 compatible for these entries).
 * `nllb`  - FLORES-200 code used by the offline NLLB translation model.
 * `he`/`en` - display names.
 * `rtl`   - right-to-left script (affects subtitle preview direction).
 *
 * Every entry is supported both as a transcription source (Whisper) and as a
 * translation target (NLLB), so any pair in this table is a valid job.
 */
export const LANGUAGES = [
  { code: 'he', nllb: 'heb_Hebr', he: 'עברית', en: 'Hebrew', rtl: true },
  { code: 'en', nllb: 'eng_Latn', he: 'אנגלית', en: 'English' },
  { code: 'ar', nllb: 'arb_Arab', he: 'ערבית', en: 'Arabic', rtl: true },
  { code: 'ru', nllb: 'rus_Cyrl', he: 'רוסית', en: 'Russian' },
  { code: 'es', nllb: 'spa_Latn', he: 'ספרדית', en: 'Spanish' },
  { code: 'fr', nllb: 'fra_Latn', he: 'צרפתית', en: 'French' },
  { code: 'de', nllb: 'deu_Latn', he: 'גרמנית', en: 'German' },
  { code: 'pt', nllb: 'por_Latn', he: 'פורטוגזית', en: 'Portuguese' },
  { code: 'it', nllb: 'ita_Latn', he: 'איטלקית', en: 'Italian' },
  { code: 'nl', nllb: 'nld_Latn', he: 'הולנדית', en: 'Dutch' },
  { code: 'pl', nllb: 'pol_Latn', he: 'פולנית', en: 'Polish' },
  { code: 'uk', nllb: 'ukr_Cyrl', he: 'אוקראינית', en: 'Ukrainian' },
  { code: 'tr', nllb: 'tur_Latn', he: 'טורקית', en: 'Turkish' },
  { code: 'fa', nllb: 'pes_Arab', he: 'פרסית', en: 'Persian', rtl: true },
  { code: 'zh', nllb: 'zho_Hans', he: 'סינית', en: 'Chinese' },
  { code: 'ja', nllb: 'jpn_Jpan', he: 'יפנית', en: 'Japanese' },
  { code: 'ko', nllb: 'kor_Hang', he: 'קוריאנית', en: 'Korean' },
  { code: 'hi', nllb: 'hin_Deva', he: 'הינדי', en: 'Hindi' },
  { code: 'bn', nllb: 'ben_Beng', he: 'בנגלית', en: 'Bengali' },
  { code: 'ur', nllb: 'urd_Arab', he: 'אורדו', en: 'Urdu', rtl: true },
  { code: 'id', nllb: 'ind_Latn', he: 'אינדונזית', en: 'Indonesian' },
  { code: 'ms', nllb: 'zsm_Latn', he: 'מלאית', en: 'Malay' },
  { code: 'vi', nllb: 'vie_Latn', he: 'ויאטנמית', en: 'Vietnamese' },
  { code: 'th', nllb: 'tha_Thai', he: 'תאילנדית', en: 'Thai' },
  { code: 'el', nllb: 'ell_Grek', he: 'יוונית', en: 'Greek' },
  { code: 'cs', nllb: 'ces_Latn', he: 'צ׳כית', en: 'Czech' },
  { code: 'sk', nllb: 'slk_Latn', he: 'סלובקית', en: 'Slovak' },
  { code: 'hu', nllb: 'hun_Latn', he: 'הונגרית', en: 'Hungarian' },
  { code: 'ro', nllb: 'ron_Latn', he: 'רומנית', en: 'Romanian' },
  { code: 'bg', nllb: 'bul_Cyrl', he: 'בולגרית', en: 'Bulgarian' },
  { code: 'sr', nllb: 'srp_Cyrl', he: 'סרבית', en: 'Serbian' },
  { code: 'hr', nllb: 'hrv_Latn', he: 'קרואטית', en: 'Croatian' },
  { code: 'bs', nllb: 'bos_Latn', he: 'בוסנית', en: 'Bosnian' },
  { code: 'sl', nllb: 'slv_Latn', he: 'סלובנית', en: 'Slovenian' },
  { code: 'mk', nllb: 'mkd_Cyrl', he: 'מקדונית', en: 'Macedonian' },
  { code: 'sq', nllb: 'als_Latn', he: 'אלבנית', en: 'Albanian' },
  { code: 'sv', nllb: 'swe_Latn', he: 'שוודית', en: 'Swedish' },
  { code: 'da', nllb: 'dan_Latn', he: 'דנית', en: 'Danish' },
  { code: 'no', nllb: 'nob_Latn', he: 'נורווגית', en: 'Norwegian' },
  { code: 'fi', nllb: 'fin_Latn', he: 'פינית', en: 'Finnish' },
  { code: 'is', nllb: 'isl_Latn', he: 'איסלנדית', en: 'Icelandic' },
  { code: 'et', nllb: 'est_Latn', he: 'אסטונית', en: 'Estonian' },
  { code: 'lv', nllb: 'lvs_Latn', he: 'לטבית', en: 'Latvian' },
  { code: 'lt', nllb: 'lit_Latn', he: 'ליטאית', en: 'Lithuanian' },
  { code: 'be', nllb: 'bel_Cyrl', he: 'בלארוסית', en: 'Belarusian' },
  { code: 'ca', nllb: 'cat_Latn', he: 'קטלאנית', en: 'Catalan' },
  { code: 'gl', nllb: 'glg_Latn', he: 'גליסית', en: 'Galician' },
  { code: 'eu', nllb: 'eus_Latn', he: 'בסקית', en: 'Basque' },
  { code: 'af', nllb: 'afr_Latn', he: 'אפריקאנס', en: 'Afrikaans' },
  { code: 'sw', nllb: 'swh_Latn', he: 'סווהילית', en: 'Swahili' },
  { code: 'am', nllb: 'amh_Ethi', he: 'אמהרית', en: 'Amharic' },
  { code: 'ha', nllb: 'hau_Latn', he: 'האוסה', en: 'Hausa' },
  { code: 'yo', nllb: 'yor_Latn', he: 'יורובה', en: 'Yoruba' },
  { code: 'so', nllb: 'som_Latn', he: 'סומלית', en: 'Somali' },
  { code: 'ta', nllb: 'tam_Taml', he: 'טמילית', en: 'Tamil' },
  { code: 'te', nllb: 'tel_Telu', he: 'טלוגו', en: 'Telugu' },
  { code: 'ml', nllb: 'mal_Mlym', he: 'מלאיאלאם', en: 'Malayalam' },
  { code: 'kn', nllb: 'kan_Knda', he: 'קנאדה', en: 'Kannada' },
  { code: 'mr', nllb: 'mar_Deva', he: 'מראטהי', en: 'Marathi' },
  { code: 'gu', nllb: 'guj_Gujr', he: 'גוג׳ראטי', en: 'Gujarati' },
  { code: 'pa', nllb: 'pan_Guru', he: 'פנג׳אבי', en: 'Punjabi' },
  { code: 'ne', nllb: 'npi_Deva', he: 'נפאלית', en: 'Nepali' },
  { code: 'si', nllb: 'sin_Sinh', he: 'סינהלה', en: 'Sinhala' },
  { code: 'km', nllb: 'khm_Khmr', he: 'חמר', en: 'Khmer' },
  { code: 'lo', nllb: 'lao_Laoo', he: 'לאו', en: 'Lao' },
  { code: 'my', nllb: 'mya_Mymr', he: 'בורמזית', en: 'Burmese' },
  { code: 'ka', nllb: 'kat_Geor', he: 'גאורגית', en: 'Georgian' },
  { code: 'hy', nllb: 'hye_Armn', he: 'ארמנית', en: 'Armenian' },
  { code: 'az', nllb: 'azj_Latn', he: 'אזרית', en: 'Azerbaijani' },
  { code: 'kk', nllb: 'kaz_Cyrl', he: 'קזחית', en: 'Kazakh' },
  { code: 'uz', nllb: 'uzn_Latn', he: 'אוזבקית', en: 'Uzbek' },
  { code: 'mn', nllb: 'khk_Cyrl', he: 'מונגולית', en: 'Mongolian' },
  { code: 'tl', nllb: 'tgl_Latn', he: 'טגלוג', en: 'Tagalog' },
  { code: 'jw', nllb: 'jav_Latn', he: 'יאוונית', en: 'Javanese' },
  { code: 'su', nllb: 'sun_Latn', he: 'סונדנית', en: 'Sundanese' },
  { code: 'cy', nllb: 'cym_Latn', he: 'וולשית', en: 'Welsh' },
  { code: 'mt', nllb: 'mlt_Latn', he: 'מלטזית', en: 'Maltese' },
  { code: 'yi', nllb: 'ydd_Hebr', he: 'יידיש', en: 'Yiddish', rtl: true },
  { code: 'ps', nllb: 'pbt_Arab', he: 'פשטו', en: 'Pashto', rtl: true },
  { code: 'ht', nllb: 'hat_Latn', he: 'קריאולית האיטית', en: 'Haitian Creole' },
];

const BY_CODE = new Map(LANGUAGES.map((l) => [l.code, l]));

export function getLanguage(code) {
  return BY_CODE.get(code) || null;
}

export function languageName(code, ui = 'he') {
  const lang = BY_CODE.get(code);
  if (!lang) return code;
  return ui === 'he' ? lang.he : lang.en;
}

export function isRTL(code) {
  return Boolean(BY_CODE.get(code)?.rtl);
}

/** Languages sorted for display, keeping the most common ones on top. */
export function sortedLanguages(ui = 'he') {
  const pinned = ['he', 'en', 'ar', 'ru', 'es', 'fr'];
  const head = pinned.map((c) => BY_CODE.get(c)).filter(Boolean);
  const tail = LANGUAGES.filter((l) => !pinned.includes(l.code)).sort((a, b) =>
    (ui === 'he' ? a.he : a.en).localeCompare(ui === 'he' ? b.he : b.en, ui),
  );
  return [...head, ...tail];
}
