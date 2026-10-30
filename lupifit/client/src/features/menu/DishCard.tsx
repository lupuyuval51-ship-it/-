import { dishById, dishImageUrl, type DishTag } from '@shared/dishes';
import type { MenuItem } from '@shared/menu';
import { Badge, Button } from '../../components/ui';
import { useI18n } from '../../i18n';
import { MacroLine } from '../nutrition/Macros';

const TAG_ORDER: DishTag[] = ['hp', 'vg', 'v', 'q', 'k'];

/** One dish of the menu: photo, name, nutrition for the portion shown, and the actions that matter on a phone. */
export function DishCard({
  item,
  logged,
  busy,
  onLog,
  onAnother,
}: {
  item: MenuItem;
  /** True when this dish was already logged from the menu. */
  logged: boolean;
  busy: boolean;
  onLog(): void;
  onAnother(): void;
}) {
  const { t, lt, formatNumber } = useI18n();
  const dish = dishById(item.dishId);
  if (!dish) return null;
  const name = lt(dish.name);
  const meal = t(`enums.mealType.${item.mealType}`);
  // "Vegan" already implies vegetarian: show the more specific tag only.
  const tags = TAG_ORDER.filter((tag) => dish.tags.includes(tag) && !(tag === 'v' && dish.tags.includes('vg')));
  const ingredients = lt(dish.ingredients);

  return (
    <article className="menu-dish" aria-label={name}>
      <img className="menu-dish-photo" src={dishImageUrl(dish.id)} alt="" width={96} height={96} loading="lazy" decoding="async" />
      <div className="menu-dish-body">
        <p className="menu-dish-meal small muted">{meal}</p>
        <h3 className="menu-dish-name">{name}</h3>
        <MacroLine
          m={{ kcal: item.kcal, proteinG: item.proteinG, carbsG: item.carbsG, fatG: item.fatG, fiberG: 0 }}
          className="menu-dish-macros"
        />
        {item.scale !== 1 && <p className="small muted menu-dish-portion">{t('menu.dish.portion', { scale: formatNumber(item.scale, { maximumFractionDigits: 2 }) })}</p>}
        {tags.length > 0 && (
          <div className="food-badges">
            {tags.map((tag) => (
              <Badge key={tag} tone={tag === 'hp' ? 'primary' : 'neutral'}>
                {t(`menu.tags.${tag}`)}
              </Badge>
            ))}
          </div>
        )}
      </div>
      <div className="menu-dish-actions">
        <Button
          size="sm"
          variant="secondary"
          icon={logged ? 'check' : 'plus'}
          loading={busy}
          onClick={onLog}
          aria-label={t(logged ? 'menu.dish.logAgainLabel' : 'menu.dish.logLabel', { name, meal })}
        >
          {logged ? t('menu.dish.logAgain') : t('menu.dish.log')}
        </Button>
        <Button size="sm" variant="ghost" icon="swap" onClick={onAnother} aria-label={t('menu.dish.anotherLabel', { meal })}>
          {t('menu.dish.another')}
        </Button>
      </div>
      {logged && (
        <p className="small menu-dish-logged" role="status">
          {t('menu.dish.logged')}
        </p>
      )}
      <details className="menu-dish-details">
        <summary>{t('menu.dish.ingredients')}</summary>
        <p className="small">{ingredients}</p>
        <p className="small muted">{t('menu.dish.listed', { kcal: dish.kcal, protein: dish.proteinG, carbs: dish.carbsG, fat: dish.fatG })}</p>
      </details>
    </article>
  );
}
