import { describe, expect, it } from 'vitest';
import { registerBackHandler, runBackHandlers } from './backHandlers';

describe('back handlers', () => {
  it('asks the latest screen first and stops at the first one that handles it', () => {
    const calls: string[] = [];
    const offA = registerBackHandler(() => (calls.push('a'), true));
    const offB = registerBackHandler(() => (calls.push('b'), false));
    expect(runBackHandlers()).toBe(true);
    expect(calls).toEqual(['b', 'a']);
    offA();
    expect(runBackHandlers()).toBe(false); // nothing handles it: the default (leave / go back) applies
    offB();
    expect(runBackHandlers()).toBe(false);
  });
});
