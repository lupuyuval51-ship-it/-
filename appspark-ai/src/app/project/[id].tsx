import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { IdeaCard } from '@/components/ideas/IdeaCard';
import { Header } from '@/components/layout/Header';
import { Screen } from '@/components/layout/Screen';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { ConfirmSheet } from '@/components/ui/ConfirmSheet';
import { EmptyState } from '@/components/ui/EmptyState';
import { IconButton } from '@/components/ui/IconButton';
import { Input } from '@/components/ui/Input';
import { OptionGroup } from '@/components/ui/OptionGroup';
import { Skeleton } from '@/components/ui/Skeleton';
import { PROJECT_STATUSES, type Project, type ProjectStatus } from '@/data/types';
import { useIdea, useProject, useProjectMutations } from '@/features/library/hooks';
import { formatDate, useI18n } from '@/i18n';
import { showToast } from '@/store/toast';
import { space } from '@/theme/tokens';

function ProjectForm({ project }: { project: Project }) {
  const { t, locale } = useI18n();
  const router = useRouter();
  const { update } = useProjectMutations();
  const [name, setName] = useState(project.name);
  const [description, setDescription] = useState(project.description);
  const [notes, setNotes] = useState(project.notes);
  const [status, setStatus] = useState<ProjectStatus>(project.status);
  const [dirty, setDirty] = useState(false);
  const linked = useIdea(project.ideaId ?? undefined);

  const save = async () => {
    if (!name.trim()) {
      showToast(t('saved.nameRequired'), { tone: 'danger' });
      return;
    }
    await update.mutateAsync({ id: project.id, patch: { name: name.trim(), description, notes, status } });
    setDirty(false);
    showToast(t('saved.projectSaved'), { tone: 'success' });
  };

  const changeStatus = async (next: ProjectStatus) => {
    setStatus(next);
    await update.mutateAsync({ id: project.id, patch: { status: next } });
  };

  return (
        <View style={styles.stack}>
          <Input
            label={t('saved.projectName')}
            value={name}
            onChangeText={(v) => {
              setName(v);
              setDirty(true);
            }}
            testID="project-edit-name"
          />
          <OptionGroup label={t('saved.projectStatus')} options={PROJECT_STATUSES.map((value) => ({ value, label: t(`enums.projectStatus.${value}`) }))} value={status} onChange={changeStatus} />
          <Input
            label={t('saved.projectDescription')}
            value={description}
            onChangeText={(v) => {
              setDescription(v);
              setDirty(true);
            }}
            multiline
          />
          <Input
            label={t('saved.projectNotes')}
            value={notes}
            onChangeText={(v) => {
              setNotes(v);
              setDirty(true);
            }}
            multiline
            inputStyle={styles.notes}
          />
          <View style={styles.actions}>
            <Button label={t('common.save')} onPress={save} loading={update.isPending} disabled={!dirty} testID="project-save" />
            <AppText variant="caption" color="textTertiary">
              {t('saved.lastUpdated', { date: formatDate(project.updatedAt, locale) })}
            </AppText>
          </View>

          <View style={styles.linked}>
            <AppText variant="heading">{t('saved.linkedIdea')}</AppText>
            {linked.idea ? (
              <>
                <IdeaCard idea={linked.idea} />
                <Button label={t('idea.createPrompt')} icon="wand" variant="secondary" onPress={() => router.push({ pathname: '/prompt/[ideaId]', params: { ideaId: linked.idea?.id ?? '' } })} />
              </>
            ) : (
              <AppText variant="body" color="textSecondary">
                {t('saved.noLinkedIdea')}
              </AppText>
            )}
          </View>
        </View>
  );
}

export default function ProjectScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useI18n();
  const router = useRouter();
  const project = useProject(id);
  const { remove } = useProjectMutations();
  const [confirmOpen, setConfirmOpen] = useState(false);

  return (
    <Screen
      scroll
      keyboard
      header={<Header back title={t('saved.projectsTab')} right={project.data ? <IconButton icon="trash" color="danger" accessibilityLabel={t('saved.deleteProject')} onPress={() => setConfirmOpen(true)} testID="delete-project" /> : null} />}
      testID="project-screen">
      {project.isLoading ? (
        <View style={styles.stack}>
          <Skeleton height={40} width="60%" />
          <Skeleton height={48} />
          <Skeleton height={120} />
        </View>
      ) : !project.data ? (
        <EmptyState icon="folder" title={t('errors.notFoundTitle')} actionLabel={t('errors.goHome')} onAction={() => router.replace('/')} />
      ) : (
        <ProjectForm key={`${project.data.id}-${project.data.updatedAt}`} project={project.data} />
      )}
      <ConfirmSheet
        visible={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title={t('saved.deleteProject')}
        message={t('saved.deleteProjectConfirm')}
        confirmLabel={t('common.delete')}
        destructive
        onConfirm={async () => {
          if (!project.data) return;
          await remove.mutateAsync(project.data.id);
          router.back();
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  stack: {
    gap: space.xl,
    paddingTop: space.sm,
  },
  notes: {
    minHeight: 160,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space.md,
  },
  linked: {
    gap: space.md,
    paddingTop: space.lg,
  },
});
