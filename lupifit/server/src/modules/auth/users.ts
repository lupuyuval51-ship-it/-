import { DEFAULT_WORKOUT_PREFS, type UserDTO, type WorkoutPrefsDTO } from '@shared/types';
import type { Sql } from '../../db/pool';

export interface UserRow {
  id: string;
  email: string;
  display_name: string;
  role: 'user' | 'admin';
  locale: UserDTO['locale'];
  theme: UserDTO['theme'];
  units: UserDTO['units'];
  timezone: string;
  created_at: Date;
  workout_prefs?: Partial<WorkoutPrefsDTO> | null;
  onboarding_completed_at?: Date | null;
}

export const USER_COLUMNS = `u.id, u.email, u.display_name, u.role, u.locale, u.theme, u.units, u.timezone, u.workout_prefs, u.created_at`;

export function toUserDTO(row: UserRow): UserDTO {
  return {
    id: row.id,
    email: row.email,
    displayName: row.display_name,
    role: row.role,
    locale: row.locale,
    theme: row.theme,
    units: row.units,
    timezone: row.timezone,
    onboardingCompleted: Boolean(row.onboarding_completed_at),
    workoutPrefs: row.workout_prefs ? { ...DEFAULT_WORKOUT_PREFS, ...row.workout_prefs } : null,
    createdAt: new Date(row.created_at).toISOString(),
  };
}

export async function getUserDTO(sql: Sql, userId: string): Promise<UserDTO | null> {
  const row = await sql.maybeOne<UserRow>(
    `SELECT ${USER_COLUMNS}, p.onboarding_completed_at
       FROM users u LEFT JOIN profiles p ON p.user_id = u.id
      WHERE u.id = $1`,
    [userId],
  );
  return row ? toUserDTO(row) : null;
}
