import { describe, expect, it } from 'vitest';
import { escapeHtml, renderLegalSite, translateStatic } from './staticSite';

const text = (html: string) => html.replace(/<style>[\s\S]*?<\/style>/, '').replace(/<[^>]+>/g, ' ');

describe('static legal pages (public URL without a server)', () => {
  const device = renderLegalSite('device');
  const page = (path: string) => {
    const file = device.find((f) => f.path === path);
    if (!file) throw new Error(`missing ${path}`);
    return file.html;
  };

  it('writes the three pages in Hebrew (top level) and English (en/), plus an index', () => {
    expect(device.map((f) => f.path).sort()).toEqual(
      ['account-deletion.html', 'en/account-deletion.html', 'en/privacy.html', 'en/terms.html', 'index.html', 'privacy.html', 'terms.html'].sort(),
    );
  });

  it('sets the language and direction of each page', () => {
    expect(page('privacy.html')).toContain('<html lang="he" dir="rtl">');
    expect(page('en/privacy.html')).toContain('<html lang="en" dir="ltr">');
  });

  it('fills every {parameter} and marks every [placeholder]', () => {
    for (const f of device) {
      const visible = text(f.html);
      expect(visible, f.path).not.toMatch(/\{\w+\}/);
      // Every bracketed placeholder is inside <mark> (the operator must fill it in before publishing).
      const unmarked = f.html.replace(/<mark>\[[^\]]+\]<\/mark>/g, '').replace(/<style>[\s\S]*?<\/style>/, '');
      expect(text(unmarked), f.path).not.toMatch(/\[[^\]]+\]/);
    }
    expect(page('en/privacy.html')).toContain('<mark>[contact email address]</mark>');
  });

  it('keeps the visible draft / lawyer-review notice', () => {
    expect(page('en/terms.html')).toContain(translateStatic('en', 'legal.draft.title'));
    expect(page('terms.html')).toContain(translateStatic('he', 'legal.draft.title'));
  });

  it('describes device mode: data on the phone, Open Food Facts, no hosting provider', () => {
    const privacy = text(page('en/privacy.html'));
    expect(privacy).toContain('Open Food Facts');
    expect(privacy).toContain(translateStatic('en', 'legal.device.privacy.summary.local'));
    expect(privacy).not.toContain('[hosting provider]');
    expect(privacy).not.toContain('Anthropic');
    expect(text(page('en/account-deletion.html'))).toContain('Erase all data');
    expect(text(page('account-deletion.html'))).toContain(translateStatic('he', 'device.settings.erase'));
  });

  it('links the pages to each other and to the other language', () => {
    expect(page('privacy.html')).toContain('href="terms.html"');
    expect(page('privacy.html')).toContain('href="en/privacy.html"');
    expect(page('en/terms.html')).toContain('href="../terms.html"');
    expect(page('index.html')).toContain('href="en/account-deletion.html"');
  });

  it('is self-contained: no scripts and nothing loaded from elsewhere', () => {
    for (const f of device) {
      expect(f.html).not.toMatch(/<script|<link|<img|src=/i);
      expect(f.html).not.toMatch(/href="https?:/);
    }
  });

  it('escapes text', () => {
    expect(escapeHtml(`<a href="x">'&'</a>`)).toBe('&lt;a href=&quot;x&quot;&gt;&#39;&amp;&#39;&lt;/a&gt;');
  });

  it('can also render the hosted-service texts', () => {
    const server = renderLegalSite('server');
    const privacy = server.find((f) => f.path === 'en/privacy.html')?.html ?? '';
    expect(privacy).toContain('[hosting provider]');
    expect(privacy).not.toContain(translateStatic('en', 'legal.device.privacy.summary.local'));
  });
});
