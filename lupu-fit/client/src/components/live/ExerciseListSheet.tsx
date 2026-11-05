import { useEffect, useState, type ReactNode } from 'react';
import { useT } from '../../i18n/index.tsx';
import { IconCheck, IconChevron, IconPlus, IconTrash } from '../../ui/icons.tsx';
import { Button, IconButton, Sheet, Tag } from '../../ui/kit.tsx';
import { IconBarbell, IconSwap } from './LiveIcons.tsx';

export interface ListItem { id: string; name: string; done: number; total: number; current: boolean; isFinisher: boolean }

/**
 * The single "more" menu: structure actions, plate calculator, the full exercise list (jump / reorder / remove), an early
 * finish (only while sets remain, so it stays out of the thumb zone next to "Finish set") and discard.
 * Reorder/remove controls appear only in "Edit list" mode, so in normal use each exercise name gets the full row width
 * and there is no stray destructive tap next to the name.
 */
export function ExerciseListSheet({ open, onClose, items, canReplace, replaceLocked, showPlates, onSelect, onMove, onRemove, onAdd, onReplace, onPlates, onDiscard, onFinish, finishLabel, finishing }: {
  open: boolean; onClose: () => void; items: ListItem[]; canReplace: boolean; replaceLocked: boolean; showPlates: boolean;
  onSelect: (id: string) => void; onMove: (id: string, dir: -1 | 1) => void; onRemove: (id: string) => void;
  onAdd: () => void; onReplace: () => void; onPlates: () => void; onDiscard: () => void;
  onFinish?: () => void; finishLabel?: string; finishing?: boolean;
}): ReactNode {
  const t = useT();
  const [editing, setEditing] = useState(false);
  useEffect(() => { if (!open) setEditing(false); }, [open]);
  return (
    <Sheet open={open} onClose={onClose} title={t('live.more.title')}>
      <div className="lv-menu">
        <button type="button" className="lv-menu-row" onClick={onAdd}><IconPlus />{t('live.structure.add')}</button>
        <button type="button" className="lv-menu-row" disabled={!canReplace} onClick={onReplace}><IconSwap />{t('live.structure.replace')}</button>
        {replaceLocked ? <span className="small muted lv-menu-hint" data-testid="replace-locked">{t('live.structure.replaceLocked')}</span> : null}
        {showPlates ? <button type="button" className="lv-menu-row" onClick={onPlates}><IconBarbell />{t('live.plates.open')}</button> : null}
      </div>
      <div className="lv-menu-head">
        <h4 className="lv-menu-h">{t('live.allExercises')}</h4>
        <Button variant="ghost" className="lv-edit-toggle" aria-pressed={editing} onClick={() => setEditing((v) => !v)}>{editing ? t('final.live.editDone') : t('final.live.editList')}</Button>
      </div>
      <ul className="list stack-sm">
        {items.map((it, i) => {
          const state = it.done >= it.total ? 'done' : it.done > 0 ? 'progress' : 'todo';
          return (
            <li key={it.id} className="live-list-row lv-list-row">
              <button type="button" className="live-list-pick" aria-current={it.current ? 'true' : undefined} onClick={() => onSelect(it.id)}>
                <span className="strong">{it.name}</span>
                <span className="lv-list-meta">
                  <span className="small muted">{t('live.setsDone', { done: it.done, total: it.total })}</span>
                  <Tag {...(state === 'done' ? { tone: 'success' as const } : {})}>{t(`live.status.${state}`)}</Tag>
                </span>
              </button>
              {editing ? (
                <span className="lv-list-tools">
                  <IconButton label={t('live.structure.moveUp')} disabled={i === 0} onClick={() => onMove(it.id, -1)}><IconChevron className="live-up" /></IconButton>
                  <IconButton label={t('live.structure.moveDown')} disabled={i === items.length - 1} onClick={() => onMove(it.id, 1)}><IconChevron className="live-down" /></IconButton>
                  <IconButton label={t('live.structure.remove')} onClick={() => onRemove(it.id)}><IconTrash /></IconButton>
                </span>
              ) : null}
            </li>
          );
        })}
      </ul>
      {onFinish ? <Button block className="lv-menu-finish" disabled={finishing} onClick={onFinish}><IconCheck />{finishLabel ?? t('live.finishWorkout')}</Button> : null}
      <Button block variant="danger" className="lv-discard" onClick={onDiscard}><IconTrash />{t('live.discard')}</Button>
    </Sheet>
  );
}
