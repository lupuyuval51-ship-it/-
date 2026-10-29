import type { TKey } from '../../i18n';

/** Public legal pages, linked from the public footer, the settings and each other. */
export const LEGAL_PAGES: { to: string; label: TKey }[] = [
  { to: '/privacy', label: 'legal.nav.privacy' },
  { to: '/terms', label: 'legal.nav.terms' },
  { to: '/account-deletion', label: 'legal.nav.deletion' },
];
