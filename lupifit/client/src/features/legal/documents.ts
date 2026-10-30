/**
 * What the public legal pages say, as data: the privacy policy, the terms of use and the deletion page,
 * for each way LUPU-FIT runs.
 *
 * - `server`: the hosted website and its Android wrapper (accounts on a server, PostgreSQL, optional AI and
 *   Web Push). The texts under `legal.privacy` / `legal.terms` / `legal.deletion`.
 * - `device`: the app with its server inside (`npm run build:device`, the Capacitor Android app): no account,
 *   no LUPU-FIT server, data only on the phone. The texts under `legal.device`, plus the server texts that are
 *   true in both modes (health, safety rules, minors, medical notes, contact).
 *
 * Every statement must match what the code of that mode does. Text in [square brackets] is a placeholder
 * the operator fills in. Pure (no React): the pages render it with `LegalDocument`, and
 * `scripts/legal-static.mjs` renders the same documents as static HTML for a public URL (Google Play needs
 * one even when the app has no server).
 */
import type { TKey, TParams } from '../../i18n';

export type LegalMode = 'server' | 'device';

/** Date of the current texts of each mode (shown as "Last updated"). Change it whenever that mode's text changes. */
export const LEGAL_UPDATED: Record<LegalMode, string> = { server: '2026-10-29', device: '2026-10-30' };

export type LegalText = TKey | { key: TKey; params: TParams };

export interface LegalSection {
  id: string;
  title: TKey;
  body?: LegalText[];
  list?: LegalText[];
  /** Numbered steps instead of bullets. */
  ordered?: boolean;
  after?: LegalText[];
}

export interface LegalDoc {
  title: TKey;
  intro: TKey;
  sections: LegalSection[];
  /** Show a table of contents. */
  toc: boolean;
}

/** Translates a UI label (button and section names quoted in the steps, so they always match the app). */
export type LabelFn = (key: TKey) => string;

export type LegalDocName = 'privacy' | 'terms' | 'deletion';

/** Splits `[placeholder]` parts out of a sentence so they can be marked. */
export function splitPlaceholders(text: string): { text: string; placeholder: boolean }[] {
  return text
    .split(/(\[[^\]]+\])/g)
    .filter(Boolean)
    .map((part) => ({ text: part, placeholder: /^\[[^\]]+\]$/.test(part) }));
}

function serverPrivacy(label: LabelFn): LegalDoc {
  const exportPath = { profile: label('nav.profile'), section: label('settings.privacy.title'), export: label('settings.privacy.export') };
  return {
    title: 'legal.privacy.title',
    intro: 'legal.privacy.intro',
    toc: true,
    sections: [
      { id: 'who', title: 'legal.privacy.who.title', body: ['legal.privacy.who.body'] },
      {
        id: 'collect',
        title: 'legal.privacy.collect.title',
        body: ['legal.privacy.collect.intro'],
        list: [
          'legal.privacy.collect.account',
          'legal.privacy.collect.profile',
          'legal.privacy.collect.training',
          'legal.privacy.collect.nutrition',
          'legal.privacy.collect.weight',
          'legal.privacy.collect.coach',
          'legal.privacy.collect.motivation',
          'legal.privacy.collect.usage',
          'legal.privacy.collect.signIn',
          'legal.privacy.collect.push',
        ],
        after: ['legal.privacy.collect.notCollected'],
      },
      { id: 'health', title: 'legal.privacy.health.title', body: ['legal.privacy.health.body1', 'legal.privacy.health.body2'] },
      {
        id: 'use',
        title: 'legal.privacy.use.title',
        list: ['legal.privacy.use.provide', 'legal.privacy.use.safety', 'legal.privacy.use.ai', 'legal.privacy.use.security'],
        after: ['legal.privacy.use.never', 'legal.privacy.use.legalBasis'],
      },
      {
        id: 'storage',
        title: 'legal.privacy.storage.title',
        body: [
          'legal.privacy.storage.server',
          'legal.privacy.storage.transit',
          'legal.privacy.storage.secrets',
          'legal.privacy.storage.rest',
          'legal.privacy.storage.access',
          'legal.privacy.storage.device',
          'legal.privacy.storage.files',
        ],
      },
      {
        id: 'ai',
        title: 'legal.privacy.ai.title',
        body: ['legal.privacy.ai.intro'],
        list: ['legal.privacy.ai.coach', 'legal.privacy.ai.photo', 'legal.privacy.ai.plan'],
        after: ['legal.privacy.ai.safety', 'legal.privacy.ai.provider', 'legal.privacy.ai.transfer', 'legal.privacy.ai.accuracy'],
      },
      { id: 'barcode', title: 'legal.privacy.barcode.title', body: ['legal.privacy.barcode.body1', 'legal.privacy.barcode.body2'] },
      {
        id: 'sharing',
        title: 'legal.privacy.sharing.title',
        list: [
          'legal.privacy.sharing.hosting',
          'legal.privacy.sharing.ai',
          'legal.privacy.sharing.openFoodFacts',
          'legal.privacy.sharing.push',
          'legal.privacy.sharing.email',
          'legal.privacy.sharing.law',
        ],
        after: ['legal.privacy.sharing.never'],
      },
      {
        id: 'retention',
        title: 'legal.privacy.retention.title',
        list: [
          'legal.privacy.retention.account',
          'legal.privacy.retention.sessions',
          'legal.privacy.retention.push',
          'legal.privacy.retention.reset',
          'legal.privacy.retention.duplicates',
          'legal.privacy.retention.usage',
          'legal.privacy.retention.logs',
          'legal.privacy.retention.backups',
        ],
      },
      {
        id: 'rights',
        title: 'legal.privacy.rights.title',
        list: [
          { key: 'legal.privacy.rights.export', params: exportPath },
          'legal.privacy.rights.correct',
          'legal.privacy.rights.delete',
          'legal.privacy.rights.permissions',
        ],
        after: ['legal.privacy.rights.law'],
      },
      {
        id: 'minors',
        title: 'legal.privacy.minors.title',
        body: ['legal.privacy.minors.age', 'legal.privacy.minors.under13', 'legal.privacy.minors.consent', 'legal.privacy.minors.rules', 'legal.privacy.minors.private'],
      },
      { id: 'changes', title: 'legal.privacy.changes.title', body: ['legal.privacy.changes.body'] },
      { id: 'contact', title: 'legal.privacy.contact.title', body: ['legal.privacy.contact.body'] },
    ],
  };
}

function devicePrivacy(label: LabelFn): LegalDoc {
  const settings = { profile: label('nav.profile'), section: label('device.settings.dataTitle') };
  return {
    title: 'legal.privacy.title',
    intro: 'legal.device.privacy.intro',
    toc: true,
    sections: [
      { id: 'who', title: 'legal.privacy.who.title', body: ['legal.privacy.who.body'] },
      {
        id: 'summary',
        title: 'legal.device.privacy.summary.title',
        list: [
          'legal.device.privacy.summary.local',
          'legal.device.privacy.summary.online',
          'legal.device.privacy.summary.copies',
          'legal.device.privacy.summary.none',
        ],
      },
      {
        id: 'stored',
        title: 'legal.device.privacy.stored.title',
        body: ['legal.device.privacy.stored.intro'],
        list: [
          'legal.device.privacy.stored.name',
          'legal.privacy.collect.profile',
          'legal.privacy.collect.training',
          'legal.privacy.collect.nutrition',
          'legal.privacy.collect.weight',
          'legal.device.privacy.stored.coach',
          'legal.privacy.collect.motivation',
          'legal.device.privacy.stored.internal',
          'legal.device.privacy.stored.technical',
          'legal.device.privacy.stored.reminders',
          'legal.device.privacy.stored.local',
        ],
        after: ['legal.device.privacy.stored.notCollected'],
      },
      { id: 'health', title: 'legal.privacy.health.title', body: ['legal.device.privacy.health.body1', 'legal.privacy.health.body2'] },
      {
        id: 'use',
        title: 'legal.privacy.use.title',
        list: ['legal.privacy.use.provide', 'legal.privacy.use.safety'],
        after: ['legal.privacy.use.never', 'legal.device.privacy.use.legalBasis'],
      },
      {
        id: 'storage',
        title: 'legal.privacy.storage.title',
        body: [
          'legal.device.privacy.storage.phone',
          'legal.device.privacy.storage.protection',
          'legal.device.privacy.storage.access',
          'legal.device.privacy.storage.noSync',
        ],
      },
      {
        id: 'backups',
        title: 'legal.device.privacy.backups.title',
        body: [{ key: 'legal.device.privacy.backups.file', params: { save: label('device.settings.saveBackup') } }, 'legal.device.privacy.backups.fileCare'],
        list: [
          'legal.device.privacy.backups.androidWhat',
          'legal.device.privacy.backups.androidCloud',
          'legal.device.privacy.backups.androidOld',
          'legal.device.privacy.backups.androidTransfer',
        ],
        after: ['legal.device.privacy.backups.androidControl'],
      },
      {
        id: 'barcode',
        title: 'legal.privacy.barcode.title',
        body: ['legal.device.privacy.barcode.body1', 'legal.device.privacy.barcode.body2', 'legal.device.privacy.barcode.only'],
      },
      { id: 'ai', title: 'legal.privacy.ai.title', body: ['legal.device.privacy.ai.body'] },
      {
        id: 'sharing',
        title: 'legal.privacy.sharing.title',
        list: ['legal.device.privacy.sharing.openFoodFacts', 'legal.device.privacy.sharing.yourChoice', 'legal.device.privacy.sharing.google'],
        after: ['legal.device.privacy.sharing.us', 'legal.privacy.sharing.never'],
      },
      {
        id: 'retention',
        title: 'legal.privacy.retention.title',
        list: [
          'legal.device.privacy.retention.data',
          'legal.device.privacy.retention.technical',
          'legal.device.privacy.retention.files',
          'legal.device.privacy.retention.android',
        ],
      },
      {
        id: 'rights',
        title: 'legal.privacy.rights.title',
        list: [
          { key: 'legal.device.privacy.rights.export', params: { ...settings, save: label('device.settings.saveBackup') } },
          'legal.privacy.rights.correct',
          { key: 'legal.device.privacy.rights.delete', params: { ...settings, erase: label('device.settings.erase') } },
          'legal.device.privacy.rights.permissions',
        ],
        after: ['legal.device.privacy.rights.law'],
      },
      {
        id: 'minors',
        title: 'legal.privacy.minors.title',
        body: ['legal.privacy.minors.age', 'legal.device.privacy.minors.under13', 'legal.privacy.minors.consent', 'legal.device.privacy.minors.rules', 'legal.privacy.minors.private'],
      },
      { id: 'changes', title: 'legal.privacy.changes.title', body: ['legal.device.privacy.changes.body'] },
      { id: 'contact', title: 'legal.privacy.contact.title', body: ['legal.privacy.contact.body'] },
    ],
  };
}

function serverTerms(): LegalDoc {
  return {
    title: 'legal.terms.title',
    intro: 'legal.terms.intro',
    toc: true,
    sections: [
      {
        id: 'medical',
        title: 'legal.terms.medical.title',
        body: ['legal.terms.medical.general'],
        list: ['legal.terms.medical.doctor', 'legal.terms.medical.stop', 'legal.terms.medical.estimates', 'legal.terms.medical.ai'],
      },
      { id: 'eligibility', title: 'legal.terms.eligibility.title', body: ['legal.terms.eligibility.age', 'legal.terms.eligibility.minors'] },
      { id: 'account', title: 'legal.terms.account.title', body: ['legal.terms.account.accurate', 'legal.terms.account.password'] },
      { id: 'use', title: 'legal.terms.use.title', body: ['legal.terms.use.body'] },
      { id: 'content', title: 'legal.terms.content.title', body: ['legal.terms.content.yours', 'legal.terms.content.ours'] },
      { id: 'service', title: 'legal.terms.service.title', body: ['legal.terms.service.body'] },
      { id: 'liability', title: 'legal.terms.liability.title', body: ['legal.terms.liability.body'] },
      { id: 'ending', title: 'legal.terms.ending.title', body: ['legal.terms.ending.body'] },
      { id: 'law', title: 'legal.terms.law.title', body: ['legal.terms.law.body'] },
      { id: 'changes', title: 'legal.terms.changes.title', body: ['legal.terms.changes.body'] },
      { id: 'contact', title: 'legal.terms.contact.title', body: ['legal.terms.contact.body'] },
    ],
  };
}

function deviceTerms(): LegalDoc {
  return {
    title: 'legal.terms.title',
    intro: 'legal.device.terms.intro',
    toc: true,
    sections: [
      {
        id: 'medical',
        title: 'legal.terms.medical.title',
        body: ['legal.terms.medical.general'],
        list: ['legal.terms.medical.doctor', 'legal.terms.medical.stop', 'legal.device.terms.medical.estimates', 'legal.device.terms.medical.coach'],
      },
      { id: 'eligibility', title: 'legal.terms.eligibility.title', body: ['legal.terms.eligibility.age', 'legal.terms.eligibility.minors'] },
      {
        id: 'data',
        title: 'legal.device.terms.data.title',
        body: ['legal.terms.account.accurate', 'legal.device.terms.data.keep', 'legal.device.terms.data.lock'],
      },
      { id: 'use', title: 'legal.terms.use.title', body: ['legal.device.terms.use.body'] },
      { id: 'content', title: 'legal.terms.content.title', body: ['legal.device.terms.content.yours', 'legal.terms.content.ours'] },
      { id: 'service', title: 'legal.terms.service.title', body: ['legal.device.terms.service.body'] },
      { id: 'liability', title: 'legal.terms.liability.title', body: ['legal.device.terms.liability.body'] },
      { id: 'ending', title: 'legal.terms.ending.title', body: ['legal.device.terms.ending.body'] },
      { id: 'law', title: 'legal.terms.law.title', body: ['legal.terms.law.body'] },
      { id: 'changes', title: 'legal.terms.changes.title', body: ['legal.device.terms.changes.body'] },
      { id: 'contact', title: 'legal.terms.contact.title', body: ['legal.terms.contact.body'] },
    ],
  };
}

function serverDeletion(label: LabelFn): LegalDoc {
  return {
    title: 'legal.deletion.title',
    intro: 'legal.deletion.intro',
    toc: false,
    sections: [
      {
        id: 'in-app',
        title: 'legal.deletion.inApp.title',
        ordered: true,
        list: [
          'legal.deletion.inApp.open',
          { key: 'legal.deletion.inApp.profile', params: { profile: label('nav.profile') } },
          { key: 'legal.deletion.inApp.section', params: { section: label('settings.privacy.title') } },
          { key: 'legal.deletion.inApp.export', params: { export: label('settings.privacy.export') } },
          { key: 'legal.deletion.inApp.delete', params: { delete: label('settings.privacy.delete') } },
          { key: 'legal.deletion.inApp.confirm', params: { submit: label('settings.privacy.deleteModal.submit') } },
        ],
        after: ['legal.deletion.inApp.done'],
      },
      {
        id: 'deleted',
        title: 'legal.deletion.deleted.title',
        body: ['legal.deletion.deleted.intro'],
        list: [
          'legal.deletion.deleted.account',
          'legal.deletion.deleted.profile',
          'legal.deletion.deleted.training',
          'legal.deletion.deleted.nutrition',
          'legal.deletion.deleted.weight',
          'legal.deletion.deleted.coach',
          'legal.deletion.deleted.motivation',
          'legal.deletion.deleted.technical',
        ],
      },
      {
        id: 'kept',
        title: 'legal.deletion.kept.title',
        list: ['legal.deletion.kept.products', 'legal.deletion.kept.logs', 'legal.deletion.kept.backups', 'legal.deletion.kept.ai', 'legal.deletion.kept.device'],
      },
      {
        id: 'no-login',
        title: 'legal.deletion.noLogin.title',
        body: [{ key: 'legal.deletion.noLogin.forgot', params: { forgot: label('auth.login.forgot') } }, 'legal.deletion.noLogin.email'],
      },
      { id: 'partial', title: 'legal.deletion.partial.title', body: ['legal.deletion.partial.body'] },
    ],
  };
}

function deviceDeletion(label: LabelFn): LegalDoc {
  return {
    title: 'legal.device.deletion.title',
    intro: 'legal.device.deletion.intro',
    toc: false,
    sections: [
      {
        id: 'in-app',
        title: 'legal.device.deletion.inApp.title',
        ordered: true,
        list: [
          'legal.device.deletion.inApp.open',
          { key: 'legal.device.deletion.inApp.profile', params: { profile: label('nav.profile') } },
          { key: 'legal.device.deletion.inApp.section', params: { section: label('device.settings.dataTitle') } },
          { key: 'legal.device.deletion.inApp.backup', params: { save: label('device.settings.saveBackup') } },
          { key: 'legal.device.deletion.inApp.erase', params: { erase: label('device.settings.erase'), continue: label('device.erase.continue') } },
          { key: 'legal.device.deletion.inApp.confirm', params: { confirm: label('device.erase.confirm') } },
        ],
        after: ['legal.device.deletion.inApp.done'],
      },
      { id: 'uninstall', title: 'legal.device.deletion.uninstall.title', body: ['legal.device.deletion.uninstall.body'] },
      {
        id: 'deleted',
        title: 'legal.deletion.deleted.title',
        body: ['legal.device.deletion.deleted.intro'],
        list: [
          'legal.device.deletion.deleted.name',
          'legal.deletion.deleted.profile',
          'legal.deletion.deleted.training',
          'legal.deletion.deleted.nutrition',
          'legal.deletion.deleted.weight',
          'legal.deletion.deleted.coach',
          'legal.deletion.deleted.motivation',
          'legal.device.deletion.deleted.technical',
          'legal.device.deletion.deleted.local',
          'legal.device.deletion.deleted.reminders',
          'legal.device.deletion.deleted.cache',
        ],
      },
      {
        id: 'kept',
        title: 'legal.deletion.kept.title',
        list: ['legal.device.deletion.kept.files', 'legal.device.deletion.kept.android', 'legal.device.deletion.kept.openFoodFacts'],
      },
      { id: 'us', title: 'legal.device.deletion.us.title', body: ['legal.device.deletion.us.body'] },
      { id: 'partial', title: 'legal.deletion.partial.title', body: ['legal.device.deletion.partial.body'] },
    ],
  };
}

/** The document `name` as it reads in `mode`. `label` translates the UI labels quoted in the steps. */
export function legalDocument(name: LegalDocName, mode: LegalMode, label: LabelFn): LegalDoc {
  if (name === 'privacy') return mode === 'device' ? devicePrivacy(label) : serverPrivacy(label);
  if (name === 'terms') return mode === 'device' ? deviceTerms() : serverTerms();
  return mode === 'device' ? deviceDeletion(label) : serverDeletion(label);
}

/** Every text key a document uses (title, intro, section titles and texts). */
export function documentKeys(doc: LegalDoc): TKey[] {
  const keyOf = (t: LegalText) => (typeof t === 'string' ? t : t.key);
  return [doc.title, doc.intro, ...doc.sections.flatMap((s) => [s.title, ...[...(s.body ?? []), ...(s.list ?? []), ...(s.after ?? [])].map(keyOf)])];
}
