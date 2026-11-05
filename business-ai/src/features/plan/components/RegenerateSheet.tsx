import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { StyleSheet, View } from 'react-native';
import { z } from 'zod';
import { Button, InlineNotice, Sheet, Text, TextField } from '@/components/ui';
import { useT } from '@/i18n/I18nProvider';
import { spacing } from '@/theme/tokens';

const INSTRUCTION_MAX = 1000;

const InstructionSchema = z.object({
  instruction: z.string().trim().max(INSTRUCTION_MAX, 'plan.regenerate.instructionTooLong'),
});
type InstructionValues = z.infer<typeof InstructionSchema>;

export interface RegenerateSheetProps {
  visible: boolean;
  sectionTitle: string;
  onClose: () => void;
  onSubmit: (instruction: string) => void;
  running: boolean;
  online: boolean;
  /** True when this month's section rewrites are used up. */
  exhausted: boolean;
  /** Translated error of the last attempt. */
  error?: string | null;
  usageLine?: string | null;
}

/** Optional instruction + "Write a proposal". The proposal is shown by the caller; nothing is saved here. */
export function RegenerateSheet({ visible, sectionTitle, onClose, onSubmit, running, online, exhausted, error, usageLine }: RegenerateSheetProps) {
  const t = useT();
  const { control, handleSubmit } = useForm<InstructionValues>({
    resolver: zodResolver(InstructionSchema),
    defaultValues: { instruction: '' },
  });
  const submit = handleSubmit((values) => onSubmit(values.instruction));

  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      title={t('plan.regenerate.title')}
      testID="plan-regenerate-sheet"
      footer={
        <Button
          label={running ? t('plan.regenerate.running') : t('plan.regenerate.run')}
          onPress={() => void submit()}
          loading={running}
          disabled={!online || exhausted}
          fullWidth
          testID="plan-regenerate-run"
        />
      }
    >
      <View style={styles.body}>
        <Text variant="bodyStrong">{sectionTitle}</Text>
        <Text variant="callout" tone="secondary">
          {t('plan.regenerate.body')}
        </Text>
      </View>
      <Controller
        control={control}
        name="instruction"
        render={({ field, fieldState }) => (
          <TextField
            label={t('plan.regenerate.instructionLabel')}
            placeholder={t('plan.regenerate.instructionPlaceholder')}
            hint={t('plan.regenerate.instructionHint')}
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            multiline
            maxLength={INSTRUCTION_MAX}
            disabled={running}
            error={fieldState.error ? t('plan.regenerate.instructionTooLong') : undefined}
            testID="plan-regenerate-instruction"
          />
        )}
      />
      {error ? <InlineNotice tone="error" message={error} /> : null}
      {!online ? <InlineNotice tone="warning" message={t('plan.errors.offlineAction')} /> : null}
      {usageLine ? (
        <Text variant="caption" tone="secondary">
          {usageLine}
        </Text>
      ) : null}
    </Sheet>
  );
}

const styles = StyleSheet.create({
  body: { gap: spacing[2] },
});
