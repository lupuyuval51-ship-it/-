import { contrastRatio, relativeLuminance } from '../contrast';
import { fontFamilies, palettes, radii, spacing, typography, layout } from '../tokens';

const AA = 4.5;

describe('contrast helper', () => {
  it('matches the WCAG reference values', () => {
    expect(contrastRatio('#000000', '#FFFFFF')).toBeCloseTo(21, 5);
    expect(contrastRatio('#FFFFFF', '#FFFFFF')).toBeCloseTo(1, 5);
    expect(relativeLuminance('#FFFFFF')).toBeCloseTo(1, 5);
    // Symmetric.
    expect(contrastRatio('#176B49', '#FFFFFF')).toBeCloseTo(contrastRatio('#FFFFFF', '#176B49'), 10);
  });

  it('rejects malformed colors', () => {
    expect(() => contrastRatio('red', '#FFFFFF')).toThrow();
  });
});

describe('ARCHITECTURE §7.2 light palette (exact values)', () => {
  it('uses the contract colors', () => {
    expect(palettes.light).toMatchObject({
      background: '#FAFAF7',
      backgroundAlt: '#F1F2ED',
      surface: '#FFFFFF',
      text: '#181B18',
      textSecondary: '#737970',
      accent: '#176B49',
      accentSoft: '#E6F2E9',
      border: '#E5E7E1',
    });
  });
});

describe('dark palette contrast (WCAG AA, >= 4.5:1)', () => {
  const d = palettes.dark;
  const cases: [string, string, string, string][] = [
    ['text', d.text, 'background', d.background],
    ['text', d.text, 'surface', d.surface],
    ['textSecondary', d.textSecondary, 'background', d.background],
    ['textSecondary', d.textSecondary, 'surface', d.surface],
    ['accent', d.accent, 'surface', d.surface],
    ['accent', d.accent, 'background', d.background],
    ['onAccent', d.onAccent, 'accent', d.accent],
    ['danger', d.danger, 'background', d.background],
    ['danger', d.danger, 'surface', d.surface],
    ['danger', d.danger, 'dangerSoft', d.dangerSoft],
    ['warning', d.warning, 'warningSoft', d.warningSoft],
    ['text', d.text, 'accentSoft', d.accentSoft],
    ['text', d.text, 'backgroundAlt', d.backgroundAlt],
    ['textSecondary', d.textSecondary, 'backgroundAlt', d.backgroundAlt],
  ];
  it.each(cases)('%s on %s', (_fgName, fg, _bgName, bg) => {
    expect(contrastRatio(fg, bg)).toBeGreaterThanOrEqual(AA);
  });
});

describe('light palette contrast', () => {
  const l = palettes.light;
  const cases: [string, string, string, string][] = [
    ['text', l.text, 'background', l.background],
    ['text', l.text, 'surface', l.surface],
    ['accent', l.accent, 'surface', l.surface],
    ['accent', l.accent, 'background', l.background],
    ['onAccent', l.onAccent, 'accent', l.accent],
    ['danger', l.danger, 'background', l.background],
    ['danger', l.danger, 'dangerSoft', l.dangerSoft],
    ['warning', l.warning, 'warningSoft', l.warningSoft],
    ['text', l.text, 'accentSoft', l.accentSoft],
  ];
  it.each(cases)('%s on %s >= 4.5:1', (_fgName, fg, _bgName, bg) => {
    expect(contrastRatio(fg, bg)).toBeGreaterThanOrEqual(AA);
  });

  /**
   * The contract value #737970 measures ~4.28:1 on background and ~4.47:1 on surface: it passes
   * AA for large text (3:1) but sits just under 4.5:1 for small text. Kept exactly as specified
   * (tokens are binding) and reported to the architecture owner; this test pins the measured
   * values so any change is deliberate.
   */
  it('textSecondary (contract value) measured ratios are pinned', () => {
    const onBackground = contrastRatio(l.textSecondary, l.background);
    const onSurface = contrastRatio(l.textSecondary, l.surface);
    expect(onBackground).toBeGreaterThanOrEqual(3);
    expect(onSurface).toBeGreaterThanOrEqual(3);
    expect(onBackground).toBeCloseTo(4.28, 1);
    expect(onSurface).toBeCloseTo(4.47, 1);
  });
});

describe('scales', () => {
  it('spacing is the 8-pt scale from the contract', () => {
    expect(Object.values(spacing).filter((v) => v > 0)).toEqual([4, 8, 12, 16, 20, 24, 32, 40, 48, 64]);
    expect(layout.gutter).toBe(20);
    expect(layout.maxContentWidth).toBe(640);
    expect(layout.touchTarget).toBeGreaterThanOrEqual(44);
  });

  it('has only the two contract radii', () => {
    expect(Object.values(radii)).toEqual([6, 10]);
  });

  it('type scale matches the contract', () => {
    const scale = Object.fromEntries(
      Object.entries(typography).map(([k, v]) => [k, `${v.fontSize}/${v.lineHeight} ${v.weight}`]),
    );
    expect(scale).toEqual({
      display: '28/34 600',
      title: '22/28 600',
      heading: '17/24 600',
      body: '16/24 400',
      bodyStrong: '16/24 500',
      callout: '15/22 400',
      caption: '13/18 400',
      overline: '12/16 500',
    });
    expect(typography.overline.letterSpacingLatin).toBe(0.4);
  });

  it('defines a font family for every script and weight', () => {
    for (const script of ['he', 'en'] as const) {
      for (const weight of [400, 500, 600] as const) {
        expect(fontFamilies[script][weight]).toMatch(script === 'he' ? /^Heebo-/ : /^Inter-/);
      }
    }
  });
});
