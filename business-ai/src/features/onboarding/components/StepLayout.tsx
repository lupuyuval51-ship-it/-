import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, InlineNotice, ProgressBar, Screen, Text, type ScreenEdge } from '@/components/ui';
import { useT } from '@/i18n/I18nProvider';
import { spacing } from '@/theme/tokens';
import { stepProgress, type OnboardingStep } from '../logic';

export interface StepLayoutProps {
  step: OnboardingStep;
  /** Editorial question text. */
  title: string;
  /** One-line "why we ask". */
  why?: string;
  children?: ReactNode;
  /** The one primary action. */
  primaryLabel?: string;
  onPrimary: () => void;
  primaryLoading?: boolean;
  /** Shown as a quiet action when the step can be skipped. */
  onSkip?: () => void;
  skipLoading?: boolean;
  onBack?: () => void;
  backLabel?: string;
  /** Disables the actions (offline, another save in flight). */
  actionsDisabled?: boolean;
  /** Translated error from the last save. */
  error?: string | null;
  /** Quiet informational line (resumed, draft restored, offline). */
  notice?: string | null;
  noticeTone?: 'info' | 'warning';
  /** Safe-area edges (default top + bottom: the onboarding route has no native header). */
  edges?: readonly ScreenEdge[];
  testID?: string;
}

/**
 * Shared shell of every onboarding step: thin progress + "Step 3 of 8", editorial question,
 * helper line, the inputs, and a pinned footer with one primary action plus quiet Back / Skip.
 */
export function StepLayout({
  step,
  title,
  why,
  children,
  primaryLabel,
  onPrimary,
  primaryLoading,
  onSkip,
  skipLoading,
  onBack,
  backLabel,
  actionsDisabled,
  error,
  notice,
  noticeTone = 'info',
  edges,
  testID,
}: StepLayoutProps) {
  const t = useT();
  const progress = stepProgress(step);
  const progressLabel = progress.isReview
    ? t('onboarding.reviewProgress')
    : t('onboarding.progress', { current: progress.current, total: progress.total });
  const busy = !!primaryLoading || !!skipLoading;

  const footer = (
    <>
      {error ? <InlineNotice tone="error" message={error} /> : null}
      <Button
        label={primaryLabel ?? t('onboarding.actions.continue')}
        onPress={onPrimary}
        loading={primaryLoading}
        disabled={actionsDisabled || (busy && !primaryLoading)}
        fullWidth
        testID="onboarding-continue"
      />
      {onBack || onSkip ? (
        <View style={styles.secondaryRow}>
          {onBack ? (
            <Button
              variant="quiet"
              size="compact"
              icon="arrow-left"
              label={backLabel ?? t('onboarding.actions.back')}
              accessibilityHint={t('onboarding.a11y.backHint')}
              onPress={onBack}
              disabled={busy}
              testID="onboarding-back"
            />
          ) : (
            <View />
          )}
          {onSkip ? (
            <Button
              variant="quiet"
              size="compact"
              label={t('onboarding.actions.skip')}
              accessibilityHint={t('onboarding.a11y.skipHint')}
              onPress={onSkip}
              loading={skipLoading}
              disabled={actionsDisabled || (busy && !skipLoading)}
              testID="onboarding-skip"
            />
          ) : null}
        </View>
      ) : null}
    </>
  );

  return (
    <Screen footer={footer} gap={spacing[8]} edges={edges} offlineBanner={false} testID={testID}>
      <View style={styles.progress}>
        <Text variant="caption" tone="secondary" numeric accessibilityLabel={progress.isReview ? progressLabel : t('onboarding.a11y.progress', { current: progress.current, total: progress.total })}>
          {progressLabel}
        </Text>
        <ProgressBar value={progress.fraction} height={2} accessibilityLabel={progressLabel} />
      </View>
      <View style={styles.question}>
        <Text variant="display">{title}</Text>
        {why ? (
          <Text variant="callout" tone="secondary">
            {why}
          </Text>
        ) : null}
      </View>
      {notice ? <InlineNotice tone={noticeTone} message={notice} /> : null}
      <View style={styles.body}>{children}</View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  progress: { gap: spacing[2] },
  question: { gap: spacing[3] },
  body: { gap: spacing[6] },
  secondaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
});
