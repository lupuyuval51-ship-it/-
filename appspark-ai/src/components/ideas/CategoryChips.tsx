import { ScrollView, StyleSheet, View } from 'react-native';

import { Chip } from '@/components/ui/Chip';
import { categories } from '@/data/categories';
import type { CategorySlug } from '@/data/types';
import { useI18n } from '@/i18n';
import { layout, space } from '@/theme/tokens';

export interface CategoryChipsProps {
  selected: CategorySlug | null;
  onSelect: (slug: CategorySlug | null) => void;
  allLabel?: string;
}

/** Horizontally scrollable category chips (single select, tap again to clear). */
export function CategoryChips({ selected, onSelect, allLabel }: CategoryChipsProps) {
  const { pick } = useI18n();
  return (
    <View style={styles.bleed}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.content}>
        {allLabel ? <Chip label={allLabel} selected={selected === null} onPress={() => onSelect(null)} /> : null}
        {categories.map((category) => (
          <Chip key={category.slug} label={pick(category.label)} selected={selected === category.slug} onPress={() => onSelect(selected === category.slug ? null : category.slug)} testID={`category-${category.slug}`} />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  bleed: {
    marginHorizontal: -layout.gutter,
  },
  content: {
    paddingHorizontal: layout.gutter,
    gap: space.sm,
  },
});
