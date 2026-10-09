import { PageHeader } from '../../components/ui';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { useI18n } from '../../i18n';

export default function DashboardPage() {
  const { t } = useI18n();
  useDocumentTitle(t('dashboard.title'));
  return <PageHeader title={t('dashboard.title')} />;
}
