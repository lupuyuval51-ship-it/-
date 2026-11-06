import { useRouter } from 'expo-router';

import { Screen } from '@/components/layout/Screen';
import { EmptyState } from '@/components/ui/EmptyState';
import { useI18n } from '@/i18n';

export default function NotFoundScreen() {
  const { t } = useI18n();
  const router = useRouter();
  return (
    <Screen>
      <EmptyState icon="alert" title={t('errors.notFoundTitle')} hint={t('errors.notFoundHint')} actionLabel={t('errors.goHome')} onAction={() => router.replace('/')} />
    </Screen>
  );
}
