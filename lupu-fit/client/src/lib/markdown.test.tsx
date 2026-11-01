import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { parseMarkdown, renderMarkdown } from './markdown.ts';

const R = ({ s }: { s: string }) => <div data-testid="out">{renderMarkdown(s)}</div>;

describe('safe markdown', () => {
  it('renders bold, lists and line breaks', () => {
    const { container } = render(<R s={'Hello **world**\nsecond line\n\n- one\n- **two**\n\n1. a\n2. b'} />);
    expect(container.querySelectorAll('strong')).toHaveLength(2);
    expect(container.querySelectorAll('ul > li')).toHaveLength(2);
    expect(container.querySelectorAll('ol > li')).toHaveLength(2);
    expect(container.querySelectorAll('br')).toHaveLength(1);
    expect(container.querySelectorAll('p')).toHaveLength(1);
  });
  it('keeps script tags and HTML as inert text', () => {
    const evil = '<script>alert(1)</script> **b** <img src=x onerror=alert(1)>';
    const { container } = render(<R s={evil} />);
    expect(container.querySelector('script')).toBeNull();
    expect(container.querySelector('img')).toBeNull();
    expect(screen.getByTestId('out').textContent).toContain('<script>alert(1)</script>');
    expect(screen.getByTestId('out').textContent).toContain('<img src=x onerror=alert(1)>');
  });
  it('does not turn markdown links or html attributes into elements', () => {
    const { container } = render(<R s={'[click](javascript:alert(1)) <a href="javascript:alert(1)">x</a>'} />);
    expect(container.querySelector('a')).toBeNull();
  });
  it('handles Hebrew and bidi text and empty input', () => {
    const { container } = render(<R s={'**חלבון** גבוה\n- ביצים'} />);
    expect(container.querySelector('strong')?.textContent).toBe('חלבון');
    expect(parseMarkdown('')).toEqual([]);
  });
  it('treats unmatched markers literally', () => { const { container } = render(<R s={'a ** b'} />); expect(container.textContent).toBe('a ** b'); });
});
