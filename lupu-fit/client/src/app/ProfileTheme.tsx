import { useEffect, type ReactNode } from 'react';
import { applyTheme, storedTheme } from '../lib/theme.ts';
import { useMe, useProfile } from './session.ts';

/**
 * On a device where no theme was chosen yet (fresh install, new browser), the theme saved in the profile is applied once the profile
 * loads. An explicit choice made on this device (`lf_theme`) always wins and is never overwritten; nothing is stored here.
 */
export function ProfileTheme(): ReactNode {
  const me = useMe();
  const profile = useProfile(!!me.data?.onboarded);
  const theme = profile.data?.profile.theme;
  useEffect(() => { if (theme && storedTheme() === null) applyTheme(theme); }, [theme]);
  return null;
}
