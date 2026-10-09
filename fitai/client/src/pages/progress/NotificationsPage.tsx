import { PageHeader } from '../../components/ui';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { useI18n } from '../../i18n';

export default function NotificationsPage() {
  const { t } = useI18n();
  useDocumentTitle(t('notifications.title'));
  return <PageHeader title={t('notifications.title')} />;
}
