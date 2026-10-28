import type en from '../en/nav';
import type { Translations } from '../types';

const nav: Translations<typeof en> = {
  dashboard: 'בית',
  workouts: 'אימונים',
  exercises: 'תרגילים',
  nutrition: 'תזונה',
  coach: 'מאמן',
  progress: 'התקדמות',
  profile: 'פרופיל',
  notifications: 'התראות',
  logout: 'התנתקות',
  mainNavigation: 'ניווט ראשי',
  skipToContent: 'דילוג לתוכן',
  activeWorkout: 'אימון פעיל',
  more: 'עוד',
};

export default nav;
