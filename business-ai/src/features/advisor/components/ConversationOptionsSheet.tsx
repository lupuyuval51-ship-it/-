import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { StyleSheet, View } from 'react-native';
import { z } from 'zod';
import { Button, InlineNotice, ListRow, Sheet, Text, TextField } from '@/components/ui';
import { useT } from '@/i18n/I18nProvider';
import { toAppError } from '@/lib/errors';
import { fieldMessage, useFieldError } from '@/lib/forms';
import { spacing } from '@/theme/tokens';
import { TITLE_MAX_LENGTH, type Conversation } from '../conversation';

const renameSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, fieldMessage('advisor.home.manage.renameRequired'))
    .max(TITLE_MAX_LENGTH, fieldMessage('advisor.home.manage.renameTooLong', { max: TITLE_MAX_LENGTH })),
});
type RenameValues = z.infer<typeof renameSchema>;

type Mode = 'menu' | 'rename' | 'delete';

export interface ConversationOptionsSheetProps {
  /** The conversation being managed; null hides the sheet. */
  conversation: Conversation | null;
  online: boolean;
  onRename: (title: string) => Promise<void>;
  onDelete: () => Promise<void>;
  onClose: () => void;
}

/**
 * Rename / delete for one conversation in a single sheet (menu → form or confirmation), so no
 * second modal is stacked on top of a closing one.
 */
export function ConversationOptionsSheet({ conversation, online, onRename, onDelete, onClose }: ConversationOptionsSheetProps) {
  const t = useT();
  const fieldError = useFieldError();
  const [mode, setMode] = useState<Mode>('menu');
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const {
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RenameValues>({ resolver: zodResolver(renameSchema), defaultValues: { title: '' } });

  // A different conversation (or reopening) starts from the menu again.
  const [shownFor, setShownFor] = useState(conversation);
  if (shownFor !== conversation) {
    setShownFor(conversation);
    setMode('menu');
    setDeleteError(null);
  }
  useEffect(() => {
    reset({ title: conversation?.title ?? '' });
  }, [conversation, reset]);

  const submitRename = handleSubmit(async (values) => {
    try {
      await onRename(values.title);
    } catch (error) {
      setError('root', { message: t(toAppError(error).messageKey) });
    }
  });

  const confirmDelete = async () => {
    setDeleting(true);
    setDeleteError(null);
    try {
      await onDelete();
    } catch (error) {
      setDeleteError(t(toAppError(error).messageKey));
    } finally {
      setDeleting(false);
    }
  };

  const busy = isSubmitting || deleting;
  const close = () => {
    if (!busy) onClose();
  };

  const title =
    mode === 'rename' ? t('advisor.home.manage.renameTitle') : mode === 'delete' ? t('advisor.home.manage.deleteTitle') : t('advisor.home.manage.sheetTitle');

  const footer =
    mode === 'rename' ? (
      <Button label={t('common.actions.save')} onPress={() => void submitRename()} loading={isSubmitting} disabled={!online} fullWidth testID="advisor-rename-save" />
    ) : mode === 'delete' ? (
      <View style={styles.footerRow}>
        <Button label={t('common.actions.cancel')} variant="quiet" onPress={() => setMode('menu')} disabled={deleting} />
        <Button
          label={t('advisor.home.manage.deleteConfirm')}
          variant="destructive"
          onPress={() => void confirmDelete()}
          loading={deleting}
          disabled={!online}
          testID="advisor-delete-confirm"
        />
      </View>
    ) : undefined;

  return (
    <Sheet visible={conversation !== null} onClose={close} title={title} footer={footer} testID="advisor-options-sheet">
      {mode === 'menu' ? (
        <View>
          <ListRow icon="edit-2" title={t('advisor.home.manage.rename')} onPress={() => setMode('rename')} chevron={false} testID="advisor-rename" />
          <ListRow icon="trash-2" title={t('advisor.home.manage.delete')} onPress={() => setMode('delete')} destructive chevron={false} testID="advisor-delete" />
        </View>
      ) : null}

      {mode === 'rename' ? (
        <Controller
          control={control}
          name="title"
          render={({ field }) => (
            <TextField
              label={t('advisor.home.manage.renameLabel')}
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              error={fieldError(errors.title)}
              maxLength={TITLE_MAX_LENGTH}
              returnKeyType="done"
              onSubmitEditing={() => void submitRename()}
              autoFocus
            />
          )}
        />
      ) : null}
      {mode === 'rename' && errors.root?.message ? <InlineNotice tone="error" message={errors.root.message} /> : null}

      {mode === 'delete' ? (
        <Text variant="callout" tone="secondary">
          {t('advisor.home.manage.deleteBody')}
        </Text>
      ) : null}
      {mode === 'delete' && deleteError ? <InlineNotice tone="error" message={deleteError} /> : null}

      {mode !== 'menu' && !online ? <InlineNotice tone="warning" message={t('errors.offline')} /> : null}
    </Sheet>
  );
}

const styles = StyleSheet.create({
  footerRow: { flexDirection: 'row', justifyContent: 'flex-end', gap: spacing[2] },
});
