import { PageHeader } from '../../components/ui';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { useI18n } from '../../i18n';

export default function WorkoutsPage() {
  const { t } = useI18n();
  useDocumentTitle(t('workouts.title'));
  return <PageHeader title={t('workouts.title')} />;
}
