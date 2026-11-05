/**
 * Design tokens — docs/ARCHITECTURE.md §7.2. Pure data (no React), safe to import anywhere.
 *
 * Calm, editorial, restrained: typography and spacing carry hierarchy. `accent` is reserved for
 * primary actions, active state and meaningful progress.
 */

export type ColorScheme = 'light' | 'dark';

export interface Palette {
  /** App background. */
  background: string;
  /** Subtle alternate background: tracks, skeletons, pressed rows, segmented control track. */
  backgroundAlt: string;
  /** Raised surfaces (fields, dialogs, sheets). Used sparingly. */
  surface: string;
  text: string;
  textSecondary: string;
  accent: string;
  /** Pressed state of accent-filled controls. */
  accentPressed: string;
  accentSoft: string;
  /** Text / icons drawn on top of `accent`. */
  onAccent: string;
  /** Hairline separators. */
  border: string;
  /** Control outlines (fields, checkboxes, secondary buttons) — a step stronger than `border`. */
  borderStrong: string;
  danger: string;
  dangerSoft: string;
  warning: string;
  warningSoft: string;
  /** Modal scrim. */
  overlay: string;
}

export const palettes: Readonly<Record<ColorScheme, Readonly<Palette>>> = Object.freeze({
  light: Object.freeze({
    background: '#FAFAF7',
    backgroundAlt: '#F1F2ED',
    surface: '#FFFFFF',
    text: '#181B18',
    textSecondary: '#737970',
    accent: '#176B49',
    accentPressed: '#115639',
    accentSoft: '#E6F2E9',
    onAccent: '#FFFFFF',
    border: '#E5E7E1',
    borderStrong: '#D3D6CE',
    danger: '#B3261E',
    dangerSoft: '#FBECEA',
    warning: '#8A5300',
    warningSoft: '#FBF1DF',
    overlay: 'rgba(24, 27, 24, 0.36)',
  }),
  dark: Object.freeze({
    background: '#111311',
    backgroundAlt: '#1E211E',
    surface: '#181B18',
    text: '#ECEEE8',
    textSecondary: '#9EA59B',
    accent: '#5DB487',
    accentPressed: '#4E9C74',
    accentSoft: '#1B2C22',
    onAccent: '#0D1A12',
    border: '#2A2E29',
    borderStrong: '#3A3F39',
    danger: '#F2877C',
    dangerSoft: '#2E1B19',
    warning: '#E3B65E',
    warningSoft: '#2A2416',
    overlay: 'rgba(0, 0, 0, 0.56)',
  }),
});

/** 8-pt scale (plus 4 and 12). Keys are multiples of 4: `spacing[4]` = 16. */
export const spacing = Object.freeze({
  0: 0,
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  8: 32,
  10: 40,
  12: 48,
  16: 64,
} as const);
export type SpacingKey = keyof typeof spacing;

export const layout = Object.freeze({
  /** Horizontal page gutter. */
  gutter: 20,
  /** Max content width (tablets, web). */
  maxContentWidth: 640,
  /** Minimum touch target. */
  touchTarget: 44,
  /** Height of buttons and single-line fields. */
  controlHeight: 48,
  /** Height of compact controls (segmented control, small buttons). */
  compactControlHeight: 36,
} as const);

/** Only two radii exist. Nothing rounder. */
export const radii = Object.freeze({
  /** Buttons, fields, segmented controls, tags, checkboxes. */
  control: 6,
  /** Sheets, dialogs, surfaces. */
  surface: 10,
} as const);

export type FontWeight = 400 | 500 | 600;

export type TypeVariant = 'display' | 'title' | 'heading' | 'body' | 'bodyStrong' | 'callout' | 'caption' | 'overline';

export interface TypeStyle {
  fontSize: number;
  lineHeight: number;
  weight: FontWeight;
  /** Letter spacing for Latin (Inter) text. Hebrew is never tracked. */
  letterSpacingLatin: number;
  /** Uppercase in Latin scripts only (never in Hebrew). */
  uppercaseLatin: boolean;
}

export const typography: Readonly<Record<TypeVariant, Readonly<TypeStyle>>> = Object.freeze({
  display: { fontSize: 28, lineHeight: 34, weight: 600, letterSpacingLatin: -0.4, uppercaseLatin: false },
  title: { fontSize: 22, lineHeight: 28, weight: 600, letterSpacingLatin: -0.2, uppercaseLatin: false },
  heading: { fontSize: 17, lineHeight: 24, weight: 600, letterSpacingLatin: 0, uppercaseLatin: false },
  body: { fontSize: 16, lineHeight: 24, weight: 400, letterSpacingLatin: 0, uppercaseLatin: false },
  bodyStrong: { fontSize: 16, lineHeight: 24, weight: 500, letterSpacingLatin: 0, uppercaseLatin: false },
  callout: { fontSize: 15, lineHeight: 22, weight: 400, letterSpacingLatin: 0, uppercaseLatin: false },
  caption: { fontSize: 13, lineHeight: 18, weight: 400, letterSpacingLatin: 0, uppercaseLatin: false },
  overline: { fontSize: 12, lineHeight: 16, weight: 500, letterSpacingLatin: 0.4, uppercaseLatin: true },
});

/** Font family per script and weight. Android needs one family per weight (no synthetic bold). */
export const fontFamilies = Object.freeze({
  he: Object.freeze({ 400: 'Heebo-Regular', 500: 'Heebo-Medium', 600: 'Heebo-SemiBold' }),
  en: Object.freeze({ 400: 'Inter-Regular', 500: 'Inter-Medium', 600: 'Inter-SemiBold' }),
} as const);

/** Upper bound for font scaling on dense UI (tab labels, tags, segmented controls). Body text is unbounded. */
export const DENSE_MAX_FONT_SCALE = 1.6;

export const motion = Object.freeze({
  /** Short, subtle durations (ms). Skipped entirely when reduce motion is on. */
  fast: 120,
  base: 180,
  noticeVisibleMs: 3000,
} as const);
