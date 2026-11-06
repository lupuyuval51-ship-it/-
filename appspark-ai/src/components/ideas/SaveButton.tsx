import { IconButton } from '@/components/ui/IconButton';
import { useSavedIdeaIds, useToggleSavedIdea } from '@/features/library/hooks';
import { useI18n } from '@/i18n';

export interface SaveButtonProps {
  ideaId: string;
  variant?: 'surface' | 'plain';
  testID?: string;
}

/** Bookmark toggle wired to the saved-ideas repository with optimistic updates. */
export function SaveButton({ ideaId, variant = 'surface', testID }: SaveButtonProps) {
  const savedIds = useSavedIdeaIds();
  const { toggle } = useToggleSavedIdea();
  const { t } = useI18n();
  const saved = savedIds.has(ideaId);
  return (
    <IconButton
      icon="bookmark"
      filled={saved}
      color={saved ? 'accent' : 'text'}
      variant={variant}
      accessibilityLabel={saved ? t('idea.unsaveIdea') : t('idea.saveIdea')}
      onPress={() => toggle(ideaId, saved)}
      testID={testID ?? `save-${ideaId}`}
    />
  );
}
