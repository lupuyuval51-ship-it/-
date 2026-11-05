// PHASE_B_STUB
import { Screen } from '@/components/ui';
import { useT } from '@/i18n/I18nProvider';

export default function OnboardingStub() {
  const t = useT();
  return <Screen title={t('common.screens.onboarding')} testID="onboarding-stub" />;
}
