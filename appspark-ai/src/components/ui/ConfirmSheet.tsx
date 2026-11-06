import { StyleSheet, View } from 'react-native';

import { useI18n } from '@/i18n';
import { space } from '@/theme/tokens';

import { AppText } from './AppText';
import { Button } from './Button';
import { Sheet } from './Sheet';

export interface ConfirmSheetProps {
  visible: boolean;
  title: string;
  message?: string;
  confirmLabel: string;
  destructive?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

/** Cross-platform confirmation (RN Alert is not reliable on web). */
export function ConfirmSheet({ visible, title, message, confirmLabel, destructive, onConfirm, onClose }: ConfirmSheetProps) {
  const { t } = useI18n();
  return (
    <Sheet visible={visible} onClose={onClose} title={title}>
      {message ? (
        <AppText variant="body" color="textSecondary">
          {message}
        </AppText>
      ) : null}
      <View style={styles.row}>
        <Button label={t('common.cancel')} variant="ghost" onPress={onClose} />
        <Button
          label={confirmLabel}
          variant={destructive ? 'danger' : 'primary'}
          onPress={() => {
            onConfirm();
            onClose();
          }}
          testID="confirm-sheet-confirm"
        />
      </View>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: space.sm,
  },
});
