import {
  CUSTOM_SORT_BASE,
  buildSeedRows,
  computeLaunchProgress,
  displayLaunchItem,
  groupLaunchItems,
  missingTemplates,
  nextCustomSortOrder,
  nextLaunchStatus,
  parseLaunchItem,
  type LaunchItem,
} from '../logic';
import { LAUNCH_TEMPLATES_BY_COUNTRY, LAUNCH_TEMPLATE_BY_KEY } from '../templates';

const BUSINESS = '00000000-0000-4000-8000-000000000001';

function item(overrides: Partial<LaunchItem> = {}): LaunchItem {
  return {
    id: overrides.id ?? Math.random().toString(36).slice(2),
    business_id: BUSINESS,
    template_key: null,
    category: 'other',
    title: 'Custom',
    description: '',
    source_name: null,
    source_url: null,
    status: 'todo',
    notes: '',
    sort_order: 0,
    created_at: '2026-11-05T10:00:00Z',
    updated_at: '2026-11-05T10:00:00Z',
    ...overrides,
  };
}

describe('buildSeedRows', () => {
  it('creates one row per template in the requested language', () => {
    const rows = buildSeedRows(BUSINESS, 'il', 'he');
    const templates = LAUNCH_TEMPLATES_BY_COUNTRY.IL;
    expect(rows).toHaveLength(templates.length);
    rows.forEach((row, index) => {
      const t = templates[index]!;
      expect(row).toMatchObject({
        business_id: BUSINESS,
        template_key: t.key,
        category: t.category,
        title: t.title.he,
        description: t.description.he,
        source_name: t.sourceName.he,
        source_url: t.sourceUrl,
        status: 'todo',
        sort_order: index,
      });
    });
    expect(buildSeedRows(BUSINESS, 'US', 'en')[0]?.title).toBe(LAUNCH_TEMPLATES_BY_COUNTRY.US[0]?.title.en);
  });

  it('returns nothing for countries without verified templates', () => {
    expect(buildSeedRows(BUSINESS, 'FR', 'en')).toEqual([]);
  });
});

describe('missingTemplates', () => {
  it('lists only templates that are not in the checklist yet', () => {
    const all = LAUNCH_TEMPLATES_BY_COUNTRY.GB;
    const present = [item({ template_key: all[0]!.key }), item({ template_key: all[1]!.key }), item()];
    expect(missingTemplates(present, 'GB').map((t) => t.key)).toEqual(all.slice(2).map((t) => t.key));
    expect(missingTemplates([], null)).toEqual([]);
  });
});

describe('displayLaunchItem', () => {
  const template = LAUNCH_TEMPLATE_BY_KEY.get('us.ein')!;

  it('re-localizes unedited template text', () => {
    const stored = item({
      template_key: template.key,
      title: template.title.he,
      description: template.description.he,
      source_name: template.sourceName.he,
      source_url: template.sourceUrl,
    });
    const display = displayLaunchItem(stored, 'en');
    expect(display.title).toBe(template.title.en);
    expect(display.description).toBe(template.description.en);
    expect(display.sourceName).toBe(template.sourceName.en);
    expect(display.template).toBe(template);
  });

  it('keeps what the user wrote', () => {
    const stored = item({ template_key: template.key, title: 'My own wording', description: template.description.en });
    const display = displayLaunchItem(stored, 'he');
    expect(display.title).toBe('My own wording');
    expect(display.description).toBe(template.description.he);
  });

  it('shows custom items as stored', () => {
    const stored = item({ title: 'Call the accountant', source_name: 'Accountant', source_url: 'https://example.com' });
    expect(displayLaunchItem(stored, 'he')).toMatchObject({ title: 'Call the accountant', sourceName: 'Accountant', template: null });
  });
});

describe('grouping and progress', () => {
  it('groups by category in canonical order and sorts within a group', () => {
    const items = [
      item({ id: 'c', category: 'tax', sort_order: 2 }),
      item({ id: 'a', category: 'registration', sort_order: 0 }),
      item({ id: 'b', category: 'tax', sort_order: 1 }),
      item({ id: 'd', category: 'other', sort_order: 0 }),
    ];
    const groups = groupLaunchItems(items);
    expect(groups.map((g) => g.category)).toEqual(['registration', 'tax', 'other']);
    expect(groups[1]!.items.map((i) => i.id)).toEqual(['b', 'c']);
  });

  it('counts done items out of the applicable ones', () => {
    const progress = computeLaunchProgress([
      item({ status: 'done' }),
      item({ status: 'done' }),
      item({ status: 'todo' }),
      item({ status: 'not_applicable' }),
    ]);
    expect(progress).toEqual({ done: 2, applicable: 3, notApplicable: 1, total: 4, ratio: 2 / 3 });
    expect(computeLaunchProgress([]).ratio).toBe(0);
    expect(computeLaunchProgress([item({ status: 'not_applicable' })]).ratio).toBe(0);
  });

  it('cycles statuses and places custom items after template items', () => {
    expect(nextLaunchStatus('todo')).toBe('done');
    expect(nextLaunchStatus('done')).toBe('not_applicable');
    expect(nextLaunchStatus('not_applicable')).toBe('todo');
    expect(nextCustomSortOrder([item({ category: 'tax', sort_order: 3 })], 'tax')).toBe(CUSTOM_SORT_BASE);
    expect(nextCustomSortOrder([item({ category: 'tax', sort_order: CUSTOM_SORT_BASE + 4 })], 'tax')).toBe(CUSTOM_SORT_BASE + 5);
  });
});

describe('parseLaunchItem', () => {
  it('narrows unknown values to safe defaults', () => {
    const parsed = parseLaunchItem({ ...item(), category: 'weird', status: 'odd' });
    expect(parsed.category).toBe('other');
    expect(parsed.status).toBe('todo');
  });
});
