import type { Messages } from '../../types';
import type he from '../he/settings';

/** Settings screen (English). */
const messages: Messages<typeof he> = {
  title: 'Settings',
  sections: {
    account: 'Account',
    language: 'Language',
    appearance: 'Appearance',
    subscription: 'Subscription',
    usage: 'AI usage this month',
    session: 'Session',
  },
  account: {
    displayName: 'Display name',
    displayNameHint: 'The name shown in the app.',
    save: 'Save name',
    saved: 'Name saved',
    email: 'Email',
  },
  language: {
    restartHint: 'Switching language restarts the app to change the layout direction.',
    confirmTitle: 'Switch language?',
    confirmBody: 'The app will restart in {language}.',
    confirm: 'Switch and restart',
    saved: 'Language updated',
  },
  appearance: {
    label: 'Color scheme',
  },
  subscription: {
    current: 'Your plan',
    tier: {
      free: 'Free',
      pro: 'Pro',
    },
    businesses: { one: '1 business', other: 'Up to {count} businesses' },
    businessesLabel: 'Businesses',
    forecast: 'Up to {count} months',
    forecastLabel: 'Forecast horizon',
    validUntil: 'Valid until {date}',
    upgradeUnavailable: 'Upgrading isn’t available in this version yet.',
  },
  usage: {
    of: '{used} of {limit}',
    resets: 'Limits reset at the start of each month.',
    features: {
      plan_generation: 'Business plan generation',
      section_regeneration: 'Section rewrites',
      roadmap_generation: 'Roadmap generation',
      roadmap_recommendation: 'Task recommendations',
      advisor_message: 'Advisor messages',
      marketing_generation: 'Marketing content',
      finance_proposal: 'Financial assumption proposals',
    },
  },
  signOut: {
    button: 'Sign out',
    confirmTitle: 'Sign out?',
    confirmBody: 'Data saved on this device will be removed from it. It stays in your account.',
    confirm: 'Sign out',
  },
  about: {
    version: 'Version {version}',
  },
};

export default messages;
