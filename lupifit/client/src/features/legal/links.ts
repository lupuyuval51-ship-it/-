import type { TKey } from '../../i18n';
import { isDeviceMode } from '../../platform';

/** Public legal pages, linked from the public footer, the settings and each other. */
export const LEGAL_PAGES: { to: string; label: TKey }[] = [
  { to: '/privacy', label: 'legal.nav.privacy' },
  { to: '/terms', label: 'legal.nav.terms' },
  // Device mode has no account: the same page explains erasing the data on the phone.
  { to: '/account-deletion', label: isDeviceMode ? 'legal.nav.deletionDevice' : 'legal.nav.deletion' },
];
