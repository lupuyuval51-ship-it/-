import {
  GENERIC_RESEARCH_CATEGORIES,
  LAUNCH_CATEGORIES,
  LAUNCH_TEMPLATES,
  LAUNCH_TEMPLATES_BY_COUNTRY,
  LAUNCH_TEMPLATE_BY_KEY,
  LAUNCH_TEMPLATES_LAST_REVIEWED,
  OFFICIAL_SOURCE_DOMAINS,
  TEMPLATE_COUNTRIES,
  isOfficialSourceUrl,
  templatesForCountry,
} from '../templates';

const HEBREW = /[֐-׿]/;

describe('launch templates', () => {
  it('has unique, well-formed keys prefixed by the country', () => {
    const keys = LAUNCH_TEMPLATES.map((t) => t.key);
    expect(new Set(keys).size).toBe(keys.length);
    for (const t of LAUNCH_TEMPLATES) {
      // Mirrors launch_checklist_items_template_key_format in the migration.
      expect(t.key).toMatch(/^[a-z0-9][a-z0-9_.-]{0,79}$/);
      expect(t.key.startsWith(`${t.country.toLowerCase()}.`)).toBe(true);
    }
  });

  it('cites an https source on an official domain for every item', () => {
    for (const t of LAUNCH_TEMPLATES) {
      expect(t.sourceUrl.startsWith('https://')).toBe(true);
      expect(isOfficialSourceUrl(t.sourceUrl)).toBe(true);
      expect(t.sourceUrl.length).toBeLessThanOrEqual(500); // source_url CHECK
    }
  });

  it('has both languages for title, description and source name', () => {
    for (const t of LAUNCH_TEMPLATES) {
      for (const text of [t.title, t.description, t.sourceName]) {
        expect(text.he.trim().length).toBeGreaterThan(0);
        expect(text.en.trim().length).toBeGreaterThan(0);
        expect(text.he).not.toBe(text.en);
      }
      expect(HEBREW.test(t.title.he)).toBe(true);
      expect(HEBREW.test(t.description.he)).toBe(true);
      expect(HEBREW.test(t.title.en)).toBe(false);
      expect(HEBREW.test(t.description.en)).toBe(false);
    }
  });

  it('fits the database column limits', () => {
    for (const t of LAUNCH_TEMPLATES) {
      for (const locale of ['he', 'en'] as const) {
        expect(t.title[locale].length).toBeLessThanOrEqual(200);
        expect(t.description[locale].length).toBeLessThanOrEqual(4000);
        expect(t.sourceName[locale].length).toBeLessThanOrEqual(200);
      }
    }
  });

  it('uses known categories and a review date for every item', () => {
    for (const t of LAUNCH_TEMPLATES) {
      expect(LAUNCH_CATEGORIES).toContain(t.category);
      expect(t.lastReviewed).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(t.lastReviewed <= LAUNCH_TEMPLATES_LAST_REVIEWED).toBe(true);
    }
  });

  it('never phrases an item as a legal conclusion', () => {
    for (const t of LAUNCH_TEMPLATES) {
      expect(t.title.en).not.toMatch(/\byou are (required|obliged)\b|\bguaranteed\b|\blegal advice\b/i);
    }
  });

  it('groups items by country and looks them up case-insensitively', () => {
    for (const country of TEMPLATE_COUNTRIES) {
      const items = LAUNCH_TEMPLATES_BY_COUNTRY[country];
      expect(items.length).toBeGreaterThan(0);
      expect(items.every((t) => t.country === country)).toBe(true);
      expect(templatesForCountry(country.toLowerCase())).toEqual(items);
    }
    expect(templatesForCountry('FR')).toEqual([]);
    expect(templatesForCountry(null)).toEqual([]);
    expect(LAUNCH_TEMPLATE_BY_KEY.get('il.tax_file')?.country).toBe('IL');
  });

  it('suggests every real category for countries without verified items', () => {
    expect([...GENERIC_RESEARCH_CATEGORIES].sort()).toEqual(LAUNCH_CATEGORIES.filter((c) => c !== 'other').sort());
  });
});

describe('isOfficialSourceUrl', () => {
  it('accepts official hosts and their subdomains over https only', () => {
    expect(isOfficialSourceUrl('https://www.gov.il/he/service/x')).toBe(true);
    expect(isOfficialSourceUrl('https://www.btl.gov.il/a')).toBe(true);
    expect(isOfficialSourceUrl('https://gov.uk')).toBe(true);
    expect(isOfficialSourceUrl('http://www.gov.uk/x')).toBe(false);
    expect(isOfficialSourceUrl('https://notgov.uk/x')).toBe(false);
    expect(isOfficialSourceUrl('https://gov.uk.example.com/x')).toBe(false);
    expect(isOfficialSourceUrl('https://example.com/?u=https://www.irs.gov')).toBe(false);
    expect(isOfficialSourceUrl('not a url')).toBe(false);
    expect(OFFICIAL_SOURCE_DOMAINS.length).toBeGreaterThan(0);
  });
});
