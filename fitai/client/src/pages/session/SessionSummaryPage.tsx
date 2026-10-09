import { PageHeader } from '../../components/ui';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { useI18n } from '../../i18n';

export default function SessionSummaryPage() {
  const { t } = useI18n();
  useDocumentTitle(t('session.title'));
  return <PageHeader title={t('session.title')} />;
}
