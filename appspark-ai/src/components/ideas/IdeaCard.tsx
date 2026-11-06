import { useRouter } from 'expo-router';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { Badge } from '@/components/ui/Badge';
import { ScalePressable } from '@/components/ui/Pressable';
import { getCategory } from '@/data/categories';
import type { Idea } from '@/data/types';
import { useI18n } from '@/i18n';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, space } from '@/theme/tokens';

import { IdeaMetaRow } from './IdeaMeta';
import { IdeaTile } from './IdeaTile';
import { SaveButton } from './SaveButton';

export interface IdeaCardProps {
  idea: Idea;
  /** `row` is the default list card; `column` is the horizontal-carousel card. */
  layout?: 'row' | 'column';
  style?: StyleProp<ViewStyle>;
  badge?: string;
  testID?: string;
}

export function IdeaCard({ idea, layout = 'row', style, badge, testID }: IdeaCardProps) {
  const router = useRouter();
  const { pick, t } = useI18n();
  const { colors } = useTheme();
  const category = getCategory(idea.category);
  const open = () => router.push({ pathname: '/idea/[id]', params: { id: idea.id } });

  if (layout === 'column') {
    return (
      <ScalePressable
        onPress={open}
        accessibilityRole="button"
        accessibilityLabel={t('a11y.openIdea', { name: pick(idea.name) })}
        testID={testID}
        style={[styles.column, { backgroundColor: colors.surface, borderColor: colors.border }, style]}>
        <View style={styles.columnTop}>
          <IdeaTile identity={idea.identity} size={48} />
          <SaveButton ideaId={idea.id} variant="plain" />
        </View>
        <View style={styles.columnBody}>
          <AppText variant="caption" color="textTertiary" numberOfLines={1}>
            {pick(category.label)}
          </AppText>
          <AppText variant="subheading" weight="semibold" numberOfLines={2}>
            {pick(idea.name)}
          </AppText>
          <AppText variant="bodySmall" color="textSecondary" numberOfLines={3}>
            {pick(idea.tagline)}
          </AppText>
        </View>
        <IdeaMetaRow idea={idea} compact />
      </ScalePressable>
    );
  }

  return (
    <ScalePressable
      onPress={open}
      accessibilityRole="button"
      accessibilityLabel={t('a11y.openIdea', { name: pick(idea.name) })}
      testID={testID}
      style={[styles.row, { backgroundColor: colors.surface, borderColor: colors.border }, style]}>
      <IdeaTile identity={idea.identity} size={56} />
      <View style={styles.rowBody}>
        <View style={styles.rowHeader}>
          <AppText variant="caption" color="textTertiary" numberOfLines={1} style={styles.flex}>
            {pick(category.label)}
          </AppText>
          {badge ? <Badge label={badge} tone="accent" /> : null}
        </View>
        <AppText variant="subheading" weight="semibold" numberOfLines={1}>
          {pick(idea.name)}
        </AppText>
        <AppText variant="bodySmall" color="textSecondary" numberOfLines={2}>
          {pick(idea.tagline)}
        </AppText>
        <IdeaMetaRow idea={idea} compact />
      </View>
      <SaveButton ideaId={idea.id} variant="plain" />
    </ScalePressable>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: space.md,
    padding: space.lg,
    borderRadius: radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
  },
  rowBody: {
    flex: 1,
    gap: space.xs,
  },
  rowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
  },
  column: {
    width: 232,
    padding: space.lg,
    borderRadius: radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    gap: space.md,
  },
  columnTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  columnBody: {
    gap: space.xs,
    minHeight: 112,
  },
});
