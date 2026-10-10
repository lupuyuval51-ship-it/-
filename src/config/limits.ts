/** Operational limits: input sizes, rate limits and generation guard-rails. */

export const INPUT_LIMITS = {
  subjectMax: 120,
  goalMax: 500,
  notesMax: 500,
  nameMax: 60,
  passwordMin: 10,
  passwordMax: 128,
  emailMax: 254,
} as const;

/** Sliding-bucket rate limits: `max` requests per `windowSec`. Keys are namespaced per route and subject. */
export const RATE_LIMITS = {
  login: { max: 8, windowSec: 600 },
  loginPerIp: { max: 30, windowSec: 600 },
  register: { max: 5, windowSec: 3600 },
  generate: { max: 6, windowSec: 600 },
  gameEvents: { max: 240, windowSec: 60 },
  checkout: { max: 10, windowSec: 600 },
  account: { max: 30, windowSec: 600 },
  general: { max: 120, windowSec: 60 },
} as const;

export const SESSION_DAYS = 30;
export const SESSION_COOKIE = "levelup_session";
export const LOCALE_COOKIE = "levelup_lang";

/** After this many wrong attempts the answer is revealed with an explanation so a learner is never stuck. */
export const MAX_ATTEMPTS_PER_CHALLENGE = 3;
