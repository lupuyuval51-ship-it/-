import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { OptionGroup } from '@/components/ui/OptionGroup';
import { Sheet } from '@/components/ui/Sheet';
import { PROJECT_STATUSES, type ProjectStatus } from '@/data/types';
import { useProjectMutations } from '@/features/library/hooks';
import { useI18n } from '@/i18n';
import { space } from '@/theme/tokens';

export interface ProjectSheetProps {
  visible: boolean;
  onClose: () => void;
  ideaId: string | null;
  defaultName?: string;
  onCreated?: (id: string) => void;
}

function ProjectForm({ ideaId, defaultName, onClose, onCreated }: Omit<ProjectSheetProps, 'visible'>) {
  const { t } = useI18n();
  const { create } = useProjectMutations();
  const [name, setName] = useState(defaultName ?? '');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<ProjectStatus>('saved');
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (!name.trim()) return setError(t('saved.nameRequired'));
    const project = await create.mutateAsync({ ideaId, name, description, status });
    onCreated?.(project.id);
    onClose();
  };

  return (
    <>
      <Input label={t('saved.projectName')} value={name} onChangeText={setName} error={error ?? undefined} autoFocus testID="project-name" />
      <Input label={t('saved.projectDescription')} value={description} onChangeText={setDescription} multiline />
      <OptionGroup label={t('saved.projectStatus')} options={PROJECT_STATUSES.map((value) => ({ value, label: t(`enums.projectStatus.${value}`) }))} value={status} onChange={setStatus} />
      {ideaId ? (
        <AppText variant="caption" color="textTertiary">
          {t('saved.createdFromIdea')}
        </AppText>
      ) : null}
      <View style={styles.footer}>
        <Button label={t('common.cancel')} variant="ghost" onPress={onClose} />
        <Button label={t('common.create')} onPress={submit} loading={create.isPending} testID="project-sheet-create" />
      </View>
    </>
  );
}

/** Create-project form, reused from the idea screen and the Saved tab. The form mounts fresh on every open. */
export function ProjectSheet({ visible, onClose, ideaId, defaultName = '', onCreated }: ProjectSheetProps) {
  const { t } = useI18n();
  return (
    <Sheet visible={visible} onClose={onClose} title={t('saved.newProject')}>
      {visible ? <ProjectForm ideaId={ideaId} defaultName={defaultName} onClose={onClose} onCreated={onCreated} /> : null}
    </Sheet>
  );
}

const styles = StyleSheet.create({
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: space.sm,
  },
});
