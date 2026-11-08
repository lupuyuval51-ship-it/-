import type {
  Budget,
  Company,
  Kind,
  Minutes,
  Mood,
  Motif,
  PaletteName,
  Prefs,
  Setting,
  Trait,
  Weirdness,
} from './types.ts';

export const MINUTES_OPTIONS: readonly Minutes[] = [15, 30, 60, 120];
export const BUDGET_OPTIONS: readonly Budget[] = [0, 30, 100];
export const SETTING_OPTIONS: readonly Setting[] = ['home', 'outside'];
export const COMPANY_OPTIONS: readonly Company[] = ['solo', 'group'];
export const MOOD_OPTIONS: readonly Mood[] = ['curious', 'creative', 'social', 'change'];
export const WEIRDNESS_OPTIONS: readonly Weirdness[] = [1, 2, 3];
export const TRAITS: readonly Trait[] = ['curiosity', 'creativity', 'boldness', 'connection'];
export const KINDS: readonly Kind[] = ['detective', 'maker', 'wanderer', 'social', 'ritual', 'game'];

export const MINUTES_LABEL: Record<Minutes, string> = {
  15: '15 min',
  30: '30 min',
  60: '1 hour',
  120: '2 hours',
};

export const BUDGET_LABEL: Record<Budget, string> = {
  0: 'Free',
  30: 'Up to ₪30',
  100: 'Up to ₪100',
};

export const SETTING_LABEL: Record<Setting, string> = {
  home: 'At home',
  outside: 'Outside',
};

export const COMPANY_LABEL: Record<Company, string> = {
  solo: 'Solo',
  group: 'With others',
};

export const MOOD_LABEL: Record<Mood, string> = {
  curious: 'Curious',
  creative: 'Creative',
  social: 'Social',
  change: 'Ready for a change',
};

export const WEIRDNESS_LABEL: Record<Weirdness, string> = {
  1: 'Keep it chill',
  2: 'Surprise me',
  3: 'Main character energy',
};

export const KIND_LABEL: Record<Kind, string> = {
  detective: 'Investigation',
  maker: 'Make something',
  wanderer: 'Wander',
  social: 'Connection',
  ritual: 'Reset ritual',
  game: 'Game',
};

export const TRAIT_LABEL: Record<Trait, string> = {
  curiosity: 'Curiosity',
  creativity: 'Creativity',
  boldness: 'Boldness',
  connection: 'Connection',
};

export const TRAIT_BLURB: Record<Trait, string> = {
  curiosity: 'Noticing what everyone else walks past.',
  creativity: 'Turning ordinary things into something new.',
  boldness: 'Doing the slightly braver version.',
  connection: 'Letting people, places and memories in.',
};

/** Level titles per trait, from level 1 upward. */
export const TRAIT_TITLES: Record<Trait, readonly string[]> = {
  curiosity: ['Noticer', 'Snoop', 'Investigator', 'Detective', 'Field Scientist', 'Oracle'],
  creativity: ['Doodler', 'Tinkerer', 'Maker', 'Auteur', 'Visionary', 'Legend of the Craft'],
  boldness: ['Toe-Dipper', 'Risk-Taker', 'Daredevil', 'Protagonist', 'Folk Hero', 'Myth'],
  connection: ['Wallflower', 'Neighbor', 'Connector', 'Host', 'Heart of the Block', 'Lighthouse'],
};

/** Cumulative points needed to reach level index i (level = i + 1). */
export const LEVEL_THRESHOLDS: readonly number[] = [0, 4, 10, 18, 28, 40];

export const DEFAULT_PREFS: Prefs = {
  minutes: 30,
  budget: 0,
  setting: 'outside',
  company: 'solo',
  mood: 'curious',
  weirdness: 2,
};

export interface PaletteColors {
  /** poster background */
  bg: string;
  /** primary text / ink on the poster */
  ink: string;
  /** dominant accent */
  accent: string;
  /** secondary accent */
  accent2: string;
  /** tertiary / shadow tone */
  accent3: string;
  /** true when bg is light (ink is dark) */
  light: boolean;
}

/** Named palettes. Each is used for posters and to tint an episode while playing. */
export const PALETTES: Record<PaletteName, PaletteColors> = {
  ember: { bg: '#1A0F0A', ink: '#F6E9D7', accent: '#FF5B1F', accent2: '#FFB547', accent3: '#7A2E12', light: false },
  noir: { bg: '#0E0E10', ink: '#EDEBE6', accent: '#E8E2D0', accent2: '#8A8578', accent3: '#C8102E', light: false },
  tide: { bg: '#0B1E26', ink: '#E9F3F1', accent: '#1FC7B0', accent2: '#FFD23F', accent3: '#2B6F8A', light: false },
  neon: { bg: '#1B0B2E', ink: '#FFF3FB', accent: '#FF4F9A', accent2: '#4FB3FF', accent3: '#FFE14F', light: false },
  citrus: { bg: '#F4E9CF', ink: '#1D1A14', accent: '#FF7A00', accent2: '#2F6B3B', accent3: '#E8442E', light: true },
  moss: { bg: '#12180F', ink: '#EEF0E1', accent: '#A8C256', accent2: '#E9D46B', accent3: '#5C7A3A', light: false },
  dusk: { bg: '#1C1430', ink: '#F5ECFF', accent: '#8E7CFF', accent2: '#FF9D6C', accent3: '#3E2F72', light: false },
  paper: { bg: '#EFE5D2', ink: '#2B2219', accent: '#C2410C', accent2: '#1E3A5F', accent3: '#A3A08F', light: true },
  cobalt: { bg: '#0A1433', ink: '#EEF2FF', accent: '#3D6BFF', accent2: '#FF5B1F', accent3: '#9BB0FF', light: false },
  rose: { bg: '#2A0E14', ink: '#FFEDEF', accent: '#FF6B81', accent2: '#FFC2A8', accent3: '#8C1C30', light: false },
};

export const PALETTE_NAMES = Object.keys(PALETTES) as PaletteName[];

export const MOTIFS: readonly Motif[] = [
  'orbits',
  'grid',
  'rays',
  'waves',
  'shards',
  'stairs',
  'dots',
  'arches',
  'stripes',
  'maze',
];

/** Validation limits. `soft` produces a warning, `hard` an error. */
export const TEXT_LIMITS = {
  title: { soft: 40, hard: 56 },
  tagline: { soft: 110, hard: 160 },
  intro: { soft: 420, hard: 700 },
  stageTitle: { soft: 36, hard: 52 },
  narrative: { soft: 300, hard: 460 },
  action: { soft: 300, hard: 440 },
  alternative: { soft: 240, hard: 380 },
  amplify: { soft: 200, hard: 300 },
  crewTip: { soft: 180, hard: 280 },
  captureLabel: { soft: 48, hard: 70 },
  capturePlaceholder: { soft: 60, hard: 90 },
  choicePrompt: { soft: 110, hard: 160 },
  optionLabel: { soft: 32, hard: 44 },
  optionDescription: { soft: 80, hard: 120 },
  endingTitle: { soft: 40, hard: 56 },
  twist: { soft: 380, hard: 560 },
  closingLine: { soft: 120, hard: 180 },
  item: { soft: 36, hard: 52 },
  stageLabel: { soft: 14, hard: 20 },
  narrator: { soft: 32, hard: 48 },
} as const;

export const MAX_ITEMS = 6;
/** Maximum length of a user's field note when quoted elsewhere. */
export const MAX_NOTE_LENGTH = 80;
