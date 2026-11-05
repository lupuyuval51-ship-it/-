import * as WebBrowser from 'expo-web-browser';
import { Pressable, StyleSheet, View } from 'react-native';
import type { PlanBlock, PlanSectionContent } from '@domain/plan';
import { BasisTag, Icon, Text } from '@/components/ui';
import { useT } from '@/i18n/I18nProvider';
import { DENSE_MAX_FONT_SCALE, layout, spacing } from '@/theme/tokens';
import { safeHttpUrl } from '../logic';

export interface SectionContentViewProps {
  content: PlanSectionContent;
  testID?: string;
}

function SourceLink({ source }: { source: NonNullable<PlanBlock['source']> }) {
  const t = useT();
  const url = safeHttpUrl(source.url);
  if (!url) {
    return (
      <Text variant="caption" tone="secondary" numberOfLines={2} style={styles.sourceText}>
        {source.title}
      </Text>
    );
  }
  return (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel={t('plan.section.openSource', { title: source.title })}
      onPress={() => void WebBrowser.openBrowserAsync(url).catch(() => undefined)}
      hitSlop={{ top: 12, bottom: 12 }}
      style={({ pressed }) => [styles.source, { opacity: pressed ? 0.6 : 1 }]}
    >
      <Text variant="caption" tone="accent" weight={500} numberOfLines={2} maxFontSizeMultiplier={DENSE_MAX_FONT_SCALE} style={styles.sourceText}>
        {source.title}
      </Text>
      <Icon name="external-link" size={12} tone="accent" />
    </Pressable>
  );
}

/**
 * Reader layout of one section: the summary as a lede, then each block as a paragraph with its
 * provenance label (and the source link for verified statements). Used by the section reader,
 * the AI proposal preview and read-only versions, so they look identical.
 */
export function SectionContentView({ content, testID }: SectionContentViewProps) {
  return (
    <View style={styles.root} testID={testID}>
      {content.summary.trim() !== '' ? (
        <Text variant="heading" weight={400} accessibilityRole="text" style={styles.lede}>
          {content.summary}
        </Text>
      ) : null}
      {content.blocks.map((block) => (
        <View key={block.id} style={styles.block}>
          <Text variant="body" selectable>
            {block.text}
          </Text>
          <View style={styles.meta}>
            <BasisTag basis={block.basis} />
            {block.basis === 'verified' && block.source ? <SourceLink source={block.source} /> : null}
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: spacing[6] },
  lede: { lineHeight: 26 },
  block: { gap: spacing[2] },
  meta: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: spacing[2], minHeight: 20 },
  source: { flexDirection: 'row', alignItems: 'center', gap: spacing[1], minHeight: layout.touchTarget - 20, flexShrink: 1 },
  sourceText: { flexShrink: 1 },
});
