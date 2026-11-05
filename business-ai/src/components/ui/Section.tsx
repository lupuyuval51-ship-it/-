import { Children, Fragment, isValidElement, type ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { spacing } from '@/theme/tokens';
import { Button } from './Button';
import { Divider } from './Divider';
import { Text } from './Text';

export interface SectionProps {
  title?: string;
  description?: string;
  /** Optional quiet action at the end of the heading row. */
  action?: { label: string; onPress: () => void; accessibilityHint?: string };
  /** `heading` (default) for content sections, `overline` for settings-style groups. */
  titleVariant?: 'heading' | 'overline';
  /** Insert hairline dividers between children (for ListRow groups). */
  separated?: boolean;
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

/** A titled group of content. No card, no background: spacing and type carry the hierarchy. */
export function Section({ title, description, action, titleVariant = 'heading', separated = false, children, style, testID }: SectionProps) {
  const items = Children.toArray(children).filter((c) => isValidElement(c) || typeof c === 'string');
  return (
    <View style={[styles.section, style]} testID={testID}>
      {title || action ? (
        <View style={styles.header}>
          <View style={styles.headerText}>
            {title ? (
              <Text variant={titleVariant} tone={titleVariant === 'overline' ? 'secondary' : 'default'} accessibilityRole="header">
                {title}
              </Text>
            ) : null}
            {description ? (
              <Text variant="callout" tone="secondary">
                {description}
              </Text>
            ) : null}
          </View>
          {action ? (
            <Button variant="quiet" inline label={action.label} onPress={action.onPress} accessibilityHint={action.accessibilityHint} />
          ) : null}
        </View>
      ) : null}
      <View style={separated ? null : styles.body}>
        {separated
          ? items.map((child, index) => (
              <Fragment key={isValidElement(child) && child.key != null ? child.key : index}>
                {index > 0 ? <Divider /> : null}
                {child}
              </Fragment>
            ))
          : children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: spacing[3], alignSelf: 'stretch' },
  header: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: spacing[4] },
  headerText: { flex: 1, gap: spacing[1] },
  body: { gap: spacing[3] },
});
