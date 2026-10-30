import { describe, expect, it } from 'vitest';
import enLegal from '../../i18n/locales/en/legal';
import heLegal from '../../i18n/locales/he/legal';
import { splitPlaceholders } from './LegalDocument';

function leaves(obj: unknown, prefix = ''): [string, string][] {
  if (typeof obj === 'string') return [[prefix, obj]];
  return Object.entries(obj as Record<string, unknown>).flatMap(([k, v]) => leaves(v, prefix ? `${prefix}.${k}` : k));
}

const placeholders = (s: string) => splitPlaceholders(s).filter((p) => p.placeholder).length;

describe('legal pages', () => {
  it('marks [bracketed] operator placeholders and keeps the rest as text', () => {
    expect(splitPlaceholders('Write to [contact email address] today.')).toEqual([
      { text: 'Write to ', placeholder: false },
      { text: '[contact email address]', placeholder: true },
      { text: ' today.', placeholder: false },
    ]);
    expect(splitPlaceholders('No placeholder here')).toEqual([{ text: 'No placeholder here', placeholder: false }]);
  });

  it('keeps every English placeholder in the Hebrew text', () => {
    const he = new Map(leaves(heLegal));
    const lost = leaves(enLegal)
      .filter(([key, text]) => placeholders(text) !== placeholders(he.get(key) ?? ''))
      .map(([key]) => key);
    expect(lost).toEqual([]);
  });

  it('never states a contact address or operator name that was not filled in by the operator', () => {
    for (const [key, text] of [...leaves(enLegal), ...leaves(heLegal)]) {
      expect(text, key).not.toMatch(/[\w.+-]+@[\w-]+\.[\w.]+/);
    }
  });
});
