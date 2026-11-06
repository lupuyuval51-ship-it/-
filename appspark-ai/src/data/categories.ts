import type { CategorySlug, Localized } from './types';

export interface Category {
  slug: CategorySlug;
  label: Localized;
  description: Localized;
  /** Short monogram used in chips and tiles. */
  glyph: string;
  hue: number;
}

export const categories: Category[] = [
  {
    slug: 'ai',
    label: { he: 'בינה מלאכותית', en: 'Artificial Intelligence' },
    description: { he: 'מוצרים שבנויים סביב מודלים, סוכנים ואוטומציה חכמה', en: 'Products built around models, agents and smart automation' },
    glyph: 'AI',
    hue: 84,
  },
  {
    slug: 'productivity',
    label: { he: 'פרודוקטיביות', en: 'Productivity' },
    description: { he: 'כלים שעוזרים לאנשים לסיים דברים', en: 'Tools that help people get things done' },
    glyph: 'Pr',
    hue: 204,
  },
  {
    slug: 'business',
    label: { he: 'עסקים וסטארטאפים', en: 'Business & Startups' },
    description: { he: 'מוצרים לבעלי עסקים, יזמים וצוותים', en: 'Products for business owners, founders and teams' },
    glyph: 'Bz',
    hue: 28,
  },
  {
    slug: 'health',
    label: { he: 'בריאות וכושר', en: 'Health & Fitness' },
    description: { he: 'הרגלים, אימונים, תזונה ורווחה נפשית', en: 'Habits, training, nutrition and wellbeing' },
    glyph: 'He',
    hue: 150,
  },
  {
    slug: 'education',
    label: { he: 'חינוך ולמידה', en: 'Education' },
    description: { he: 'למידה, תרגול, הוראה והכנה למבחנים', en: 'Learning, practice, teaching and exam prep' },
    glyph: 'Ed',
    hue: 262,
  },
  {
    slug: 'finance',
    label: { he: 'פיננסים', en: 'Finance' },
    description: { he: 'כסף אישי, תקציב, חשבוניות והשקעות', en: 'Personal money, budgeting, invoicing and investing' },
    glyph: 'Fi',
    hue: 120,
  },
  {
    slug: 'social',
    label: { he: 'רשתות חברתיות', en: 'Social' },
    description: { he: 'קהילות, חיבורים בין אנשים ושיתוף', en: 'Communities, connecting people and sharing' },
    glyph: 'So',
    hue: 330,
  },
  {
    slug: 'entertainment',
    label: { he: 'בידור', en: 'Entertainment' },
    description: { he: 'תוכן, מדיה, אירועים ותרבות', en: 'Content, media, events and culture' },
    glyph: 'En',
    hue: 12,
  },
  {
    slug: 'games',
    label: { he: 'משחקי מובייל', en: 'Mobile Games' },
    description: { he: 'משחקים קטנים עם לולאה ממכרת ורעיון ברור', en: 'Small games with a tight loop and a clear hook' },
    glyph: 'Gm',
    hue: 290,
  },
  {
    slug: 'devtools',
    label: { he: 'כלים למפתחים', en: 'Developer Tools' },
    description: { he: 'מוצרים שמפתחים ישלמו עליהם בשמחה', en: 'Products developers happily pay for' },
    glyph: 'Dv',
    hue: 190,
  },
  {
    slug: 'lifestyle',
    label: { he: 'לייפסטייל', en: 'Lifestyle' },
    description: { he: 'בית, משפחה, טיולים ושגרה', en: 'Home, family, travel and routines' },
    glyph: 'Li',
    hue: 40,
  },
  {
    slug: 'creativity',
    label: { he: 'יצירתיות', en: 'Creativity' },
    description: { he: 'כתיבה, מוזיקה, עיצוב ואמנות', en: 'Writing, music, design and art' },
    glyph: 'Cr',
    hue: 350,
  },
  {
    slug: 'ecommerce',
    label: { he: 'מסחר אלקטרוני', en: 'E-commerce' },
    description: { he: 'מכירה, קנייה, מלאי ושווקים', en: 'Selling, buying, inventory and marketplaces' },
    glyph: 'Ec',
    hue: 60,
  },
];

export const categoryBySlug: Record<CategorySlug, Category> = categories.reduce(
  (acc, category) => {
    acc[category.slug] = category;
    return acc;
  },
  {} as Record<CategorySlug, Category>,
);

export function getCategory(slug: CategorySlug): Category {
  return categoryBySlug[slug];
}
