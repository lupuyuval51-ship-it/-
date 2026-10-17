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

/** Keyword stems (Hebrew and English; matched as substrings of the lower-cased text) → motif. */
const KEYWORDS: Record<Motif, readonly string[]> = {
  glassware: ["chem", "כימ", "atom", "אטום", "molecul", "מולקול", "reaction", "תגובה", "acid", "חומצ", "lab", "מעבד"],
  plants: ["plant", "צמח", "photosyn", "פוטוסינ", "leaf", "עלה", "seed", "זרע", "tree", "עץ", "ecolog", "אקולוג", "flower", "פרח"],
  planets: ["space", "חלל", "planet", "כוכב", "star", "orbit", "מסלול", "gravity", "כבידה", "galax", "גלקס", "solar", "שמש"],
  monuments: ["histor", "היסטור", "war", "מלחמ", "ancient", "עתיק", "empire", "אימפר", "king", "מלך", "revolution", "מהפכ", "rome", "egypt", "מצרי"],
  glyphs: ["math", "מתמט", "equation", "משוואה", "number", "מספר", "fraction", "שבר", "geometr", "גאומט", "algebra", "אלגברה", "angle", "זווית"],
  circuits: ["code", "program", "תכנות", "קוד", "loop", "לולאה", "function", "פונקצ", "algorithm", "אלגוריתם", "computer", "מחשב", "variable", "משתנ"],
  bubbles: ["water", "מים", "ocean", "אוקיינוס", "sea", "ים", "river", "נהר", "fish", "דג", "rain", "גשם"],
  cells: ["cell", "תא", "body", "גוף", "bio", "ביולוג", "dna", "heart", "לב", "blood", "דם", "organ", "אבר", "brain", "מוח"],
  letters: ["language", "שפה", "grammar", "דקדוק", "word", "מילה", "verb", "פועל", "sentence", "משפט", "vocabulary", "אוצר מילים", "english", "אנגלית", "writing", "כתיבה"],
  crystals: [],
};

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
  const hay = texts.join(" \n ").toLowerCase();
  const scores = new Map<Motif, number>();
  for (const m of MOTIFS) {
    let s = 0;
    for (const k of KEYWORDS[m]) if (hay.includes(k)) s += 1;
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

  const signs: StationSign[] = world.stations.map((st, i) => ({ stationId: st.stationId, text: st.label.slice(0, 40), motif: motifs[i % motifs.length]! }));

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
