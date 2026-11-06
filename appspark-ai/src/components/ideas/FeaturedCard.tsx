import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { ScalePressable } from '@/components/ui/Pressable';
import { getCategory } from '@/data/categories';
import type { Idea } from '@/data/types';
import { useI18n } from '@/i18n';
import { identityTint, useTheme } from '@/theme/ThemeProvider';
import { radius, space } from '@/theme/tokens';

import { IdeaMetaRow } from './IdeaMeta';
import { IdeaTile } from './IdeaTile';
import { SaveButton } from './SaveButton';

/** Hero card for the idea of the day. Larger type, the identity tint as a quiet backdrop. */
export function FeaturedCard({ idea }: { idea: Idea }) {
  const router = useRouter();
  const { pick, t } = useI18n();
  const { colors, scheme } = useTheme();
  const tint = identityTint(idea.identity.hue, scheme);
  const category = getCategory(idea.category);
  const open = () => router.push({ pathname: '/idea/[id]', params: { id: idea.id } });

  return (
    <ScalePressable
      onPress={open}
      pressedScale={0.99}
      accessibilityRole="button"
      accessibilityLabel={t('a11y.openIdea', { name: pick(idea.name) })}
      testID="featured-card"
      style={[styles.card, { backgroundColor: colors.surface, borderColor: tint.border }]}>
      <View style={[styles.backdrop, { backgroundColor: tint.background }]} />
      <View style={styles.header}>
        <View style={styles.eyebrow}>
          <AppText variant="caption" weight="semibold" color="accent">
            {t('discover.featured').toUpperCase()}
          </AppText>
          <AppText variant="caption" color="textTertiary">
            · {pick(category.label)}
          </AppText>
        </View>
        <SaveButton ideaId={idea.id} />
      </View>
      <View style={styles.body}>
        <IdeaTile identity={idea.identity} size={72} />
        <View style={styles.texts}>
          <AppText variant="title">{pick(idea.name)}</AppText>
          <AppText variant="body" color="textSecondary" numberOfLines={4}>
            {pick(idea.tagline)}
          </AppText>
        </View>
      </View>
      <View style={styles.footer}>
        <IdeaMetaRow idea={idea} />
        <Button label={t('common.open')} variant="secondary" size="sm" iconEnd="arrow-right" onPress={open} />
      </View>
    </ScalePressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.xl + 4,
    borderWidth: StyleSheet.hairlineWidth,
    padding: space.xl,
    gap: space.lg,
    overflow: 'hidden',
  },
  backdrop: {
    position: 'absolute',
    top: -80,
    end: -60,
    width: 240,
    height: 240,
    borderRadius: 120,
    opacity: 0.55,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  eyebrow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xs,
  },
  body: {
    flexDirection: 'row',
    gap: space.lg,
    alignItems: 'flex-start',
  },
  texts: {
    flex: 1,
    gap: space.sm,
  },
  footer: {
    gap: space.md,
    alignItems: 'flex-start',
  },
});
