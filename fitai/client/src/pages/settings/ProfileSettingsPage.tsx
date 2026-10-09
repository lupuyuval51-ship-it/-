import { PageHeader } from '../../components/ui';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { useI18n } from '../../i18n';

export default function ProfileSettingsPage() {
  const { t } = useI18n();
  useDocumentTitle(t('settings.title'));
  return <PageHeader title={t('settings.title')} />;
}
