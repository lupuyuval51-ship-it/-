import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState, type FormEvent } from 'react';
import { COACH_THREAD_TITLE_MAX, renameThreadSchema } from '@shared/schemas/coach';
import type { CoachThreadDTO, CoachThreadListResponse } from '@shared/types';
import { qk } from '../../api/queryClient';
import { Button, Modal, Notice, TextField, useToast } from '../../components/ui';
import { useI18n } from '../../i18n';
import { errorMessage, fieldErrorMessage } from '../../lib/errors';
import { coachApi } from './api';

export function RenameThreadModal({ thread, onClose }: { thread: CoachThreadDTO | null; onClose(): void }) {
  const i18n = useI18n();
  const { t } = i18n;
  const toast = useToast();
  const queryClient = useQueryClient();
  const [title, setTitle] = useState('');
  const [fieldError, setFieldError] = useState<string | undefined>();

  useEffect(() => {
    if (thread) {
      setTitle(thread.title);
      setFieldError(undefined);
    }
  }, [thread]);

  const rename = useMutation({
    mutationFn: (vars: { id: string; title: string }) => coachApi.renameThread(vars.id, vars.title),
    onSuccess: ({ thread: updated }) => {
      queryClient.setQueryData<CoachThreadListResponse>(qk.coachThreads, (old) =>
        old ? { threads: old.threads.map((x) => (x.id === updated.id ? updated : x)) } : old,
      );
      void queryClient.invalidateQueries({ queryKey: qk.coachThreads });
      toast.success(t('coach.renamed'));
      onClose();
    },
  });

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!thread || rename.isPending) return;
    const parsed = renameThreadSchema.safeParse({ title });
    if (!parsed.success) {
      setFieldError(fieldErrorMessage(parsed.error.issues[0]?.message ?? parsed.error.issues[0]?.code, i18n));
      return;
    }
    setFieldError(undefined);
    rename.mutate({ id: thread.id, title: parsed.data.title });
  };

  const close = () => {
    rename.reset();
    onClose();
  };

  return (
    <Modal
      open={thread != null}
      onClose={close}
      title={t('coach.rename')}
      size="sm"
      footer={
        <>
          <Button onClick={close}>{t('common.actions.cancel')}</Button>
          <Button type="submit" form="coach-rename-form" variant="primary" loading={rename.isPending}>
            {t('common.actions.save')}
          </Button>
        </>
      }
    >
      <form id="coach-rename-form" onSubmit={onSubmit} noValidate className="stack">
        {rename.isError && <Notice tone="danger">{errorMessage(rename.error, i18n, 'coach')}</Notice>}
        <TextField
          label={t('coach.titleLabel')}
          value={title}
          maxLength={COACH_THREAD_TITLE_MAX}
          onChange={(e) => setTitle(e.target.value)}
          error={fieldError}
          required
          autoFocus
        />
      </form>
    </Modal>
  );
}
