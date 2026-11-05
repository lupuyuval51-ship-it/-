// PHASE_B_STUB
import { useRouter } from 'expo-router';
import { ListRow, Screen, Section } from '@/components/ui';
import { useT } from '@/i18n/I18nProvider';

/** Stub: the workspace feature replaces this. Keep a working link to Settings (sign-out lives there). */
export default function WorkspaceTab() {
  const t = useT();
  const router = useRouter();
  return (
    <Screen edges={['top']} title={t('common.tabs.workspace')} testID="workspace-tab">
      <Section separated>
        <ListRow icon="settings" title={t('settings.title')} onPress={() => router.push('/settings')} accessibilityRole="link" testID="open-settings" />
      </Section>
    </Screen>
  );
}
