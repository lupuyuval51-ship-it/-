/** Translated labels for advisor domain values (actions, phases, priorities, relative times). */
import type { AdvisorAction } from '@domain/ai-api';
import { formatDate } from '@/i18n/format';
import type { TFunction } from '@/i18n/I18nProvider';
import type { Locale } from '@/i18n/types';
import { actionSubject } from './actions';
import { relativeTime } from './time';

export function actionLabel(t: TFunction, action: AdvisorAction): string {
  switch (action.type) {
    case 'add_task':
      return t('advisor.actions.addTask', { title: actionSubject(action) });
    case 'add_milestone':
      return t('advisor.actions.addMilestone', { title: actionSubject(action) });
    case 'add_recurring_expense':
      return t('advisor.actions.addRecurringExpense', { title: actionSubject(action) });
    case 'add_startup_cost':
      return t('advisor.actions.addStartupCost', { title: actionSubject(action) });
    case 'open_plan_section':
      return t('advisor.actions.openPlanSection', { title: t(`advisor.sections.${action.sectionKey}`) });
  }
}

export function relativeTimeLabel(t: TFunction, locale: Locale, iso: string, now: Date = new Date()): string {
  const r = relativeTime(iso, now);
  if (!r) return '';
  switch (r.kind) {
    case 'key':
      return t(r.key);
    case 'count':
      return t(r.key, { count: r.count });
    case 'date':
      return formatDate(r.date, locale, { style: r.sameYear ? 'short' : 'medium' });
  }
}
