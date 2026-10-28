// @vitest-environment node
// Contrast guard for the orange × black palette: every text/control token pair must meet WCAG 2.2 AA
// in both themes (4.5:1 for text, 3:1 for non-text UI such as control borders and focus rings).
import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const css = fs.readFileSync(path.join(import.meta.dirname, 'global.css'), 'utf8');

function themeTokens(theme: 'dark' | 'light'): Record<string, string> {
  const block = css.match(new RegExp(`\\[data-theme='${theme}'\\] \\{([\\s\\S]*?)\\n\\}`))?.[1] ?? '';
  return Object.fromEntries([...block.matchAll(/--([\w-]+):\s*(#[0-9a-f]{6})\b/gi)].map((m) => [m[1] ?? '', (m[2] ?? '').toLowerCase()]));
}

function luminance(hex: string): number {
  const [r = 0, g = 0, b = 0] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
function contrast(a: string, b: string): number {
  const hi = Math.max(luminance(a), luminance(b));
  const lo = Math.min(luminance(a), luminance(b));
  return (hi + 0.05) / (lo + 0.05);
}

const SURFACES = ['bg', 'surface', 'surface-2', 'surface-3'];
const TEXT = ['text', 'text-muted', 'primary-text', 'success', 'warning', 'danger', 'info'];
const NON_TEXT = ['border-control', 'focus', 'accent-line'];

describe.each(['dark', 'light'] as const)('%s theme tokens', (theme) => {
  const t = themeTokens(theme);
  const v = (k: string): string => t[k] ?? '#missing';

  it('defines every token the checks need', () => {
    for (const k of [...SURFACES, ...TEXT, ...NON_TEXT, 'primary', 'primary-contrast']) expect(t[k], k).toMatch(/^#/);
  });

  it.each(TEXT)('%s reads as text on every surface (≥4.5:1)', (fg) => {
    for (const bg of SURFACES) expect(contrast(v(fg), v(bg)), `${fg} on ${bg}`).toBeGreaterThanOrEqual(4.5);
  });

  it.each(NON_TEXT)('%s is visible as a UI boundary on every surface (≥3:1)', (fg) => {
    for (const bg of SURFACES) expect(contrast(v(fg), v(bg)), `${fg} on ${bg}`).toBeGreaterThanOrEqual(3);
  });

  it('text on the orange fill passes, and white on orange is not used', () => {
    expect(contrast(v('primary-contrast'), v('primary'))).toBeGreaterThanOrEqual(4.5);
    expect(contrast('#ffffff', v('primary'))).toBeLessThan(4.5);
  });

  // Orange as a fill (primary button) is identified by its black label; thin indicators (active tab bar,
  // current tally mark, progress) use --accent-line, which is the same orange in dark and a darker
  // burnt orange in light so it keeps ≥3:1 there (checked in NON_TEXT above).
  it('in the dark theme the orange fill itself stands out from the page (≥3:1)', () => {
    if (theme === 'dark') expect(contrast(v('primary'), v('bg'))).toBeGreaterThanOrEqual(3);
    expect(v('accent-line')).toBe(theme === 'dark' ? v('primary') : v('primary-text'));
  });
});
