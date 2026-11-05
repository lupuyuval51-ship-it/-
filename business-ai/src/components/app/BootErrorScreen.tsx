import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, EmptyState, ErrorState, Screen } from '@/components/ui';
import { useAuth } from '@/features/auth/AuthProvider';
import { useT } from '@/i18n/I18nProvider';
import { spacing } from '@/theme/tokens';

export interface BootErrorScreenProps {
  error: unknown;
  /** The request is paused because the device is offline. */
  offline: boolean;
  onRetry: () => void;
  retrying: boolean;
}

/** Signed in, but the business list (needed to route) could not be loaded and nothing is cached. */
export function BootErrorScreen({ error, offline, onRetry, retrying }: BootErrorScreenProps) {
  const t = useT();
  const { signOut } = useAuth();
  const [signingOut, setSigningOut] = useState(false);
  return (
    <Screen scroll={false} testID="boot-error">
      <View style={styles.center}>
        {offline ? (
          <EmptyState
            icon="wifi-off"
            title={t('common.states.offlineTitle')}
            body={t('common.boot.offlineBody')}
            action={{ label: t('common.actions.retry'), onPress: onRetry, loading: retrying }}
          />
        ) : (
          <ErrorState title={t('common.boot.errorTitle')} error={error} onRetry={onRetry} retrying={retrying} />
        )}
        <Button
          variant="quiet"
          label={t('common.boot.signOut')}
          loading={signingOut}
          onPress={async () => {
            setSigningOut(true);
            await signOut().catch(() => undefined);
            setSigningOut(false);
          }}
          style={styles.signOut}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', gap: spacing[2] },
  signOut: { alignSelf: 'center' },
});
