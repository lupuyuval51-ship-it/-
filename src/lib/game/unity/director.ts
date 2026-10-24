/**
 * Scene director: turns what the learner is studying into render-only scene directives for the Unity client
 * (themed scenery, station signage, mood). Deterministic and pure.
 *
 * It reads ONLY text the browser already receives (subject, area names/descriptions, station labels, lore titles).
 * It never looks at challenge prompts, answers, hints or explanations, so nothing here can leak a solution.
 */
import { hashSeed, mulberry32 } from "../util/prng";
import type { WorldSpec } from "../world/build";
import type { WorldModel } from "../world/types";

export const MOTIFS = ["glassware", "plants", "planets", "monuments", "glyphs", "circuits", "bubbles", "cells", "letters", "crystals"] as const;
export type Motif = (typeof MOTIFS)[number];

/**
 * Keyword stems (Hebrew and English) → motif. A stem matches the START of a word (after up to two Hebrew one-letter
 * prefixes: "הים", "בתא"); a stem ending in "$" must be the whole word, optionally plural ("ים$": ים, הים, but not every
 * plural "-ים"; "star$": star, stars, but not "start"; "קוד$": not "קודם"). Matching inside words made almost every
 * Hebrew game look like water ("ים" ends every masculine plural) and "making" a history lesson ("king").
 */
const KEYWORDS: Record<Motif, readonly string[]> = {
  glassware: ["chem", "כימ", "atom", "אטום", "molecul", "מולקול", "reaction", "תגובה", "acid", "חומצ", "lab$", "laborator", "מעבד"],
  plants: ["plant", "צמח", "photosyn", "פוטוסינ", "leaf", "leaves", "עלה$", "עלים", "seed", "זרע", "tree", "עץ", "עצים", "ecolog", "אקולוג", "flower", "פרח"],
  planets: ["space", "חלל", "planet", "כוכב", "star$", "orbit", "מסלול", "gravity", "כבידה", "galax", "גלקס", "solar", "שמש"],
  monuments: ["histor", "היסטור", "war$", "מלחמ", "ancient", "עתיק", "empire", "אימפר", "king", "מלך", "revolution", "מהפכ", "rome", "roman", "egypt", "מצרי"],
  glyphs: ["math", "מתמט", "equation", "משווא", "number", "מספר", "fraction", "שבר", "geometr", "גאומט", "algebra", "אלגברה", "angle", "triangle", "זווי"],
  circuits: ["code", "program", "תכנות", "קוד$", "loop", "לולא", "function", "פונקצ", "algorithm", "אלגוריתם", "computer", "מחשב", "variable", "משתנ"],
  bubbles: ["water", "מים", "ocean", "אוקיינוס", "sea$", "ים$", "river", "נהר", "fish", "דג$", "rain", "גשם"],
  cells: ["cell", "תא$", "body", "גוף", "bio", "ביולוג", "dna", "heart", "לב$", "blood", "דם$", "organ$", "organism", "איבר", "אבר$", "brain", "מוח$"],
  letters: ["language", "שפה", "grammar", "דקדוק", "word", "מילה", "מילים", "verb", "פועל", "sentence", "משפט", "vocabulary", "אוצר מילים", "english", "אנגלית", "writing", "כתיבה"],
  crystals: [],
};

/** Hebrew one-letter prefixes (the, and, in, to, as). מ and ש are left out: too many words begin with them (מעלה, שלב). */
const HE_PREFIX = new Set(["ה", "ו", "ב", "ל", "כ"]);
const HEBREW_LETTER = /^[א-ת]/;
const WHOLE_WORD_SUFFIXES = ["", "s", "es", "ים", "ות"] as const;

/** The word and, for a Hebrew word, the word without its first one or two prefix letters ("והים" → "הים", "ים"). */
function wordForms(word: string): string[] {
  const out = [word];
  let w = word;
  for (let i = 0; i < 2 && w.length > 2 && HEBREW_LETTER.test(w) && HE_PREFIX.has(w[0]!); i++) {
    w = w.slice(1);
    out.push(w);
  }
  return out;
}

/** Lower-cased words of the text, without Hebrew vowel marks (niqqud) and punctuation. */
function wordsOf(text: string): string[] {
  return text.toLowerCase().normalize("NFC").replace(/\p{M}/gu, "").split(/[^\p{L}\p{N}]+/u).filter(Boolean);
}

/** Whether a keyword (see KEYWORDS) occurs in a text, given as its words and their prefix-free forms. */
function keywordIn(keyword: string, words: readonly string[], forms: ReadonlySet<string>): boolean {
  if (keyword.includes(" ")) return ` ${words.join(" ")}`.includes(` ${keyword}`);
  if (keyword.endsWith("$")) {
    const base = keyword.slice(0, -1);
    return WHOLE_WORD_SUFFIXES.some((s) => forms.has(base + s));
  }
  for (const f of forms) if (f.startsWith(keyword)) return true;
  return false;
}

const CATEGORY_MOTIF: Record<string, Motif> = {
  programming: "circuits",
  math: "glyphs",
  science: "glassware",
  history: "monuments",
  language: "letters",
  other: "crystals",
};

/** Unity prefab names the client skeleton ships placeholders for. Unknown names fall back to a cube in the client. */
const PREFAB: Record<Motif, readonly string[]> = {
  glassware: ["Prop_Flask", "Prop_Beaker", "Prop_Tube"],
  plants: ["Prop_Sprout", "Prop_Fern", "Prop_Blossom"],
  planets: ["Prop_Planet", "Prop_Moon", "Prop_Ring"],
  monuments: ["Prop_Column", "Prop_Statue", "Prop_Scroll"],
  glyphs: ["Prop_Cube3D", "Prop_Pyramid", "Prop_Sphere3D"],
  circuits: ["Prop_Chip", "Prop_Node", "Prop_Cable"],
  bubbles: ["Prop_Bubble", "Prop_Shell", "Prop_Bubble"],
  cells: ["Prop_Cell", "Prop_Helix", "Prop_Cell"],
  letters: ["Prop_LetterBlock", "Prop_Book", "Prop_LetterBlock"],
  crystals: ["Prop_Crystal", "Prop_Crystal", "Prop_Orb"],
};

export interface DirectedProp {
  /** Unity prefab name. */
  prefab: string;
  x: number; y: number; z: number;
  rot: number;
  scale: number;
  /** Render-only: the prop has no collider and the server/browser physics ignore it. */
  decorative: true;
  /** The station it dresses, if any. */
  stationId?: string;
}

export interface StationSign {
  stationId: string;
  text: string;
  motif: Motif;
}

export interface SceneDirectives {
  motifs: Motif[];
  /** Overall mood for the Unity post-processing stack. */
  mood: { bloom: number; vignette: number; fogDensity: number; colorGrade: "neutral" | "warm" | "cool" | "night" };
  signs: StationSign[];
  props: DirectedProp[];
}

function scoreMotifs(texts: readonly string[], category: string): Motif[] {
  const words = wordsOf(texts.join(" \n "));
  const forms = new Set(words.flatMap(wordForms));
  const scores = new Map<Motif, number>();
  for (const m of MOTIFS) {
    let s = 0;
    for (const k of KEYWORDS[m]) if (keywordIn(k, words, forms)) s += 1;
    if (s > 0) scores.set(m, s);
  }
  const ranked = [...scores.entries()].sort((a, b) => b[1] - a[1] || MOTIFS.indexOf(a[0]) - MOTIFS.indexOf(b[0])).map(([m]) => m);
  const fallback = CATEGORY_MOTIF[category] ?? "crystals";
  const out = ranked.slice(0, 2);
  if (!out.includes(fallback) && out.length < 2) out.push(fallback);
  return out;
}

const r2 = (n: number) => Math.round(n * 100) / 100;

export function directScene(spec: WorldSpec, world: WorldModel): SceneDirectives {
  const area = spec.areas.find((a) => a.id === world.areaId);
  const texts = [
    spec.meta.subject,
    area?.name ?? "",
    area?.description ?? "",
    ...(area?.stations.map((s) => (s.kind === "lore" ? `${s.label} ${s.loreTitle ?? ""}` : s.label)) ?? []),
  ];
  const motifs = scoreMotifs(texts, (spec.meta as { subjectCategory?: string }).subjectCategory ?? "other");
  const rnd = mulberry32(hashSeed(`unity|${world.seed}|${motifs.join(",")}`));

  // 40 characters, counted by code point so an emoji is never cut in half (a lone surrogate is not valid text for Unity)
  const signs: StationSign[] = world.stations.map((st, i) => ({ stationId: st.stationId, text: Array.from(st.label).slice(0, 40).join(""), motif: motifs[i % motifs.length]! }));

  const props: DirectedProp[] = [];
  world.stations.forEach((st, i) => {
    const motif = motifs[i % motifs.length]!;
    const prefabs = PREFAB[motif];
    const n = 2 + Math.floor(rnd() * 2);
    for (let k = 0; k < n; k++) {
      // a small ring behind and beside the station (facing is a yaw; "behind" is the opposite direction)
      const ang = st.facing + Math.PI + (k - (n - 1) / 2) * 0.9;
      const rad = 2.4 + rnd() * 0.8;
      props.push({
        prefab: prefabs[Math.floor(rnd() * prefabs.length)]!,
        x: r2(st.x + Math.sin(ang) * rad),
        y: r2(st.y),
        z: r2(st.z + Math.cos(ang) * rad),
        rot: r2(rnd() * Math.PI * 2),
        scale: r2(0.8 + rnd() * 0.7),
        decorative: true,
        stationId: st.stationId,
      });
    }
  });

  const time = spec.theme.timeOfDay;
  const grade = time === "night" ? "night" : time === "dusk" ? "warm" : world.environment === "ocean-floor" || world.environment === "space-station" ? "cool" : "neutral";
  return {
    motifs,
    mood: { bloom: time === "day" ? 0.25 : 0.5, vignette: time === "night" ? 0.35 : 0.2, fogDensity: r2(world.environment === "ocean-floor" ? 0.03 : 0.012), colorGrade: grade },
    signs,
    props,
  };
}
