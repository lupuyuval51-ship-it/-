import { TabList, TabSlot, TabTrigger, Tabs } from 'expo-router/ui';
import { StyleSheet } from 'react-native';

import { AppTabBar, TabButton } from '@/components/layout/TabBar';
import { useI18n } from '@/i18n';

/** Headless tabs with a fully custom floating bar (identical on native and web). */
export default function TabsLayout() {
  const { t } = useI18n();
  return (
    <Tabs style={styles.tabs}>
      <TabSlot style={styles.slot} />
      <TabList asChild>
        <AppTabBar>
          <TabTrigger name="index" href="/" asChild>
            <TabButton icon="compass" label={t('tabs.discover')} testID="tab-index" />
          </TabTrigger>
          <TabTrigger name="generate" href="/generate" asChild>
            <TabButton icon="sparkles" label={t('tabs.generate')} testID="tab-generate" />
          </TabTrigger>
          <TabTrigger name="saved" href="/saved" asChild>
            <TabButton icon="bookmark" label={t('tabs.saved')} testID="tab-saved" />
          </TabTrigger>
          <TabTrigger name="profile" href="/profile" asChild>
            <TabButton icon="user" label={t('tabs.profile')} testID="tab-profile" />
          </TabTrigger>
        </AppTabBar>
      </TabList>
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabs: { flex: 1 },
  slot: { flex: 1 },
});
