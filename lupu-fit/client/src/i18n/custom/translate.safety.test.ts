import { describe, expect, it } from 'vitest';
import { overlayTree, unflatten, type StoredLang } from './translate.ts';

describe('stored translations are data, never structure', () => {
  it('cannot pollute Object.prototype through crafted keys', () => {
    unflatten({ '__proto__.polluted': 'yes', 'a.constructor.prototype.polluted2': 'yes', 'ok.key': 'fine' });
    expect(({} as Record<string, unknown>)['polluted']).toBeUndefined();
    expect(({} as Record<string, unknown>)['polluted2']).toBeUndefined();
    expect(Object.prototype.hasOwnProperty.call(Object.prototype, 'polluted')).toBe(false);
  });
  it('keeps normal keys and drops non-string values (an object or number in storage is never rendered)', () => {
    const t = unflatten({ 'a.b': 'x', 'a.c': 5 as unknown as string, 'd': { e: 'f' } as unknown as string });
    expect(t).toEqual({ a: { b: 'x' } });
  });
  it('overlayTree of a tampered stored language is just text', () => {
    const l = { code: 'fr', name: 'x', dir: 'ltr', dictHash: 'h', updatedAt: 0, entries: { 'nav.home': '<img src=x onerror=alert(1)>', '__proto__.x': 'y' }, src: {}, fallbackKeys: 0, total: 2 } as StoredLang;
    const t = overlayTree(l);
    expect(t).toEqual({ nav: { home: '<img src=x onerror=alert(1)>' } }); // stays a plain string; React renders it as text
  });
});
