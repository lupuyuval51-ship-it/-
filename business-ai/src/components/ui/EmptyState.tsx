import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { spacing } from '@/theme/tokens';
import { Button, type ButtonVariant } from './Button';
import { Icon, type IconName } from './Icon';
import { Text } from './Text';

export interface EmptyStateProps {
  title: string;
  body?: string;
  icon?: IconName;
  action?: { label: string; onPress: () => void; variant?: ButtonVariant; loading?: boolean };
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

/** Calm, centered empty state: optional icon, title, one sentence, at most one action. */
export function EmptyState({ title, body, icon, action, style, testID }: EmptyStateProps) {
  return (
    <View style={[styles.container, style]} testID={testID}>
      {icon ? <Icon name={icon} size={28} tone="secondary" /> : null}
      <View style={styles.text}>
        <Text variant="heading" align="center">
          {title}
        </Text>
        {body ? (
          <Text variant="callout" tone="secondary" align="center">
            {body}
          </Text>
        ) : null}
      </View>
      {action ? (
        <Button label={action.label} onPress={action.onPress} variant={action.variant ?? 'secondary'} loading={action.loading} style={styles.action} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', paddingVertical: spacing[12], paddingHorizontal: spacing[4], gap: spacing[4] },
  text: { gap: spacing[2], maxWidth: 360, alignItems: 'center' },
  action: { alignSelf: 'center' },
});
