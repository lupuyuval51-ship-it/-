/**
 * Route /plan/[section]: section reader with edit mode (copy-on-write save → new version) and
 * AI rewrite (proposal shown in the reader layout; saved only on "Use this version").
 */
import { Stack, useLocalSearchParams, usePreventRemove, useRouter } from 'expo-router';
import { useCallback, useState, type ReactElement } from 'react';
import { StyleSheet, View } from 'react-native';
import type { PlanSectionContent, PlanSectionKey } from '@domain/plan';
import { Button, Divider, EmptyState, ErrorState, InlineNotice, LoadingState, Screen, Text, useConfirm, useNotice } from '@/components/ui';
import { useActiveBusiness } from '@/features/business/api';
import { useT } from '@/i18n/I18nProvider';
import { useIsOnline } from '@/lib/net';
import { spacing } from '@/theme/tokens';
import { usePlanState, usePlanUsage, useRegenerateSection, useSaveSection } from '../api';
import { RegenerateSheet } from '../components/RegenerateSheet';
import { SectionContentView } from '../components/SectionContentView';
import { SectionEditorFields, SectionEditorFooter, useSectionEditor } from '../components/SectionEditor';
import { FINANCE_LINKED_SECTIONS, countBasis, isPlanSectionKey, orderedSectionKeys, sectionNeighbors, toDraft } from '../logic';
import { actionErrorText, usageText } from '../text';

type Mode = 'read' | 'edit' | 'proposal';

export default function SectionScreen() {
  const t = useT();
  const router = useRouter();
  const params = useLocalSearchParams<{ section?: string }>();
  const sectionKey: PlanSectionKey | null = isPlanSectionKey(params.section) ? params.section : null;
  const { businessId, isLoading: businessLoading } = useActiveBusiness();
  const plan = usePlanState(businessId);
  const row = sectionKey ? plan.sections[sectionKey] : undefined;
  const title = sectionKey ? t(`plan.sections.${sectionKey}`) : t('plan.section.notFoundTitle');

  const header = <Stack.Screen options={{ title }} />;
  const backToPlan = () => router.navigate('/plan');

  if ((!businessId && businessLoading) || plan.isLoading || (!!businessId && !plan.isReady && !plan.error)) {
    return (
      <Screen edges={['bottom']}>
        {header}
        <LoadingState variant="text" count={6} />
      </Screen>
    );
  }
  if (plan.error && !plan.isReady) {
    return (
      <Screen edges={['bottom']}>
        {header}
        <ErrorState title={t('plan.errors.loadTitle')} error={plan.error} onRetry={() => void plan.refetch()} />
      </Screen>
    );
  }
  if (!plan.currentVersion) {
    return (
      <Screen edges={['bottom']}>
        {header}
        <EmptyState title={t('plan.section.noPlanTitle')} body={t('plan.section.noPlanBody')} action={{ label: t('plan.section.backToPlan'), onPress: backToPlan }} />
      </Screen>
    );
  }
  if (!sectionKey || !row) {
    return (
      <Screen edges={['bottom']}>
        {header}
        <EmptyState
          icon="file-text"
          title={t('plan.section.notFoundTitle')}
          body={t('plan.section.notFoundBody')}
          action={{ label: t('plan.section.backToPlan'), onPress: backToPlan }}
        />
      </Screen>
    );
  }

  return (
    <SectionView
      key={sectionKey}
      header={header}
      businessId={businessId as string}
      sectionKey={sectionKey}
      title={title}
      content={row.content}
      availableKeys={orderedSectionKeys(plan.sections)}
      isGenerating={plan.isGenerating}
    />
  );
}

interface SectionViewProps {
  header: ReactElement;
  businessId: string;
  sectionKey: PlanSectionKey;
  title: string;
  content: PlanSectionContent;
  availableKeys: PlanSectionKey[];
  isGenerating: boolean;
}

function SectionView({ header, businessId, sectionKey, title, content, availableKeys, isGenerating }: SectionViewProps) {
  const t = useT();
  const router = useRouter();
  const confirm = useConfirm();
  const notice = useNotice();
  const online = useIsOnline();
  const usage = usePlanUsage();
  const save = useSaveSection(businessId);
  const regenerate = useRegenerateSection(businessId);

  const [mode, setMode] = useState<Mode>('read');
  const [dirty, setDirty] = useState(false);
  const [proposal, setProposal] = useState<PlanSectionContent | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const rewritesExhausted = usage.sectionRegeneration?.left === 0;
  const sectionUsage = usageText(t, usage.sectionRegeneration, 'section');

  // Unsaved edits or an unaccepted proposal: confirm before leaving the screen.
  const guarded = (mode === 'edit' && dirty) || (mode === 'proposal' && proposal !== null);
  usePreventRemove(guarded && !save.isPending, ({ repeat }) => {
    void (async () => {
      const ok = await confirm(
        mode === 'proposal'
          ? { title: t('plan.regenerate.discardTitle'), message: t('plan.regenerate.discardBody'), confirmLabel: t('plan.regenerate.discardConfirm'), destructive: true }
          : { title: t('plan.edit.discardTitle'), message: t('plan.edit.discardBody'), confirmLabel: t('plan.edit.discardConfirm'), cancelLabel: t('plan.edit.keepEditing'), destructive: true },
      );
      if (ok) {
        setDirty(false);
        setProposal(null);
        setMode('read');
        repeat();
      }
    })();
  });

  const onDirtyChange = useCallback((value: boolean) => setDirty(value), []);

  const saveContent = (next: PlanSectionContent, origin: 'user' | 'ai') => {
    save.mutate(
      { sectionKey, content: next, origin },
      {
        onSuccess: () => {
          setDirty(false);
          setProposal(null);
          setMode('read');
          notice.show({ message: origin === 'ai' ? t('plan.regenerate.accepted') : t('plan.edit.saved') });
        },
      },
    );
  };

  const runRegenerate = (instruction: string) => {
    if (!online || regenerate.isPending) return;
    regenerate.mutate(
      { sectionKey, instruction },
      {
        onSuccess: (result) => {
          setProposal(result.content);
          setMode('proposal');
          setSheetOpen(false);
        },
      },
    );
  };

  const rejectProposal = () => {
    setProposal(null);
    setMode('read');
    notice.show({ tone: 'info', message: t('plan.regenerate.discarded') });
  };

  /* ---------------- edit ---------------- */
  const editor = useSectionEditor({ initial: content, onSave: (c) => saveContent(c, 'user'), onDirtyChange, saving: save.isPending, online });

  if (mode === 'edit') {
    const cancelEdit = async () => {
      if (dirty) {
        const ok = await confirm({
          title: t('plan.edit.discardTitle'),
          message: t('plan.edit.discardBody'),
          confirmLabel: t('plan.edit.discardConfirm'),
          cancelLabel: t('plan.edit.keepEditing'),
          destructive: true,
        });
        if (!ok) return;
      }
      editor.form.reset();
      setDirty(false);
      setMode('read');
    };
    return (
      <Screen
        edges={['bottom']}
        footer={<SectionEditorFooter onSave={() => void editor.submit()} onCancel={() => void cancelEdit()} saving={save.isPending} disabled={!online} />}
        testID="plan-section-edit"
      >
        {header}
        <View style={styles.head}>
          <Text variant="overline" tone="secondary">
            {t('plan.edit.title')}
          </Text>
          <Text variant="title">{title}</Text>
        </View>
        <SectionEditorFields form={editor.form} online={online} saveError={save.error ? actionErrorText(t, save.error, 'save') : null} />
      </Screen>
    );
  }

  /* ---------------- proposal ---------------- */
  if (mode === 'proposal' && proposal) {
    return (
      <Screen
        edges={['bottom']}
        testID="plan-section-proposal"
        footer={
          <View style={styles.footerRow}>
            <Button variant="quiet" label={t('plan.regenerate.reject')} onPress={rejectProposal} disabled={save.isPending} />
            <Button
              label={t('plan.regenerate.accept')}
              onPress={() => saveContent(proposal, 'ai')}
              loading={save.isPending}
              disabled={!online}
              style={styles.flex}
              testID="plan-proposal-accept"
            />
          </View>
        }
      >
        {header}
        <View style={styles.head}>
          <Text variant="overline" tone="secondary">
            {t('plan.regenerate.proposalHeading')}
          </Text>
          <Text variant="title">{title}</Text>
        </View>
        <InlineNotice tone="info" message={t('plan.regenerate.proposalNote')} />
        {save.error ? <InlineNotice tone="error" message={actionErrorText(t, save.error, 'save')} /> : null}
        <SectionContentView content={proposal} testID="plan-proposal-content" />
        {countBasis(proposal).ai_estimate > 0 ? (
          <Text variant="caption" tone="secondary">
            {t('plan.section.estimatesNote')}
          </Text>
        ) : null}
      </Screen>
    );
  }

  /* ---------------- read ---------------- */
  const nav = sectionNeighbors(sectionKey, availableKeys);
  const goTo = (key: PlanSectionKey) => router.replace({ pathname: '/plan/[section]', params: { section: key } });
  const writesDisabled = !online || isGenerating;

  return (
    <Screen edges={['bottom']} gap={spacing[8]} testID="plan-section-read">
      {header}
      <View style={styles.head}>
        <Text variant="overline" tone="secondary" numeric>
          {t('plan.section.position', { position: nav.position, total: nav.total })}
        </Text>
        <Text variant="display">{title}</Text>
      </View>

      <SectionContentView content={content} testID="plan-section-content" />

      {countBasis(content).ai_estimate > 0 ? (
        <Text variant="caption" tone="secondary">
          {t('plan.section.estimatesNote')}
        </Text>
      ) : null}

      {FINANCE_LINKED_SECTIONS.has(sectionKey) ? (
        <Button
          variant="quiet"
          inline
          icon="arrow-right"
          label={t('plan.section.financeLink')}
          accessibilityHint={t('plan.section.financeLinkHint')}
          onPress={() => router.push('/finance')}
          style={styles.start}
          testID="plan-finance-link"
        />
      ) : null}

      <View style={styles.actionsBlock}>
        {isGenerating ? <InlineNotice tone="info" message={t('plan.generating.newVersionNotice')} /> : null}
        <View style={styles.actions}>
          <Button
            variant="secondary"
            icon="edit-2"
            label={t('plan.section.edit')}
            onPress={() => {
              save.reset();
              editor.form.reset(toDraft(content));
              setMode('edit');
            }}
            disabled={writesDisabled}
            testID="plan-section-edit-button"
          />
          <Button
            variant="secondary"
            icon="refresh-cw"
            label={t('plan.section.regenerate')}
            onPress={() => {
              regenerate.reset();
              setSheetOpen(true);
            }}
            disabled={writesDisabled || rewritesExhausted}
            testID="plan-section-regenerate-button"
          />
        </View>
        {!online ? (
          <Text variant="caption" tone="secondary">
            {t('plan.errors.offlineAction')}
          </Text>
        ) : sectionUsage ? (
          <Text variant="caption" tone="secondary">
            {sectionUsage}
          </Text>
        ) : null}
      </View>

      <View style={styles.navBlock}>
        <Divider />
        <View style={styles.nav}>
          {nav.prev ? (
            <NavLink direction="prev" label={t('plan.section.prev')} title={t(`plan.sections.${nav.prev}`)} onPress={() => goTo(nav.prev as PlanSectionKey)} />
          ) : (
            <View style={styles.flex} />
          )}
          {nav.next ? (
            <NavLink direction="next" label={t('plan.section.next')} title={t(`plan.sections.${nav.next}`)} onPress={() => goTo(nav.next as PlanSectionKey)} />
          ) : (
            <View style={styles.flex} />
          )}
        </View>
      </View>

      <RegenerateSheet
        visible={sheetOpen}
        sectionTitle={title}
        onClose={() => setSheetOpen(false)}
        onSubmit={runRegenerate}
        running={regenerate.isPending}
        online={online}
        exhausted={rewritesExhausted}
        error={regenerate.error ? actionErrorText(t, regenerate.error, 'regenerate') : null}
        usageLine={sectionUsage}
      />
    </Screen>
  );
}

function NavLink({ direction, label, title, onPress }: { direction: 'prev' | 'next'; label: string; title: string; onPress: () => void }) {
  const next = direction === 'next';
  return (
    <View style={[styles.flex, next ? styles.navEnd : null]}>
      <Button
        variant="quiet"
        icon={next ? 'arrow-right' : 'arrow-left'}
        label={label}
        onPress={onPress}
        accessibilityHint={title}
        inline
      />
      <Text variant="caption" tone="secondary" align={next ? 'end' : 'start'} numberOfLines={2}>
        {title}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  head: { gap: spacing[2] },
  actionsBlock: { gap: spacing[3] },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[3] },
  navBlock: { gap: spacing[4] },
  nav: { flexDirection: 'row', gap: spacing[4] },
  navEnd: { alignItems: 'flex-end' },
  footerRow: { flexDirection: 'row', alignItems: 'center', gap: spacing[3] },
  flex: { flex: 1 },
  start: { alignSelf: 'flex-start' },
});
