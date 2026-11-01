import { useMemo, useState, type ReactNode } from 'react';
import type { ExerciseContent } from '@lupu-fit/shared/content';
import { useLang, useT } from '../../i18n/index.tsx';
import { exName } from '../../data/content.ts';
import { Button, Sheet, TextInput } from '../../ui/kit.tsx';

export function ReplaceSheet({ open, onClose, options, onPick }: { open: boolean; onClose: () => void; options: ExerciseContent[]; onPick: (id: string) => void }): ReactNode {
  const t = useT(); const { lang } = useLang();
  return (
    <Sheet open={open} onClose={onClose} title={t('live.structure.replace')}>
      <span className="small muted">{t('live.structure.replaceHint')}</span>
      {options.length === 0 ? <span>{t('live.structure.replaceNone')}</span> : (
        <ul className="list stack-sm">{options.map((o) => <li key={o.id}><Button block onClick={() => onPick(o.id)}>{exName(o, lang)}</Button></li>)}</ul>
      )}
    </Sheet>
  );
}

export function AddExerciseSheet({ open, onClose, candidates, onPick }: { open: boolean; onClose: () => void; candidates: ExerciseContent[]; onPick: (id: string) => void }): ReactNode {
  const t = useT(); const { lang } = useLang();
  const [q, setQ] = useState('');
  const shown = useMemo(() => {
    const s = q.trim().toLowerCase();
    return candidates.filter((c) => !s || c.nameHe.toLowerCase().includes(s) || c.nameEn.toLowerCase().includes(s)).slice(0, 40);
  }, [candidates, q]);
  return (
    <Sheet open={open} onClose={onClose} title={t('live.structure.add')}>
      <TextInput label={t('live.structure.search')} value={q} onChange={(e) => setQ(e.target.value)} />
      {shown.length === 0 ? <span>{t('live.structure.none')}</span> : <ul className="list stack-sm">{shown.map((c) => <li key={c.id}><Button block onClick={() => onPick(c.id)}>{exName(c, lang)}</Button></li>)}</ul>}
    </Sheet>
  );
}
