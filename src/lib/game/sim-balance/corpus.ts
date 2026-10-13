/**
 * The corpus the balance simulation runs over: study-engine games from a spread of realistic notes (he + en, from a
 * three-line sketch to a long chapter, with and without terms / steps / Q&A / numbers) and every demo template.
 */
import { generateOffline } from "../../offline/generate";
import { buildDemoExtension } from "../demo";
import { MaterialError, buildMaterialExtension } from "../material/build";
import { mergeExtension } from "../spec/extension";
import { extensionSchema } from "../spec/schema";
import { validateGameSpec } from "../spec/validate";
import { generationRequestSchema } from "../../schemas/generation";
import type { GameSpec } from "../spec/schema";
import { GAME_TYPES } from "../spec/constants";
import { hashSeed, mulberry32 } from "../util/prng";

export interface CorpusItem {
  id: string;
  kind: "engine" | "demo";
  lang: "he" | "en";
  mode: "FAST" | "FULL";
  spec: GameSpec;
}

interface Notes {
  id: string;
  subject: string;
  text: string;
}

const EN: Notes[] = [
  {
    id: "en-water", subject: "The water cycle",
    text: `Evaporation: water turns into vapour because of the sun's heat.
Condensation: water vapour cools down and forms tiny droplets that make clouds.
Precipitation: water that falls from clouds as rain, snow or hail.
Infiltration: water that soaks into the ground and reaches groundwater.

Steps of the water cycle:
1. The sun heats the sea.
2. The water evaporates and rises.
3. The vapour cools and forms clouds.
4. The water falls as rain and returns to the sea.

Q: What powers the water cycle?
A: The energy of the sun.

About 97 percent of the water on Earth is in the oceans.
Clouds form when water vapour cools high in the air.`,
  },
  {
    id: "en-terms-only", subject: "Cell biology",
    text: `Nucleus: the control centre of the cell that holds the DNA.
Mitochondria: the parts of the cell that release energy from food.
Ribosome: a tiny structure that builds proteins.
Membrane: the thin layer that surrounds the cell and controls what enters.
Cytoplasm: the jelly-like fluid that fills the cell.
Vacuole: a storage space inside the cell.
Chloroplast: the green part of a plant cell where photosynthesis happens.
Cell wall: the stiff outer layer of plant cells that gives them shape.`,
  },
  {
    id: "en-steps-only", subject: "Baking bread",
    text: `How to bake bread:
1. Mix flour, water, yeast and salt.
2. Knead the dough for ten minutes.
3. Let the dough rise for one hour.
4. Shape the loaf.
5. Let it rise a second time.
6. Bake at 220 degrees for 30 minutes.

Why bake in two stages:
1. Heat the oven fully.
2. Put the loaf in.
3. Lower the heat after ten minutes.`,
  },
  {
    id: "en-numbers", subject: "Planets",
    text: `Mercury is 58 million kilometres from the sun.
Venus is 108 million kilometres from the sun.
Earth is 150 million kilometres from the sun.
Mars is 228 million kilometres from the sun.
Jupiter has 95 known moons.
A day on Mars lasts 24.6 hours.
Saturn takes 29 years to orbit the sun.
Neptune takes 165 years to orbit the sun.`,
  },
  {
    id: "en-prose", subject: "Ancient Egypt",
    text: `Ancient Egypt grew along the river Nile. The river flooded every year and left rich soil behind. Farmers grew wheat and barley on this soil. The pharaoh was the king and the religious leader of Egypt. Pyramids were built as tombs for the pharaohs. Hieroglyphs were the picture writing of the Egyptians. Egyptians believed in life after death. Mummies were made to keep the body safe for the next life. Scribes learned to write and kept records for the pharaoh. Trade with other lands brought gold, wood and spices to Egypt.`,
  },
  {
    id: "en-mixed-long", subject: "Python loops",
    text: `Variable: a named box that stores a value.
Loop: code that repeats until a condition changes.
For loop: a loop that runs a fixed number of times.
While loop: a loop that runs as long as a condition stays true.
Condition: an expression that is either true or false.
Index: the position of an item in a list, starting at zero.
Function: a reusable block of code with a name.
Argument: a value passed into a function.

How a for loop runs:
1. Python takes the first item of the list.
2. It runs the indented code with that item.
3. It takes the next item.
4. It stops after the last item.

How to find the largest number:
1. Start with the first number as the best.
2. Look at the next number.
3. If it is larger, make it the best.
4. Repeat until the list ends.

Q: What does range(5) give?
A: The numbers 0 to 4.
Q: How many times does a loop over 7 items run?
A: 7

A list in Python starts counting at 0.
The loop for i in range(3) runs 3 times.
A while loop with a condition that is always true never ends.
Python was created in 1991.`,
  },
  {
    id: "en-short", subject: "Fractions",
    text: `Numerator: the top number of a fraction.
Denominator: the bottom number of a fraction.
Half of 10 is 5.
A quarter is 25 percent.`,
  },
  {
    id: "en-qa", subject: "World capitals",
    text: `Q: What is the capital of France?
A: Paris
Q: What is the capital of Italy?
A: Rome
Q: What is the capital of Japan?
A: Tokyo
Q: How many states are in the United States?
A: 50
Q: What is the capital of Egypt?
A: Cairo
Q: How many continents are there?
A: 7`,
  },
  {
    id: "en-history", subject: "The space race",
    text: `Space race: the competition between the United States and the Soviet Union to be first in space.
Satellite: an object that orbits a planet or a moon.
Orbit: the curved path of an object around a planet or a star.
Cosmonaut: the Russian word for an astronaut.

In 1957 the Soviet Union launched Sputnik, the first artificial satellite.
In 1961 Yuri Gagarin became the first human to travel into space.
In 1963 Valentina Tereshkova became the first woman in space.
In 1965 Alexei Leonov made the first spacewalk outside a spacecraft.
Neil Armstrong was the first human to walk on the Moon in 1969.
In 1975 an American Apollo craft and a Soviet Soyuz craft docked together in orbit.
In 1981 the first Space Shuttle, Columbia, flew into orbit.
In 1998 the first module of the International Space Station was launched.`,
  },
];

const HE: Notes[] = [
  {
    id: "he-water", subject: "מחזור המים",
    text: `אידוי: מים הופכים לאדים בגלל חום השמש.
עיבוי: אדי מים מתקררים והופכים לטיפות זעירות שיוצרות עננים.
משקעים: מים שיורדים מהעננים כגשם, שלג או ברד.
חלחול: מים שנספגים באדמה ומגיעים למי התהום.

שלבי מחזור המים:
1. השמש מחממת את מי הים.
2. המים מתאדים ועולים למעלה.
3. האדים מתקררים ויוצרים עננים.
4. המים יורדים כגשם וחוזרים לים.

ש: מה מניע את מחזור המים?
ת: האנרגיה של השמש.

כ־97 אחוז מהמים בכדור הארץ נמצאים באוקיינוסים.
עננים נוצרים כשאדי מים מתקררים בגובה.`,
  },
  {
    id: "he-terms-only", subject: "התא החי",
    text: `גרעין: מרכז הבקרה של התא שמכיל את ה-DNA.
מיטוכונדריה: חלקי התא שמשחררים אנרגיה מהמזון.
ריבוזום: מבנה זעיר שבונה חלבונים.
קרום: השכבה הדקה שעוטפת את התא ושולטת במה שנכנס.
ציטופלזמה: הנוזל הג'לטיני שממלא את התא.
ואקואולה: חלל אחסון בתוך התא.
כלורופלסט: החלק הירוק בתא צמחי שבו מתרחשת פוטוסינתזה.
דופן התא: השכבה הקשיחה החיצונית של תאי צמח שנותנת להם צורה.`,
  },
  {
    id: "he-steps-only", subject: "אפיית לחם",
    text: `איך אופים לחם:
1. מערבבים קמח, מים, שמרים ומלח.
2. לשים את הבצק עשר דקות.
3. משאירים את הבצק לתפוח שעה.
4. מעצבים את כיכר הלחם.
5. נותנים לו לתפוח פעם שנייה.
6. אופים ב-220 מעלות במשך 30 דקות.`,
  },
  {
    id: "he-numbers", subject: "מערכת השמש",
    text: `מרקורי נמצא במרחק 58 מיליון קילומטר מהשמש.
נוגה נמצאת במרחק 108 מיליון קילומטר מהשמש.
כדור הארץ נמצא במרחק 150 מיליון קילומטר מהשמש.
מאדים נמצא במרחק 228 מיליון קילומטר מהשמש.
ליום במאדים יש 24.6 שעות.
שבתאי משלים הקפה סביב השמש תוך 29 שנים.
נפטון משלים הקפה סביב השמש תוך 165 שנים.`,
  },
  {
    id: "he-prose", subject: "מצרים העתיקה",
    text: `מצרים העתיקה התפתחה לאורך נהר הנילוס. הנהר הציף את הסביבה בכל שנה והשאיר אדמה פורייה. החקלאים גידלו חיטה ושעורה באדמה הזאת. הפרעה היה המלך והמנהיג הדתי של מצרים. הפירמידות נבנו כקברים לפרעונים. ההירוגליפים היו כתב התמונות של המצרים. המצרים האמינו בחיים אחרי המוות. את המומיות הכינו כדי לשמור על הגוף לחיים הבאים. הסופרים למדו לכתוב ושמרו תיעוד עבור הפרעה. המסחר עם ארצות אחרות הביא למצרים זהב, עץ ותבלינים.`,
  },
  {
    id: "he-mixed-long", subject: "לולאות בפייתון",
    text: `משתנה: תיבה עם שם ששומרת ערך.
לולאה: קוד שחוזר על עצמו עד שתנאי משתנה.
לולאת for: לולאה שרצה מספר קבוע של פעמים.
לולאת while: לולאה שרצה כל עוד התנאי נשאר אמת.
תנאי: ביטוי שהוא אמת או שקר.
אינדקס: המיקום של פריט ברשימה, החל מאפס.
פונקציה: קטע קוד לשימוש חוזר עם שם.
ארגומנט: ערך שמועבר לפונקציה.

איך לולאת for רצה:
1. פייתון לוקח את הפריט הראשון ברשימה.
2. הוא מריץ את הקוד המוזח עם הפריט.
3. הוא לוקח את הפריט הבא.
4. הוא עוצר אחרי הפריט האחרון.

איך מוצאים את המספר הגדול ביותר:
1. מתחילים עם המספר הראשון כטוב ביותר.
2. מסתכלים על המספר הבא.
3. אם הוא גדול יותר, הופכים אותו לטוב ביותר.
4. חוזרים עד שהרשימה נגמרת.

ש: מה נותן range(5)?
ת: את המספרים 0 עד 4.
ש: כמה פעמים תרוץ לולאה על 7 פריטים?
ת: 7

ברשימה בפייתון הספירה מתחילה מאפס.
הלולאה for i in range(3) רצה 3 פעמים.
לולאת while עם תנאי שתמיד אמת לא נגמרת לעולם.
פייתון נוצרה בשנת 1991.`,
  },
  {
    id: "he-short", subject: "שברים",
    text: `מונה: המספר העליון בשבר.
מכנה: המספר התחתון בשבר.
חצי מ-10 הוא 5.
רבע הוא 25 אחוז.`,
  },
  {
    id: "he-qa", subject: "בירות העולם",
    text: `ש: מהי בירת צרפת?
ת: פריז
ש: מהי בירת איטליה?
ת: רומא
ש: מהי בירת יפן?
ת: טוקיו
ש: כמה מדינות יש בארצות הברית?
ת: 50
ש: מהי בירת מצרים?
ת: קהיר
ש: כמה יבשות יש?
ת: 7`,
  },
  {
    id: "he-history", subject: "מרוץ החלל",
    text: `מרוץ החלל: התחרות בין ארצות הברית לברית המועצות מי יגיע ראשון להישגים בחלל.
לוויין: גוף שמקיף כוכב לכת או ירח.
מסלול: הדרך המעוקלת שבה גוף נע סביב כוכב לכת או כוכב.
קוסמונאוט: המילה הרוסית לאסטרונאוט.

בשנת 1957 שיגרה ברית המועצות את ספוטניק, הלוויין המלאכותי הראשון.
בשנת 1961 יורי גגרין הפך לאדם הראשון שטס אל החלל.
בשנת 1963 ולנטינה טרשקובה הפכה לאישה הראשונה בחלל.
בשנת 1965 אלכסיי לאונוב ביצע את ההליכה הראשונה בחלל מחוץ לחללית.
ניל ארמסטרונג היה האדם הראשון שצעד על הירח בשנת 1969.
בשנת 1975 חללית אמריקנית מסוג אפולו וחללית סובייטית מסוג סויוז עגנו יחד במסלול.
בשנת 1981 המעבורת הראשונה, קולומביה, יצאה למסלול סביב כדור הארץ.
בשנת 1998 שוגר המודול הראשון של תחנת החלל הבינלאומית.`,
  },
];

/** The first `n` paragraphs of some notes (used to probe the small end of the range). */
export function head(text: string, n: number): string {
  return text.split(/\n{2,}/).slice(0, n).join("\n\n");
}

const DEMO_SUBJECTS: Record<"he" | "en", string[]> = {
  en: ["Python loops", "Fractions", "Photosynthesis", "Ancient Rome", "Spanish verbs", "Something unrelated"],
  he: ["לולאות בפייתון", "שברים", "פוטוסינתזה", "רומא העתיקה", "פעלים בספרדית", "משהו אחר"],
};

/** Study-engine games: every note set in FULL and FAST (the long one also in a clipped version). */
export function engineCorpus(): CorpusItem[] {
  const out: CorpusItem[] = [];
  for (const [lang, sets] of [["en", EN], ["he", HE]] as const) {
    for (const n of sets) {
      for (const mode of ["FULL", "FAST"] as const) {
        for (const gameType of ["adventure", "platformer"] as const) {
          try {
            const { spec } = generateOffline({
              mode, subject: n.subject, learningGoal: `Learn ${n.subject}`, difficulty: "beginner", gameType, contentLanguage: lang, material: n.text,
            });
            out.push({ id: `${n.id}/${mode}/${gameType}`, kind: "engine", lang, mode, spec });
          } catch {
            // too little material for this mode is a legitimate refusal, covered by material tests
          }
        }
      }
    }
  }
  return out;
}

/** Demo templates: each pack x game type x mode x language. */
export function demoCorpus(): CorpusItem[] {
  const out: CorpusItem[] = [];
  for (const lang of ["en", "he"] as const) {
    for (const subject of DEMO_SUBJECTS[lang]) {
      for (const gameType of GAME_TYPES) {
        for (const mode of ["FULL", "FAST"] as const) {
          const { spec } = generateOffline({ mode, subject, learningGoal: subject, difficulty: "intermediate", gameType, contentLanguage: lang });
          out.push({ id: `demo:${subject}/${mode}/${gameType}`, kind: "demo", lang, mode, spec });
        }
      }
    }
  }
  return out;
}

/**
 * Games grown with "Extend Existing Game" until they are full (4 areas / 24 challenges): the longest games the product makes.
 * Engine games are extended with other notes of the same language, demo games with their own pre-written extensions.
 */
export function extendedCorpus(): CorpusItem[] {
  const out: CorpusItem[] = [];
  for (const lang of ["en", "he"] as const) {
    const sets = lang === "en" ? EN : HE;
    const base = sets.find((n) => n.id.endsWith("mixed-long"))!;
    let spec = generateOffline({ mode: "FULL", subject: base.subject, learningGoal: base.subject, difficulty: "beginner", gameType: "adventure", contentLanguage: lang, material: base.text }).spec;
    const extras = sets.filter((n) => n !== base && n.text.length > 300);
    for (let i = 0; i < 6; i++) {
      const more = extras[i % extras.length]!;
      const req = generationRequestSchema.parse({ mode: "FULL", subject: more.subject, learningGoal: more.subject, difficulty: "beginner", gameType: "adventure", contentLanguage: lang, material: more.text });
      try {
        const built = buildMaterialExtension(spec, req);
        const merged = mergeExtension(spec, extensionSchema.parse(built.ext));
        const res = validateGameSpec(merged.raw, { alignGameType: spec.meta.gameType });
        if (!res.ok) throw new Error(`extended engine game invalid: ${res.errors.join("; ")}`);
        spec = res.spec;
        out.push({ id: `ext-engine:${lang}/x${i + 1}`, kind: "engine", lang, mode: "FULL", spec });
      } catch (e) {
        if (e instanceof MaterialError) break;
        throw e;
      }
    }
    for (const subject of DEMO_SUBJECTS[lang].slice(0, 5)) {
      let d = generateOffline({ mode: "FULL", subject, learningGoal: subject, difficulty: "intermediate", gameType: "adventure", contentLanguage: lang }).spec;
      for (let i = 0; i < 4; i++) {
        const req = generationRequestSchema.parse({ mode: "EXTEND", subject, learningGoal: subject, difficulty: "intermediate", gameType: "adventure", contentLanguage: lang, targetGameId: "g" });
        const next = buildDemoExtension(d, req);
        if (!next) break;
        const merged = mergeExtension(d, extensionSchema.parse(next.ext));
        const res = validateGameSpec(merged.raw, { alignGameType: d.meta.gameType });
        if (!res.ok) throw new Error(`extended demo game invalid: ${res.errors.join("; ")}`);
        d = res.spec;
        out.push({ id: `ext-demo:${subject}/x${i + 1}`, kind: "demo", lang, mode: "FULL", spec: d });
      }
    }
  }
  return out;
}

// ───────────────────────────── fuzz: synthetic notes of every shape ─────────────────────────────

const SYLLABLES = ["ra", "to", "ni", "ke", "lu", "mo", "sa", "vi", "de", "pa", "zo", "an", "el", "or", "ib"];
const HE_LETTERS = "אבגדהוזחטיכלמנסעפצקרשת";

/** `count` synthetic note sets of random shape and size (deterministic for a seed). Some are legitimately too thin to build. */
export function fuzzCorpus(count: number, seed = "fuzz"): CorpusItem[] {
  const rnd = mulberry32(hashSeed(seed));
  const int = (lo: number, hi: number) => lo + Math.floor(rnd() * (hi - lo + 1));
  const out: CorpusItem[] = [];
  for (let i = 0; i < count; i++) {
    const lang = rnd() < 0.5 ? "en" : "he";
    const word = () => (lang === "en" ? Array.from({ length: int(1, 3) }, () => SYLLABLES[int(0, SYLLABLES.length - 1)]).join("") : Array.from({ length: int(2, 6) }, () => HE_LETTERS[int(0, HE_LETTERS.length - 1)]).join(""));
    const sentence = (n: number) => Array.from({ length: n }, word).join(" ");
    const lines: string[] = [];
    for (let k = int(0, 18); k > 0; k--) lines.push(`${word()}: ${sentence(int(3, 12))}.`);
    for (let g = int(0, 3); g > 0; g--) {
      lines.push("", lang === "en" ? `Steps of ${word()}:` : `שלבי ${word()}:`);
      for (let k = 1; k <= int(3, 7); k++) lines.push(`${k}. ${sentence(int(2, 8))}.`);
    }
    for (let k = int(0, 4); k > 0; k--) lines.push(lang === "en" ? `Q: ${sentence(4)}?` : `ש: ${sentence(4)}?`, lang === "en" ? `A: ${sentence(3)}` : `ת: ${sentence(3)}`);
    for (let k = int(0, 5); k > 0; k--) lines.push(`${sentence(int(2, 5))} ${int(2, 900)} ${lang === "en" ? "kilometres" : "קילומטר"}.`);
    for (let k = int(0, 12); k > 0; k--) lines.push(`${sentence(int(5, 14))}.`);
    const text = lines.join("\n").slice(0, 8000);
    for (const mode of ["FULL", "FAST"] as const) {
      try {
        const { spec } = generateOffline({
          mode, subject: `${word()} ${word()}`, learningGoal: "Learn it", difficulty: (["beginner", "intermediate", "advanced"] as const)[int(0, 2)], gameType: GAME_TYPES[int(0, GAME_TYPES.length - 1)]!,
          contentLanguage: lang, material: text,
        });
        out.push({ id: `fuzz-${i}/${mode}/${spec.meta.gameType}`, kind: "engine", lang, mode, spec });
      } catch {
        // thin notes are refused honestly (tested elsewhere)
      }
    }
  }
  return out;
}

export const NOTE_SETS = { en: EN, he: HE };
