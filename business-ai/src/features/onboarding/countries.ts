/**
 * Curated country list for onboarding (ISO 3166-1 alpha-2) with Hebrew and English names and
 * common alternative spellings used for search. Pure data — no React.
 *
 * `currency` is the local ISO-4217 currency, used only as a suggestion when the domain map
 * (`DEFAULT_CURRENCY_BY_COUNTRY` in @domain/onboarding) has no entry. The user can always change it.
 */
export interface Country {
  code: string;
  he: string;
  en: string;
  currency: string;
  /** Extra search terms in either language (abbreviations, endonyms, old names). */
  aliases?: readonly string[];
}

export const COUNTRIES: readonly Country[] = [
  { code: 'IL', he: 'ישראל', en: 'Israel', currency: 'ILS' },
  { code: 'US', he: 'ארצות הברית', en: 'United States', currency: 'USD', aliases: ['USA', 'America', 'ארה"ב', 'אמריקה'] },
  { code: 'GB', he: 'בריטניה', en: 'United Kingdom', currency: 'GBP', aliases: ['UK', 'England', 'Britain', 'Great Britain', 'Scotland', 'Wales', 'אנגליה', 'הממלכה המאוחדת', 'סקוטלנד'] },
  { code: 'CA', he: 'קנדה', en: 'Canada', currency: 'CAD' },
  { code: 'AU', he: 'אוסטרליה', en: 'Australia', currency: 'AUD' },
  { code: 'NZ', he: 'ניו זילנד', en: 'New Zealand', currency: 'NZD' },
  { code: 'IE', he: 'אירלנד', en: 'Ireland', currency: 'EUR' },
  { code: 'DE', he: 'גרמניה', en: 'Germany', currency: 'EUR', aliases: ['Deutschland'] },
  { code: 'FR', he: 'צרפת', en: 'France', currency: 'EUR' },
  { code: 'ES', he: 'ספרד', en: 'Spain', currency: 'EUR', aliases: ['España'] },
  { code: 'IT', he: 'איטליה', en: 'Italy', currency: 'EUR', aliases: ['Italia'] },
  { code: 'NL', he: 'הולנד', en: 'Netherlands', currency: 'EUR', aliases: ['Holland', 'The Netherlands', 'ארצות השפלה'] },
  { code: 'BE', he: 'בלגיה', en: 'Belgium', currency: 'EUR' },
  { code: 'LU', he: 'לוקסמבורג', en: 'Luxembourg', currency: 'EUR' },
  { code: 'PT', he: 'פורטוגל', en: 'Portugal', currency: 'EUR' },
  { code: 'AT', he: 'אוסטריה', en: 'Austria', currency: 'EUR', aliases: ['Österreich'] },
  { code: 'CH', he: 'שווייץ', en: 'Switzerland', currency: 'CHF', aliases: ['שוויץ', 'Schweiz', 'Suisse'] },
  { code: 'DK', he: 'דנמרק', en: 'Denmark', currency: 'DKK' },
  { code: 'SE', he: 'שוודיה', en: 'Sweden', currency: 'SEK', aliases: ['שבדיה'] },
  { code: 'NO', he: 'נורווגיה', en: 'Norway', currency: 'NOK', aliases: ['נורבגיה'] },
  { code: 'FI', he: 'פינלנד', en: 'Finland', currency: 'EUR' },
  { code: 'IS', he: 'איסלנד', en: 'Iceland', currency: 'ISK' },
  { code: 'PL', he: 'פולין', en: 'Poland', currency: 'PLN', aliases: ['Polska'] },
  { code: 'CZ', he: "צ'כיה", en: 'Czechia', currency: 'CZK', aliases: ['Czech Republic', "הרפובליקה הצ'כית"] },
  { code: 'SK', he: 'סלובקיה', en: 'Slovakia', currency: 'EUR' },
  { code: 'HU', he: 'הונגריה', en: 'Hungary', currency: 'HUF' },
  { code: 'RO', he: 'רומניה', en: 'Romania', currency: 'RON' },
  { code: 'BG', he: 'בולגריה', en: 'Bulgaria', currency: 'EUR' },
  { code: 'GR', he: 'יוון', en: 'Greece', currency: 'EUR' },
  { code: 'CY', he: 'קפריסין', en: 'Cyprus', currency: 'EUR' },
  { code: 'MT', he: 'מלטה', en: 'Malta', currency: 'EUR' },
  { code: 'HR', he: 'קרואטיה', en: 'Croatia', currency: 'EUR', aliases: ['Hrvatska'] },
  { code: 'SI', he: 'סלובניה', en: 'Slovenia', currency: 'EUR' },
  { code: 'RS', he: 'סרביה', en: 'Serbia', currency: 'RSD' },
  { code: 'EE', he: 'אסטוניה', en: 'Estonia', currency: 'EUR' },
  { code: 'LV', he: 'לטביה', en: 'Latvia', currency: 'EUR' },
  { code: 'LT', he: 'ליטא', en: 'Lithuania', currency: 'EUR' },
  { code: 'UA', he: 'אוקראינה', en: 'Ukraine', currency: 'UAH' },
  { code: 'MD', he: 'מולדובה', en: 'Moldova', currency: 'MDL' },
  { code: 'GE', he: 'גאורגיה', en: 'Georgia', currency: 'GEL', aliases: ['גרוזיה'] },
  { code: 'RU', he: 'רוסיה', en: 'Russia', currency: 'RUB' },
  { code: 'TR', he: 'טורקיה', en: 'Türkiye', currency: 'TRY', aliases: ['Turkey'] },
  { code: 'AZ', he: "אזרבייג'ן", en: 'Azerbaijan', currency: 'AZN' },
  { code: 'KZ', he: 'קזחסטן', en: 'Kazakhstan', currency: 'KZT' },
  { code: 'AE', he: 'איחוד האמירויות', en: 'United Arab Emirates', currency: 'AED', aliases: ['UAE', 'Emirates', 'Dubai', 'Abu Dhabi', 'אמירויות', 'דובאי', 'אבו דאבי'] },
  { code: 'BH', he: 'בחריין', en: 'Bahrain', currency: 'BHD' },
  { code: 'SA', he: 'ערב הסעודית', en: 'Saudi Arabia', currency: 'SAR', aliases: ['סעודיה'] },
  { code: 'QA', he: 'קטאר', en: 'Qatar', currency: 'QAR' },
  { code: 'JO', he: 'ירדן', en: 'Jordan', currency: 'JOD' },
  { code: 'EG', he: 'מצרים', en: 'Egypt', currency: 'EGP' },
  { code: 'MA', he: 'מרוקו', en: 'Morocco', currency: 'MAD' },
  { code: 'IN', he: 'הודו', en: 'India', currency: 'INR' },
  { code: 'PK', he: 'פקיסטן', en: 'Pakistan', currency: 'PKR' },
  { code: 'SG', he: 'סינגפור', en: 'Singapore', currency: 'SGD' },
  { code: 'MY', he: 'מלזיה', en: 'Malaysia', currency: 'MYR' },
  { code: 'ID', he: 'אינדונזיה', en: 'Indonesia', currency: 'IDR' },
  { code: 'TH', he: 'תאילנד', en: 'Thailand', currency: 'THB' },
  { code: 'VN', he: 'וייטנאם', en: 'Vietnam', currency: 'VND', aliases: ['Việt Nam', 'Viet Nam', 'ויאטנם'] },
  { code: 'PH', he: 'הפיליפינים', en: 'Philippines', currency: 'PHP' },
  { code: 'JP', he: 'יפן', en: 'Japan', currency: 'JPY' },
  { code: 'KR', he: 'דרום קוריאה', en: 'South Korea', currency: 'KRW', aliases: ['Korea', 'קוריאה'] },
  { code: 'CN', he: 'סין', en: 'China', currency: 'CNY' },
  { code: 'HK', he: 'הונג קונג', en: 'Hong Kong', currency: 'HKD' },
  { code: 'TW', he: 'טייוואן', en: 'Taiwan', currency: 'TWD' },
  { code: 'BR', he: 'ברזיל', en: 'Brazil', currency: 'BRL', aliases: ['Brasil'] },
  { code: 'MX', he: 'מקסיקו', en: 'Mexico', currency: 'MXN', aliases: ['México'] },
  { code: 'AR', he: 'ארגנטינה', en: 'Argentina', currency: 'ARS' },
  { code: 'CL', he: "צ'ילה", en: 'Chile', currency: 'CLP' },
  { code: 'CO', he: 'קולומביה', en: 'Colombia', currency: 'COP' },
  { code: 'PE', he: 'פרו', en: 'Peru', currency: 'PEN', aliases: ['Perú'] },
  { code: 'UY', he: 'אורוגוואי', en: 'Uruguay', currency: 'UYU' },
  { code: 'CR', he: 'קוסטה ריקה', en: 'Costa Rica', currency: 'CRC' },
  { code: 'PA', he: 'פנמה', en: 'Panama', currency: 'USD', aliases: ['Panamá'] },
  { code: 'ZA', he: 'דרום אפריקה', en: 'South Africa', currency: 'ZAR' },
  { code: 'NG', he: 'ניגריה', en: 'Nigeria', currency: 'NGN' },
  { code: 'KE', he: 'קניה', en: 'Kenya', currency: 'KES', aliases: ['קנייה'] },
  { code: 'GH', he: 'גאנה', en: 'Ghana', currency: 'GHS' },
  { code: 'ET', he: 'אתיופיה', en: 'Ethiopia', currency: 'ETB' },
];

export const COUNTRY_BY_CODE: ReadonlyMap<string, Country> = new Map(COUNTRIES.map((c) => [c.code, c]));
