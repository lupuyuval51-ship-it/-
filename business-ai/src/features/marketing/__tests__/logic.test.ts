import { MarketingContentSchema } from '@domain/marketing';
import {
  groupAssetsByKind,
  marketingAssetToText,
  moveItem,
  newMarketingItemId,
  normalizeMarketingContent,
  parseMarketingAsset,
  parseMarketingContent,
  remainingMarketingGenerations,
  type MarketingAsset,
} from '../logic';

function asset(overrides: Partial<MarketingAsset>): MarketingAsset {
  return {
    id: 'a',
    business_id: 'b',
    kind: 'taglines',
    title: 'Taglines',
    content: { summary: '', items: [] },
    origin: 'user',
    created_at: '2026-11-01T00:00:00Z',
    updated_at: '2026-11-01T00:00:00Z',
    ...overrides,
  };
}

describe('parseMarketingContent', () => {
  it('accepts valid content and salvages malformed content', () => {
    const valid = { summary: 'S', items: [{ id: '1', heading: 'H', body: 'B', label: 'L' }] };
    expect(parseMarketingContent(valid)).toEqual(valid);
    expect(parseMarketingContent({ summary: 3, items: [{ id: '1', heading: 'H', body: 'B' }, { nope: true }] })).toEqual({
      summary: '',
      items: [{ id: '1', heading: 'H', body: 'B' }],
    });
    expect(parseMarketingContent(null)).toEqual({ summary: '', items: [] });
  });
});

describe('parseMarketingAsset', () => {
  const row = {
    id: 'a',
    business_id: 'b',
    kind: 'personas',
    title: 'Personas',
    content: { summary: '', items: [] },
    origin: 'ai',
    created_at: 'x',
    updated_at: 'y',
  };
  it('narrows kind and origin', () => {
    expect(parseMarketingAsset(row)).toMatchObject({ kind: 'personas', origin: 'ai' });
    expect(parseMarketingAsset({ ...row, origin: 'something' })?.origin).toBe('user');
    expect(parseMarketingAsset({ ...row, kind: 'unknown' })).toBeNull();
  });
});

describe('groupAssetsByKind', () => {
  it('orders groups by kind and assets by most recent update', () => {
    const groups = groupAssetsByKind([
      asset({ id: '1', kind: 'taglines', updated_at: '2026-11-01T00:00:00Z' }),
      asset({ id: '2', kind: 'positioning' }),
      asset({ id: '3', kind: 'taglines', updated_at: '2026-11-03T00:00:00Z' }),
    ]);
    expect(groups.map((g) => g.kind)).toEqual(['positioning', 'taglines']);
    expect(groups[1]!.assets.map((a) => a.id)).toEqual(['3', '1']);
  });
});

describe('item editing', () => {
  it('moves items within bounds', () => {
    expect(moveItem(['a', 'b', 'c'], 0, 1)).toEqual(['b', 'a', 'c']);
    expect(moveItem(['a', 'b', 'c'], 2, -1)).toEqual(['a', 'c', 'b']);
    expect(moveItem(['a', 'b'], 0, -1)).toEqual(['a', 'b']);
    expect(moveItem(['a', 'b'], 1, 1)).toEqual(['a', 'b']);
  });

  it('creates short unique ids', () => {
    const ids = new Set(Array.from({ length: 200 }, () => newMarketingItemId()));
    expect(ids.size).toBe(200);
    for (const id of ids) expect(id.length).toBeLessThanOrEqual(40);
  });

  it('normalizes content into something the schema accepts', () => {
    const normalized = normalizeMarketingContent({
      summary: '  Summary  ',
      items: [
        { id: 'x', heading: ' Heading ', body: ' Body ', label: '  ' },
        { id: 'x', heading: 'Second', body: '', label: 'Week 1' },
        { id: 'y', heading: '  ', body: '' },
      ],
    });
    expect(normalized.summary).toBe('Summary');
    expect(normalized.items).toHaveLength(2);
    expect(normalized.items[0]).toEqual({ id: 'x', heading: 'Heading', body: 'Body' });
    expect(normalized.items[1]).toMatchObject({ heading: 'Second', label: 'Week 1' });
    expect(normalized.items[1]!.id).not.toBe('x');
    expect(MarketingContentSchema.safeParse(normalized).success).toBe(true);
  });
});

describe('marketingAssetToText', () => {
  it('renders title, summary and items as plain text', () => {
    const text = marketingAssetToText({
      title: 'Launch campaign',
      content: {
        summary: 'Three phases.',
        items: [
          { id: '1', heading: 'Teaser', body: 'Post a teaser.', label: 'Week 1' },
          { id: '2', heading: '', body: 'Only a body.' },
        ],
      },
    });
    expect(text).toBe('Launch campaign\n\nThree phases.\n\nTeaser (Week 1)\nPost a teaser.\n\nOnly a body.');
  });
});

describe('remainingMarketingGenerations', () => {
  it('subtracts this month’s usage from the tier limit', () => {
    expect(remainingMarketingGenerations('free', { marketing_generation: 3 })).toBe(7);
    expect(remainingMarketingGenerations('pro', {})).toBe(200);
    expect(remainingMarketingGenerations('free', { marketing_generation: 50 })).toBe(0);
    expect(remainingMarketingGenerations('free', undefined)).toBeNull();
  });
});
