import { useState } from 'react';
import { SESSION_LIMITS } from '@shared/schemas/sessions';
import { formatClock } from '@shared/training';
import { Button, Modal, Notice, Segmented, TextAreaField } from '../../components/ui';
import { useUnits } from '../../hooks/useUnits';
import { useI18n } from '../../i18n';

export interface FinishLine {
  id: string;
  name: string;
  done: number;
  total: number;
}

/**
 * Confirmation before finishing: a short summary of what was logged (time, volume, sets
 * left undone per exercise), a warning when nothing was completed, and optional RPE and notes.
 */
export function FinishDialog({
  open,
  onClose,
  onConfirm,
  pending,
  done,
  total,
  elapsedSeconds,
  volumeKg,
  lines,
  missingWeight = 0,
}: {
  open: boolean;
  onClose(): void;
  onConfirm(input: { perceivedExertion: number | null; notes: string }): void;
  pending: boolean;
  done: number;
  total: number;
  elapsedSeconds: number;
  volumeKg: number;
  /** Exercises that still have sets not marked done. */
  lines: FinishLine[];
  /** Completed barbell sets logged without a weight (a warning, never a blocker). */
  missingWeight?: number;
}) {
  const { t } = useI18n();
  const { formatWeight } = useUnits();
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
            {t('session.finish.keepGoing')}
          </Button>
          <Button variant="primary" icon="check" loading={pending} onClick={() => onConfirm({ perceivedExertion: effort || null, notes: notes.trim() })}>
            {t('session.finish.confirm')}
          </Button>
        </>
      }
    >
      <div className="stack">
        <p>{t('session.finish.summary', { done, total })}</p>
        <dl className="finish-stats">
          <div>
            <dt>{t('session.finish.time')}</dt>
            <dd className="num">{formatClock(elapsedSeconds)}</dd>
          </div>
          <div>
            <dt>{t('session.finish.volume')}</dt>
            <dd className="num">{volumeKg > 0 ? formatWeight(volumeKg) : '—'}</dd>
          </div>
        </dl>
        {done === 0 ? (
          <Notice tone="warning">{t('session.finish.noneWarning')}</Notice>
        ) : lines.length > 0 ? (
          <Notice tone="info">
            <p>{t('session.finish.fewWarning')}</p>
            <ul className="finish-left">
              {lines.map((l) => (
                <li key={l.id}>{t('session.finish.left', { name: l.name, done: l.done, total: l.total })}</li>
              ))}
            </ul>
          </Notice>
        ) : null}
        {missingWeight > 0 && <Notice tone="warning">{t('session.finish.missingWeight', { count: missingWeight })}</Notice>}
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
