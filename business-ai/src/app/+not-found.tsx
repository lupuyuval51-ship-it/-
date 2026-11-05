import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { EmptyState, Screen } from '@/components/ui';
import { useT } from '@/i18n/I18nProvider';

export default function NotFoundRoute() {
  const t = useT();
  const router = useRouter();
  return (
    <Screen scroll={false} testID="not-found">
      <View style={styles.center}>
        <EmptyState
          icon="compass"
          title={t('common.notFound.title')}
          body={t('common.notFound.body')}
          action={{ label: t('common.notFound.home'), onPress: () => router.replace('/') }}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center' },
});
