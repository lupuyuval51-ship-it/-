import type { Messages } from '../../types';
import type he from '../he/common';

/** Shared UI strings (English). */
const messages: Messages<typeof he> = {
  appName: 'Business AI',
  actions: {
    save: 'Save',
    saving: 'Saving…',
    cancel: 'Cancel',
    continue: 'Continue',
    back: 'Back',
    done: 'Done',
    retry: 'Try again',
    close: 'Close',
    edit: 'Edit',
    delete: 'Delete',
    confirm: 'Confirm',
    add: 'Add',
    remove: 'Remove',
    next: 'Next',
    skip: 'Skip',
    dismiss: 'Dismiss',
  },
  states: {
    loading: 'Loading…',
    offlineBanner: 'You’re offline. Showing data saved on this device.',
    offlineTitle: 'You’re offline',
    offlineBody: 'Your data will load as soon as you’re back online.',
    errorTitle: 'Something went wrong',
    emptyTitle: 'Nothing here yet',
  },
  screens: {
    onboarding: 'Let’s get started',
  },
  tabs: {
    home: 'Home',
    plan: 'Plan',
    advisor: 'Advisor',
    finance: 'Finance',
    workspace: 'Workspace',
  },
  language: {
    label: 'Language',
    he: 'עברית',
    en: 'English',
  },
  theme: {
    system: 'System',
    light: 'Light',
    dark: 'Dark',
  },
  basis: {
    user_provided: 'From you',
    assumption: 'Assumption',
    ai_estimate: 'AI estimate',
    verified: 'Verified',
  },
  basisA11y: 'Source: {basis}',
  estimate: 'Estimate',
  due: {
    overdue: { one: 'Overdue by 1 day', other: 'Overdue by {count} days' },
    today: 'Due today',
    tomorrow: 'Due tomorrow',
    inDays: { one: 'In 1 day', other: 'In {count} days' },
  },
  a11y: {
    showPassword: 'Show password',
    hidePassword: 'Hide password',
    loading: 'Loading',
    progress: '{value} percent',
    dismissNotice: 'Dismiss notice',
    closeSheet: 'Close',
    goBack: 'Go back',
    settings: 'Settings',
  },
  confirm: {
    title: 'Continue?',
    confirm: 'Confirm',
    cancel: 'Cancel',
  },
  notFound: {
    title: 'Page not found',
    body: 'The link may be wrong, or the page has moved.',
    home: 'Go to Home',
  },
  config: {
    title: 'The app isn’t configured yet',
    body: 'EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY are missing. Add them to your .env file and restart the app.',
  },
  boot: {
    errorTitle: 'We couldn’t load your account',
    offlineBody: 'Signing in on this device for the first time needs a connection.',
    signOut: 'Sign out',
  },
};

export default messages;
