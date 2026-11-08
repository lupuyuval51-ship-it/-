/**
 * PLOT TWIST — the structured content model.
 *
 * One model for every episode, whether a writer curated it or the AI Director
 * generated it. `shared/validate.ts` enforces the rules described here, and the
 * same validator runs on curated content (tests) and on AI output (server).
 *
 * This module is isomorphic: no DOM and no Node APIs.
 */

export type Minutes = 15 | 30 | 60 | 120;
/** Budget ceiling in ILS (₪). 0 means free. */
export type Budget = 0 | 30 | 100;
export type Setting = 'home' | 'outside';
export type Company = 'solo' | 'group';
export type Mood = 'curious' | 'creative' | 'social' | 'change';
/** 1 = Keep it chill, 2 = Surprise me, 3 = Main character energy. */
export type Weirdness = 1 | 2 | 3;
export type Trait = 'curiosity' | 'creativity' | 'boldness' | 'connection';
/** The kind of experience — used to keep the three envelopes different. */
export type Kind = 'detective' | 'maker' | 'wanderer' | 'social' | 'ritual' | 'game';

export type PaletteName =
  | 'ember'
  | 'noir'
  | 'tide'
  | 'neon'
  | 'citrus'
  | 'moss'
  | 'dusk'
  | 'paper'
  | 'cobalt'
  | 'rose';

export type Motif =
  | 'orbits'
  | 'grid'
  | 'rays'
  | 'waves'
  | 'shards'
  | 'stairs'
  | 'dots'
  | 'arches'
  | 'stripes'
  | 'maze';

export type TraitPoints = Record<Trait, number>;
export type TraitBoost = Partial<TraitPoints>;

/** What the user chose on the Set the Scene screen. */
export interface Prefs {
  minutes: Minutes;
  budget: Budget;
  setting: Setting;
  company: Company;
  mood: Mood;
  weirdness: Weirdness;
}

/**
 * An optional one-line field note the user can jot down during a stage.
 * Later text can quote it with a template token: `{{key|fallback}}`.
 */
export interface Capture {
  /** lowercase letters, digits, dashes; unique within the adventure */
  key: string;
  /** e.g. "The strangest detail you found" */
  label: string;
  /** e.g. "a door painted the wrong blue" */
  placeholder: string;
}

export interface ChoiceOption {
  id: string;
  /** Short, punchy: "Follow the details" */
  label: string;
  /** What this path feels like: "Observe. Notice. Connect." */
  description: string;
  /** Id of the next stage node (always the next stage number). */
  next: string;
  traits?: TraitBoost;
}

export interface Choice {
  /** The question that frames the fork: "Your guidebook is blank. How do you fill it?" */
  prompt: string;
  /** 2 or 3 options, each leading to a different node. */
  options: ChoiceOption[];
}

/**
 * One stage of an episode. Every path through an episode visits exactly three
 * stage nodes: stage 1, then stage 2, then stage 3, then an ending.
 */
export interface StageNode {
  id: string;
  stage: 1 | 2 | 3;
  title: string;
  /** Concise narrative: sets the scene in the episode's voice. */
  narrative: string;
  /** The specific action the user performs in the real world. */
  action: string;
  /** An alternative challenge achieving the same story beat (accessibility / comfort). */
  alternative: string;
  /** Suggested minutes for this stage. */
  minutes: number;
  capture?: Capture;
  /** Shown when the user is with others. */
  crewTip?: string;
  /** Extra flourish — highlighted at "Main character energy", hinted at "Surprise me", hidden at "Keep it chill". */
  amplify?: string;
  /** A branching choice offered after the action is marked complete. Mutually exclusive with `next`. */
  choice?: Choice;
  /** Next node id (stage + 1) or, from stage 3, an ending id. Mutually exclusive with `choice`. */
  next?: string;
}

export interface Ending {
  id: string;
  title: string;
  /** The final twist — must connect back to something earlier in the story. Tokens allowed. */
  twist: string;
  /** A closing line tied to this ending. Tokens allowed. Shown on the finale and poster. */
  closingLine: string;
  traits?: TraitBoost;
}

export type AdventureSource = 'curated' | 'ai';

export interface Adventure {
  id: string;
  /** Content revision — bump when a curated adventure changes meaningfully. */
  version: number;
  source: AdventureSource;
  title: string;
  /** The intriguing hint printed on the sealed envelope. Never spoils the twist. */
  tagline: string;
  /** Short story introduction revealed when the envelope opens. */
  intro: string;
  kind: Kind;
  /** 1–3 moods, strongest first. */
  moods: Mood[];
  /** The episode's natural weirdness level. */
  weirdness: Weirdness;
  /** Estimated total minutes (≥ the longest path's stage minutes). */
  minutes: number;
  /** Expected spend in ILS. Free = {min: 0, max: 0}. */
  cost: { min: number; max: number };
  settings: Setting[];
  company: Company[];
  /** Ordinary items needed. Empty array means "nothing but you". */
  items: string[];
  palette: PaletteName;
  motif: Motif;
  /** Base trait points awarded for completing the episode. */
  traits: TraitBoost;
  /** Flavor label for stages, e.g. "Clue", "Exhibit", "Prophecy". */
  stageLabel?: string;
  /** Who narrates, e.g. "The Archivist". Shown as a sign-off. */
  narrator?: string;
  /** Id of the stage-1 node where every run starts. */
  start: string;
  nodes: StageNode[];
  endings: Ending[];
}

/** One possible run through an adventure. */
export interface AdventurePath {
  nodes: StageNode[];
  choices: { nodeId: string; optionId: string }[];
  ending: Ending;
}
