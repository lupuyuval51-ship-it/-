import { PLAN_SECTION_KEYS, type PlanSectionContent } from '@domain/plan';
import {
  STALE_ERROR_CODE,
  STALE_GENERATION_MS,
  changedSectionKeys,
  countBasis,
  diffSectionContent,
  effectiveVersionStatus,
  emptyDraftBlock,
  firstLine,
  formatElapsed,
  fromDraft,
  isDraftDirty,
  isPlanSectionKey,
  isStaleGeneration,
  moveItem,
  newBlockId,
  normalizeUrl,
  orderedSectionKeys,
  parseSectionContent,
  provenanceMix,
  relativeTime,
  remainingUses,
  sectionNeighbors,
  sectionPreview,
  sumBasisCounts,
  toDraft,
  validateDraft,
} from '../logic';

const content = (overrides: Partial<PlanSectionContent> = {}): PlanSectionContent => ({
  summary: 'A neighbourhood bakery focused on sourdough.',
  blocks: [
    { id: 'b1', text: 'Customers are local families.', basis: 'user_provided' },
    { id: 'b2', text: 'About 120 loaves a day.', basis: 'ai_estimate' },
    { id: 'b3', text: 'Rent stays flat for two years.', basis: 'assumption' },
    { id: 'b4', text: 'Average spend is 38 ILS.', basis: 'ai_estimate' },
    { id: 'b5', text: 'Zoning allows a storefront.', basis: 'verified', source: { title: 'City zoning map', url: 'https://example.gov/zoning' } },
  ],
  ...overrides,
});

describe('section keys & navigation', () => {
  it('recognises plan section keys', () => {
    expect(isPlanSectionKey('executive_summary')).toBe(true);
    expect(isPlanSectionKey('roadmap_30_60_90')).toBe(true);
    expect(isPlanSectionKey('history')).toBe(false);
    expect(isPlanSectionKey(undefined)).toBe(false);
  });

  it('orders present sections in display order', () => {
    const c = content();
    expect(orderedSectionKeys({ startup_costs: c, executive_summary: c, revenue_model: c })).toEqual([
      'executive_summary',
      'revenue_model',
      'startup_costs',
    ]);
    expect(orderedSectionKeys({})).toEqual([]);
  });

  it('finds prev/next among all keys', () => {
    expect(sectionNeighbors('executive_summary')).toEqual({ prev: null, next: 'business_concept', position: 1, total: 15 });
    expect(sectionNeighbors('roadmap_30_60_90')).toEqual({ prev: 'risks_assumptions', next: null, position: 15, total: 15 });
    expect(sectionNeighbors('pricing_strategy')).toMatchObject({ prev: 'revenue_model', next: 'startup_costs', position: 9 });
  });

  it('skips sections that are not available, regardless of the order given', () => {
    const available = ['startup_costs', 'executive_summary', 'market_validation'] as const;
    expect(sectionNeighbors('market_validation', available)).toEqual({
      prev: 'executive_summary',
      next: 'startup_costs',
      position: 2,
      total: 3,
    });
    expect(sectionNeighbors('revenue_model', available)).toEqual({ prev: null, next: null, position: 0, total: 3 });
  });
});

describe('parseSectionContent', () => {
  it('accepts valid content', () => {
    expect(parseSectionContent(content())).toEqual(content());
  });

  it('reads content that the strict schema rejects but is structurally fine', () => {
    const parsed = parseSectionContent({
      summary: 'x',
      blocks: [
        { id: 'b1', text: ' kept ', basis: 'assumption' },
        { id: 'b2', text: '   ', basis: 'assumption' },
        { text: 'no id', basis: 'weird' },
        { id: 'b4', text: 'verified without source', basis: 'verified' },
      ],
    });
    expect(parsed).toEqual({
      summary: 'x',
      blocks: [
        { id: 'b1', text: 'kept', basis: 'assumption', source: null },
        { id: 'b3', text: 'no id', basis: 'assumption', source: null },
        { id: 'b4', text: 'verified without source', basis: 'assumption', source: null },
      ],
    });
  });

  it('rejects non-content', () => {
    expect(parseSectionContent(null)).toBeNull();
    expect(parseSectionContent('text')).toBeNull();
    expect(parseSectionContent({ summary: 'x', blocks: [] })).toBeNull();
  });
});

describe('provenance', () => {
  it('counts blocks per basis', () => {
    expect(countBasis(content())).toEqual({ user_provided: 1, assumption: 1, ai_estimate: 2, verified: 1 });
    expect(countBasis(null)).toEqual({ user_provided: 0, assumption: 0, ai_estimate: 0, verified: 0 });
  });

  it('sums counts', () => {
    const c = countBasis(content());
    expect(sumBasisCounts([c, c])).toEqual({ user_provided: 2, assumption: 2, ai_estimate: 4, verified: 2 });
  });

  it('lists non-zero bases, estimates and assumptions first', () => {
    expect(provenanceMix({ user_provided: 1, assumption: 2, ai_estimate: 3, verified: 0 })).toEqual([
      { basis: 'ai_estimate', count: 3 },
      { basis: 'assumption', count: 2 },
      { basis: 'user_provided', count: 1 },
    ]);
    expect(provenanceMix({ user_provided: 0, assumption: 0, ai_estimate: 0, verified: 0 })).toEqual([]);
  });
});

describe('text helpers', () => {
  it('takes the first non-empty line', () => {
    expect(firstLine('\n  First line.\nSecond line')).toBe('First line.');
  });

  it('cuts long lines on a word boundary', () => {
    const text = 'one two three four five six seven eight nine ten';
    expect(firstLine(text, 20)).toBe('one two three four…');
    expect(firstLine('short', 20)).toBe('short');
  });

  it('previews the summary, or the first block when the summary is empty', () => {
    expect(sectionPreview(content())).toBe('A neighbourhood bakery focused on sourdough.');
    expect(sectionPreview(content({ summary: '  ' }))).toBe('Customers are local families.');
    expect(sectionPreview(undefined)).toBe('');
  });
});

describe('diffSectionContent', () => {
  it('reports no change for equal content (edge whitespace ignored)', () => {
    const a = content();
    const b = content({ summary: `  ${a.summary} ` });
    expect(diffSectionContent(a, b).changed).toBe(false);
  });

  it('detects summary, added, removed, edited and reordered blocks', () => {
    const a = content();
    const [b1, b2, b3, b4] = a.blocks;
    const b = {
      summary: 'New summary',
      blocks: [b2!, b1!, { ...b3!, basis: 'verified' as const, source: { title: 'Lease', url: 'https://example.com/lease' } }, b4!, { id: 'u1', text: 'New', basis: 'user_provided' as const }],
    };
    expect(diffSectionContent(a, b)).toEqual({
      changed: true,
      summaryChanged: true,
      added: ['u1'],
      removed: ['b5'],
      edited: ['b3'],
      reordered: true,
    });
  });

  it('treats a missing section as different from a present one', () => {
    expect(diffSectionContent(undefined, content()).changed).toBe(true);
    expect(diffSectionContent(undefined, undefined).changed).toBe(false);
  });

  it('lists changed section keys in display order', () => {
    const a = content();
    const b = content({ summary: 'changed' });
    expect(
      changedSectionKeys({ startup_costs: a, executive_summary: a, revenue_model: a }, { startup_costs: b, executive_summary: a, market_validation: a }),
    ).toEqual(['market_validation', 'revenue_model', 'startup_costs']);
  });
});

describe('generation state', () => {
  const now = Date.parse('2026-11-05T12:00:00Z');
  const at = (msAgo: number) => new Date(now - msAgo).toISOString();

  it('flags generating versions older than 10 minutes as stale', () => {
    expect(isStaleGeneration({ status: 'generating', created_at: at(STALE_GENERATION_MS + 1000) }, now)).toBe(true);
    expect(isStaleGeneration({ status: 'generating', created_at: at(60_000) }, now)).toBe(false);
    expect(isStaleGeneration({ status: 'ready', created_at: at(STALE_GENERATION_MS * 3) }, now)).toBe(false);
    expect(isStaleGeneration(null, now)).toBe(false);
    expect(isStaleGeneration({ status: 'generating', created_at: 'garbage' }, now)).toBe(false);
  });

  it('maps effective status', () => {
    expect(effectiveVersionStatus({ status: 'generating', created_at: at(1000) }, now)).toEqual({ status: 'generating', errorCode: null });
    expect(effectiveVersionStatus({ status: 'generating', created_at: at(STALE_GENERATION_MS * 2) }, now)).toEqual({
      status: 'failed',
      errorCode: STALE_ERROR_CODE,
    });
    expect(effectiveVersionStatus({ status: 'failed', created_at: at(1000), error_code: 'quota_exceeded' }, now)).toEqual({
      status: 'failed',
      errorCode: 'quota_exceeded',
    });
    expect(effectiveVersionStatus({ status: 'failed', created_at: at(1000), error_code: null }, now)).toEqual({
      status: 'failed',
      errorCode: 'internal',
    });
    expect(effectiveVersionStatus({ status: 'ready', created_at: at(1000), error_code: null }, now)).toEqual({ status: 'ready', errorCode: null });
  });

  it('formats elapsed time', () => {
    expect(formatElapsed(0)).toBe('0:00');
    expect(formatElapsed(84_000)).toBe('1:24');
    expect(formatElapsed(3_725_000)).toBe('1:02:05');
    expect(formatElapsed(-5)).toBe('0:00');
  });

  it('computes relative time buckets', () => {
    expect(relativeTime(at(10_000), now)).toEqual({ key: 'justNow', count: 0 });
    expect(relativeTime(at(5 * 60_000), now)).toEqual({ key: 'minutes', count: 5 });
    expect(relativeTime(at(3 * 3_600_000), now)).toEqual({ key: 'hours', count: 3 });
    expect(relativeTime(at(2 * 86_400_000), now)).toEqual({ key: 'days', count: 2 });
    expect(relativeTime(at(30 * 86_400_000), now)).toBeNull();
    expect(relativeTime('nope', now)).toBeNull();
  });

  it('computes remaining uses', () => {
    expect(remainingUses(2, 1)).toBe(1);
    expect(remainingUses(2, 5)).toBe(0);
    expect(remainingUses(2, undefined)).toBeNull();
  });
});

describe('draft editing', () => {
  it('round-trips content through a draft', () => {
    const c = content();
    expect(fromDraft(toDraft(c))).toEqual({
      summary: c.summary,
      blocks: c.blocks.map((b) => (b.basis === 'verified' ? b : { id: b.id, text: b.text, basis: b.basis })),
    });
    expect(isDraftDirty(c, toDraft(c))).toBe(false);
  });

  it('detects dirty drafts', () => {
    const c = content();
    const draft = toDraft(c);
    draft.blocks[0]!.text = 'Changed';
    expect(isDraftDirty(c, draft)).toBe(true);
    const reordered = toDraft(c);
    reordered.blocks = moveItem(reordered.blocks, 0, 1);
    expect(isDraftDirty(c, reordered)).toBe(true);
  });

  it('validates a good draft into stored content', () => {
    const draft = toDraft(content());
    draft.blocks[0] = { ...draft.blocks[0]!, basis: 'verified', sourceTitle: 'Survey', sourceUrl: 'example.org/survey' };
    const result = validateDraft(draft);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.content.blocks[0]).toEqual({
        id: 'b1',
        text: 'Customers are local families.',
        basis: 'verified',
        source: { title: 'Survey', url: 'https://example.org/survey' },
      });
      // Non-verified blocks never carry a source.
      expect(result.content.blocks[1]).not.toHaveProperty('source');
    }
  });

  it('reports empty text, missing source and bad URL with i18n keys', () => {
    const draft = toDraft(content());
    draft.blocks[0] = { ...draft.blocks[0]!, text: '   ' };
    draft.blocks[1] = { ...draft.blocks[1]!, basis: 'verified', sourceTitle: '', sourceUrl: 'javascript:alert(1)' };
    const result = validateDraft(draft);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.issues).toEqual(
        expect.arrayContaining([
          { path: ['blocks', 0, 'text'], message: 'plan.edit.errors.textRequired' },
          { path: ['blocks', 1, 'sourceTitle'], message: 'plan.edit.errors.sourceTitleRequired' },
          { path: ['blocks', 1, 'sourceUrl'], message: 'plan.edit.errors.sourceUrlInvalid' },
        ]),
      );
    }
  });

  it('requires at least one block and limits the summary', () => {
    const result = validateDraft({ summary: 'x'.repeat(601), blocks: [] });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.issues.map((i) => i.message)).toEqual(
        expect.arrayContaining(['plan.edit.errors.summaryTooLong', 'plan.edit.errors.minBlocks']),
      );
    }
  });

  it('normalizes URLs', () => {
    expect(normalizeUrl(' example.com/a ')).toBe('https://example.com/a');
    expect(normalizeUrl('http://example.com')).toBe('http://example.com');
    expect(normalizeUrl('')).toBe('');
  });

  it('creates unique block ids within the DB limit', () => {
    const ids = ['u00000000'];
    const id = newBlockId(ids, () => 0); // first candidate collides → fallback
    expect(id).not.toBe('u00000000');
    expect(id.length).toBeLessThanOrEqual(40);
    const block = emptyDraftBlock(['b1']);
    expect(block).toMatchObject({ text: '', basis: 'user_provided', sourceTitle: '', sourceUrl: '' });
    expect(block.id).not.toBe('b1');
  });

  it('moves items within bounds only', () => {
    expect(moveItem(['a', 'b', 'c'], 1, -1)).toEqual(['b', 'a', 'c']);
    expect(moveItem(['a', 'b', 'c'], 1, 1)).toEqual(['a', 'c', 'b']);
    expect(moveItem(['a', 'b', 'c'], 0, -1)).toEqual(['a', 'b', 'c']);
    expect(moveItem(['a', 'b', 'c'], 2, 1)).toEqual(['a', 'b', 'c']);
  });
});

it('covers all 15 keys in display order', () => {
  expect(PLAN_SECTION_KEYS).toHaveLength(15);
});
