/**
 * Request schemas for phone notifications (Web Push). The body is what the browser's
 * `PushSubscription.toJSON()` returns. Keys are normalized to unpadded base64url.
 * The server additionally checks the endpoint against its list of known push services.
 */
import { z } from 'zod';

const toBase64Url = (s: string) => s.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

/** HTTPS URL of a browser push service (opaque, per device). */
export const pushEndpoint = z
  .string()
  .max(1024)
  .url('invalid_endpoint')
  .refine((s) => s.startsWith('https://'), { message: 'invalid_endpoint' });

export const pushSubscribeSchema = z.object({
  endpoint: pushEndpoint,
  expirationTime: z.number().nonnegative().nullable().optional(),
  keys: z.object({
    // P-256 public key: 65 bytes (87 base64 characters without padding).
    p256dh: z.string().regex(/^[A-Za-z0-9_+/-]{87}=?$/, 'invalid_key').transform(toBase64Url),
    // Authentication secret: 16 bytes (22 base64 characters without padding).
    auth: z.string().regex(/^[A-Za-z0-9_+/-]{22}(==)?$/, 'invalid_key').transform(toBase64Url),
  }),
});
export type PushSubscribeInput = z.infer<typeof pushSubscribeSchema>;

export const pushUnsubscribeSchema = z.object({ endpoint: pushEndpoint });
export type PushUnsubscribeInput = z.infer<typeof pushUnsubscribeSchema>;

/** Test notification: to one of the caller's devices (`endpoint`) or to all of them. */
export const pushTestSchema = z.object({ endpoint: pushEndpoint.optional() });
export type PushTestInput = z.infer<typeof pushTestSchema>;
