/**
 * Lightweight language identification for the transcript.
 *
 * Whisper detects the spoken language internally but the pipeline does not
 * report it, and the offline translation model needs an explicit source
 * language. Guessing from the transcript text costs nothing and is reliable for
 * the length of text a video produces: the script alone settles most languages,
 * and the Latin alphabet is resolved with stop words plus diacritics.
 */

/** Scripts that map to exactly one language in our table. */
const SCRIPTS = [
  { code: 'el', pattern: /[Ͱ-Ͽ]/g },
  { code: 'hy', pattern: /[԰-֏]/g },
  { code: 'ka', pattern: /[Ⴀ-ჿ]/g },
  { code: 'am', pattern: /[ሀ-፿]/g },
  { code: 'th', pattern: /[฀-๿]/g },
  { code: 'lo', pattern: /[຀-໿]/g },
  { code: 'km', pattern: /[ក-៿]/g },
  { code: 'my', pattern: /[က-႟]/g },
  { code: 'si', pattern: /[඀-෿]/g },
  { code: 'ta', pattern: /[஀-௿]/g },
  { code: 'te', pattern: /[ఀ-౿]/g },
  { code: 'kn', pattern: /[ಀ-೿]/g },
  { code: 'ml', pattern: /[ഀ-ൿ]/g },
  { code: 'gu', pattern: /[઀-૿]/g },
  { code: 'pa', pattern: /[਀-੿]/g },
  { code: 'bn', pattern: /[ঀ-৿]/g },
  { code: 'ko', pattern: /[가-힯ᄀ-ᇿ]/g },
  { code: 'ja', pattern: /[぀-ヿ]/g },
];

const HEBREW = /[֐-׿]/g;
const ARABIC = /[؀-ۿݐ-ݿ]/g;
const CYRILLIC = /[Ѐ-ӿ]/g;
const DEVANAGARI = /[ऀ-ॿ]/g;
const HAN = /[一-鿿]/g;
const LATIN = /[A-Za-zÀ-ɏ]/g;

/** Letters that only appear in one of the languages sharing a script. */
const MARKERS = {
  arabic: [
    { code: 'ur', pattern: /[ٹڈڑںےہ]/ },
    { code: 'ps', pattern: /[ښټډړږ]/ },
    { code: 'fa', pattern: /[پچژگی]/ },
  ],
  cyrillic: [
    { code: 'uk', pattern: /[іїєґ]/ },
    { code: 'be', pattern: /[ў]/ },
    { code: 'sr', pattern: /[ђљњћџ]/ },
    { code: 'mk', pattern: /[ѓќѕ]/ },
    { code: 'kk', pattern: /[әғқңүұөһ]/ },
    { code: 'mn', pattern: /[үө]/ },
    { code: 'bg', pattern: /\b(?:ще|няма|със)\b/ },
  ],
  hebrew: [{ code: 'yi', pattern: /(?:און|יידיש|איז)/ }],
  devanagari: [
    { code: 'mr', pattern: /(?:आहे|आणि|नाही)/ },
    { code: 'ne', pattern: /(?:छ|गरेको)/ },
  ],
};

/** Stop words for the Latin-script languages we support. */
const STOPWORDS = {
  en: 'the and to of that is it you for in with was not have this are but they',
  es: 'que de la el en los las por con una para pero como es no se',
  fr: 'que de le la les des est pas pour dans une nous vous qui il',
  de: 'der die das und ist nicht ein eine mit auch sich auf wir aber sie',
  it: 'che di il la per non una gli sono con come del anche questo',
  pt: 'que de nao uma para com dos por mais como isso voce ele muito',
  nl: 'het een van de en dat niet zijn voor met ook maar deze wij',
  pl: 'nie jest sie tak ale tego jak dla przez czy oraz jeszcze bardzo',
  tr: 'bir bu ve ile icin daha cok ama gibi olarak var yok ben biz',
  id: 'yang dan itu tidak untuk dengan pada saya kita adalah akan bisa dari',
  ms: 'yang dan ini tidak untuk dengan saya kita adalah akan boleh dari sudah',
  vi: 'khong cua duoc mot nhung nguoi trong voi cho khi nay lam',
  ro: 'este care nu sunt pentru cu din mai sa ca dar acest foarte',
  sv: 'och att det som en for inte med har vi den till men',
  da: 'og at det som en for ikke med har vi den til men',
  no: 'og at det som en for ikke med har vi den til men',
  fi: 'ja on ei se etta myos kuin mutta niin voi kaikki tama',
  cs: 'je se na to ale nebo jak jsem jsou tak kdyz nej pro',
  sk: 'je sa na to ale alebo ako som su tak ked pre vsetko',
  hr: 'je se na to ali ili kako sam su tako kada za sve',
  sl: 'je se na to ali kako sem so tako ko za vse pa',
  sq: 'dhe per nga eshte nuk kete me shume duke ku por',
  af: 'die en van is nie wat het ons met vir maar hulle',
  sw: 'na ya wa kwa ni katika hii yake kama lakini sana',
  tl: 'ang ng sa na ay mga hindi ko po para pero yung',
  ca: 'que de la el en els les amb per aixo no es una',
  et: 'ja on ei see kui aga ka nii mis oma veel',
  lv: 'un ir ka nav ar to bet ka par vai visu',
  lt: 'ir yra ne kad su tai bet kaip apie labai',
  hu: 'hogy nem egy az es meg csak ez volt mint ki',
  is: 'og er ad ekki thad sem en um til fyrir',
  cy: 'yn ac ar bod mae ddim wedi hyn gyda fel',
  eu: 'eta da bat ez du dira baina hori bere zen',
  gl: 'que de non unha para con dos por mais como isto',
  ha: 'da kuma ba na wannan don yana suna sai',
  yo: 'ati awon ni ti won pe fun lati emi',
  so: 'iyo waa ah ku la oo uu si aan waxa',
  ht: 'nan yon pou ak pa se nou yo ki li',
  jw: 'lan sing ing kang karo iki ora wong',
  su: 'jeung nu di ka teh ieu henteu urang',
  mt: 'ta li fil hu ma biex kien ukoll',
};

const DIACRITIC_HINTS = [
  { code: 'es', pattern: /[ñ¿¡]/i },
  { code: 'fr', pattern: /[àâçéèêëîïôùûœ]/i },
  { code: 'de', pattern: /[äöüß]/i },
  { code: 'pt', pattern: /[ãõáâê]/i },
  { code: 'pl', pattern: /[ąćęłńóśźż]/i },
  { code: 'tr', pattern: /[ğışçö]/i },
  { code: 'ro', pattern: /[ăâîșţț]/i },
  { code: 'cs', pattern: /[ěřůýíč]/i },
  { code: 'hu', pattern: /[őűáé]/i },
  { code: 'sv', pattern: /[åäö]/i },
  { code: 'da', pattern: /[æøå]/i },
  { code: 'no', pattern: /[æøå]/i },
  { code: 'is', pattern: /[þðæ]/i },
  { code: 'vi', pattern: /[ạảấầẩẫậắằẳẵặêếềểễệ]/i },
  { code: 'hr', pattern: /[čćđšž]/i },
];

const WORDS = Object.fromEntries(
  Object.entries(STOPWORDS).map(([code, list]) => [code, new Set(list.split(' '))]),
);

function count(text, pattern) {
  return (text.match(pattern) || []).length;
}

function firstMarker(text, markers, fallback) {
  for (const marker of markers) {
    if (marker.pattern.test(text)) return marker.code;
  }
  return fallback;
}

function detectLatin(text) {
  const normalized = text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
  const tokens = normalized.split(/[^a-z]+/).filter(Boolean);
  if (tokens.length === 0) return 'en';

  const scores = new Map();
  for (const token of tokens) {
    for (const [code, words] of Object.entries(WORDS)) {
      if (words.has(token)) scores.set(code, (scores.get(code) ?? 0) + 1);
    }
  }
  // Diacritics break ties between languages that share their common words.
  for (const hint of DIACRITIC_HINTS) {
    if (hint.pattern.test(text)) scores.set(hint.code, (scores.get(hint.code) ?? 0) + tokens.length * 0.08);
  }
  if (scores.size === 0) return 'en';
  return [...scores.entries()].sort((a, b) => b[1] - a[1])[0][0];
}

/**
 * @param {string} text transcript (or a representative sample of it)
 * @returns {string} an ISO-639-1 code from the language table
 */
export function detectLanguage(text) {
  const sample = String(text ?? '').slice(0, 4000);
  if (!sample.trim()) return 'en';

  const tallies = [
    ['hebrew', count(sample, HEBREW)],
    ['arabic', count(sample, ARABIC)],
    ['cyrillic', count(sample, CYRILLIC)],
    ['devanagari', count(sample, DEVANAGARI)],
    ['han', count(sample, HAN)],
    ['latin', count(sample, LATIN)],
    ...SCRIPTS.map((script) => [script.code, count(sample, script.pattern)]),
  ];
  const [winner, hits] = tallies.sort((a, b) => b[1] - a[1])[0];
  if (hits === 0) return 'en';

  switch (winner) {
    case 'hebrew':
      return firstMarker(sample, MARKERS.hebrew, 'he');
    case 'arabic':
      return firstMarker(sample, MARKERS.arabic, 'ar');
    case 'cyrillic':
      return firstMarker(sample, MARKERS.cyrillic, 'ru');
    case 'devanagari':
      return firstMarker(sample, MARKERS.devanagari, 'hi');
    case 'han':
      return 'zh';
    case 'latin':
      return detectLatin(sample);
    default:
      return winner;
  }
}
