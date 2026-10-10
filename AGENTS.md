# LEVEL UP engineering notes

Stack: Next.js 16 (App Router) · React 19 · TypeScript · Tailwind 4 · React Three Fiber · PostgreSQL + Prisma 7 · Zod 4 · Stripe.
Node ≥ 20.9. Commands, configuration and architecture are in `README.md`.

## Rules that are enforced (and tested)

- Plans, prices, allowances and graphics permissions live **only** in `src/config/plans.ts`. Never gate by price in the UI; the server enforces.
- Plus and Pro have the **same** Tier A graphics; Free gets Tier B/C. The tier is resolved on the server from the persisted plan, never taken from the client.
- Allowance credits are **reserved → committed/released** in the database (atomic conditional update, idempotency key, one in-flight job per user). A failed generation must never cost a credit.
- Game score, rewards, hints, attempts and completion are calculated **server-side from validated events**. The browser never receives answer keys, explanations or solutions before the server releases them.
- A payment never activates access unless it arrives through the verified billing pipeline (`src/server/billing`): Stripe signature verified over the raw body, idempotent by event id, price checked against the plan config. The dev simulator (`PAYMENTS_MODE=dev`) goes through the same pipeline, is labelled, and is refused when `APP_ENV=production`.
- Minor profiles are private by default. No open chat and no precise location (the region is a user-chosen billing region only).
- Hebrew/RTL is the default and English/LTR must stay functional: add every string to both dictionaries (`defineDict` fails the build on a missing key), use logical Tailwind properties (`ms-`/`me-`/`start-`/`end-`).
- Demo templates are never presented as AI output: games store `generatorKind` and the UI shows the label.
- No secrets in the client: no `NEXT_PUBLIC_*` variables, no keys in props. `.env` is never committed.
- AI output is untrusted: it must pass `validateGameSpec` (schema, cross-checks, solvability, sanitising) before it is stored or played. Nothing in a spec is executable.

## Offline Android app (`mobile/`, `android/`, `src/lib/offline`)

- A deliberate, documented exception: no server, so the reducer, answer keys and scoring run on the device. Keep it free of
  accounts, payments, AI keys and network calls (CSP `connect-src 'self'`). Never import server code (`server-only` throws in that bundle).
- Paid features there must use Google Play Billing, never Stripe. Generated games must still pass `validateGameSpec` and keep their `generatorKind` label.
- Run `npm run test:e2e:mobile` for changes that affect it.

## Working agreements

- Before calling work done run `npm run check` (typecheck + lint + unit/integration) and, for UI/gameplay/billing changes, `npm run test:e2e`. Report what was actually run; never claim an unrun test passed.
- Integration tests use the `levelup_test` database; never point them at real data.
- Changes to the database go through a Prisma migration (partial indexes / CHECKs are hand-written in SQL).

## Removed on purpose

The previous version of this file described the archived prototype in `legacy-demo/` (dependency-free Node runtime, a BASIC tier, "Daily 3D Quest",
manual bit payments approved by an admin, private proof files). The LEVEL UP rebuild specifies a different stack and exactly three plans
(Free / Plus / Pro) with Stripe billing, so those rules no longer apply and were dropped rather than kept as dead guidance.
