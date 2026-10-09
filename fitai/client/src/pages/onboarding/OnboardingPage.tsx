import { PageHeader } from '../../components/ui';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { useI18n } from '../../i18n';

export default function OnboardingPage() {
  const { t } = useI18n();
  useDocumentTitle(t('onboarding.title'));
  return <PageHeader title={t('onboarding.title')} />;
}
