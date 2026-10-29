import { useState } from 'react';
import { shoppingList, type MenuItem } from '@shared/menu';
import { Button, Modal, useToast } from '../../components/ui';
import { useI18n } from '../../i18n';

/** Ingredient names across the menu, with local check marks (not saved: the list is for one shopping trip). */
export function ShoppingListModal({ open, onClose, items }: { open: boolean; onClose(): void; items: readonly MenuItem[] }) {
  const { t, locale } = useI18n();
  const toast = useToast();
  const [done, setDone] = useState<Set<string>>(new Set());
  const list = shoppingList(items, locale === 'he' ? 'he' : 'en');

  const toggle = (name: string) =>
    setDone((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(list.map((e) => `- ${e.name}`).join('\n'));
      toast.success(t('menu.shopping.copied'));
    } catch {
      toast.error(t('menu.shopping.copyFailed'));
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t('menu.shopping.title')}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            {t('common.actions.close')}
          </Button>
          <Button variant="secondary" icon="copy" onClick={() => void copy()} disabled={!list.length}>
            {t('menu.shopping.copy')}
          </Button>
        </>
      }
    >
      <p className="small muted">{t('menu.shopping.intro')}</p>
      {list.length === 0 ? (
        <p>{t('menu.shopping.empty')}</p>
      ) : (
        <ul className="menu-shopping">
          {list.map((e) => (
            <li key={e.name}>
              <label className="menu-shopping-row">
                <input type="checkbox" checked={done.has(e.name)} onChange={() => toggle(e.name)} />
                <span className={done.has(e.name) ? 'menu-shopping-done' : undefined}>{e.name}</span>
                {e.dishes > 1 && <span className="small muted">{t('menu.shopping.dishes', { count: e.dishes })}</span>}
              </label>
            </li>
          ))}
        </ul>
      )}
    </Modal>
  );
}
