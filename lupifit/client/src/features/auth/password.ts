/** Password rules shown while typing; mirrors `passwordSchema` in shared/schemas/auth.ts. */
import { LIMITS } from '@shared/constants';

export interface PasswordChecks {
  length: boolean;
  letter: boolean;
  number: boolean;
}

export type PasswordStrengthLevel = 'empty' | 'weak' | 'fair' | 'strong';

export function passwordChecks(password: string): PasswordChecks {
  return {
    length: password.length >= LIMITS.passwordMin,
    letter: /[A-Za-z֐-׿]/.test(password),
    number: /\d/.test(password),
  };
}

/** Meets every rule the server enforces. */
export const passwordMeetsRules = (password: string): boolean => Object.values(passwordChecks(password)).every(Boolean);

/** Coarse strength for the hint: rules first, then length / variety as a bonus. */
export function passwordStrength(password: string): PasswordStrengthLevel {
  if (!password) return 'empty';
  if (!passwordMeetsRules(password)) return 'weak';
  const variety = [/[a-z]/, /[A-Z]/, /\d/, /[^A-Za-z0-9]/].filter((r) => r.test(password)).length;
  return password.length >= 12 && variety >= 3 ? 'strong' : 'fair';
}
