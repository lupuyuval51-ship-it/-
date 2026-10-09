import type { Request } from 'express';
import type { ZodError, ZodTypeAny, z } from 'zod';
import { badRequest } from '../lib/errors';

export interface ValidationIssue {
  path: string;
  code: string;
  message: string;
}

export function formatZodError(err: ZodError): ValidationIssue[] {
  return err.issues.map((i) => ({ path: i.path.join('.'), code: i.code, message: i.message }));
}

function parse<S extends ZodTypeAny>(schema: S, value: unknown): z.output<S> {
  const result = schema.safeParse(value);
  if (!result.success) throw badRequest('validation_error', 'Invalid input', { issues: formatZodError(result.error) });
  return result.data;
}

/** Validates and returns the JSON body. */
export const parseBody = <S extends ZodTypeAny>(schema: S, req: Request): z.output<S> => parse(schema, req.body ?? {});
/** Validates and returns query parameters (use z.coerce for numbers). */
export const parseQuery = <S extends ZodTypeAny>(schema: S, req: Request): z.output<S> => parse(schema, req.query ?? {});
/** Validates and returns route params. */
export const parseParams = <S extends ZodTypeAny>(schema: S, req: Request): z.output<S> => parse(schema, req.params ?? {});
