import type { Messages } from '../../types';
import type he from '../he/auth';

/** Authentication screens (English). */
const messages: Messages<typeof he> = {
  signIn: {
    title: 'Sign in',
    subtitle: 'Pick up where you left off. Your plan, tasks and numbers are waiting.',
    submit: 'Sign in',
    forgot: 'Forgot password?',
    noAccount: 'New here?',
    createAccount: 'Create an account',
  },
  signUp: {
    title: 'Create your account',
    subtitle: 'From an idea to a business plan you can act on, one step at a time.',
    submit: 'Create account',
    haveAccount: 'Already have an account?',
    signIn: 'Sign in',
  },
  fields: {
    displayName: 'Name',
    displayNameHint: 'How we’ll address you in the app.',
    email: 'Email',
    password: 'Password',
    newPassword: 'New password',
    confirmPassword: 'Confirm password',
  },
  passwordRules: {
    title: 'Your password needs',
    minLength: 'At least 8 characters',
    letterAndNumber: 'At least one letter and one number',
    met: 'Requirement met',
    unmet: 'Requirement not met yet',
  },
  confirmEmail: {
    title: 'Confirm your email',
    body: 'We sent a confirmation link to {email}. Once confirmed, you can sign in.',
    backToSignIn: 'Back to sign in',
    useDifferentEmail: 'Use a different email',
  },
  forgot: {
    title: 'Reset your password',
    subtitle: 'We’ll email a link to choose a new password to the address you signed up with.',
    submit: 'Send reset link',
    sentTitle: 'Check your inbox',
    sentBody: 'If an account exists for {email}, a reset link will arrive in the next few minutes. Open it on this device.',
    backToSignIn: 'Back to sign in',
    resend: 'Send again',
  },
  reset: {
    title: 'Choose a new password',
    subtitle: 'Your new password replaces the old one.',
    submit: 'Save password',
    verifying: 'Verifying your link…',
    invalidTitle: 'This link is no longer valid',
    invalidBody: 'Reset links work once, for a limited time, and must be opened on the device where the reset was requested.',
    requestNew: 'Request a new link',
    missingTitle: 'Open the link from your email',
    missingBody: 'To choose a new password, open the reset link we emailed you.',
    success: 'Password updated',
  },
  language: {
    label: 'Interface language',
  },
};

export default messages;
