/**
 * AppSpark AI design tokens.
 *
 * One accent, deep charcoal surfaces, warm off-white type. Every colour in the
 * app must come from here – never hard-code a hex value inside a component.
 */

export type ColorScheme = 'dark' | 'light';

export interface Palette {
  /** Page background. */
  background: string;
  /** Cards, inputs, sheets. */
  surface: string;
  /** Raised surfaces: chips, elevated cards, tab bar. */
  surfaceElevated: string;
  /** Pressed / selected neutral surface. */
  surfaceSelected: string;
  /** Hairline borders. */
  border: string;
  /** Stronger border for focused / selected states. */
  borderStrong: string;
  /** Primary text. */
  text: string;
  /** Secondary text. */
  textSecondary: string;
  /** Tertiary / placeholder text. */
  textTertiary: string;
  /** Text on accent surfaces. */
  textOnAccent: string;
  /** The single accent colour. Use sparingly. */
  accent: string;
  /** Subtle accent tint used for selected states and highlights. */
  accentSoft: string;
  /** Accent border for selected states. */
  accentBorder: string;
  /** Semantic. */
  danger: string;
  dangerSoft: string;
  success: string;
  successSoft: string;
  warning: string;
  warningSoft: string;
  /** Overlay scrim. */
  scrim: string;
  /** Skeleton shimmer base. */
  skeleton: string;
}

export const palettes: Record<ColorScheme, Palette> = {
  dark: {
    background: '#101113',
    surface: '#1A1C1F',
    surfaceElevated: '#24272B',
    surfaceSelected: '#2C3035',
    border: 'rgba(245, 244, 240, 0.08)',
    borderStrong: 'rgba(245, 244, 240, 0.18)',
    text: '#F5F4F0',
    textSecondary: '#96999E',
    textTertiary: '#63676D',
    textOnAccent: '#101113',
    accent: '#D7F36A',
    accentSoft: 'rgba(215, 243, 106, 0.12)',
    accentBorder: 'rgba(215, 243, 106, 0.45)',
    danger: '#F28B82',
    dangerSoft: 'rgba(242, 139, 130, 0.14)',
    success: '#8BD3A0',
    successSoft: 'rgba(139, 211, 160, 0.14)',
    warning: '#F2C26B',
    warningSoft: 'rgba(242, 194, 107, 0.14)',
    scrim: 'rgba(0, 0, 0, 0.6)',
    skeleton: 'rgba(245, 244, 240, 0.06)',
  },
  light: {
    background: '#F7F6F2',
    surface: '#FFFFFF',
    surfaceElevated: '#EFEEE8',
    surfaceSelected: '#E4E3DC',
    border: 'rgba(16, 17, 19, 0.08)',
    borderStrong: 'rgba(16, 17, 19, 0.18)',
    text: '#17181A',
    textSecondary: '#5F636A',
    textTertiary: '#9A9DA3',
    textOnAccent: '#17181A',
    accent: '#8FB31A',
    accentSoft: 'rgba(143, 179, 26, 0.14)',
    accentBorder: 'rgba(143, 179, 26, 0.5)',
    danger: '#C7352B',
    dangerSoft: 'rgba(199, 53, 43, 0.1)',
    success: '#2E8B57',
    successSoft: 'rgba(46, 139, 87, 0.12)',
    warning: '#B7791F',
    warningSoft: 'rgba(183, 121, 31, 0.12)',
    scrim: 'rgba(16, 17, 19, 0.45)',
    skeleton: 'rgba(16, 17, 19, 0.06)',
  },
};

/** 4pt spacing scale. */
export const space = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 48,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 22,
  pill: 999,
} as const;

/**
 * Typography scale. Display sizes use the editorial serif, everything else the
 * humanist sans. Hebrew and Latin share the same metrics.
 */
export const type = {
  display: { fontSize: 34, lineHeight: 40, letterSpacing: -0.4 },
  title: { fontSize: 26, lineHeight: 32, letterSpacing: -0.3 },
  heading: { fontSize: 20, lineHeight: 26, letterSpacing: -0.2 },
  subheading: { fontSize: 17, lineHeight: 24, letterSpacing: 0 },
  body: { fontSize: 15, lineHeight: 22, letterSpacing: 0 },
  bodySmall: { fontSize: 13, lineHeight: 19, letterSpacing: 0 },
  caption: { fontSize: 12, lineHeight: 16, letterSpacing: 0.1 },
  mono: { fontSize: 13, lineHeight: 20, letterSpacing: 0 },
} as const;

export type TypeVariant = keyof typeof type;

export const motion = {
  fast: 140,
  base: 220,
  slow: 360,
} as const;

/** Minimum touch target. */
export const hit = 44;

export const layout = {
  /** Horizontal page gutter. */
  gutter: 20,
  /** Content never grows wider than this on tablets / web. */
  maxWidth: 720,
} as const;
