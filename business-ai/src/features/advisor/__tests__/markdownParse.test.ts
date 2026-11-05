import { markdownPreview, parseInline, parseMarkdown } from '../markdownParse';

describe('parseMarkdown', () => {
  it('parses headings, paragraphs and soft line breaks', () => {
    expect(parseMarkdown('# כותרת\n\nשורה ראשונה\nשורה שנייה\n\n### Sub ###\n#### Deep')).toEqual([
      { type: 'heading', level: 1, children: [{ type: 'text', text: 'כותרת' }] },
      { type: 'paragraph', children: [{ type: 'text', text: 'שורה ראשונה שורה שנייה' }] },
      { type: 'heading', level: 3, children: [{ type: 'text', text: 'Sub' }] },
      { type: 'heading', level: 3, children: [{ type: 'text', text: 'Deep' }] },
    ]);
  });

  it('keeps "#tag" and "C#" as text', () => {
    expect(parseMarkdown('#tag')).toEqual([{ type: 'paragraph', children: [{ type: 'text', text: '#tag' }] }]);
    expect(parseMarkdown('## Learn C#')).toEqual([{ type: 'heading', level: 2, children: [{ type: 'text', text: 'Learn C#' }] }]);
  });

  it('parses bullet and numbered lists with nesting and continuation lines', () => {
    const blocks = parseMarkdown('- one\n  continued\n* two\n  - nested\n\n1. first\n2) second\n');
    expect(blocks).toEqual([
      {
        type: 'list',
        items: [
          { ordered: false, number: 0, depth: 0, children: [{ type: 'text', text: 'one continued' }] },
          { ordered: false, number: 0, depth: 0, children: [{ type: 'text', text: 'two' }] },
          { ordered: false, number: 0, depth: 1, children: [{ type: 'text', text: 'nested' }] },
          { ordered: true, number: 1, depth: 0, children: [{ type: 'text', text: 'first' }] },
          { ordered: true, number: 2, depth: 0, children: [{ type: 'text', text: 'second' }] },
        ],
      },
    ]);
  });

  it('ends a list at a following unindented paragraph after a blank line', () => {
    const blocks = parseMarkdown('- a\n\nAfter');
    expect(blocks.map((b) => b.type)).toEqual(['list', 'paragraph']);
  });

  it('parses fenced code blocks (also unterminated while streaming), rules and quotes', () => {
    expect(parseMarkdown('```\nconst a = 1;\n**not bold**\n```\n---\n> quoted')).toEqual([
      { type: 'code', text: 'const a = 1;\n**not bold**' },
      { type: 'rule' },
      { type: 'paragraph', children: [{ type: 'text', text: 'quoted' }] },
    ]);
    expect(parseMarkdown('```js\npartial')).toEqual([{ type: 'code', text: 'partial' }]);
  });

  it('normalises CRLF', () => {
    expect(parseMarkdown('a\r\nb\r\n\r\nc')).toEqual([
      { type: 'paragraph', children: [{ type: 'text', text: 'a b' }] },
      { type: 'paragraph', children: [{ type: 'text', text: 'c' }] },
    ]);
  });

  it('never interprets HTML', () => {
    expect(parseMarkdown('<script>alert(1)</script> <b>x</b>')).toEqual([
      { type: 'paragraph', children: [{ type: 'text', text: '<script>alert(1)</script> <b>x</b>' }] },
    ]);
  });

  it('returns nothing for empty input', () => {
    expect(parseMarkdown('')).toEqual([]);
    expect(parseMarkdown('\n\n  \n')).toEqual([]);
  });
});

describe('parseInline', () => {
  it('parses strong, emphasis and code', () => {
    expect(parseInline('a **bold** and `code` and *em* and __also__')).toEqual([
      { type: 'text', text: 'a ' },
      { type: 'strong', children: [{ type: 'text', text: 'bold' }] },
      { type: 'text', text: ' and ' },
      { type: 'code', text: 'code' },
      { type: 'text', text: ' and ' },
      { type: 'em', children: [{ type: 'text', text: 'em' }] },
      { type: 'text', text: ' and ' },
      { type: 'strong', children: [{ type: 'text', text: 'also' }] },
    ]);
  });

  it('supports Hebrew inside markers and nested emphasis', () => {
    expect(parseInline('**מחיר *ממוצע* ללקוח**')).toEqual([
      {
        type: 'strong',
        children: [
          { type: 'text', text: 'מחיר ' },
          { type: 'em', children: [{ type: 'text', text: 'ממוצע' }] },
          { type: 'text', text: ' ללקוח' },
        ],
      },
    ]);
  });

  it('leaves unterminated or spaced markers literal (streaming-safe)', () => {
    expect(parseInline('**partial')).toEqual([{ type: 'text', text: '**partial' }]);
    expect(parseInline('2 * 3 * 4')).toEqual([{ type: 'text', text: '2 * 3 * 4' }]);
    expect(parseInline('`open')).toEqual([{ type: 'text', text: '`open' }]);
    expect(parseInline('snake_case_name')).toEqual([{ type: 'text', text: 'snake_case_name' }]);
  });

  it('does not parse markers inside code', () => {
    expect(parseInline('`**x**`')).toEqual([{ type: 'code', text: '**x**' }]);
  });

  it('handles backslash escapes', () => {
    expect(parseInline('\\*not em\\*')).toEqual([{ type: 'text', text: '*not em*' }]);
  });

  it('turns links into inert text nodes', () => {
    expect(parseInline('See [the guide](https://gov.il/x "t") now')).toEqual([
      { type: 'text', text: 'See ' },
      { type: 'link', text: 'the guide', url: 'https://gov.il/x' },
      { type: 'text', text: ' now' },
    ]);
  });
});

describe('markdownPreview', () => {
  it('flattens markdown into a single trimmed line', () => {
    expect(markdownPreview('## Pricing\n\n- **Cost** plus margin\n- `30%`')).toBe('Pricing Cost plus margin 30%');
  });

  it('truncates with an ellipsis', () => {
    const preview = markdownPreview('word '.repeat(100), 20);
    expect(preview.length).toBeLessThanOrEqual(20);
    expect(preview.endsWith('…')).toBe(true);
  });
});
