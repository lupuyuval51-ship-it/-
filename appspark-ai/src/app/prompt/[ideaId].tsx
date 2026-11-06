import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import { Header } from '@/components/layout/Header';
import { Screen } from '@/components/layout/Screen';
import { AppText } from '@/components/ui/AppText';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { ConfirmSheet } from '@/components/ui/ConfirmSheet';
import { EmptyState } from '@/components/ui/EmptyState';
import { Icon } from '@/components/ui/Icon';
import { Input } from '@/components/ui/Input';
import { OptionGroup } from '@/components/ui/OptionGroup';
import { ScalePressable } from '@/components/ui/Pressable';
import { Sheet } from '@/components/ui/Sheet';
import { Skeleton } from '@/components/ui/Skeleton';
import { Surface } from '@/components/ui/Surface';
import { AI_TARGETS, BACKENDS, DESIGN_DIRECTIONS, FEATURE_COMPLEXITIES, FRAMEWORKS, PROMPT_PLATFORMS, PROMPT_SCOPES, type GeneratedPrompt, type Idea, type Locale, type PromptOptions } from '@/data/types';
import { AiError, enhancePromptLive } from '@/features/generator/client';
import { useAiMode } from '@/features/generator/useAiMode';
import { useIdea, usePrompt, usePromptMutations, usePrompts } from '@/features/library/hooks';
import { buildPrompt, defaultPromptOptions, promptFileName, promptStats, promptTitle } from '@/features/prompt/engine';
import { formatDate, useI18n } from '@/i18n';
import { copyText } from '@/lib/clipboard';
import { exportTextFile } from '@/lib/export';
import { usePreferences } from '@/store/preferences';
import { showToast } from '@/store/toast';
import { fonts } from '@/theme/fonts';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, space, type as typeScale } from '@/theme/tokens';

type Params = { ideaId: string; promptId?: string };

function PromptStudio({ idea, initialPrompt }: { idea: Idea; initialPrompt: GeneratedPrompt | null }) {
  const { t, pick, locale } = useI18n();
  const { colors } = useTheme();
  const ai = useAiMode();
  const onboarding = usePreferences((s) => s.onboarding);
  const savedPrompts = usePrompts(idea.id);
  const { create, update, remove } = usePromptMutations();

  const [options, setOptions] = useState<PromptOptions>(
    () =>
      initialPrompt?.options ?? {
        ...defaultPromptOptions,
        targetAi: onboarding.assistant ?? defaultPromptOptions.targetAi,
        platform: onboarding.platform ?? defaultPromptOptions.platform,
        language: locale,
      },
  );
  const [generatedContent, setGeneratedContent] = useState(() => buildPrompt(idea, options));
  const [content, setContent] = useState(() => initialPrompt?.content ?? generatedContent);
  const [activePromptId, setActivePromptId] = useState<string | null>(initialPrompt?.id ?? null);
  const [title, setTitle] = useState(() => initialPrompt?.title ?? promptTitle(idea, options));
  const [optionsOpen, setOptionsOpen] = useState(false);
  const [saveOpen, setSaveOpen] = useState(false);
  const [discardOpen, setDiscardOpen] = useState<PromptOptions | null>(null);
  const [deleteOpen, setDeleteOpen] = useState<string | null>(null);
  const [enhancing, setEnhancing] = useState(false);

  const edited = content !== generatedContent;
  const stats = useMemo(() => promptStats(content), [content]);

  const regenerate = (next: PromptOptions, force = false) => {
    if (edited && !force) {
      setDiscardOpen(next);
      return;
    }
    const text = buildPrompt(idea, next);
    setOptions(next);
    setGeneratedContent(text);
    setContent(text);
    if (!activePromptId) setTitle(promptTitle(idea, next));
    showToast(t('prompt.regenerated'), { icon: 'refresh' });
  };

  const changeOption = <K extends keyof PromptOptions>(key: K, value: PromptOptions[K]) => regenerate({ ...options, [key]: value });

  const copy = async () => {
    const ok = await copyText(content);
    showToast(ok ? t('common.copied') : t('errors.generic'), { tone: ok ? 'success' : 'danger', icon: 'copy' });
  };

  const exportMarkdown = async () => {
    const ok = await exportTextFile(promptFileName(idea, options), content);
    showToast(ok ? t('prompt.exported') : t('prompt.exportFailed'), { tone: ok ? 'success' : 'danger' });
  };

  const save = async (asNew = false) => {
    const finalTitle = title.trim() || promptTitle(idea, options);
    if (activePromptId && !asNew) {
      await update.mutateAsync({ id: activePromptId, patch: { title: finalTitle, content, options } });
    } else {
      const created = await create.mutateAsync({ ideaId: idea.id, title: finalTitle, options, content });
      setActivePromptId(created.id);
    }
    setSaveOpen(false);
  };

  const openSaved = (prompt: GeneratedPrompt) => {
    setOptions(prompt.options);
    setContent(prompt.content);
    setGeneratedContent(buildPrompt(idea, prompt.options));
    setTitle(prompt.title);
    setActivePromptId(prompt.id);
  };

  const enhance = async () => {
    if (ai.mode !== 'live') return;
    setEnhancing(true);
    try {
      const improved = await enhancePromptLive(content, pick(idea.name), options);
      setContent(improved);
      showToast(t('prompt.regenerated'), { tone: 'success', icon: 'sparkles' });
    } catch (err) {
      showToast(err instanceof AiError && err.code === 'quota' ? t('generator.errorQuota') : t('generator.errorGeneric'), { tone: 'danger' });
    } finally {
      setEnhancing(false);
    }
  };

  const summaryChips: { key: keyof PromptOptions; label: string }[] = [
    { key: 'targetAi', label: t(`enums.aiTarget.${options.targetAi}`) },
    { key: 'platform', label: t(`enums.platform.${options.platform}`) },
    { key: 'framework', label: t(`enums.framework.${options.framework}`) },
    { key: 'scope', label: t(`enums.scope.${options.scope}`) },
    { key: 'language', label: options.language === 'he' ? t('common.hebrew') : t('common.english') },
  ];

  return (
    <Screen scroll keyboard header={<Header back eyebrow={t('prompt.forIdea', { name: pick(idea.name) })} title={t('prompt.title')} />} testID="prompt-screen">
      <AppText variant="body" color="textSecondary" style={styles.subtitle}>
        {t('prompt.subtitle')}
      </AppText>

      <ScalePressable onPress={() => setOptionsOpen(true)} pressedScale={0.995} accessibilityRole="button" style={[styles.optionsCard, { backgroundColor: colors.surface, borderColor: colors.border }]} testID="open-options">
        <View style={styles.optionsHeader}>
          <AppText variant="bodySmall" weight="semibold" color="textSecondary">
            {t('prompt.options')}
          </AppText>
          <Icon name="sliders" size={16} color="textSecondary" />
        </View>
        <View style={styles.chips}>
          {summaryChips.map((chip) => (
            <Chip key={chip.key} size="sm" label={chip.label} />
          ))}
        </View>
      </ScalePressable>

      <View style={styles.quickRow}>
        <Chip label={t('prompt.mvpVersion')} icon="zap" selected={options.scope === 'mvp'} onPress={() => changeOption('scope', 'mvp')} testID="scope-mvp" />
        <Chip label={t('prompt.advancedVersion')} icon="rocket" selected={options.scope === 'complete'} onPress={() => changeOption('scope', 'complete')} testID="scope-complete" />
      </View>

      <View style={styles.editorHeader}>
        <View style={styles.editorTitle}>
          <AppText variant="heading">{t('prompt.generated')}</AppText>
          {edited ? <Badge label={t('prompt.edited')} tone="warning" icon="edit" /> : null}
        </View>
        <AppText variant="caption" color="textTertiary">
          {t('prompt.words', { count: stats.words })} · {t('prompt.characters', { count: stats.characters })}
        </AppText>
      </View>
      <AppText variant="caption" color="textTertiary" style={styles.hint}>
        {t('prompt.editableHint')}
      </AppText>
      <View style={[styles.editor, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <TextInput
          value={content}
          onChangeText={setContent}
          multiline
          scrollEnabled={false}
          textAlignVertical="top"
          autoCorrect={false}
          accessibilityLabel={t('prompt.generated')}
          testID="prompt-editor"
          style={[styles.editorInput, typeScale.bodySmall, { color: colors.text, fontFamily: fonts.sans, textAlign: options.language === 'he' ? 'right' : 'left', writingDirection: options.language === 'he' ? 'rtl' : 'ltr' }]}
        />
      </View>
      {edited ? <Button label={t('prompt.restoreGenerated')} variant="ghost" size="sm" icon="history" onPress={() => setContent(generatedContent)} style={styles.restore} /> : null}

      <View style={styles.actions}>
        <Button label={t('prompt.copyFull')} icon="copy" size="lg" fullWidth onPress={copy} testID="copy-prompt" />
        <View style={styles.actionRow}>
          <Button label={t('prompt.savePrompt')} icon="bookmark" variant="secondary" onPress={() => setSaveOpen(true)} style={styles.flex} fullWidth testID="save-prompt" />
          <Button label={t('prompt.regenerate')} icon="refresh" variant="secondary" onPress={() => regenerate(options)} style={styles.flex} fullWidth testID="regenerate-prompt" />
        </View>
        <View style={styles.actionRow}>
          <Button label={t('prompt.exportMarkdown')} icon="download" variant="outline" onPress={exportMarkdown} style={styles.flex} fullWidth testID="export-prompt" />
          <Button label={t('prompt.enhanceAi')} icon="sparkles" variant="outline" onPress={enhance} loading={enhancing} disabled={ai.mode !== 'live'} style={styles.flex} fullWidth />
        </View>
        {ai.mode !== 'live' ? (
          <AppText variant="caption" color="textTertiary">
            {t('prompt.enhanceAiUnavailable')}
          </AppText>
        ) : null}
      </View>

      <Surface variant="elevated" style={styles.disclaimer} padding="md">
        <Icon name="info" size={16} color="textSecondary" />
        <AppText variant="caption" color="textSecondary" style={styles.flex}>
          {t('prompt.disclaimer')}
        </AppText>
      </Surface>

      <View style={styles.saved}>
        <AppText variant="heading">{t('prompt.savedTitle')}</AppText>
        {savedPrompts.data?.length ? (
          savedPrompts.data.map((prompt) => (
            <ScalePressable
              key={prompt.id}
              onPress={() => openSaved(prompt)}
              accessibilityRole="button"
              accessibilityLabel={t('prompt.openSaved')}
              style={[styles.savedRow, { backgroundColor: prompt.id === activePromptId ? colors.accentSoft : colors.surface, borderColor: prompt.id === activePromptId ? colors.accentBorder : colors.border }]}
              testID={`saved-prompt-${prompt.id}`}>
              <View style={styles.flex}>
                <AppText variant="body" weight="semibold" numberOfLines={1}>
                  {prompt.title}
                </AppText>
                <AppText variant="caption" color="textTertiary">
                  {t(`enums.aiTarget.${prompt.options.targetAi}`)} · {t(`enums.scope.${prompt.options.scope}`)} · {formatDate(prompt.updatedAt, locale)}
                </AppText>
              </View>
              <ScalePressable onPress={() => setDeleteOpen(prompt.id)} hitSlop={8} accessibilityRole="button" accessibilityLabel={t('prompt.deletePrompt')}>
                <Icon name="trash" size={16} color="textTertiary" />
              </ScalePressable>
            </ScalePressable>
          ))
        ) : (
          <AppText variant="bodySmall" color="textSecondary">
            {t('prompt.savedEmpty')}
          </AppText>
        )}
      </View>

      <Sheet visible={optionsOpen} onClose={() => setOptionsOpen(false)} title={t('prompt.options')} footer={<Button label={t('common.done')} fullWidth onPress={() => setOptionsOpen(false)} />}>
        <OptionGroup label={t('prompt.targetAi')} options={AI_TARGETS.map((value) => ({ value, label: t(`enums.aiTarget.${value}`) }))} value={options.targetAi} onChange={(value) => changeOption('targetAi', value)} />
        <OptionGroup label={t('prompt.platform')} options={PROMPT_PLATFORMS.map((value) => ({ value, label: t(`enums.platform.${value}`) }))} value={options.platform} onChange={(value) => changeOption('platform', value)} />
        <OptionGroup label={t('prompt.framework')} options={FRAMEWORKS.map((value) => ({ value, label: t(`enums.framework.${value}`) }))} value={options.framework} onChange={(value) => changeOption('framework', value)} />
        <OptionGroup label={t('prompt.designDirection')} options={DESIGN_DIRECTIONS.map((value) => ({ value, label: t(`enums.designDirection.${value}`) }))} value={options.designDirection} onChange={(value) => changeOption('designDirection', value)} />
        <OptionGroup label={t('prompt.complexity')} options={FEATURE_COMPLEXITIES.map((value) => ({ value, label: t(`enums.complexity.${value}`) }))} value={options.complexity} onChange={(value) => changeOption('complexity', value)} />
        <OptionGroup label={t('prompt.scope')} options={PROMPT_SCOPES.map((value) => ({ value, label: t(`enums.scope.${value}`) }))} value={options.scope} onChange={(value) => changeOption('scope', value)} />
        <OptionGroup
          label={t('prompt.language')}
          options={(['he', 'en'] as Locale[]).map((value) => ({ value, label: value === 'he' ? t('common.hebrew') : t('common.english') }))}
          value={options.language}
          onChange={(value) => changeOption('language', value)}
        />
        <OptionGroup label={t('prompt.backend')} options={BACKENDS.map((value) => ({ value, label: t(`enums.backend.${value}`) }))} value={options.backend} onChange={(value) => changeOption('backend', value)} />
      </Sheet>

      <Sheet
        visible={saveOpen}
        onClose={() => setSaveOpen(false)}
        title={t('prompt.savePrompt')}
        footer={
          <View style={styles.actionRow}>
            {activePromptId ? <Button label={t('prompt.saveAsNew')} variant="secondary" onPress={() => save(true)} style={styles.flex} fullWidth /> : null}
            <Button label={t('common.save')} onPress={() => save(false)} loading={create.isPending || update.isPending} style={styles.flex} fullWidth testID="confirm-save-prompt" />
          </View>
        }>
        <Input label={t('prompt.promptName')} value={title} onChangeText={setTitle} placeholder={t('prompt.untitled')} testID="prompt-title-input" />
      </Sheet>

      <ConfirmSheet
        visible={Boolean(discardOpen)}
        onClose={() => setDiscardOpen(null)}
        title={t('prompt.discardChanges')}
        message={t('prompt.discardChangesHint')}
        confirmLabel={t('prompt.regenerate')}
        onConfirm={() => discardOpen && regenerate(discardOpen, true)}
      />
      <ConfirmSheet
        visible={Boolean(deleteOpen)}
        onClose={() => setDeleteOpen(null)}
        title={t('prompt.deletePrompt')}
        confirmLabel={t('common.delete')}
        destructive
        onConfirm={() => {
          if (!deleteOpen) return;
          void remove.mutateAsync(deleteOpen);
          if (deleteOpen === activePromptId) setActivePromptId(null);
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  skeletons: {
    gap: space.md,
    paddingTop: space.lg,
  },
  subtitle: {
    marginBottom: space.lg,
  },
  optionsCard: {
    padding: space.lg,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    gap: space.sm,
    marginBottom: space.md,
  },
  optionsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space.xs,
  },
  quickRow: {
    flexDirection: 'row',
    gap: space.sm,
    marginBottom: space.xl,
  },
  editorHeader: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: space.sm,
  },
  editorTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
  },
  hint: {
    marginTop: space.xs,
    marginBottom: space.md,
  },
  editor: {
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    padding: space.lg,
    minHeight: 320,
  },
  editorInput: {
    minHeight: 300,
    outlineStyle: 'none',
  } as object,
  restore: {
    marginTop: space.sm,
  },
  actions: {
    gap: space.sm,
    marginTop: space.xl,
  },
  actionRow: {
    flexDirection: 'row',
    gap: space.sm,
  },
  disclaimer: {
    flexDirection: 'row',
    gap: space.sm,
    alignItems: 'flex-start',
    marginTop: space.xl,
  },
  saved: {
    marginTop: space.xxxl,
    gap: space.md,
  },
  savedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    padding: space.lg,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
  },
});

export default function PromptStudioScreen() {
  const { ideaId, promptId } = useLocalSearchParams<Params>();
  const { t } = useI18n();
  const router = useRouter();
  const { idea, isLoading } = useIdea(ideaId);
  const savedPrompt = usePrompt(promptId);
  const waitingForPrompt = Boolean(promptId) && savedPrompt.isLoading;

  if (isLoading || waitingForPrompt) {
    return (
      <Screen header={<Header back title={t('prompt.title')} />}>
        <View style={styles.skeletons}>
          <Skeleton height={28} width="60%" />
          <Skeleton height={40} />
          <Skeleton height={320} />
        </View>
      </Screen>
    );
  }

  if (!idea) {
    return (
      <Screen header={<Header back title={t('prompt.title')} />}>
        <EmptyState icon="alert" title={t('idea.notFound')} actionLabel={t('errors.goHome')} onAction={() => router.replace('/')} />
      </Screen>
    );
  }

  return <PromptStudio key={`${idea.id}-${savedPrompt.data?.id ?? 'new'}`} idea={idea} initialPrompt={savedPrompt.data ?? null} />;
}
