/**
 * Edit fields for a marketing asset: title, summary and items (add, remove, reorder, edit).
 * The screen owns the form (`useAssetEditForm`) and places the save/cancel footer.
 */
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useFieldArray, useForm, type UseFormReturn } from 'react-hook-form';
import { StyleSheet, View } from 'react-native';
import { Button, Divider, IconButton, Section, Text, TextField } from '@/components/ui';
import { useT } from '@/i18n/I18nProvider';
import { useFieldError } from '@/lib/forms';
import { spacing } from '@/theme/tokens';
import { MAX_MARKETING_ITEMS, emptyMarketingItem, type MarketingAsset } from '../logic';
import { AssetEditSchema, assetToEditValues, type AssetEditOutput, type AssetEditValues } from '../schemas';

export type AssetEditForm = UseFormReturn<AssetEditValues, unknown, AssetEditOutput>;

export function useAssetEditForm(asset: Pick<MarketingAsset, 'title' | 'content'>): AssetEditForm {
  return useForm<AssetEditValues, unknown, AssetEditOutput>({
    resolver: zodResolver(AssetEditSchema),
    defaultValues: assetToEditValues(asset),
    mode: 'onSubmit',
    reValidateMode: 'onChange',
  });
}

export interface AssetEditorFieldsProps {
  form: AssetEditForm;
  disabled?: boolean;
}

export function AssetEditorFields({ form, disabled = false }: AssetEditorFieldsProps) {
  const t = useT();
  const fieldError = useFieldError();
  const { fields, append, remove, move } = useFieldArray({ control: form.control, name: 'items', keyName: 'key' });
  const itemsError = form.formState.errors.items?.root ?? form.formState.errors.items;
  const atMax = fields.length >= MAX_MARKETING_ITEMS;

  return (
    <View style={styles.root}>
      <Controller
        control={form.control}
        name="title"
        render={({ field, fieldState }) => (
          <TextField
            label={t('marketing.editor.titleLabel')}
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            error={fieldError(fieldState.error)}
            maxLength={200}
            disabled={disabled}
            testID="asset-edit-title"
          />
        )}
      />
      <Controller
        control={form.control}
        name="summary"
        render={({ field, fieldState }) => (
          <TextField
            label={t('marketing.editor.summaryLabel')}
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            error={fieldError(fieldState.error)}
            multiline
            maxLength={1200}
            disabled={disabled}
            testID="asset-edit-summary"
          />
        )}
      />

      <Section title={t('marketing.editor.itemsTitle')}>
        {fields.map((field, index) => {
          const number = index + 1;
          return (
            <View key={field.key} style={styles.item} testID={`asset-edit-item-${index}`}>
              {index > 0 ? <Divider spacing={2} /> : null}
              <View style={styles.itemHead}>
                <Text variant="overline" tone="secondary" style={styles.flex}>
                  {t('marketing.editor.itemNumber', { number })}
                </Text>
                <IconButton
                  icon="arrow-up"
                  size="compact"
                  accessibilityLabel={t('marketing.editor.moveUp', { number })}
                  onPress={() => move(index, index - 1)}
                  disabled={disabled || index === 0}
                />
                <IconButton
                  icon="arrow-down"
                  size="compact"
                  accessibilityLabel={t('marketing.editor.moveDown', { number })}
                  onPress={() => move(index, index + 1)}
                  disabled={disabled || index === fields.length - 1}
                />
                <IconButton
                  icon="trash-2"
                  size="compact"
                  tone="danger"
                  accessibilityLabel={t('marketing.editor.removeItem', { number })}
                  onPress={() => remove(index)}
                  disabled={disabled}
                />
              </View>
              <Controller
                control={form.control}
                name={`items.${index}.heading`}
                render={({ field: f, fieldState }) => (
                  <TextField
                    label={t('marketing.editor.headingLabel')}
                    value={f.value}
                    onChangeText={f.onChange}
                    onBlur={f.onBlur}
                    error={fieldError(fieldState.error)}
                    maxLength={200}
                    disabled={disabled}
                  />
                )}
              />
              <Controller
                control={form.control}
                name={`items.${index}.label`}
                render={({ field: f, fieldState }) => (
                  <TextField
                    label={t('marketing.editor.labelLabel')}
                    hint={t('marketing.editor.labelHint')}
                    value={f.value}
                    onChangeText={f.onChange}
                    onBlur={f.onBlur}
                    error={fieldError(fieldState.error)}
                    maxLength={60}
                    disabled={disabled}
                  />
                )}
              />
              <Controller
                control={form.control}
                name={`items.${index}.body`}
                render={({ field: f, fieldState }) => (
                  <TextField
                    label={t('marketing.editor.bodyLabel')}
                    value={f.value}
                    onChangeText={f.onChange}
                    onBlur={f.onBlur}
                    error={fieldError(fieldState.error)}
                    multiline
                    maxLength={3000}
                    disabled={disabled}
                  />
                )}
              />
            </View>
          );
        })}
        {itemsError?.message ? (
          <Text variant="caption" tone="danger">
            {fieldError(itemsError)}
          </Text>
        ) : null}
        <Button
          label={t('marketing.editor.addItem')}
          variant="quiet"
          icon="plus"
          inline
          onPress={() => {
            const item = emptyMarketingItem();
            append({ id: item.id, heading: '', label: '', body: '' });
          }}
          disabled={disabled || atMax}
          accessibilityHint={atMax ? t('marketing.editor.maxItems', { max: MAX_MARKETING_ITEMS }) : undefined}
          testID="asset-edit-add-item"
        />
      </Section>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: spacing[5] },
  item: { gap: spacing[3] },
  itemHead: { flexDirection: 'row', alignItems: 'center', gap: spacing[1] },
  flex: { flex: 1 },
});
