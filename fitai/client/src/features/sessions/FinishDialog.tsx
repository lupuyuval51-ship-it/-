import { useState } from 'react';
import { SESSION_LIMITS } from '@shared/schemas/sessions';
import { Button, Modal, Notice, Segmented, TextAreaField } from '../../components/ui';
import { useI18n } from '../../i18n';

/** Confirmation before finishing: warns about uncompleted sets and collects optional RPE and notes. */
export function FinishDialog({
  open,
  onClose,
  onConfirm,
  pending,
  done,
  total,
}: {
  open: boolean;
  onClose(): void;
  onConfirm(input: { perceivedExertion: number | null; notes: string }): void;
  pending: boolean;
  done: number;
  total: number;
}) {
  const { t } = useI18n();
  const [effort, setEffort] = useState<number>(0);
  const [notes, setNotes] = useState('');
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t('session.finish.title')}
      footer={
        <>
          <Button onClick={onClose} disabled={pending}>
            {t('common.actions.cancel')}
          </Button>
          <Button variant="primary" icon="check" loading={pending} onClick={() => onConfirm({ perceivedExertion: effort || null, notes: notes.trim() })}>
            {t('session.finish.confirm')}
          </Button>
        </>
      }
    >
      <div className="stack">
        <p>{t('session.finish.summary', { done, total })}</p>
        {done === 0 ? (
          <Notice tone="warning">{t('session.finish.noneWarning')}</Notice>
        ) : done < total ? (
          <Notice tone="info">{t('session.finish.fewWarning')}</Notice>
        ) : null}
        <Segmented<number>
          label={t('session.finish.effort')}
          size="sm"
          value={effort}
          onChange={setEffort}
          options={[{ value: 0, label: t('session.finish.effortNone') }, ...Array.from({ length: 10 }, (_, i) => ({ value: i + 1, label: String(i + 1) }))]}
        />
        <TextAreaField
          label={t('session.finish.notes')}
          value={notes}
          maxLength={SESSION_LIMITS.notesMax}
          rows={3}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>
    </Modal>
  );
}
