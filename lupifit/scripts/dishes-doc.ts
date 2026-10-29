/**
 * Writes docs/menu-foods.md: every dish of the daily menu by meal (Hebrew), with nutrition and photo,
 * plus the ingredients that appear most across dishes. Run with `npm run docs:dishes`.
 */
import fs from 'node:fs';
import path from 'node:path';
import { DISH_CATEGORIES, DISHES, dishImageUrl, type DishCategory } from '../shared/dishes';
import { ingredientNames } from '../shared/menu';

const TITLES: Record<DishCategory, string> = {
  breakfast: 'ארוחות בוקר',
  lunch: 'ארוחות צהריים',
  dinner: 'ארוחות ערב',
  snack: 'נשנושים',
  pre: 'לפני אימון',
  post: 'אחרי אימון',
  drink: 'משקאות',
};
const TAGS: Record<string, string> = { hp: 'חלבון גבוה', v: 'צמחוני', vg: 'טבעוני', q: 'מהיר', k: 'אהוב על ילדים' };

const out: string[] = [];
out.push('# רשימת המנות של התפריט היומי ב-LUPU-FIT', '');
out.push(`${DISHES.length} מנות מוכנות, לפי סוג ארוחה. הערכים (קק״ל, חלבון, פחמימות, שומן) הם **הערכה** למנה רגילה אחת, לא מדידה במעבדה.`, '');
out.push('מקור הנתונים והתמונות מתועד ב-`docs/dishes-source.md` (מקור התמונות ורישיונן לא תועדו; לבדוק לפני השקה ציבורית).', '');
out.push('_הקובץ נוצר אוטומטית מ-`shared/dishes/data.ts` (`npm run docs:dishes`), אין לערוך אותו ידנית._', '');

out.push('## סיכום', '', '| סוג | מנות | טווח קק״ל |', '|---|---|---|');
for (const c of DISH_CATEGORIES) {
  const list = DISHES.filter((d) => d.category === c);
  out.push(`| ${TITLES[c]} | ${list.length} | ${Math.min(...list.map((d) => d.kcal))}–${Math.max(...list.map((d) => d.kcal))} |`);
}
out.push('');

for (const c of DISH_CATEGORIES) {
  out.push(`## ${TITLES[c]}`, '', '| # | מנה | English | קק״ל | חלבון | פחמימות | שומן | תגיות | מרכיבים | תמונה |', '|---|---|---|---|---|---|---|---|---|---|');
  for (const d of DISHES.filter((x) => x.category === c)) {
    const tags = d.tags.map((t) => TAGS[t] ?? t).join(', ');
    out.push(`| ${d.id} | ${d.name.he} | ${d.name.en} | ${d.kcal} | ${d.proteinG} | ${d.carbsG} | ${d.fatG} | ${tags} | ${d.ingredients.he} | \`${dishImageUrl(d.id).slice(1)}\` |`);
  }
  out.push('');
}

const counts = new Map<string, { he: string; dishes: number }>();
for (const d of DISHES) {
  const he = ingredientNames(d, 'he');
  const en = ingredientNames(d, 'en');
  he.forEach((name, i) => {
    const key = (en[i] ?? name).toLowerCase();
    const e = counts.get(key);
    if (e) e.dishes += 1;
    else counts.set(key, { he: name, dishes: 1 });
  });
}
out.push('## מרכיבים נפוצים (מה כדאי שיהיה במטבח)', '', 'המרכיבים שמופיעים בהכי הרבה מנות. שמות בלבד, בלי כמויות.', '', '| מרכיב | מספר מנות |', '|---|---|');
for (const [, e] of Array.from(counts).sort((a, b) => b[1].dishes - a[1].dishes).slice(0, 60)) out.push(`| ${e.he} | ${e.dishes} |`);
out.push('');

fs.writeFileSync(path.resolve(import.meta.dirname, '..', 'docs', 'menu-foods.md'), out.join('\n'));
console.log(`docs/menu-foods.md: ${DISHES.length} dishes, ${counts.size} distinct ingredients`);
