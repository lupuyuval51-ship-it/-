import type { Translations } from '../types';
import common from './common';
import nav from './nav';
import auth from './auth';
import errors from './errors';
import enums from './enums';
import onboarding from './onboarding';
import settings from './settings';
import dashboard from './dashboard';
import workouts from './workouts';
import session from './session';
import exercises from './exercises';
import nutrition from './nutrition';
import menu from './menu';
import coach from './coach';
import progress from './progress';
import achievements from './achievements';
import notifications from './notifications';
import legal from './legal';

export const en = {
  common,
  nav,
  auth,
  errors,
  enums,
  onboarding,
  settings,
  dashboard,
  workouts,
  session,
  exercises,
  nutrition,
  menu,
  coach,
  progress,
  achievements,
  notifications,
  legal,
};

export type Dictionary = Translations<typeof en>;
