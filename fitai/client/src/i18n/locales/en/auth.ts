const auth = {
  login: {
    title: 'Welcome back',
    subtitle: 'Log in to continue your training',
    submit: 'Log in',
    noAccount: "Don't have an account?",
    register: 'Create one',
    forgot: 'Forgot password?',
  },
  register: {
    title: 'Create your account',
    subtitle: 'Personalized training and nutrition in minutes',
    submit: 'Create account',
    haveAccount: 'Already have an account?',
    login: 'Log in',
    ageNote: 'You must be at least 13 years old to use FITAI.',
    terms: 'By creating an account you agree to use FITAI for general fitness guidance only.',
  },
  fields: {
    email: 'Email',
    password: 'Password',
    newPassword: 'New password',
    currentPassword: 'Current password',
    displayName: 'Name',
    passwordHint: 'At least 8 characters, including a letter and a number.',
    showPassword: 'Show password',
    hidePassword: 'Hide password',
  },
  forgot: {
    title: 'Reset your password',
    subtitle: "Enter your email and we'll send you a reset link.",
    submit: 'Send reset link',
    sent: 'If an account exists for that email, a reset link has been sent. It is valid for 30 minutes.',
    emailNotConfigured: 'Note: email delivery must be configured by the server administrator.',
    backToLogin: 'Back to log in',
  },
  reset: {
    title: 'Choose a new password',
    submit: 'Update password',
    success: 'Your password was updated. You can log in now.',
    missingToken: 'This reset link is incomplete. Request a new one.',
  },
  loggedOut: 'You have been logged out.',
  sessionExpired: 'Your session expired. Please log in again.',
};

export default auth;
