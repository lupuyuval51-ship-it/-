import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { MarkdownLite, parseInline, parseMarkdownLite } from './markdown';

function html(text: string) {
  const { container } = render(<MarkdownLite text={text} />);
  return container.firstElementChild as HTMLElement;
}

describe('Markdown-lite renderer', () => {
  it('renders HTML and scripts in model output as inert text', () => {
    const el = html('Hello <script>alert("xss")</script> <img src=x onerror="alert(1)"> <b>bold?</b> <a href="javascript:alert(1)">x</a>');
    expect(el.querySelector('script')).toBeNull();
    expect(el.querySelector('img')).toBeNull();
    expect(el.querySelector('b')).toBeNull();
    expect(el.querySelector('a')).toBeNull();
    expect(el.textContent).toContain('<script>alert("xss")</script>');
    expect(el.textContent).toContain('<img src=x onerror="alert(1)">');
    expect(el.innerHTML).toContain('&lt;script&gt;');
  });

  it('keeps markup inside bold/italic/code inert too', () => {
    const el = html('**<iframe src="//evil">** and *<svg onload=alert(1)>* and `<style>body{}</style>`');
    expect(el.querySelector('iframe, svg, style')).toBeNull();
    expect(el.querySelector('strong')?.textContent).toBe('<iframe src="//evil">');
    expect(el.querySelector('em')?.textContent).toBe('<svg onload=alert(1)>');
    expect(el.querySelector('code')?.textContent).toBe('<style>body{}</style>');
  });

  it('does not auto-link URLs or markdown links', () => {
    const el = html('See https://example.com and [click](javascript:alert(1)) or www.evil.test');
    expect(el.querySelector('a')).toBeNull();
    expect(el.textContent).toBe('See https://example.com and [click](javascript:alert(1)) or www.evil.test');
  });

  it('renders bold, italic and inline code', () => {
    const el = html('This is **bold**, *italic*, `code` and **bold with *italic* inside**.');
    const strongs = el.querySelectorAll('strong');
    expect(strongs).toHaveLength(2);
    expect(strongs[0]!.textContent).toBe('bold');
    expect(strongs[1]!.querySelector('em')?.textContent).toBe('italic');
    expect(el.querySelector('p > em')?.textContent).toBe('italic');
    expect(el.querySelector('code')?.textContent).toBe('code');
  });

  it('does not treat stray asterisks as emphasis', () => {
    const el = html('3 * 4 = 12 and 5*6 and ** not bold **');
    expect(el.querySelector('strong, em')).toBeNull();
    expect(el.textContent).toBe('3 * 4 = 12 and 5*6 and ** not bold **');
  });

  it('renders paragraphs and line breaks', () => {
    const el = html('First line\nsecond line\n\nSecond paragraph');
    const ps = el.querySelectorAll('p');
    expect(ps).toHaveLength(2);
    expect(ps[0]!.querySelectorAll('br')).toHaveLength(1);
    expect(ps[0]!.textContent).toBe('First linesecond line');
    expect(ps[1]!.textContent).toBe('Second paragraph');
  });

  it('renders bullet and numbered lists', () => {
    const el = html('Intro:\n- one\n- **two**\n* three\n\n1. first\n2. second\n\n3) third');
    const ul = el.querySelector('ul')!;
    expect([...ul.querySelectorAll('li')].map((li) => li.textContent)).toEqual(['one', 'two', 'three']);
    expect(ul.querySelector('strong')?.textContent).toBe('two');
    const ols = el.querySelectorAll('ol');
    expect(ols).toHaveLength(2);
    expect([...ols[0]!.querySelectorAll('li')].map((li) => li.textContent)).toEqual(['first', 'second']);
    expect(ols[1]!.getAttribute('start')).toBe('3');
    expect(el.querySelector('p')?.textContent).toBe('Intro:');
  });

  it('continues a list item with indented lines and switches list types', () => {
    const blocks = parseMarkdownLite('- **Meal** — tasty\n  500 kcal · 30 g protein\n1. step');
    expect(blocks).toHaveLength(2);
    expect(blocks[0]).toMatchObject({ type: 'ul' });
    expect((blocks[0] as { items: unknown[][] }).items[0]).toHaveLength(2);
    expect(blocks[1]).toMatchObject({ type: 'ol', start: 1 });
    const el = html('- **Meal** — tasty\n  500 kcal');
    expect(el.querySelector('li br')).not.toBeNull();
  });

  it('shows headings as bold paragraphs and drops horizontal rules', () => {
    const el = html('### Plan\n---\ntext');
    expect(el.querySelector('h1, h2, h3, hr')).toBeNull();
    expect(el.querySelector('p > strong')?.textContent).toBe('Plan');
  });

  it('handles Hebrew text and empty input', () => {
    const el = html('**חשוב:** לשתות מים\n- סקוואט');
    expect(el.querySelector('strong')?.textContent).toBe('חשוב:');
    expect(el.querySelector('li')?.textContent).toBe('סקוואט');
    expect(parseMarkdownLite('')).toEqual([]);
    expect(parseInline('plain')).toEqual([{ type: 'text', text: 'plain' }]);
  });
});
