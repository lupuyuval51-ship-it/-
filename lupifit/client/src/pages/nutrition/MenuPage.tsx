import { useState } from 'react';
import { useSearchParams } from 'react-router';
import { dishById } from '@shared/dishes';
import type { QuickAddInput } from '@shared/schemas/nutrition';
import { menuSlots, type MenuItem } from '@shared/menu';
import { Button, Card, EmptyState, LinkButton, Notice, PageHeader, ProgressBar, QueryState, useToast } from '../../components/ui';
import { useIdempotentMutation } from '../../hooks/useIdempotentMutation';
import { DishCard } from '../../features/menu/DishCard';
import { ShoppingListModal } from '../../features/menu/ShoppingListModal';
import { useMenu } from '../../features/menu/useMenu';
import { DateNavigator } from '../../features/nutrition/DateNavigator';
import { useNutritionInvalidation, useUserToday } from '../../features/nutrition/hooks';
import { quickAdd } from '../../features/nutrition/api';
import { clampLogDate } from '../../features/nutrition/portion';
import { sendOrQueue } from '../../features/offline/hooks';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { useI18n } from '../../i18n';
import { errorMessage } from '../../lib/errors';
import '../../styles/nutrition.css';
import '../../styles/menu.css';

export default function MenuPage() {
  const i18n = useI18n();
  const { t, lt, formatNumber } = i18n;
  useDocumentTitle(t('menu.title'));
  const toast = useToast();
  const invalidate = useNutritionInvalidation();
  const today = useUserToday();
  const [params, setParams] = useSearchParams();
  const date = clampLogDate(params.get('date'), today);
  const setDate = (d: string) => setParams(d === today ? {} : { date: d }, { replace: true });
  const { profileQuery, profile, targets, menu, state, setState } = useMenu(date);
  const [shoppingOpen, setShoppingOpen] = useState(false);

  const input = (item: MenuItem): QuickAddInput => {
    const dish = dishById(item.dishId);
    const base = dish ? lt(dish.name) : item.dishId;
    return {
      date,
      mealType: item.mealType,
      name: item.scale === 1 ? base : `${base} ×${formatNumber(item.scale, { maximumFractionDigits: 2 })}`,
      kcal: item.kcal,
      proteinG: item.proteinG,
      carbsG: item.carbsG,
      fatG: item.fatG,
      // The dish data has no fibre value; 0 means "not known", as for any quick add.
      fiberG: 0,
      note: t('menu.logNote'),
    };
  };

  const log = useIdempotentMutation(
    async (items: MenuItem[], key: string) => {
      const results = [];
      // One by one, each with its own key derived from this submission's key, so a retry never double-logs.
      for (const item of items) {
        const body = input(item);
        const k = `${key}-${item.slot}`;
        results.push(await sendOrQueue({ type: 'quick_add', input: body }, k, () => quickAdd(body, k)));
      }
      return results;
    },
    {
      // Run even without a connection: sendOrQueue keeps the entries on this device instead of the mutation pausing.
      networkMode: 'always',
      onSuccess: (results, { vars }) => {
        const sent = results.flatMap((r) => (r.queued ? [] : [r.res]));
        const last = sent[sent.length - 1];
        if (last) invalidate(last.day);
        setState((s) => ({ ...s, logged: { ...s.logged, ...Object.fromEntries(vars.map((i) => [i.slot, i.dishId])) } }));
        if (results.some((r) => r.queued)) {
          toast.show(t('menu.savedOffline'), 'info');
          return;
        }
        const first = vars[0];
        const dish = first && dishById(first.dishId);
        if (vars.length === 1 && first && dish) toast.success(t('menu.logged', { name: lt(dish.name), meal: t(`enums.mealType.${first.mealType}`) }));
        else toast.success(t('menu.loggedDay', { count: vars.length }));
      },
      onError: (err) => toast.error(errorMessage(err, i18n, 'nutrition')),
    },
  );

  const isLogged = (item: MenuItem) => state.logged[item.slot] === item.dishId;
  const another = (slot: number) =>
    setState((s) => ({ swaps: { ...s.swaps, [slot]: (s.swaps[slot] ?? 0) + 1 }, logged: Object.fromEntries(Object.entries(s.logged).filter(([k]) => Number(k) !== slot)) }));

  const pendingSlots = new Set(log.isPending ? log.variables?.vars.map((i) => i.slot) : []);
  const unlogged = menu ? menu.items.filter((i) => !isLogged(i)) : [];
  const slots = menuSlots(profile?.mealsPerDay);
  const hasAllergies = (profile?.allergies.length ?? 0) > 0;

  return (
    <div className="menu-page stack">
      <PageHeader title={t('menu.title')} subtitle={t('menu.subtitle')} backTo="/nutrition" backLabel={t('menu.back')} />
      <DateNavigator date={date} onChange={setDate} />
      <QueryState query={profileQuery}>
        {() => {
          if (!targets || !menu) {
            return (
              <EmptyState
                icon="target"
                title={t('menu.empty.noTargets')}
                body={t('menu.empty.noTargetsBody')}
                action={
                  <LinkButton variant="primary" to="/profile">
                    {t('menu.empty.profile')}
                  </LinkButton>
                }
              />
            );
          }
          if (menu.items.length === 0) return <EmptyState icon="apple" title={t('menu.empty.all')} body={t('menu.empty.allBody')} />;
          const { totals } = menu;
          return (
            <>
              <Card title={t('menu.summary.title')} className="menu-summary">
                <p className="menu-summary-kcal num">
                  <strong>{t('menu.summary.kcal', { value: formatNumber(totals.kcal), target: formatNumber(targets.calories) })}</strong>
                </p>
                <ProgressBar value={totals.kcal} max={targets.calories} label={t('menu.summary.title')} />
                <p className="small muted num">
                  {t('menu.summary.macros', {
                    protein: formatNumber(totals.proteinG),
                    proteinTarget: formatNumber(targets.proteinG),
                    carbs: formatNumber(totals.carbsG),
                    carbsTarget: formatNumber(targets.carbsG),
                    fat: formatNumber(totals.fatG),
                    fatTarget: formatNumber(targets.fatG),
                  })}
                </p>
                <div className="menu-summary-actions">
                  {unlogged.length > 0 ? (
                    <Button variant="primary" icon="plus" loading={log.isPending} onClick={() => log.mutate(unlogged)}>
                      {t('menu.summary.logAll')}
                    </Button>
                  ) : (
                    <p className="small" role="status">
                      {t('menu.summary.logAllDone')}
                    </p>
                  )}
                  <Button variant="secondary" icon="list" onClick={() => setShoppingOpen(true)}>
                    {t('menu.shopping.open')}
                  </Button>
                </div>
              </Card>
              <Notice tone={hasAllergies ? 'warning' : 'info'} title={hasAllergies ? t('menu.notice.allergyTitle') : undefined}>
                {hasAllergies ? t('menu.notice.allergyBody') : `${t('menu.notice.estimate')} ${t('menu.notice.filter')}`}
              </Notice>
              <div className="menu-list">
                {menu.items.map((item) => (
                  <DishCard
                    key={`${item.slot}-${item.dishId}`}
                    item={item}
                    logged={isLogged(item)}
                    busy={pendingSlots.has(item.slot)}
                    onLog={() => log.mutate([item])}
                    onAnother={() => another(item.slot)}
                  />
                ))}
                {menu.emptySlots.map((slot) => (
                  <p key={`empty-${slot}`} className="small muted">
                    {t('menu.empty.slot', { meal: t(`enums.mealType.${slots[slot]?.mealType ?? 'snack'}`) })}
                  </p>
                ))}
              </div>
              <ShoppingListModal open={shoppingOpen} onClose={() => setShoppingOpen(false)} items={menu.items} />
            </>
          );
        }}
      </QueryState>
    </div>
  );
}
