import { useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';

import { CategoryChips } from '@/components/ideas/CategoryChips';
import { IdeaCard } from '@/components/ideas/IdeaCard';
import { Header } from '@/components/layout/Header';
import { Screen } from '@/components/layout/Screen';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { EmptyState } from '@/components/ui/EmptyState';
import { IconButton } from '@/components/ui/IconButton';
import { Input, type InputHandle } from '@/components/ui/Input';
import { MultiOptionGroup } from '@/components/ui/OptionGroup';
import { Sheet } from '@/components/ui/Sheet';
import { allIdeas } from '@/data/ideas';
import { BUDGET_TIERS, BUSINESS_MODELS, CATEGORY_SLUGS, DIFFICULTIES, PLATFORMS, type CategorySlug } from '@/data/types';
import { applyFilters, countActiveFilters, emptyFilters, searchIdeas, sortIdeas, type IdeaFilters, type SortMode } from '@/features/discover/search';
import { useI18n } from '@/i18n';
import { useTheme } from '@/theme/ThemeProvider';
import { layout, space } from '@/theme/tokens';

type Params = { q?: string; category?: string; flag?: string };

export default function SearchScreen() {
  const { t, locale } = useI18n();
  const { colors } = useTheme();
  const params = useLocalSearchParams<Params>();
  const inputRef = useRef<InputHandle>(null);

  const initialCategory = (CATEGORY_SLUGS as readonly string[]).includes(params.category ?? '') ? (params.category as CategorySlug) : null;
  const [query, setQuery] = useState(params.q ?? '');
  const [filters, setFilters] = useState<IdeaFilters>({
    ...emptyFilters,
    categories: initialCategory ? [initialCategory] : [],
    beginnerFriendly: params.flag === 'beginner',
    profitable: params.flag === 'profitable',
    experimental: params.flag === 'experimental',
  });
  const [sort, setSort] = useState<SortMode>('relevance');
  const [sheetOpen, setSheetOpen] = useState(false);

  useEffect(() => {
    if (!params.q && !params.category && !params.flag) {
      const timer = setTimeout(() => inputRef.current?.focus(), 350);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [params.q, params.category, params.flag]);

  const results = useMemo(() => sortIdeas(applyFilters(searchIdeas(allIdeas, query, locale), filters), sort, locale), [query, filters, sort, locale]);
  const activeCount = countActiveFilters(filters);
  const selectedCategory = filters.categories.length === 1 ? filters.categories[0] : null;

  const difficultyOptions = DIFFICULTIES.map((value) => ({ value, label: t(`enums.difficulty.${value}`) }));
  const budgetOptions = BUDGET_TIERS.map((value) => ({ value, label: t(`enums.budget.${value}`) }));
  const businessOptions = BUSINESS_MODELS.map((value) => ({ value, label: t(`enums.businessModel.${value}`) }));
  const platformOptions = PLATFORMS.map((value) => ({ value, label: t(`enums.platform.${value}`) }));

  return (
    <Screen
      header={
        <Header
          back
          title={t('common.search')}
          right={<IconButton icon="sliders" accessibilityLabel={t('a11y.openFilters')} onPress={() => setSheetOpen(true)} variant={activeCount ? 'accent' : 'surface'} testID="open-filters" />}
        />
      }
      noGutter
      testID="search-screen">
      <FlatList
        data={results}
        keyExtractor={(idea) => idea.id}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View style={styles.header}>
            <Input
              ref={inputRef}
              icon="search"
              size="lg"
              value={query}
              onChangeText={setQuery}
              onClear={() => setQuery('')}
              placeholder={t('discover.searchPlaceholder')}
              returnKeyType="search"
              autoCorrect={false}
              testID="search-input"
            />
            <CategoryChips selected={selectedCategory} onSelect={(slug) => setFilters((f) => ({ ...f, categories: slug ? [slug] : [] }))} allLabel={t('discover.allIdeas')} />
            <View style={styles.resultsRow}>
              <AppText variant="bodySmall" color="textSecondary" testID="results-count">
                {t('discover.results', { count: results.length })}
                {activeCount ? ` · ${t('discover.filtersActive', { count: activeCount })}` : ''}
              </AppText>
              <View style={styles.sortRow}>
                <Chip size="sm" label={t('discover.sortRelevance')} selected={sort === 'relevance'} onPress={() => setSort('relevance')} />
                <Chip size="sm" label={t('discover.sortEffort')} selected={sort === 'effort'} onPress={() => setSort('effort')} />
              </View>
            </View>
          </View>
        }
        renderItem={({ item }) => <IdeaCard idea={item} style={styles.card} />}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={
          <EmptyState
            icon="search"
            title={t('discover.noResults')}
            hint={t('discover.noResultsHint')}
            actionLabel={activeCount || query ? t('common.clear') : undefined}
            onAction={() => {
              setQuery('');
              setFilters(emptyFilters);
            }}
          />
        }
        style={{ backgroundColor: colors.background }}
      />

      <Sheet
        visible={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title={t('discover.filters')}
        footer={
          <View style={styles.sheetFooter}>
            <Button label={t('common.reset')} variant="ghost" onPress={() => setFilters(emptyFilters)} />
            <Button label={t('common.apply')} onPress={() => setSheetOpen(false)} style={styles.flex} fullWidth />
          </View>
        }>
        <MultiOptionGroup label={t('discover.filterDifficulty')} options={difficultyOptions} value={filters.difficulties} onChange={(difficulties) => setFilters((f) => ({ ...f, difficulties }))} />
        <MultiOptionGroup label={t('discover.filterBudget')} options={budgetOptions} value={filters.budgets} onChange={(budgets) => setFilters((f) => ({ ...f, budgets }))} />
        <MultiOptionGroup label={t('discover.filterBusiness')} options={businessOptions} value={filters.businessModels} onChange={(businessModels) => setFilters((f) => ({ ...f, businessModels }))} />
        <MultiOptionGroup label={t('discover.filterPlatform')} options={platformOptions} value={filters.platforms} onChange={(platforms) => setFilters((f) => ({ ...f, platforms }))} />
        <View style={styles.flags}>
          <AppText variant="bodySmall" weight="medium" color="textSecondary">
            {t('discover.filterFlags')}
          </AppText>
          <View style={styles.flagRow}>
            <Chip label={t('discover.flagBeginner')} icon="zap" selected={filters.beginnerFriendly} onPress={() => setFilters((f) => ({ ...f, beginnerFriendly: !f.beginnerFriendly }))} />
            <Chip label={t('discover.flagProfitable')} icon="trending-up" selected={filters.profitable} onPress={() => setFilters((f) => ({ ...f, profitable: !f.profitable }))} />
            <Chip label={t('discover.flagExperimental')} icon="beaker" selected={filters.experimental} onPress={() => setFilters((f) => ({ ...f, experimental: !f.experimental }))} />
          </View>
        </View>
      </Sheet>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  listContent: {
    paddingHorizontal: layout.gutter,
    paddingBottom: space.huge,
    maxWidth: layout.maxWidth,
    width: '100%',
    alignSelf: 'center',
  },
  header: {
    gap: space.lg,
    paddingTop: space.sm,
    paddingBottom: space.lg,
  },
  resultsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space.sm,
    flexWrap: 'wrap',
  },
  sortRow: {
    flexDirection: 'row',
    gap: space.xs,
  },
  card: {},
  separator: {
    height: space.md,
  },
  sheetFooter: {
    flexDirection: 'row',
    gap: space.sm,
    alignItems: 'center',
  },
  flags: {
    gap: space.sm,
  },
  flagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space.sm,
  },
});
