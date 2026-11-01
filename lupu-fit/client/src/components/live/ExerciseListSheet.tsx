import type { ReactNode } from 'react';
import { useT } from '../../i18n/index.tsx';
import { IconChevron, IconPlus, IconTrash } from '../../ui/icons.tsx';
import { Button, IconButton, Sheet, Tag } from '../../ui/kit.tsx';
import { IconBarbell, IconSwap } from './LiveIcons.tsx';

export interface ListItem { id: string; name: string; done: number; total: number; current: boolean; isFinisher: boolean }

/** The single "more" menu: structure actions, plate calculator, the full exercise list (jump / reorder / remove) and discard. */
export function ExerciseListSheet({ open, onClose, items, canReplace, replaceLocked, showPlates, onSelect, onMove, onRemove, onAdd, onReplace, onPlates, onDiscard }: {
  open: boolean; onClose: () => void; items: ListItem[]; canReplace: boolean; replaceLocked: boolean; showPlates: boolean;
  onSelect: (id: string) => void; onMove: (id: string, dir: -1 | 1) => void; onRemove: (id: string) => void;
  onAdd: () => void; onReplace: () => void; onPlates: () => void; onDiscard: () => void;
}): ReactNode {
  const t = useT();
  return (
    <Sheet open={open} onClose={onClose} title={t('live.more.title')}>
      <div className="lv-menu">
        <button type="button" className="lv-menu-row" onClick={onAdd}><IconPlus />{t('live.structure.add')}</button>
        <button type="button" className="lv-menu-row" disabled={!canReplace} onClick={onReplace}><IconSwap />{t('live.structure.replace')}</button>
        {replaceLocked ? <span className="small muted lv-menu-hint" data-testid="replace-locked">{t('live.structure.replaceLocked')}</span> : null}
        {showPlates ? <button type="button" className="lv-menu-row" onClick={onPlates}><IconBarbell />{t('live.plates.open')}</button> : null}
      </div>
      <h4 className="lv-menu-h">{t('live.allExercises')}</h4>
      <ul className="list stack-sm">
        {items.map((it, i) => {
          const state = it.done >= it.total ? 'done' : it.done > 0 ? 'progress' : 'todo';
          return (
            <li key={it.id} className="live-list-row lv-list-row">
              <button type="button" className="live-list-pick" aria-current={it.current ? 'true' : undefined} onClick={() => onSelect(it.id)}>
                <span className="strong">{it.name}</span>
                <span className="small muted">{t('live.setsDone', { done: it.done, total: it.total })}</span>
              </button>
              <Tag {...(state === 'done' ? { tone: 'success' as const } : {})}>{t(`live.status.${state}`)}</Tag>
              <IconButton label={t('live.structure.moveUp')} disabled={i === 0} onClick={() => onMove(it.id, -1)}><IconChevron className="live-up" /></IconButton>
              <IconButton label={t('live.structure.moveDown')} disabled={i === items.length - 1} onClick={() => onMove(it.id, 1)}><IconChevron className="live-down" /></IconButton>
              <IconButton label={t('live.structure.remove')} onClick={() => onRemove(it.id)}><IconTrash /></IconButton>
            </li>
          );
        })}
      </ul>
      <Button block variant="danger" className="lv-discard" onClick={onDiscard}><IconTrash />{t('live.discard')}</Button>
    </Sheet>
  );
}
