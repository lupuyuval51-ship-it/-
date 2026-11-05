import { PLAN_SECTION_KEYS, type PlanSectionContent, type PlanSectionKey } from '@domain/plan';
import { translate } from '@/i18n/translate';
import { buildPlanHtml, escapeHtml, safeHttpUrl } from '../export';

jest.mock('expo-print', () => ({ printToFileAsync: jest.fn(), printAsync: jest.fn() }));
jest.mock('expo-sharing', () => ({ isAvailableAsync: jest.fn(), shareAsync: jest.fn() }));

const section = (key: string): PlanSectionContent => ({
  summary: `Summary of ${key}`,
  blocks: [
    { id: 'b1', text: `First paragraph of ${key}`, basis: 'ai_estimate' },
    { id: 'b2', text: 'Second paragraph', basis: 'assumption' },
  ],
});

const allSections = Object.fromEntries(PLAN_SECTION_KEYS.map((k) => [k, section(k)])) as Record<PlanSectionKey, PlanSectionContent>;
const generatedAt = new Date(2026, 10, 5);

describe('escapeHtml', () => {
  it('escapes the five HTML-significant characters', () => {
    expect(escapeHtml(`<a href="x" onclick='y'>&</a>`)).toBe('&lt;a href=&quot;x&quot; onclick=&#39;y&#39;&gt;&amp;&lt;/a&gt;');
  });
});

describe('safeHttpUrl', () => {
  it('allows only absolute http(s) URLs', () => {
    expect(safeHttpUrl('https://example.com/a?b=1')).toBe('https://example.com/a?b=1');
    expect(safeHttpUrl('http://example.com')).toBe('http://example.com');
    expect(safeHttpUrl('javascript:alert(1)')).toBeNull();
    expect(safeHttpUrl('data:text/html,<b>')).toBeNull();
    expect(safeHttpUrl('/relative')).toBeNull();
    expect(safeHttpUrl('https://exa mple.com')).toBeNull();
    expect(safeHttpUrl(null)).toBeNull();
  });
});

describe('buildPlanHtml', () => {
  it('is RTL with lang="he" for Hebrew', () => {
    const html = buildPlanHtml({ locale: 'he', businessName: 'מאפיית השכונה', versionNumber: 3, sections: allSections, generatedAt });
    expect(html).toMatch(/^<!DOCTYPE html>/);
    expect(html).toContain('<html lang="he" dir="rtl">');
    expect(html).toContain('<body dir="rtl">');
    expect(html).toContain('<meta charset="utf-8">');
    expect(html).toContain('מאפיית השכונה');
  });

  it('is LTR with lang="en" for English', () => {
    const html = buildPlanHtml({ locale: 'en', businessName: 'Corner Bakery', versionNumber: 1, sections: allSections, generatedAt });
    expect(html).toContain('<html lang="en" dir="ltr">');
    expect(html).toContain('<body dir="ltr">');
  });

  it('contains every section, in display order, with translated titles', () => {
    const html = buildPlanHtml({ locale: 'en', businessName: 'Corner Bakery', versionNumber: 1, sections: allSections, generatedAt });
    let lastIndex = -1;
    for (const key of PLAN_SECTION_KEYS) {
      const index = html.indexOf(`<section class="plan-section" id="section-${key}">`);
      expect(index).toBeGreaterThan(lastIndex);
      lastIndex = index;
      expect(html).toContain(`href="#section-${key}"`);
      expect(html).toContain(escapeHtml(translate('en', `plan.sections.${key}`)));
      expect(html).toContain(`First paragraph of ${key}`);
    }
    expect(html.match(/<section class="plan-section"/g)).toHaveLength(15);
  });

  it('skips missing sections', () => {
    const html = buildPlanHtml({
      locale: 'en',
      businessName: 'B',
      versionNumber: 1,
      sections: { executive_summary: section('executive_summary'), startup_costs: null },
      generatedAt,
    });
    expect(html.match(/<section class="plan-section"/g)).toHaveLength(1);
    expect(html).not.toContain('section-startup_costs');
  });

  it('labels provenance and includes the disclaimer and generated date', () => {
    const html = buildPlanHtml({ locale: 'en', businessName: 'B', versionNumber: 7, sections: allSections, generatedAt });
    expect(html).toContain('<p class="basis basis-ai_estimate">AI estimate</p>');
    expect(html).toContain('<p class="basis basis-assumption">Assumption</p>');
    expect(html).toContain(escapeHtml(translate('en', 'plan.export.disclaimer')));
    expect(html).toContain('Version');
    expect(html).toContain('2026');
  });

  it('escapes all user and AI content and never links unsafe URLs', () => {
    const evil: PlanSectionContent = {
      summary: '<img src=x onerror=alert(1)>',
      blocks: [
        { id: 'b1', text: '<script>alert("x")</script>\n\nline & more', basis: 'user_provided' },
        { id: 'b2', text: 'Verified fact', basis: 'verified', source: { title: '<b>Gov</b>', url: 'javascript:alert(1)' } },
        { id: 'b3', text: 'Linked fact', basis: 'verified', source: { title: 'Stats "office"', url: 'https://stats.example/a?x=1&y=2' } },
      ],
    };
    const html = buildPlanHtml({
      locale: 'en',
      businessName: '</title><script>alert(1)</script>',
      versionNumber: 1,
      sections: { executive_summary: evil },
      generatedAt,
    });
    expect(html).not.toMatch(/<script/i);
    expect(html).not.toMatch(/<img/i);
    expect(html).not.toContain('javascript:');
    expect(html).toContain('&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;');
    expect(html).toContain('<p>line &amp; more</p>');
    expect(html).toContain('&lt;b&gt;Gov&lt;/b&gt;');
    expect(html).toContain('<a href="https://stats.example/a?x=1&amp;y=2">Stats &quot;office&quot;</a>');
    expect(html).toContain('&lt;/title&gt;&lt;script&gt;');
  });
});
