import { describe, expect, it } from 'vitest';
import enLegal from '../../i18n/locales/en/legal';
import heLegal from '../../i18n/locales/he/legal';
import { documentKeys, legalDocument, splitPlaceholders, type LegalMode } from './documents';

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

describe('legal documents per mode', () => {
  const label = (key: string) => key;
  const names = ['privacy', 'terms', 'deletion'] as const;
  const keysOf = (mode: LegalMode) => new Set(names.flatMap((n) => documentKeys(legalDocument(n, mode, label))));

  it('server mode never shows the device-mode texts, and device mode only shows its own', () => {
    expect([...keysOf('server')].filter((k) => k.startsWith('legal.device.'))).toEqual([]);
  });

  /**
   * Hosted-service texts that device mode also shows. Each was checked as true for the app on the phone
   * (no account, no server). Add a key here only after checking that; anything about accounts, servers,
   * hosting, AI, Web Push, sign-in records or e-mail must have a `legal.device.*` version instead.
   */
  const SHARED = [
    'legal.deletion.deleted.coach',
    'legal.deletion.deleted.motivation',
    'legal.deletion.deleted.nutrition',
    'legal.deletion.deleted.profile',
    'legal.deletion.deleted.title',
    'legal.deletion.deleted.training',
    'legal.deletion.deleted.weight',
    'legal.deletion.kept.title',
    'legal.deletion.partial.title',
    'legal.privacy.ai.title',
    'legal.privacy.barcode.title',
    'legal.privacy.changes.title',
    'legal.privacy.collect.motivation',
    'legal.privacy.collect.nutrition',
    'legal.privacy.collect.profile',
    'legal.privacy.collect.training',
    'legal.privacy.collect.weight',
    'legal.privacy.contact.body',
    'legal.privacy.contact.title',
    'legal.privacy.health.body2',
    'legal.privacy.health.title',
    'legal.privacy.minors.age',
    'legal.privacy.minors.consent',
    'legal.privacy.minors.private',
    'legal.privacy.minors.title',
    'legal.privacy.retention.title',
    'legal.privacy.rights.correct',
    'legal.privacy.rights.title',
    'legal.privacy.sharing.never',
    'legal.privacy.sharing.title',
    'legal.privacy.storage.title',
    'legal.privacy.title',
    'legal.privacy.use.never',
    'legal.privacy.use.provide',
    'legal.privacy.use.safety',
    'legal.privacy.use.title',
    'legal.privacy.who.body',
    'legal.privacy.who.title',
    'legal.terms.account.accurate',
    'legal.terms.changes.title',
    'legal.terms.contact.body',
    'legal.terms.contact.title',
    'legal.terms.content.ours',
    'legal.terms.content.title',
    'legal.terms.eligibility.age',
    'legal.terms.eligibility.minors',
    'legal.terms.eligibility.title',
    'legal.terms.ending.title',
    'legal.terms.law.body',
    'legal.terms.law.title',
    'legal.terms.liability.title',
    'legal.terms.medical.doctor',
    'legal.terms.medical.general',
    'legal.terms.medical.stop',
    'legal.terms.medical.title',
    'legal.terms.service.title',
    'legal.terms.title',
    'legal.terms.use.title',
  ];

  it('device mode reuses only hosted-service texts that are true on the phone', () => {
    const server = keysOf('server');
    expect([...keysOf('device')].filter((k) => server.has(k)).sort()).toEqual(SHARED);
  });

  it('quotes the real settings labels in the device-mode steps', () => {
    const doc = legalDocument('deletion', 'device', label);
    const params = doc.sections.flatMap((s) => [...(s.list ?? []), ...(s.body ?? [])]).flatMap((t) => (typeof t === 'string' ? [] : Object.values(t.params)));
    expect(params).toEqual(
      expect.arrayContaining(['nav.profile', 'device.settings.dataTitle', 'device.settings.saveBackup', 'device.settings.erase', 'device.erase.continue', 'device.erase.confirm']),
    );
  });

  it('uses section ids once per page (they are link targets)', () => {
    for (const mode of ['server', 'device'] as const) {
      for (const n of names) {
        const ids = legalDocument(n, mode, label).sections.map((s) => s.id);
        expect(new Set(ids).size, `${mode} ${n}`).toBe(ids.length);
      }
    }
  });
});
