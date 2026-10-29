import { Card, LinkButton } from '../../components/ui';
import { useI18n } from '../../i18n';
import { useMenu } from './useMenu';

/** Nutrition page entry point: what today's menu adds up to, one tap to open it. */
export function MenuTeaser({ date }: { date: string }) {
  const { t, formatNumber } = useI18n();
  const { menu } = useMenu(date);
  if (!menu || menu.items.length === 0) return null;
  return (
    <Card className="menu-teaser" title={t('menu.teaser.title')} subtitle={t('menu.teaser.body', { count: menu.items.length, kcal: formatNumber(menu.totals.kcal) })}>
      <LinkButton variant="secondary" icon="apple" iconEnd="chevronRight" to={`/nutrition/menu?date=${date}`}>
        {t('menu.teaser.open')}
      </LinkButton>
    </Card>
  );
}
