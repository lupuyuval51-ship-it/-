import { PageHeader } from '../../components/ui';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { useI18n } from '../../i18n';

export default function ProgressPage() {
  const { t } = useI18n();
  useDocumentTitle(t('progress.title'));
  return <PageHeader title={t('progress.title')} />;
}
