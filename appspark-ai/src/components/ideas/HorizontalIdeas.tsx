import { ScrollView, StyleSheet, View } from 'react-native';

import type { Idea } from '@/data/types';
import { layout, space } from '@/theme/tokens';

import { IdeaCard } from './IdeaCard';

/** Horizontally scrolling carousel of column cards that bleeds past the page gutter. */
export function HorizontalIdeas({ ideas, testID }: { ideas: Idea[]; testID?: string }) {
  if (!ideas.length) return null;
  return (
    <View style={styles.bleed} testID={testID}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.content} decelerationRate="fast" snapToInterval={232 + space.md} snapToAlignment="start">
        {ideas.map((idea) => (
          <IdeaCard key={idea.id} idea={idea} layout="column" />
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
    gap: space.md,
  },
});
