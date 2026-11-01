import { describe, expect, it } from 'vitest';
import { LoginBodySchema, RegisterBodySchema, UsernameSchema } from '../src/index.js';

describe('UsernameSchema', () => {
  it('trims and lowercases', () => { expect(UsernameSchema.parse('  Yuval_L ')).toBe('yuval_l'); });
  it('accepts letters, digits and _ . -', () => { for (const u of ['abc', 'a.b-c_9', '9lives', 'x'.repeat(24)]) expect(UsernameSchema.safeParse(u).success, u).toBe(true); });
  it('rejects too short, too long, bad characters and a bad first character', () => {
    for (const u of ['', 'ab', 'x'.repeat(25), 'a b c', 'a@b.co', '_abc', '.abc', '-abc', 'שלום1']) expect(UsernameSchema.safeParse(u).success, u).toBe(false);
  });
  it('is used by register and login bodies (no email field)', () => {
    expect(RegisterBodySchema.parse({ username: 'Abc', password: 'correct-horse-battery' })).toEqual({ username: 'abc', password: 'correct-horse-battery' });
    expect(RegisterBodySchema.safeParse({ email: 'a@b.co', password: 'correct-horse-battery' }).success).toBe(false);
    expect(LoginBodySchema.parse({ username: 'ABC', password: 'x' }).username).toBe('abc');
  });
});
