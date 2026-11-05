import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { Controller, useFieldArray, useForm, useWatch, type FieldError } from 'react-hook-form';
import { StyleSheet, View } from 'react-native';
import { BASIS_VALUES, type Basis, type PlanSectionContent } from '@domain/plan';
import { Button, Divider, IconButton, InlineNotice, SegmentedControl, Text, TextField, useConfirm, useNotice } from '@/components/ui';
import { hasTranslation, type TranslationKey } from '@/i18n/translate';
import { useT } from '@/i18n/I18nProvider';
import { spacing } from '@/theme/tokens';
import { DRAFT_LIMITS, SectionDraftSchema, emptyDraftBlock, isDraftDirty, toDraft, validateDraft, type SectionDraft } from '../logic';

export interface SectionEditorProps {
  initial: PlanSectionContent;
  onSave: (content: PlanSectionContent) => void;
  onCancel: (dirty: boolean) => void;
  onDirtyChange: (dirty: boolean) => void;
  saving: boolean;
  /** Writes are disabled while offline. */
  online: boolean;
  /** Translated save error. */
  saveError?: string | null;
}

/**
 * Edit form for one section: summary + blocks (text, provenance, source for verified), add,
 * delete and reorder. Validates with SectionDraftSchema (→ PlanSectionContentSchema).
 * Rendered as content; the caller places `EditorFooter` in the screen footer.
 */
export function useSectionEditor({ initial, onSave, onDirtyChange, saving, online }: Omit<SectionEditorProps, 'onCancel' | 'saveError'>) {
  const t = useT();
  const notice = useNotice();
  const form = useForm<SectionDraft>({
    resolver: zodResolver(SectionDraftSchema),
    defaultValues: toDraft(initial),
    mode: 'onSubmit',
    reValidateMode: 'onChange',
  });
  const values = useWatch({ control: form.control }) as SectionDraft;
  const dirty = isDraftDirty(initial, { summary: values.summary ?? '', blocks: values.blocks ?? [] });

  useEffect(() => {
    onDirtyChange(dirty);
  }, [dirty, onDirtyChange]);

  const submit = form.handleSubmit(
    (draft) => {
      if (!online || saving) return;
      if (!isDraftDirty(initial, draft)) {
        notice.show({ tone: 'info', message: t('plan.edit.noChanges') });
        return;
      }
      const result = validateDraft(draft);
      if (!result.ok) {
        notice.show({ tone: 'error', message: t('plan.edit.fixErrors') });
        return;
      }
      onSave(result.content);
    },
    () => notice.show({ tone: 'error', message: t('plan.edit.fixErrors') }),
  );

  return { form, dirty, submit };
}

function useErrorText() {
  const t = useT();
  return (error: FieldError | { message?: string } | undefined): string | undefined => {
    const message = error?.message;
    if (!message) return undefined;
    return hasTranslation(message) ? t(message as TranslationKey) : t('plan.edit.errors.invalid');
  };
}

export function SectionEditorFields({
  form,
  saveError,
  online,
}: {
  form: ReturnType<typeof useSectionEditor>['form'];
  saveError?: string | null;
  online: boolean;
}) {
  const t = useT();
  const confirm = useConfirm();
  const errorText = useErrorText();
  const { control, formState, getValues } = form;
  const { fields, append, remove, move } = useFieldArray({ control, name: 'blocks', keyName: 'key' });
  const blocks = useWatch({ control, name: 'blocks' });

  const basisOptions = BASIS_VALUES.map((basis) => ({ value: basis, label: t(`common.basis.${basis}`) }));

  const removeBlock = async (index: number) => {
    const text = getValues(`blocks.${index}.text`) ?? '';
    if (text.trim() !== '') {
      const ok = await confirm({
        title: t('plan.edit.deleteBlockTitle'),
        message: t('plan.edit.deleteBlockBody'),
        confirmLabel: t('plan.edit.deleteBlock'),
        destructive: true,
      });
      if (!ok) return;
    }
    remove(index);
  };

  const blocksError = errorText(formState.errors.blocks?.root ?? (formState.errors.blocks as { message?: string } | undefined));

  return (
    <View style={styles.root}>
      {!online ? <InlineNotice tone="warning" message={t('plan.edit.offline')} /> : null}
      {saveError ? <InlineNotice tone="error" message={saveError} /> : null}

      <Controller
        control={control}
        name="summary"
        render={({ field, fieldState }) => (
          <TextField
            label={t('plan.edit.summaryLabel')}
            hint={t('plan.edit.summaryHint')}
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            multiline
            maxLength={DRAFT_LIMITS.summaryMax + 50}
            error={errorText(fieldState.error)}
            testID="plan-edit-summary"
          />
        )}
      />

      {fields.map((item, index) => {
        const basis: Basis = blocks?.[index]?.basis ?? item.basis;
        const total = fields.length;
        return (
          <View key={item.key} style={styles.block} accessibilityLabel={t('plan.edit.blockA11y', { number: index + 1, total })}>
            <Divider />
            <Controller
              control={control}
              name={`blocks.${index}.text`}
              render={({ field, fieldState }) => (
                <TextField
                  label={t('plan.edit.blockLabel', { number: index + 1 })}
                  value={field.value}
                  onChangeText={field.onChange}
                  onBlur={field.onBlur}
                  multiline
                  maxLength={DRAFT_LIMITS.textMax + 50}
                  error={errorText(fieldState.error)}
                  testID={`plan-edit-block-${index}`}
                  labelAccessory={
                    <View style={styles.blockActions}>
                      <IconButton
                        icon="arrow-up"
                        size="compact"
                        tone="secondary"
                        accessibilityLabel={t('plan.edit.moveUp')}
                        disabled={index === 0}
                        onPress={() => move(index, index - 1)}
                      />
                      <IconButton
                        icon="arrow-down"
                        size="compact"
                        tone="secondary"
                        accessibilityLabel={t('plan.edit.moveDown')}
                        disabled={index === total - 1}
                        onPress={() => move(index, index + 1)}
                      />
                      <IconButton
                        icon="trash-2"
                        size="compact"
                        tone="secondary"
                        accessibilityLabel={t('plan.edit.deleteBlock')}
                        disabled={total <= DRAFT_LIMITS.blocksMin}
                        onPress={() => void removeBlock(index)}
                      />
                    </View>
                  }
                />
              )}
            />
            <View style={styles.basis}>
              <Text variant="callout" weight={500}>
                {t('plan.edit.basisLabel')}
              </Text>
              <Controller
                control={control}
                name={`blocks.${index}.basis`}
                render={({ field }) => (
                  <SegmentedControl options={basisOptions} value={field.value} onChange={field.onChange} accessibilityLabel={t('plan.edit.basisLabel')} />
                )}
              />
            </View>
            {basis === 'verified' ? (
              <View style={styles.source}>
                <Text variant="caption" tone="secondary">
                  {t('plan.edit.verifiedHint')}
                </Text>
                <Controller
                  control={control}
                  name={`blocks.${index}.sourceTitle`}
                  render={({ field, fieldState }) => (
                    <TextField
                      label={t('plan.edit.sourceTitleLabel')}
                      placeholder={t('plan.edit.sourceTitlePlaceholder')}
                      value={field.value}
                      onChangeText={field.onChange}
                      onBlur={field.onBlur}
                      maxLength={DRAFT_LIMITS.sourceTitleMax}
                      error={errorText(fieldState.error)}
                    />
                  )}
                />
                <Controller
                  control={control}
                  name={`blocks.${index}.sourceUrl`}
                  render={({ field, fieldState }) => (
                    <TextField
                      label={t('plan.edit.sourceUrlLabel')}
                      placeholder={t('plan.edit.sourceUrlPlaceholder')}
                      value={field.value}
                      onChangeText={field.onChange}
                      onBlur={field.onBlur}
                      keyboardType="url"
                      inputMode="url"
                      autoCapitalize="none"
                      autoCorrect={false}
                      maxLength={DRAFT_LIMITS.sourceUrlMax}
                      error={errorText(fieldState.error)}
                    />
                  )}
                />
              </View>
            ) : null}
          </View>
        );
      })}

      {blocksError ? <InlineNotice tone="error" message={blocksError} /> : null}

      <Button
        variant="secondary"
        icon="plus"
        label={t('plan.edit.addBlock')}
        onPress={() => append(emptyDraftBlock((getValues('blocks') ?? []).map((b) => b.id)))}
        disabled={fields.length >= DRAFT_LIMITS.blocksMax}
        style={styles.add}
        testID="plan-edit-add-block"
      />
    </View>
  );
}

export function SectionEditorFooter({
  onSave,
  onCancel,
  saving,
  disabled,
}: {
  onSave: () => void;
  onCancel: () => void;
  saving: boolean;
  disabled: boolean;
}) {
  const t = useT();
  return (
    <View style={styles.footer}>
      <Button variant="quiet" label={t('plan.edit.cancel')} onPress={onCancel} disabled={saving} />
      <Button
        label={saving ? t('plan.edit.saving') : t('plan.edit.save')}
        onPress={onSave}
        loading={saving}
        disabled={disabled}
        style={styles.flex}
        testID="plan-edit-save"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: spacing[6] },
  block: { gap: spacing[4] },
  blockActions: { flexDirection: 'row', alignItems: 'center', gap: spacing[1], marginVertical: -spacing[2] },
  basis: { gap: spacing[2] },
  source: { gap: spacing[4] },
  add: { alignSelf: 'flex-start' },
  footer: { flexDirection: 'row', alignItems: 'center', gap: spacing[3] },
  flex: { flex: 1 },
});
