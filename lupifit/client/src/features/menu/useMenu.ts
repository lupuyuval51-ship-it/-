import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { qk } from '../../api/queryClient';
import { buildDailyMenu, type DailyMenu, type MenuTargets } from '@shared/menu';
import type { DishPreferences } from '@shared/dishes/safety';
import type { ProfileDTO } from '@shared/types';
import { useDraft } from '../../hooks/useDraft';
import { fetchProfile } from '../nutrition/api';

/** What the user changed on this day's menu, kept on this device. */
export interface MenuState {
  /** Per slot: how many times "another dish" was pressed. */
  swaps: Record<number, number>;
  /** Per slot: the dish that was logged, so the card can say so. */
  logged: Record<number, string>;
}

export const EMPTY_MENU_STATE: MenuState = { swaps: {}, logged: {} };

export function menuPreferences(p: ProfileDTO): DishPreferences {
  return { dietType: p.dietType, allergies: p.allergies, dietaryRestrictions: p.dietaryRestrictions, dislikedFoods: p.dislikedFoods };
}

export function menuTargets(p: ProfileDTO): MenuTargets | null {
  const t = p.targets;
  return t ? { calories: t.calories, proteinG: t.proteinG, carbsG: t.carbsG, fatG: t.fatG } : null;
}

/** The day's menu, rebuilt from the profile and the user's swaps (nothing about the menu itself is stored). */
export function useMenu(date: string) {
  const profileQuery = useQuery({ queryKey: qk.profile, queryFn: fetchProfile, staleTime: 5 * 60_000 });
  const [state, setState] = useDraft<MenuState>(`menu.${date}`, EMPTY_MENU_STATE);
  const profile = profileQuery.data ?? null;
  const targets = profile ? menuTargets(profile) : null;
  const menu: DailyMenu | null = useMemo(
    () => (profile && targets ? buildDailyMenu({ seed: date, targets, mealsPerDay: profile.mealsPerDay, preferences: menuPreferences(profile), swaps: state.swaps }) : null),
    // targets is derived from profile
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [profile, date, state.swaps],
  );
  return { profileQuery, profile, targets, menu, state, setState };
}
