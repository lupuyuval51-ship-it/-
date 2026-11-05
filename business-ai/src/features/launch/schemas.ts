/**
 * Launch checklist item form (react-hook-form + zod). Messages are translation keys
 * (see src/lib/forms.ts → useFieldError).
 */
import { z } from 'zod';
import type { Locale } from '@/i18n/types';
import { fieldMessage } from '@/lib/forms';
import { displayLaunchItem, type LaunchItem } from './logic';
import { LAUNCH_CATEGORIES, LAUNCH_STATUSES, type LaunchCategory, type LaunchStatus } from './templates';

const HTTP_URL = /^https?:\/\/[^\s/$.?#][^\s]*$/i;

export const LaunchItemFormSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(1, fieldMessage('errors.field.required'))
      .max(200, fieldMessage('errors.field.tooLong', { max: 200 })),
    description: z.string().trim().max(4000, fieldMessage('errors.field.tooLong', { max: 4000 })),
    category: z.enum(LAUNCH_CATEGORIES),
    status: z.enum(LAUNCH_STATUSES),
    notes: z.string().trim().max(2000, fieldMessage('errors.field.tooLong', { max: 2000 })),
    sourceName: z.string().trim().max(200, fieldMessage('errors.field.tooLong', { max: 200 })),
    sourceUrl: z
      .string()
      .trim()
      .max(500, fieldMessage('errors.field.tooLong', { max: 500 }))
      .refine((v) => v === '' || HTTP_URL.test(v), fieldMessage('launch.form.sourceUrlInvalid')),
  })
  .refine((v) => v.sourceName === '' || v.sourceUrl !== '', {
    path: ['sourceUrl'],
    message: fieldMessage('launch.form.sourceUrlRequired'),
  });

export type LaunchItemFormValues = z.input<typeof LaunchItemFormSchema>;
export type LaunchItemFormOutput = z.output<typeof LaunchItemFormSchema>;

export function emptyLaunchItemForm(category: LaunchCategory = 'other'): LaunchItemFormValues {
  return { title: '', description: '', category, status: 'todo', notes: '', sourceName: '', sourceUrl: '' };
}

/** Form values for an existing item (unedited template text in the current language). */
export function launchItemToForm(item: LaunchItem, locale: Locale): LaunchItemFormValues {
  const display = displayLaunchItem(item, locale);
  return {
    title: display.title,
    description: display.description,
    category: item.category,
    status: item.status,
    notes: item.notes,
    sourceName: display.sourceName ?? '',
    sourceUrl: display.sourceUrl ?? '',
  };
}

export interface LaunchItemPatch {
  title: string;
  description: string;
  category: LaunchCategory;
  status: LaunchStatus;
  notes: string;
  source_name: string | null;
  source_url: string | null;
}

/** Validated form → DB columns (empty source fields become null, as the CHECKs require). */
export function formToLaunchPatch(values: LaunchItemFormOutput): LaunchItemPatch {
  return {
    title: values.title,
    description: values.description,
    category: values.category,
    status: values.status,
    notes: values.notes,
    source_url: values.sourceUrl === '' ? null : values.sourceUrl,
    source_name: values.sourceName === '' ? null : values.sourceName,
  };
}
