import type { Locale, Theme, Units } from '../constants';
import type { ISODateTime } from './common';

export interface UserDTO {
  id: string;
  email: string;
  displayName: string;
  role: 'user' | 'admin';
  locale: Locale;
  theme: Theme;
  units: Units;
  timezone: string;
  onboardingCompleted: boolean;
  createdAt: ISODateTime;
}

export interface AuthResponse {
  user: UserDTO;
  csrfToken: string;
}

export interface MeResponse {
  user: UserDTO | null;
  csrfToken: string | null;
}

export interface HealthResponse {
  status: 'ok' | 'degraded';
  database: 'ok' | 'error';
  version: string;
  ai: { configured: boolean; provider: string | null; model: string | null };
  time: ISODateTime;
}
