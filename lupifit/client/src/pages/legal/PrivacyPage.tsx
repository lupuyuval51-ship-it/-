import { LegalDocument, type LegalSection } from '../../features/legal/LegalDocument';
import { useI18n } from '../../i18n';

/** Public privacy policy (/privacy). Every statement must match what the code does. */
export default function PrivacyPage() {
  const { t } = useI18n();
  const exportPath = { profile: t('nav.profile'), section: t('settings.privacy.title'), export: t('settings.privacy.export') };
  const sections: LegalSection[] = [
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
  ];
  return <LegalDocument title="legal.privacy.title" intro="legal.privacy.intro" sections={sections} toc />;
}
