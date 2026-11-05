// PHASE_B_STUB
import { Screen } from '@/components/ui';
import { useT } from '@/i18n/I18nProvider';

export default function HomeTab() {
  const t = useT();
  return <Screen edges={['top']} title={t('common.tabs.home')} testID="home-tab" />;
}
