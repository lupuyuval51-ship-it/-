# No sign-up, Claude API, and payment-scaled AI limits — September 2026

Three product changes, applied together because they touch the same seam: who a learner is,
which model answers them, and how much of it they get.

## 1. Registration removed

There is no sign-up form, no email verification, no password reset and no parent-consent link.
`POST /api/auth/guest` opens a complete server-side account and returns a 365-day session cookie.
Calling it again with a live cookie resumes the same account instead of stranding the old one.

| Removed | Replaced by |
|---|---|
| `auth/register`, `auth/verify`, `auth/forgot`, `auth/reset`, `auth/parent`, `auth/resend` | `auth/guest` |
| `register()`, `issueToken()`, `consumeToken()`, `userMail()` | `guestSession()` |
| `nodemailer` dependency, `SMTP_*` / `MAIL_FROM` config | nothing — no mail is sent at all |
| Registration-time year of birth and parent-consent gate | a year of birth stated in settings |
| Registering, then promoting, an administrator | `scripts/promote-admin.mjs` creates the staff account and issues a one-time password |

**Safety did not come off with the form.** Registration used to be where the app learned a
learner's age, and every minor-safety gate hung off it. With no form there is no stated age, so
an account now **fails closed as a minor** until settings says otherwise: the profile is forced
private, a purchase needs an explicit payer authorization, and publishing a paid path is blocked.
`isAdult()` — shared by server and client — treats a missing or implausible year as a minor. This
is stricter than the old behaviour, where an unverified self-declared year unlocked adult actions
immediately.

**Two consequences worth stating plainly.** A learner who clears browser data loses the account
permanently; the landing page says so before the first click. And because accounts open with no
form, bulk creation is rate-limited rather than prevented — `GUEST_HOURLY_LIMIT` (500/hour
server-wide) plus `GUEST_NETWORK_LIMIT` per address when `TRUST_PROXY=true`.

`/login` survives as staff sign-in only. Learner accounts carry a random 64-byte password nobody
holds, so no learner account can ever be signed into by password — asserted in the test suite.
Account deletion, which required a password, now accepts an explicit confirmation from a guest.

## 2. AI provider is the Claude API

`OpenAIJsonProvider` → `ClaudeJsonProvider`, on the official `@anthropic-ai/sdk`.

- Default model `claude-opus-5`, adaptive thinking, `AI_EFFORT` exposed for the operator.
- Structured output via `output_config.format` built with `zodOutputFormat`, so the same Zod
  schema constrains the model *and* validates the reply. Both layers still run.
- `maxRetries: 0` on the SDK client — `validatedAI` owns the retry policy, so one logical
  request can never be billed twice.
- Reasoning shares the response budget, so `max_tokens` is 3× the requested content (floor 8K).
  Per-attempt timeouts were raised accordingly: coach 25s → 60s, arena 45s → 90s, path 60s → 150s.
- `stop_reason: "refusal"` is handled explicitly rather than read as empty content.
- A key set alongside a foreign `AI_PROVIDER` fails with a visible 503 instead of quietly
  serving Demo content — the old code had the same intent and this preserves it.

`ANTHROPIC_API_KEY` is the primary variable; `AI_API_KEY` still works. The test runner now strips
`ANTHROPIC_*` as well as `AI_*`, so a suite run can never spend real credits.

## 3. Daily AI allowance follows the amount paid

The limits were hardcoded per tier, which meant a Basic subscriber paying ₪9 got exactly the same
8 coach messages a day as a free account. They are now derived:

```
coach messages/day  = AI_FREE_DAILY_MESSAGES + (amount paid × AI_MESSAGES_PER_NIS)
game generations/day = AI_FREE_DAILY_GAMES   + (amount paid × AI_GAMES_PER_NIS)
```

| Plan | Paid | Coach/day (was) | Games/day (was) |
|---|---|---|---|
| Free | ₪0 | 8 (8) | 1 (1) |
| Basic | ₪9 | 31 (8) | 4 (3) |
| Plus | ₪19 | 56 (30) | 7 (6) |
| Pro | ₪39 | 106 (100) | 13 (12) |

"Amount paid" is the amount captured on the approved order backing the active subscription, not
today's list price. So an administrator changing a price moves new subscribers only — anyone who
already paid keeps the allowance they bought. Feature access (3D worlds, active-path count,
history depth) stays tier-based; only the metered AI spend follows the money. The earned figure
is shown in Settings beside the plan.

## Verification

- `pnpm typecheck`, `pnpm lint`, `pnpm build` — clean.
- `pnpm test` — **76 passed**. New and rewritten coverage: an account opening with no form and
  resuming on repeat; every removed auth route returning 404; a guest's unusable password hash;
  guest deletion by confirmation; an unstated age staying minor-safe while a stated adult year
  unlocks a public profile and a purchase; the Claude transport shape (endpoint, model, json_schema
  format, thinking, reasoning headroom, no key in the body); a refusal stop reason failing safely;
  and a foreign `AI_PROVIDER` failing loudly.
- `pnpm test:e2e` — **8 passed**, including the rewritten landing-page journey.
- Manual pass over a production build in Chromium: opened an account from the landing page with
  one click (birthYear 0, privacy private, 8 messages/day), completed onboarding, stated 1990 in
  settings, bought Plus at ₪19, approved it as the Demo admin, and confirmed the allowance moved
  to 56 messages and 7 generations a day. `/login` shows staff sign-in only. No console errors
  beyond the expected pre-login 401 on `/api/state`.

## Known gaps left open

- No account recovery exists by design. If durable identity is wanted later, the natural addition
  is an optional "claim this account" step that attaches an email to an already-open guest account,
  rather than restoring a sign-up wall.
- Age is self-declared with no verification, as before.
- The per-shekel rates are message counts, not token cost. A learner sending very long messages
  costs more than one sending short ones at the same allowance; moving to a token budget would
  close that gap if real usage shows it matters.
