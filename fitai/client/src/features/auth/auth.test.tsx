import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ApiError } from '../../api/client';
import { I18nProvider, translate } from '../../i18n';
import { loginErrorMessage, retryAfterMinutes } from './authErrors';
import { passwordChecks, passwordMeetsRules, passwordStrength } from './password';
import { PasswordStrength } from './PasswordStrength';

const i18n = (locale: 'en' | 'he') => ({
  t: (key: string, params?: Record<string, string | number | null | undefined>) => translate(locale, key, params) ?? key,
  tx: (key: string, params?: Record<string, string | number | null | undefined>, fallback?: string) => translate(locale, key, params) ?? fallback ?? key,
}) as unknown as Parameters<typeof loginErrorMessage>[1];

describe('password rules', () => {
  it('matches the server rules', () => {
    expect(passwordChecks('abc')).toEqual({ length: false, letter: true, number: false });
    expect(passwordMeetsRules('abcdefg1')).toBe(true);
    expect(passwordMeetsRules('abcdefgh')).toBe(false);
    expect(passwordMeetsRules('12345678')).toBe(false);
    expect(passwordMeetsRules('סיסמה1234')).toBe(true);
  });

  it('grades strength', () => {
    expect(passwordStrength('')).toBe('empty');
    expect(passwordStrength('abc')).toBe('weak');
    expect(passwordStrength('abcdefg1')).toBe('fair');
    expect(passwordStrength('Correct-Horse-9')).toBe('strong');
  });
});

describe('login error copy', () => {
  const locked = new ApiError(423, 'account_locked', 'locked', { retryAfterSeconds: 610 });
  it('rounds the lockout up to whole minutes', () => {
    expect(retryAfterMinutes(locked)).toBe(11);
    expect(loginErrorMessage(locked, i18n('en'))).toContain('11 minutes');
    expect(loginErrorMessage(locked, i18n('he'))).toContain('11 דקות');
  });
  it('uses singular and a one-minute minimum', () => {
    expect(loginErrorMessage(new ApiError(423, 'account_locked', 'x', { retryAfterSeconds: 5 }), i18n('en'))).toContain('1 minute');
  });
  it('falls back to the generic code message without a wait time', () => {
    expect(loginErrorMessage(new ApiError(401, 'invalid_credentials', 'x'), i18n('en'))).toBe('Incorrect email or password.');
    expect(loginErrorMessage(new ApiError(429, 'rate_limited', 'x'), i18n('en'))).toBe('Too many requests. Please wait a moment and try again.');
  });
});

describe('PasswordStrength', () => {
  it('lists every rule with a words state, not just colour', () => {
    render(
      <I18nProvider locale="en">
        <PasswordStrength password="abcdefgh" id="s" />
      </I18nProvider>,
    );
    expect(screen.getByText(/A number/).parentElement?.textContent).toContain('missing');
    expect(screen.getByText(/A letter/).parentElement?.textContent).toContain('done');
  });
});
