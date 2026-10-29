import { useState } from 'react';
import { Badge, Button, Icon, Modal } from '../../components/ui';
import { useUnits } from '../../hooks/useUnits';
import { useI18n } from '../../i18n';
import { useOutbox } from './hooks';
import { mayDuplicate, type OutboxEntry } from './outbox';
import { outboxSync } from './sync';

function useEntryLabel() {
  const { t, lt, formatDate, tx } = useI18n();
  const { formatWeight } = useUnits();
  return (e: OutboxEntry): { title: string; detail: string } => {
    const op = e.op;
    if (op.type === 'weight') return { title: t('common.offline.kinds.weight'), detail: `${formatWeight(op.input.weightKg)} · ${formatDate(op.input.date, { day: 'numeric', month: 'short' })}` };
    const meal = tx(`enums.mealType.${op.input.mealType}`);
    const name = op.type === 'quick_add' ? op.input.name : lt(op.preview.name);
    return { title: name, detail: `${meal} · ${formatDate(op.input.date, { day: 'numeric', month: 'short' })}` };
  };
}

/**
 * Top-bar chip for changes kept on this device (food log and weigh-ins made without a connection).
 * Hidden when nothing is waiting; opens a list where entries can be reviewed, retried or removed.
 */
export function OutboxIndicator() {
  const { t, tx } = useI18n();
  const { entries, pending, failed, offline, saving } = useOutbox();
  const [open, setOpen] = useState(false);
  const label = useEntryLabel();
  if (entries.length === 0) return null;
  const now = Date.now();
  return (
    <>
      <button
        type="button"
        className={`pill outbox-pill${failed > 0 ? ' outbox-pill-failed' : ''}`}
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-label={t('common.offline.indicatorLabel', { count: entries.length })}
      >
        <Icon name={failed > 0 ? 'warning' : saving ? 'refresh' : 'clock'} size={16} />
        <span className="num">{entries.length}</span>
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title={t('common.offline.title')} footer={<Button onClick={() => setOpen(false)}>{t('common.actions.close')}</Button>}>
        <div className="stack">
          <p className="muted small">{offline ? t('common.offline.statusOffline', { count: pending }) : t('common.offline.statusSyncing', { count: pending })}</p>
          <ul className="list" aria-label={t('common.offline.title')}>
            {entries.map((e) => {
              const { title, detail } = label(e);
              return (
                <li key={e.id} className="list-item outbox-entry">
                  <div className="outbox-entry-body">
                    <div className="row">
                      <span>{title}</span>
                      {e.status === 'failed' ? <Badge tone="danger">{t('common.offline.rejected')}</Badge> : <Badge tone="warning">{t('nutrition.offline.pending')}</Badge>}
                    </div>
                    <span className="small muted">{detail}</span>
                    {e.status === 'failed' && e.errorCode && <span className="small">{tx(`errors.${e.errorCode}`) || e.errorCode}</span>}
                    {e.status === 'pending' && mayDuplicate(e, now) && <span className="small faint">{t('common.offline.mayDuplicate')}</span>}
                  </div>
                  <div className="row">
                    {e.status === 'failed' && (
                      <Button size="sm" variant="ghost" onClick={() => outboxSync.retry(e.id)}>
                        {t('common.offline.retry')}
                      </Button>
                    )}
                    <Button size="sm" variant="ghost" onClick={() => outboxSync.discard(e.id)}>
                      {t('nutrition.offline.discard')}
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </Modal>
    </>
  );
}
