import { z } from 'zod';
import { LIMITS } from '../constants';
import { cleanText, requiredText } from './common';

export const coachMessageSchema = z.object({
  content: requiredText(LIMITS.coachMessageMaxChars),
});

export const createThreadSchema = z.object({
  title: cleanText(120).default(''),
});
