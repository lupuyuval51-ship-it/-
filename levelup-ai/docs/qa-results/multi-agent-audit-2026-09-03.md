# Multi-agent audit and fixes — 3 September 2026

An 11-way parallel audit over every subsystem, followed by fixes for the confirmed
critical and high findings. Several of the worst items were in code landed the same day.

## How the audit actually went

Worth recording honestly, because the raw numbers are misleading:

- **Run 1** died immediately — every finder hit `API 529 Overloaded`. Stopped rather than
  letting it return an empty result. The script was then hardened so a transient failure
  retries once and an unrecoverable loss is logged in `lost_agents` instead of vanishing.
- **Run 2** completed **8 of 11 finders** (75 findings) and then hit the account's session
  limit; the verification and sweep phases never ran. 464 agents errored.
- The workflow reported `confirmed: 0, refuted: 75`. **That was a bug in my own script**, not a
  verdict: with zero votes, `keeps.length >= 2` is false, so it labelled every finding "refuted".
  Nothing was refuted, because nothing was verified.
- Verification was therefore done by hand, reading the code for each finding before acting.
  That immediately paid off: the finding claiming *"path generation asks 36 000 max_tokens, above
  the non-streaming ceiling, so every live Claude call fails"* was **wrong about the mechanism** —
  the SDK guard is `if (!body.stream && timeout == null)` and we pass an explicit client timeout,
  so it never fires. The real defect underneath was different and milder (see AI transport below).
- Three subsystems never got a finder: **performance, tests/docs/deploy, data-integrity/migrations**.
  They are unaudited, not clean.

## Fixed

### Security

| Finding | Fix |
|---|---|
| `POST /api/auth/*` had no limit an attacker could not sidestep. `clientNetworkAddress()` returns null unless `TRUST_PROXY=true`, so the bucket key fell back to the caller-supplied email — a fresh address per request minted a fresh bucket. `login()` then ran `scryptSync` even for unknown accounts (anti-enumeration), **measured at 53.8 ms of blocking CPU** on Node's single thread. ~19 req/s stalled the whole app, unauthenticated. | Bounded the identifier to 254 chars before it becomes a `rate_limits` primary key (it was unbounded up to the 1 MB body cap), and added a route-wide ceiling nothing can sidestep: `AUTH_LOGIN_LIMIT` 30/15 min for the scrypt-bearing staff route, `AUTH_ROUTE_LIMIT` 600 elsewhere. |
| The demo game coach handed out the **answer key for a scored daily quest**. The protection was inverted: during a live question it returned a bounded hint, but *before* an attempt started it fell through to returning `question.explanation`, which states the correct answer. Harvest all eight, then play for a perfect score, XP, coins, leaderboard and the `perfect-game` achievement. The Claude path was already clean — it only sends `{prompt, topic}`. | Explanations now require a `completed` attempt on that game. Reviewing your mistakes afterwards still works; mining answers beforehand returns the bounded hint. |
| `guest-total` was a single global hourly bucket, so **500 anonymous requests locked every real visitor out of opening an account for an hour** — the brake was itself a kill switch. (Landed the same day.) | Replaced with a short burst window (`GUEST_BURST_LIMIT`, 60/min): an attacker can saturate it, but recovery is a minute, not an hour. Documented that real protection needs `TRUST_PROXY` behind a proxy. |

### Data integrity

| Finding | Fix |
|---|---|
| The daily reward's idempotency key was `('daily-game', dayIn(profile.timezone, started_at))`, and **the learner edits their own timezone**. Finish in Jerusalem, switch to `Pacific/Kiritimati`, and the same instant maps to a different date string — the "already rewarded" lookup misses and XP is granted again. Attempt quotas had the same hole. | Quota and reward boundaries are now server-authoritative UTC (`quotaDay`). The learner's zone still selects *which* quest they see — content freshness, not a reward — and `nextResetAt` now reports the boundary the quota actually uses. |
| A creator was charged full price to buy **their own** marketplace path: `paymentAdapter.create` checked the listing exists, is approved, priced and unpurchased, but never that `creator_id !== userId` — while `enroll()` already exempts the creator and `catalog()` already gives them full content. | Rejects with `ALREADY_OWNED` before an order row is written. |
| `submitTask` wrote `status = 'active'` unconditionally, silently **un-pausing a paused enrollment**. Pausing is the documented way to stay under `maxActivePaths`, so completing a task could push a learner over their own plan cap. | Preserves `paused`; only completion overrides it. |

### Reliability and UX

- **AI transport.** `responseBudget` asked for 36 000 tokens on path generation against a 150 s
  timeout. The SDK's own heuristic sizes such a request at ~17 minutes, so live generation timed
  out opaquely, retried once, and surfaced `AI_GENERATION_UNAVAILABLE`. Now **streamed**
  (`messages.stream().finalMessage()` carries the same `parsed_output` contract as `parse()`),
  the budget is capped at 32 000 (2.5× content), and the path timeout is 240 s.
- **Signed-out routing.** Any private route rendered the marketing page *inside the signed-in
  shell* — sidebar, plan badge, streak and logout, all wired to a `state` that did not exist.
  Signed-out is now public everywhere and renders bare, while a signed-in learner still gets the
  app shell on `/pricing` and `/marketplace`.
- **Silent account-opening failures.** Four of five `start()` call sites let a 429 reject
  unhandled, leaving a button that did nothing. `start()` now reports its own failure and resolves
  to `null`; every caller checks.
- **Checkout modal destroyed mid-purchase.** Opening an account on `/pricing` swapped the tree and
  remounted `useCheckout`, discarding the payer-authorization modal. The pending purchase now
  survives in `sessionStorage`.
- **Stale settings form.** `update()` spread a captured `form`, so an awaited avatar upload wrote
  back a pre-upload snapshot and silently reverted every edit made while it was in flight.
- **Hebrew-only errors for English readers.** The router localizes from `x-levelup-locale`, which
  the client never sent, so every pre-account failure reached an English reader in Hebrew.
- **Arrows pointed backwards in English.** The design is Hebrew-first, so "forward" is drawn as
  `ArrowLeft`; only `.back-link` was direction-aware. One CSS rule now mirrors directional lucide
  icons under `[dir="ltr"]`, excluding the back link.
- **Delete dialog told passwordless learners to enter a password** — the checkbox branch was
  right, the warning text above it was the pre-guest string.

## Verification

- `pnpm typecheck`, `pnpm lint`, `pnpm build` — clean.
- `pnpm test` — **86 passed** (76 + 10 new across both batches). Each new test was confirmed to **fail against the
  unfixed code**; the first version of the timezone test passed even when reverted, so it was
  rewritten to drive `finishGame` directly rather than stopping at `startGame`.
- `pnpm test:e2e` — 8 passed.
- Browser pass over a production build: signed-out `/dashboard` renders bare (sidebar 0,
  landing 1), English gets `matrix(-1,0,0,1,0,0)` on forward arrows, signed-in `/pricing` keeps
  the app shell, and the delete dialog no longer mentions a password.

## Second batch — 4 September

Continued from the same 75-finding set. Each was verified by reading the code first, which
changed the outcome twice: one finding was rejected as wrong about intent, and one fix was
withdrawn after its own tests showed it broke a coupling the finder had not considered.

| Finding | Fix |
|---|---|
| `deleteAccount` soft-deleted the `payment_proofs` rows but **never removed the files**. A payment screenshot carries a bank reference and a name, and it outlived the account indefinitely. | Storage names are collected inside the transaction and unlinked after it commits; the audit entry records how many files went. |
| A learner with **no stated adult year** was forced to a private profile but could still opt into the public leaderboard and publish their display name. That contradicts the app's own minor-safety posture. | The leaderboard opt-in is now refused for non-adults exactly as `privacy` is, existing rows are cleared, and `finishGame` re-checks before writing a row. |
| The output filter for dosages, training loads and securities **only ran when the input had been classified health or finance**. A topic classified `general` whose generated content drifted into "the recommended dosage is…" passed untouched. | Split the pattern: explicit medical and securities directives are refused unconditionally, while bare units like "5 kg" — legitimate in a general path — stay gated on the restricted domains. |
| The admin reports tab read `r.pathId` off a raw `SELECT *` row, so the reported path was **always blank**. | `adminData()` maps reports to camelCase like every other collection it returns. |
| `validatedAI`'s empty `catch` discarded the failure class, so a **rejected API key was indistinguishable from schema drift** — and the retry spent a second call on a credential that could never work. | The failure class is preserved and logged (never the content), and an authentication or permission error breaks out instead of retrying. |
| The 20 s state poll **swallowed a 401**, leaving a signed-in shell driving a session the server had already dropped; every later action failed with no explanation. | A failed poll now probes `/api/health` first — so a network blip never signs anyone out — and clears the session only on a confirmed 401. |
| A daily quest drew 8 questions from a 6-question pool, so two were **verbatim repeats whose explanation the learner had already read**. | The overflow slots are labelled as review, matching how `generateGameDraft` already presents a repeat. |

**Two corrections worth recording.** The finding that *"`generateGame` enforces no plan
entitlement, so a FREE account spends a paid Claude generation on a game it can never start"* was
**rejected**: a Free preview is deliberate product design, pinned by
`mobile-arena.e2e.spec.ts:221`. And the first attempt at the repeated-question fix shortened the
quest to the pool size — four tests immediately failed, because the arena is built around
`waveCount: z.literal(8)` and a 6-question quest desyncs it. The fix was withdrawn and replaced.

## Not fixed — open

- **Three subsystems were never audited**: performance, tests/docs/deploy, data-integrity and the
  PostgreSQL migrations. The migration files in particular have not been checked against the
  guest / `birth_year = 0` change or the paid-amount join.
- **~45 medium and low findings remain untriaged** in the raw audit output, including:
  `assertGameAccess` not checking marketplace purchase; `deleteAccount` leaving in-flight orders
  open; `parental_consents` surviving as a dead PII table; `GamePlayer` mixing the server clock
  with the device clock; a latched submit error that can make a run unfinishable; several ARIA
  patterns declared but not implemented; unbounded order queries; the admin console's shared,
  never-cleared review-note field.
- A guest account keeps its Hebrew default display name after switching to English until renamed
  in settings.
