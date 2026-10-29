import { LegalDocument, type LegalSection } from '../../features/legal/LegalDocument';
import { useI18n } from '../../i18n';

/**
 * Public account-deletion instructions (/account-deletion), the URL Google Play asks for. The step
 * labels are read from the real settings and auth strings so they always match the app.
 */
export default function AccountDeletionPage() {
  const { t } = useI18n();
  const sections: LegalSection[] = [
    {
      id: 'in-app',
      title: 'legal.deletion.inApp.title',
      ordered: true,
      list: [
        'legal.deletion.inApp.open',
        { key: 'legal.deletion.inApp.profile', params: { profile: t('nav.profile') } },
        { key: 'legal.deletion.inApp.section', params: { section: t('settings.privacy.title') } },
        { key: 'legal.deletion.inApp.export', params: { export: t('settings.privacy.export') } },
        { key: 'legal.deletion.inApp.delete', params: { delete: t('settings.privacy.delete') } },
        { key: 'legal.deletion.inApp.confirm', params: { submit: t('settings.privacy.deleteModal.submit') } },
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
      body: [{ key: 'legal.deletion.noLogin.forgot', params: { forgot: t('auth.login.forgot') } }, 'legal.deletion.noLogin.email'],
    },
    { id: 'partial', title: 'legal.deletion.partial.title', body: ['legal.deletion.partial.body'] },
  ];
  return <LegalDocument title="legal.deletion.title" intro="legal.deletion.intro" sections={sections} />;
}
