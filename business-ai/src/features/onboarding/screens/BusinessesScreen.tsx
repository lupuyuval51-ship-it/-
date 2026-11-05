/**
 * /businesses — every non-archived business: name, stage, country and setup status, with the
 * active one marked. Tap = make active and go home (or resume setup); the edit button opens
 * /businesses/[id]; the one primary action starts a new business (/onboarding?new=1).
 */
import { Stack, useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { Button, Divider, EmptyState, ErrorState, Icon, IconButton, LoadingState, Screen, Text, useNotice } from '@/components/ui';
import { useActiveBusiness, useBusinesses, useSetActiveBusiness, type Business } from '@/features/business/api';
import { useLocale, useT } from '@/i18n/I18nProvider';
import { useTheme } from '@/theme/ThemeProvider';
import { spacing } from '@/theme/tokens';
import { countryName } from '../logic';

export default function BusinessesScreen() {
  const t = useT();
  const { locale } = useLocale();
  const { colors } = useTheme();
  const router = useRouter();
  const notice = useNotice();
  const { businesses, businessId: activeId, isLoading, error, refetch } = useActiveBusiness();
  const { isRefetching } = useBusinesses();
  const setActive = useSetActiveBusiness();

  const startNew = () => router.push('/onboarding?new=1');

  const open = (business: Business) => {
    if (business.id !== activeId) {
      setActive.mutate(business.id);
      notice.show({ message: t('business.active.switched', { name: business.name }) });
    }
    // An unfinished setup resumes where it stopped; otherwise go home.
    router.replace(business.onboarding_completed_at ? '/' : '/onboarding');
  };

  const header = <Stack.Screen options={{ title: t('onboarding.businesses.title') }} />;

  if (!businesses.length) {
    return (
      <>
        {header}
        <Screen edges={['bottom']}>
          {isLoading ? (
            <LoadingState variant="list" count={3} />
          ) : error ? (
            <ErrorState error={error} title={t('onboarding.businesses.loadFailed')} onRetry={refetch} retrying={isRefetching} />
          ) : (
            <EmptyState
              title={t('onboarding.businesses.emptyTitle')}
              body={t('onboarding.businesses.emptyBody')}
              icon="briefcase"
              action={{ label: t('onboarding.businesses.emptyAction'), onPress: startNew, variant: 'primary' }}
            />
          )}
        </Screen>
      </>
    );
  }

  return (
    <>
      {header}
      <Screen
        edges={['bottom']}
        refreshing={isRefetching}
        onRefresh={refetch}
        footer={<Button label={t('onboarding.businesses.new')} icon="plus" onPress={startNew} fullWidth testID="businesses-new" />}
        testID="businesses-screen"
      >
        <View>
          {businesses.map((business, index) => {
            const isActive = business.id === activeId;
            const incomplete = business.onboarding_completed_at === null;
            const country = countryName(business.country_code, locale);
            const subtitle = [t(`business.stage.${business.stage}`), country].filter(Boolean).join(' · ');
            const status = isActive ? t('onboarding.businesses.active') : incomplete ? t('onboarding.businesses.incomplete') : null;
            return (
              <View key={business.id}>
                {index > 0 ? <Divider /> : null}
                <View style={styles.row}>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={[business.name, subtitle, status].filter(Boolean).join(', ')}
                    accessibilityHint={t('onboarding.businesses.makeActiveHint')}
                    accessibilityState={{ selected: isActive }}
                    onPress={() => open(business)}
                    testID={`businesses-row-${business.id}`}
                    style={({ pressed }) => [styles.main, pressed ? { backgroundColor: colors.backgroundAlt } : null]}
                  >
                    <View style={styles.text}>
                      <Text variant="bodyStrong" numberOfLines={2}>
                        {business.name}
                      </Text>
                      <Text variant="caption" tone="secondary">
                        {subtitle}
                      </Text>
                      {incomplete ? (
                        <Text variant="caption" tone="warning">
                          {t('onboarding.businesses.incomplete')}
                        </Text>
                      ) : null}
                    </View>
                    {isActive ? (
                      <View style={styles.active}>
                        <Icon name="check" size={16} tone="accent" />
                        <Text variant="caption" tone="accent" weight={500}>
                          {t('onboarding.businesses.active')}
                        </Text>
                      </View>
                    ) : null}
                  </Pressable>
                  <IconButton
                    icon="edit-2"
                    tone="secondary"
                    accessibilityLabel={t('onboarding.businesses.editA11y', { name: business.name })}
                    onPress={() => router.push({ pathname: '/businesses/[id]', params: { id: business.id } })}
                    testID={`businesses-edit-${business.id}`}
                  />
                </View>
              </View>
            );
          })}
        </View>
      </Screen>
    </>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing[2] },
  main: { flex: 1, minHeight: 64, flexDirection: 'row', alignItems: 'center', gap: spacing[3], paddingVertical: spacing[3] },
  text: { flex: 1, gap: 2 },
  active: { flexDirection: 'row', alignItems: 'center', gap: spacing[1] },
});
