import { StyleSheet, View } from 'react-native';
import { Button, IconButton, Text, TextField } from '@/components/ui';
import { useT } from '@/i18n/I18nProvider';
import { spacing } from '@/theme/tokens';
import { MESSAGE_MAX_LENGTH } from '../conversation';

export interface ComposerProps {
  value: string;
  onChangeText: (text: string) => void;
  onSend: () => void;
  onStop: () => void;
  streaming: boolean;
  online: boolean;
  /** Sending is impossible for another reason (no business, quota reached). */
  disabled?: boolean;
}

/** Multiline message field with Send (or Stop while a reply streams). Disabled offline, with the reason. */
export function Composer({ value, onChangeText, onSend, onStop, streaming, online, disabled = false }: ComposerProps) {
  const t = useT();
  const canSend = online && !disabled && !streaming && value.trim().length > 0;
  return (
    <View style={styles.root}>
      <View style={styles.row}>
        <TextField
          label={t('advisor.chat.composerLabel')}
          placeholder={t('advisor.chat.composerPlaceholder')}
          value={value}
          onChangeText={onChangeText}
          multiline
          maxLength={MESSAGE_MAX_LENGTH}
          disabled={!online || disabled}
          hint={value.length >= MESSAGE_MAX_LENGTH ? t('advisor.chat.composerTooLong', { max: MESSAGE_MAX_LENGTH }) : undefined}
          containerStyle={styles.field}
          testID="advisor-composer"
        />
        <View style={styles.trailing}>
          {streaming ? (
            <Button
              label={t('advisor.chat.stopShort')}
              accessibilityHint={t('advisor.chat.stop')}
              variant="secondary"
              size="compact"
              icon="x"
              onPress={onStop}
              testID="advisor-stop"
            />
          ) : (
            <IconButton
              icon="arrow-up"
              accessibilityLabel={t('advisor.chat.send')}
              variant="secondary"
              tone={canSend ? 'accent' : 'secondary'}
              disabled={!canSend}
              onPress={onSend}
              testID="advisor-send"
            />
          )}
        </View>
      </View>
      {!online ? (
        <Text variant="caption" tone="secondary" accessibilityLiveRegion="polite">
          {t('advisor.chat.offline')}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: spacing[2] },
  row: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing[2] },
  field: { flex: 1 },
  trailing: { paddingBottom: spacing[1] },
});
