import { PageHeader } from '../../components/ui';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { useI18n } from '../../i18n';

export default function NutritionPage() {
  const { t } = useI18n();
  useDocumentTitle(t('nutrition.title'));
  return <PageHeader title={t('nutrition.title')} />;
}
