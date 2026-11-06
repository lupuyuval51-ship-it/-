import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { CategoryChips } from '@/components/ideas/CategoryChips';
import { FeaturedCard } from '@/components/ideas/FeaturedCard';
import { HorizontalIdeas } from '@/components/ideas/HorizontalIdeas';
import { IdeaCard } from '@/components/ideas/IdeaCard';
import { Screen } from '@/components/layout/Screen';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { ScalePressable } from '@/components/ui/Pressable';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { allIdeas } from '@/data/ideas';
import type { CategorySlug } from '@/data/types';
import { beginnerIdeas, curatedIdeas, experimentalIdeas, featuredIdeaForDate, greetingKey, profitableIdeas, trendingIdeas } from '@/features/discover/sections';
import { useI18n } from '@/i18n';
import { usePreferences } from '@/store/preferences';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, space } from '@/theme/tokens';

export default function DiscoverScreen() {
  const { t } = useI18n();
  const router = useRouter();
  const { colors } = useTheme();
  const displayName = usePreferences((s) => s.displayName);
  const onboarding = usePreferences((s) => s.onboarding);
  const onboardingCompleted = usePreferences((s) => s.onboardingCompleted);

  const sections = useMemo(() => {
    const today = new Date();
    const featured = featuredIdeaForDate(allIdeas, today);
    const rest = allIdeas.filter((idea) => idea.id !== featured?.id);
    return {
      featured,
      curated: curatedIdeas(rest, onboarding, 8, today.toDateString()),
      trending: trendingIdeas(rest, 8),
      beginner: beginnerIdeas(rest, 3),
      profitable: profitableIdeas(rest, 8),
      experimental: experimentalIdeas(rest, 3),
    };
  }, [onboarding]);

  const greeting = t(`greeting.${greetingKey()}`);
  const hasSignal = onboardingCompleted && (onboarding.interests.length > 0 || onboarding.experience);

  const openSearch = (category?: CategorySlug | null) => {
    if (category) router.push({ pathname: '/search', params: { category } });
    else router.push('/search');
  };

  return (
    <Screen scroll withTabBar testID="discover-screen">
      <View style={styles.hero}>
        <AppText variant="display">
          {greeting}
          {displayName ? `, ${displayName}` : ''}
        </AppText>
        <AppText variant="body" color="textSecondary">
          {t('greeting.subtitle')}
        </AppText>
      </View>

      <ScalePressable
        onPress={() => openSearch()}
        pressedScale={0.99}
        accessibilityRole="search"
        accessibilityLabel={t('discover.searchPlaceholder')}
        testID="discover-search"
        style={[styles.search, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Icon name="search" size={18} color="textTertiary" />
        <AppText variant="body" color="textTertiary" style={styles.flex} numberOfLines={1}>
          {t('discover.searchPlaceholder')}
        </AppText>
        <View style={[styles.searchKey, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
          <Icon name="sliders" size={14} color="textSecondary" />
        </View>
      </ScalePressable>

      {sections.featured ? (
        <View style={styles.section}>
          <FeaturedCard idea={sections.featured} />
        </View>
      ) : null}

      <View style={styles.section}>
        <SectionHeader title={t('discover.categories')} />
        <CategoryChips selected={null} onSelect={(slug) => openSearch(slug)} />
      </View>

      <View style={styles.section}>
        <SectionHeader title={t('discover.curated')} hint={hasSignal ? t('discover.curatedHint') : undefined} actionLabel={t('common.seeAll')} onAction={() => openSearch()} />
        <HorizontalIdeas ideas={sections.curated} testID="curated-list" />
      </View>

      <View style={styles.section}>
        <SectionHeader title={t('discover.trending')} hint={t('discover.trendingHint')} />
        <HorizontalIdeas ideas={sections.trending} />
      </View>

      <View style={styles.section}>
        <SectionHeader title={t('discover.beginner')} hint={t('discover.beginnerHint')} actionLabel={t('common.seeAll')} onAction={() => router.push({ pathname: '/search', params: { flag: 'beginner' } })} />
        <View style={styles.list}>
          {sections.beginner.map((idea) => (
            <IdeaCard key={idea.id} idea={idea} />
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <SectionHeader title={t('discover.profitable')} hint={t('discover.profitableHint')} actionLabel={t('common.seeAll')} onAction={() => router.push({ pathname: '/search', params: { flag: 'profitable' } })} />
        <HorizontalIdeas ideas={sections.profitable} />
      </View>

      <View style={styles.section}>
        <SectionHeader title={t('discover.experimental')} hint={t('discover.experimentalHint')} actionLabel={t('common.seeAll')} onAction={() => router.push({ pathname: '/search', params: { flag: 'experimental' } })} />
        <View style={styles.list}>
          {sections.experimental.map((idea) => (
            <IdeaCard key={idea.id} idea={idea} />
          ))}
        </View>
      </View>

      <View style={[styles.section, styles.allIdeas]}>
        <AppText variant="bodySmall" color="textSecondary" align="center">
          {t('discover.ideaCount', { count: allIdeas.length })}
        </AppText>
        <Button label={t('discover.allIdeas')} variant="outline" iconEnd="arrow-right" onPress={() => openSearch()} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  hero: {
    paddingTop: space.lg,
    paddingBottom: space.xl,
    gap: space.xs,
  },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    height: 52,
    paddingStart: space.lg,
    paddingEnd: space.sm,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: space.xxl,
  },
  searchKey: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
  },
  section: {
    marginBottom: space.xxxl,
  },
  list: {
    gap: space.md,
  },
  allIdeas: {
    alignItems: 'center',
    gap: space.md,
  },
});
