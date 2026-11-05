/**
 * Plan tab: empty (what the plan contains + generate), generating (calm progress), failed
 * (translated reason + retry) and ready (header, provenance legend, contents, roadmap, more).
 * Search param `generate=1` starts generation once when no plan or generation exists yet.
 */
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { PLAN_SECTION_KEYS } from '@domain/plan';
import {
  Button,
  EmptyState,
  ErrorState,
  InlineNotice,
  ListRow,
  LoadingState,
  Screen,
  Section,
  Text,
  useConfirm,
  useNotice,
} from '@/components/ui';
import { useActiveBusiness } from '@/features/business/api';
import { useRoadmapProgress } from '@/features/roadmap/api';
import { useLocale, useT } from '@/i18n/I18nProvider';
import { useIsOnline } from '@/lib/net';
import { spacing } from '@/theme/tokens';
import { usePlanState, usePlanUsage, useStartPlanGeneration, type PlanState } from '../api';
import { GeneratingView } from '../components/GeneratingView';
import { RoadmapRow, SectionTocRow } from '../components/PlanRows';
import { ProvenanceLegendRow } from '../components/ProvenanceLegend';
import { useNow } from '../hooks';
import { countBasis, sectionPreview } from '../logic';
import { generationErrorText, isLimitError, provenanceMixText, relativeLabel, usageText } from '../text';
import { useExportPlan } from '../useExportPlan';

type StartGeneration = ReturnType<typeof useStartPlanGeneration>;

export default function PlanScreen() {
  const t = useT();
  const router = useRouter();
  const params = useLocalSearchParams<{ generate?: string }>();
  const online = useIsOnline();
  const active = useActiveBusiness();
  const businessId = active.businessId;
  const plan = usePlanState(businessId);
  const start = useStartPlanGeneration(businessId);
  const usage = usePlanUsage();

  // generate=1 (from onboarding): start once, only when there is no plan and no generation yet.
  const autoStarted = useRef(false);
  const wantsAutoStart = params.generate === '1';
  const canAutoStart = !!businessId && plan.isReady && !plan.isLoading && !plan.currentVersion && !plan.latestVersion;
  useEffect(() => {
    if (!wantsAutoStart || autoStarted.current || !businessId || !plan.isReady) return;
    autoStarted.current = true;
    router.setParams({ generate: undefined });
    if (canAutoStart && online) start.mutate();
  }, [wantsAutoStart, canAutoStart, businessId, plan.isReady, online, router, start]);

  const startGeneration = () => {
    if (!online || start.isPending) return;
    start.mutate();
  };

  const planGenerationsLeft = usage.planGeneration?.left;
  const usageLine = usageText(t, usage.planGeneration, 'plan');

  let body: ReactNode;
  if (!businessId) {
    if (active.isLoading) body = <LoadingState variant="screen" />;
    else if (active.error) body = <ErrorState error={active.error} onRetry={active.refetch} />;
    else
      body = (
        <EmptyState
          title={t('plan.errors.noBusinessTitle')}
          body={t('plan.errors.noBusinessBody')}
          action={{ label: t('plan.errors.noBusinessAction'), onPress: () => router.push('/onboarding'), variant: 'primary' }}
        />
      );
  } else if (plan.isLoading || (!plan.isReady && !plan.error)) {
    body = <LoadingState variant="screen" />;
  } else if (plan.error && !plan.isReady) {
    body = <ErrorState title={t('plan.errors.loadTitle')} error={plan.error} onRetry={() => void plan.refetch()} />;
  } else if (plan.currentVersion) {
    return (
      <ReadyView
        plan={plan}
        businessId={businessId}
        businessName={active.business?.name ?? ''}
        online={online}
        start={start}
        planGenerationsLeft={planGenerationsLeft}
        usageLine={usageLine}
      />
    );
  } else if (plan.pendingGeneration?.status === 'generating' || (start.isPending && !plan.pendingGeneration)) {
    body = (
      <GeneratingView
        startedAt={plan.pendingGeneration?.version.created_at ?? new Date().toISOString()}
        writtenKeys={plan.pendingGeneration?.writtenKeys ?? []}
      />
    );
  } else if (plan.pendingGeneration?.status === 'failed') {
    const code = plan.pendingGeneration.errorCode;
    const limited = isLimitError(code) || planGenerationsLeft === 0;
    body = (
      <View style={styles.stack} testID="plan-failed">
        <View style={styles.intro}>
          <Text variant="title">{t('plan.failed.title')}</Text>
          <Text variant="body" tone="secondary">
            {generationErrorText(t, code ?? 'internal')}
          </Text>
        </View>
        {start.error ? <InlineNotice tone="error" message={generationErrorText(t, start.error)} /> : null}
        {limited ? null : (
          <View style={styles.actions}>
            <Button label={t('plan.failed.retry')} onPress={startGeneration} loading={start.isPending} disabled={!online} />
            {usageLine ? (
              <Text variant="caption" tone="secondary">
                {usageLine}
              </Text>
            ) : null}
            {!online ? (
              <Text variant="caption" tone="secondary">
                {t('plan.errors.offlineAction')}
              </Text>
            ) : null}
          </View>
        )}
      </View>
    );
  } else {
    body = (
      <PlanIntro
        onGenerate={startGeneration}
        pending={start.isPending}
        online={online}
        error={start.error}
        usageLine={usageLine}
        exhausted={planGenerationsLeft === 0}
      />
    );
  }

  return (
    <Screen title={t('plan.title')} edges={['top']} refreshing={plan.isRefetching} onRefresh={businessId ? () => void plan.refetch() : undefined}>
      {body}
    </Screen>
  );
}

/* ------------------------------------------------------------------ */
/* Empty state                                                         */
/* ------------------------------------------------------------------ */

interface PlanIntroProps {
  onGenerate: () => void;
  pending: boolean;
  online: boolean;
  error: unknown;
  usageLine: string | null;
  exhausted: boolean;
}

function PlanIntro({ onGenerate, pending, online, error, usageLine, exhausted }: PlanIntroProps) {
  const t = useT();
  return (
    <View style={styles.stack} testID="plan-empty">
      <View style={styles.intro}>
        <Text variant="title">{t('plan.empty.title')}</Text>
        <Text variant="body" tone="secondary">
          {t('plan.empty.body')}
        </Text>
      </View>

      <Section title={t('plan.empty.contentsHeading')} titleVariant="overline">
        <View style={styles.sectionList}>
          {PLAN_SECTION_KEYS.map((key, i) => (
            <View key={key} style={styles.sectionListItem}>
              <Text variant="callout" tone="secondary" numeric style={styles.sectionNumber}>
                {i + 1}
              </Text>
              <Text variant="callout" style={styles.flex}>
                {t(`plan.sections.${key}`)}
              </Text>
            </View>
          ))}
        </View>
      </Section>

      <Section title={t('plan.empty.provenanceHeading')} titleVariant="overline">
        <Text variant="callout">{t('plan.empty.provenanceBody')}</Text>
      </Section>

      <Section title={t('plan.empty.roadmapHeading')} titleVariant="overline">
        <Text variant="callout">{t('plan.empty.roadmapBody')}</Text>
      </Section>

      <View style={styles.actions}>
        {error ? <InlineNotice tone="error" message={generationErrorText(t, error)} /> : null}
        <Button
          label={t('plan.empty.generate')}
          onPress={onGenerate}
          loading={pending}
          disabled={!online || exhausted}
          fullWidth
          testID="plan-generate"
        />
        <Text variant="caption" tone="secondary">
          {!online ? t('plan.errors.offlineAction') : (usageLine ?? t('plan.empty.duration'))}
        </Text>
        {online && usageLine && !exhausted ? (
          <Text variant="caption" tone="secondary">
            {t('plan.empty.duration')}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* Ready                                                               */
/* ------------------------------------------------------------------ */

interface ReadyViewProps {
  plan: PlanState;
  businessId: string;
  businessName: string;
  online: boolean;
  start: StartGeneration;
  planGenerationsLeft: number | undefined;
  usageLine: string | null;
}

function ReadyView({ plan, businessId, businessName, online, start, planGenerationsLeft, usageLine }: ReadyViewProps) {
  const t = useT();
  const { locale } = useLocale();
  const router = useRouter();
  const confirm = useConfirm();
  const notice = useNotice();
  const roadmap = useRoadmapProgress(businessId);
  const { exportPdf, exporting } = useExportPlan();
  const [dismissedFailureId, setDismissedFailureId] = useState<string | null>(null);
  const now = useNow(60_000);

  const version = plan.currentVersion!;
  const pending = plan.pendingGeneration;
  const generatingNew = plan.isGenerating || start.isPending;
  const failedNew = pending?.status === 'failed' && pending.version.id !== dismissedFailureId ? pending : null;
  const exhausted = planGenerationsLeft === 0;

  const regenerateAll = async () => {
    const ok = await confirm({
      title: t('plan.regenerateAll.title'),
      message: t('plan.regenerateAll.body'),
      confirmLabel: t('plan.regenerateAll.confirm'),
    });
    if (!ok) return;
    startNew(t('plan.regenerateAll.started'));
  };

  const startNew = (successMessage?: string) => {
    if (!online || start.isPending) return;
    start.mutate(undefined, {
      onSuccess: () => {
        if (successMessage) notice.show({ tone: 'info', message: successMessage });
      },
      onError: (error) => notice.show({ tone: 'error', message: generationErrorText(t, error) }),
    });
  };

  return (
    <Screen edges={['top']} refreshing={plan.isRefetching} onRefresh={() => void plan.refetch()} gap={spacing[8]} testID="plan-ready">
      <View style={styles.header}>
        <Text variant="overline" tone="secondary">
          {t('plan.title')}
        </Text>
        <Text variant="display">{businessName || t('plan.title')}</Text>
        <Text variant="callout" tone="secondary" numeric>
          {t('plan.ready.versionLine', { number: version.version_number, date: relativeLabel(t, locale, version.created_at, now) })}
        </Text>
      </View>

      {generatingNew ? <InlineNotice tone="info" message={t('plan.generating.newVersionNotice')} testID="plan-generating-notice" /> : null}
      {failedNew && !generatingNew ? (
        <InlineNotice
          tone="error"
          title={t('plan.failed.title')}
          message={`${generationErrorText(t, failedNew.errorCode ?? 'internal')} ${t('plan.failed.previousVersion')}`}
          action={
            isLimitError(failedNew.errorCode) || exhausted || !online ? undefined : { label: t('plan.failed.retry'), onPress: () => startNew() }
          }
          onDismiss={() => setDismissedFailureId(failedNew.version.id)}
        />
      ) : null}

      <ProvenanceLegendRow />

      <Section title={t('plan.ready.contentsHeading')} separated>
        {PLAN_SECTION_KEYS.map((key, i) => {
          const row = plan.sections[key];
          const title = t(`plan.sections.${key}`);
          if (!row) {
            return <SectionTocRow key={key} index={i + 1} title={title} missingLabel={t('plan.ready.sectionMissing')} />;
          }
          return (
            <SectionTocRow
              key={key}
              index={i + 1}
              title={title}
              preview={sectionPreview(row.content)}
              provenance={provenanceMixText(t, countBasis(row.content))}
              onPress={() => router.push({ pathname: '/plan/[section]', params: { section: key } })}
              testID={`plan-toc-${key}`}
            />
          );
        })}
      </Section>

      <Section separated>
        <RoadmapRow total={roadmap.total} done={roadmap.done} loading={roadmap.isLoading} onPress={() => router.push('/roadmap')} />
      </Section>

      <Section title={t('plan.ready.moreHeading')} titleVariant="overline" separated>
        <ListRow icon="clock" title={t('plan.actions.history')} onPress={() => router.push('/plan/history')} accessibilityRole="link" testID="plan-history" />
        <ListRow
          icon="share"
          title={exporting ? t('plan.actions.exporting') : t('plan.actions.exportPdf')}
          onPress={() => void exportPdf({ businessName, versionNumber: version.version_number, sections: plan.sections })}
          disabled={exporting}
          chevron={false}
          testID="plan-export"
        />
        <ListRow
          icon="refresh-cw"
          title={t('plan.actions.regenerateAll')}
          subtitle={!online ? t('plan.errors.offlineAction') : (usageLine ?? t('plan.actions.regenerateAllHint'))}
          onPress={() => void regenerateAll()}
          disabled={!online || generatingNew || exhausted}
          chevron={false}
          testID="plan-regenerate-all"
        />
      </Section>

      <Text variant="caption" tone="secondary">
        {t('plan.ready.estimatesNote')}
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  stack: { gap: spacing[8] },
  intro: { gap: spacing[3] },
  header: { gap: spacing[2] },
  actions: { gap: spacing[3] },
  flex: { flex: 1 },
  sectionList: { gap: spacing[2] },
  sectionListItem: { flexDirection: 'row', gap: spacing[3], alignItems: 'baseline' },
  sectionNumber: { minWidth: 20 },
});
