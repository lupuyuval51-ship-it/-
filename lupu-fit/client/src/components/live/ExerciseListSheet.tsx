import type { ReactNode } from 'react';
import { useT } from '../../i18n/index.tsx';
import { IconChevron, IconTrash } from '../../ui/icons.tsx';
import { Button, IconButton, Sheet, Tag } from '../../ui/kit.tsx';

export interface ListItem { id: string; name: string; done: number; total: number; current: boolean; isFinisher: boolean }

export function ExerciseListSheet({ open, onClose, items, onSelect, onMove, onRemove, onAdd }: {
  open: boolean; onClose: () => void; items: ListItem[]; onSelect: (id: string) => void; onMove: (id: string, dir: -1 | 1) => void; onRemove: (id: string) => void; onAdd: () => void;
}): ReactNode {
  const t = useT();
  return (
    <Sheet open={open} onClose={onClose} title={t('live.allExercises')}>
      <ul className="list stack-sm">
        {items.map((it, i) => {
          const state = it.done >= it.total ? 'done' : it.done > 0 ? 'progress' : 'todo';
          return (
            <li key={it.id} className="live-list-row">
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
      <Button block onClick={onAdd}>{t('live.structure.add')}</Button>
    </Sheet>
  );
}
