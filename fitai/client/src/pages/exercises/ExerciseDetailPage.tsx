import { PageHeader } from '../../components/ui';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { useI18n } from '../../i18n';

export default function ExerciseDetailPage() {
  const { t } = useI18n();
  useDocumentTitle(t('exercises.title'));
  return <PageHeader title={t('exercises.title')} />;
}
