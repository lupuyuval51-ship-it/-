import { PageHeader } from '../../components/ui';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { useI18n } from '../../i18n';

export default function CoachPage() {
  const { t } = useI18n();
  useDocumentTitle(t('coach.title'));
  return <PageHeader title={t('coach.title')} />;
}
