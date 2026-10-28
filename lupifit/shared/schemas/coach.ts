import { z } from 'zod';
import { LIMITS } from '../constants';
import { cleanText, intParam, requiredText, uuid } from './common';

/** Longest thread title (DB constraint). Auto-titles from the first message are shorter. */
export const COACH_THREAD_TITLE_MAX = 120;
/** Messages per page when reading a thread. */
export const COACH_MESSAGES_PAGE_DEFAULT = 50;
export const COACH_MESSAGES_PAGE_MAX = 100;

export const coachMessageSchema = z.object({
  content: requiredText(LIMITS.coachMessageMaxChars),
});

export const createThreadSchema = z.object({
  title: cleanText(COACH_THREAD_TITLE_MAX).default(''),
});

export const renameThreadSchema = z.object({
  title: requiredText(COACH_THREAD_TITLE_MAX),
});

export const coachThreadParamsSchema = z.object({
  id: uuid,
});

export const coachMessagesQuerySchema = z.object({
  /** Id of the oldest message already loaded; returns the messages before it. */
  before: uuid.optional(),
  limit: intParam(1, COACH_MESSAGES_PAGE_MAX).default(COACH_MESSAGES_PAGE_DEFAULT),
});

export type CoachMessageInput = z.infer<typeof coachMessageSchema>;
export type CreateThreadInput = z.infer<typeof createThreadSchema>;
export type RenameThreadInput = z.infer<typeof renameThreadSchema>;
