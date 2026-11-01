#!/usr/bin/env tsx
/** Writes docs/dishes-list.md from whatever dish slices currently parse (safe while content is still being authored). */
import { readdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { buildDish, foodMap } from '../shared/src/content/build.ts';
import { FOODS_ALL } from '../shared/src/content/sources.ts';
import type { DishRaw } from '../shared/src/content/types.ts';

const root = resolve(import.meta.dirname, '..');
const dir = join(root, 'shared/src/content/data/dishes');
const foods = foodMap(FOODS_ALL);
const PLAN: Record<string, { label: string; he: string; target: number }> = {
  breakfast_a: { label: 'Breakfast A', he: 'ארוחת בוקר א׳ (ביצים וסלטים)', target: 35 }, breakfast_b: { label: 'Breakfast B', he: 'ארוחת בוקר ב׳ (דגנים, שייקים, מתוק)', target: 35 },
  lunch_a: { label: 'Lunch A', he: 'צהריים א׳ (עוף, הודו, בקר)', target: 40 }, lunch_b: { label: 'Lunch B', he: 'צהריים ב׳ (דגים, צמחוני, טבעוני)', target: 40 },
  dinner_a: { label: 'Dinner A', he: 'ערב א׳ (בשר ועוף)', target: 40 }, dinner_b: { label: 'Dinner B', he: 'ערב ב׳ (דגים, צמחוני, קל)', target: 40 },
  snack_a: { label: 'Snack A', he: 'נשנוש א׳ (מלוח וחלבוני)', target: 35 }, snack_b: { label: 'Snack B', he: 'נשנוש ב׳ (מתוק, פירות, אגוזים)', target: 35 },
  ext_breakfast: { label: 'Breakfast +', he: 'ארוחות בוקר נוספות', target: 40 }, ext_lunch: { label: 'Lunch +', he: 'ארוחות צהריים נוספות', target: 50 },
  ext_dinner: { label: 'Dinner +', he: 'ארוחות ערב נוספות', target: 60 }, ext_snack: { label: 'Snack +', he: 'נשנושים נוספים', target: 50 },
};
const onlyExtra = process.argv.includes('--extra');
let md = `# ${onlyExtra ? 'המנות החדשות (200 נוספות)' : 'רשימת המנות'} / Dishes list\n\nערכי קלוריות ומקרו **מחושבים אוטומטית** מהמזונות והכמויות (לא מוקלדים ידנית). מנה אחת = מנה אחת למבוגר.\n\n`;
let have = 0; let want = 0;
for (const [key, meta] of Object.entries(PLAN)) {
  if (onlyExtra && !key.startsWith('ext_')) continue;
  want += meta.target;
  let raws: DishRaw[] = [];
  try { const m = (await import(pathToFileURL(join(dir, `${key}.ts`)).href)) as Record<string, DishRaw[]>; raws = Object.values(m).find(Array.isArray) ?? []; } catch { /* still being written */ }
  have += raws.length;
  md += `## ${meta.he} — ${raws.length}/${meta.target}\n\n`;
  if (raws.length === 0) { md += '_עדיין בכתיבה._\n\n'; continue; }
  md += '| # | מנה | Dish | קק״ל | חלבון | פחמ׳ | שומן | תגיות |\n|---|---|---|---|---|---|---|---|\n';
  raws.forEach((r, i) => {
    try {
      const d = buildDish(r, foods);
      const tags = [d.diets.includes('vegan') ? 'טבעוני' : d.diets.includes('vegetarian') ? 'צמחוני' : d.diets.includes('pescatarian') ? 'ללא בשר' : '', d.allergens.length ? `אלרגנים: ${d.allergens.join(', ')}` : 'ללא אלרגנים'].filter(Boolean).join(' · ');
      md += `| ${i + 1} | ${r.nameHe} | ${r.nameEn} | ${d.kcal} | ${d.proteinG} | ${d.carbsG} | ${d.fatG} | ${tags} |\n`;
    } catch (e) { md += `| ${i + 1} | ${r.nameHe} | ${r.nameEn} | ? | ? | ? | ? | שגיאה: ${(e as Error).message} |\n`; }
  });
  md += '\n';
}
md = md.replace('\n\nערכי', `\n\n**נכתבו ${have} מתוך ${want} מנות.**\n\nערכי`);
writeFileSync(join(root, onlyExtra ? 'docs/dishes-extra-200.md' : 'docs/dishes-list.md'), md);
console.log(`dishes written: ${have}/${want}`);
