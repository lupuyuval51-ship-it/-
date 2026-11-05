import { decodeFieldMessage } from '@/lib/forms';
import { hasAuthCallbackError, parseAuthCallbackParams, parseAuthCallbackUrl } from '../recovery';
import { passwordRules, resetPasswordSchema, signInSchema, signUpSchema } from '../schemas';

jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));

function firstErrorKey(result: { success: boolean; error?: { issues: { message: string; path: PropertyKey[] }[] } }, path: string) {
  const issue = result.error?.issues.find((i) => i.path.join('.') === path);
  return issue ? decodeFieldMessage(issue.message)?.key : undefined;
}

describe('passwordRules', () => {
  it('checks length and letter + number', () => {
    expect(passwordRules('')).toEqual({ minLength: false, letterAndNumber: false });
    expect(passwordRules('abcdefgh')).toEqual({ minLength: true, letterAndNumber: false });
    expect(passwordRules('abc123')).toEqual({ minLength: false, letterAndNumber: true });
    expect(passwordRules('abcd1234')).toEqual({ minLength: true, letterAndNumber: true });
    expect(passwordRules('שלום1234')).toEqual({ minLength: true, letterAndNumber: true });
  });
});

describe('auth schemas', () => {
  it('sign in requires a valid email and any password', () => {
    expect(signInSchema.safeParse({ email: ' dana@example.com ', password: 'x' })).toMatchObject({ success: true, data: { email: 'dana@example.com' } });
    expect(firstErrorKey(signInSchema.safeParse({ email: 'dana', password: 'x' }), 'email')).toBe('errors.field.emailInvalid');
    expect(firstErrorKey(signInSchema.safeParse({ email: '', password: '' }), 'email')).toBe('errors.field.required');
    expect(firstErrorKey(signInSchema.safeParse({ email: 'a@b.co', password: '' }), 'password')).toBe('errors.field.required');
  });

  it('sign up enforces the password policy and a display name', () => {
    const base = { displayName: 'Dana', email: 'dana@example.com', password: 'abcd1234', locale: 'he' as const };
    expect(signUpSchema.safeParse(base).success).toBe(true);
    expect(firstErrorKey(signUpSchema.safeParse({ ...base, password: 'abc12' }), 'password')).toBe('errors.field.passwordTooShort');
    expect(firstErrorKey(signUpSchema.safeParse({ ...base, password: 'abcdefghij' }), 'password')).toBe('errors.field.passwordNeedsLetterAndNumber');
    expect(firstErrorKey(signUpSchema.safeParse({ ...base, password: 'a1'.repeat(40) }), 'password')).toBe('errors.field.passwordTooLong');
    expect(firstErrorKey(signUpSchema.safeParse({ ...base, displayName: '   ' }), 'displayName')).toBe('errors.field.required');
    expect(firstErrorKey(signUpSchema.safeParse({ ...base, displayName: 'x'.repeat(101) }), 'displayName')).toBe('errors.field.tooLong');
    expect(signUpSchema.safeParse({ ...base, locale: 'fr' }).success).toBe(false);
  });

  it('reset requires matching passwords', () => {
    expect(resetPasswordSchema.safeParse({ password: 'abcd1234', confirm: 'abcd1234' }).success).toBe(true);
    expect(firstErrorKey(resetPasswordSchema.safeParse({ password: 'abcd1234', confirm: 'abcd1235' }), 'confirm')).toBe('errors.field.passwordsDontMatch');
  });
});

describe('auth callback parsing', () => {
  it('reads the PKCE code from route params', () => {
    expect(parseAuthCallbackParams({ code: 'abc' })).toEqual({ code: 'abc', errorCode: null, errorDescription: null });
    expect(parseAuthCallbackParams({ code: ['abc', 'def'] }).code).toBe('abc');
    expect(parseAuthCallbackParams({ code: '' }).code).toBeNull();
  });

  it('reads errors from the query or the hash fragment', () => {
    const fromHash = parseAuthCallbackUrl('http://localhost:8081/reset-password#error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid+or+has+expired');
    expect(fromHash).toEqual({ code: null, errorCode: 'otp_expired', errorDescription: 'Email link is invalid or has expired' });
    expect(hasAuthCallbackError(fromHash)).toBe(true);

    const fromQuery = parseAuthCallbackUrl('businessai://reset-password?code=123-456');
    expect(fromQuery).toEqual({ code: '123-456', errorCode: null, errorDescription: null });
    expect(hasAuthCallbackError(fromQuery)).toBe(false);

    expect(parseAuthCallbackUrl(null)).toEqual({ code: null, errorCode: null, errorDescription: null });
  });
});
