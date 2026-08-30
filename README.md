# LEVELUP AI

LEVELUP AI is a runnable first-version SaaS Demo for personalized, game-based learning. The default interface is Hebrew/RTL and includes English/LTR support, adaptive learning paths, tasks, XP, achievements, a Demo AI coach, a lazy-loaded WebGL Daily 3D Quest, Marketplace discovery, plan feature gates, manual bit payments, and an Admin review flow.

> **Demo boundary:** this repository is intentionally runnable with **zero third-party runtime dependencies**. External production services (PostgreSQL/Supabase, transactional email, a real AI provider, official payment provider, and real parental-verification service) are adapters/migration targets, not faked integrations.

## What works end-to-end

- Registration, login, logout, Demo email-verification behavior, forgot/reset password APIs.
- Birth-year collection and private-by-default profiles.
- Parent-consent gate for young accounts. Demo approval is explicit and clearly marked.
- Onboarding for skill, level, daily time, goal, target date, and learning styles.
- Eight distinct starter learning paths, each with 3 chapters and 6 concrete tasks.
- Task completion, evidence text/link, difficulty feedback, idempotent XP/coin rewards, progress, streaks, and achievements.
- Central AI service adapter: a safe Demo coach with per-plan message limits and hint-first behavior, upgraded to a real Claude coach and schema-validated personalized path generation when `AI_API_KEY` is set.
- Central plan feature matrix for Free / Basic / Plus / Pro.
- Daily game seed based on date/path/level, five game-mode templates, five world themes, WebGL scene, keyboard/touch input, pause-on-hidden-tab, low-performance mode, and 2D fallback when WebGL is unavailable.
- Server-created attempts, hidden answer keys, server-side score/reward calculation, sequence validation, duplicate-finish prevention, first/best attempt persistence.
- Free preview and hard server-side block on full 3D play; Basic+ full-game permission.
- Marketplace search/filter/favorites/reporting with data clearly marked Demo.
- Manual bit order flow, exact captured price, centralized phone number, proof upload validation, private proof storage, manual Admin approve/reject, audit history, no automatic activation, and permission refresh without re-login.
- Settings for display name, language, coach style, privacy and theme; data export and soft account deletion.
- PWA manifest and service worker.
- Responsive layout for phone/tablet/desktop, visible focus, semantic labels, reduced-motion support, and dark/light palettes.

## Requirements

- Node.js 20 or newer. Verified with Node.js 22.
- Chromium/Chrome is optional for visual QA.
- No `npm install` is needed for the verified Demo runtime.

## Local installation

```bash
cp .env.example .env
npm run dev
```

Open `http://localhost:3000`.

If your shell does not load `.env` automatically, export the values or run with environment variables directly. Every variable also has a safe Demo default.

## Demo accounts

| Role | Email | Password | Plan |
|---|---|---|---|
| Free user | `demo@levelup.local` | `Demo1234` | Free |
| Basic user | `basic@levelup.local` | `Basic1234` | Basic |
| Admin | `admin@levelup.local` | `Admin1234` | Pro / Admin |

These are Demo-only credentials. Never deploy them unchanged.

## Commands

```bash
npm run dev        # start server on PORT (default 3000)
npm run typecheck  # syntax/type-contract gate for all JS modules
npm run lint       # security/release scan
npm test           # integration tests
npm run build      # create dependency-free dist/
npm run test:dist  # boot dist/ and check health
node scripts/reset-demo.mjs
```

## Environment variables

```env
BIT_PAYMENT_PHONE=0526262828
BIT_PAYMENT_URL=
BASIC_MONTHLY_PRICE_NIS=9
PLUS_MONTHLY_PRICE_NIS=19
PRO_MONTHLY_PRICE_NIS=39
DEMO_MODE=true
DATABASE_URL=
AI_API_KEY=
AI_PROVIDER=anthropic
AI_MODEL=claude-opus-5
APP_URL=http://localhost:3000
SESSION_SECRET=change-me-in-production
PORT=3000
```

`BIT_PAYMENT_URL` must be a real verified HTTPS payment URL. If it is empty, the product **does not invent a bit deep link** and instead displays manual instructions.

## Manual bit payment process

1. User chooses Basic, Plus or Pro.
2. Server creates a unique order and captures the plan price at that moment.
3. UI displays the exact amount, centralized `BIT_PAYMENT_PHONE`, and order number.
4. User transfers manually in bit and includes the order number in the note.
5. User uploads PNG/JPG/WEBP/PDF proof, max 5MB.
6. Order becomes `under_review`.
7. Access remains unchanged.
8. Admin views the private proof and approves or rejects.
9. Approval creates an active 30-day subscription, updates the profile plan, records the approver/time and audit action, and adds a user notification.
10. The next `/api/auth/me`/dashboard refresh returns the new feature permissions without a new login.

The payment service is isolated in `src/payment.js` so an official provider can replace the manual adapter later.

## Database

The verified Demo uses `data/db.json` with atomic temp-file writes. This makes the project runnable offline and with no database service.

For production, use PostgreSQL/Supabase. `docs/schema.sql` contains the requested table family, indexes and starter RLS policies, including users/profiles, parental consents, plans/features/subscriptions, learning content and enrollments, task submissions, coach messages, skills, XP/achievements/streaks, friends/challenges, Marketplace, Daily Games/events/leaderboards, inventory, orders/proofs, notifications/reports and admin actions.

### Production migration

1. Provision PostgreSQL/Supabase.
2. Run `docs/schema.sql` in a migration pipeline.
3. Expand and review RLS for every user-owned table.
4. Replace `src/store.js` with a repository adapter; keep API/business rules unchanged.
5. Store proof/task files in a private bucket and issue short-lived signed URLs only after authorization.

## AI setup

`src/ai.js` is the central service adapter. It includes a real Anthropic (Claude) provider used in two places: the **coach** and **learning-path generation**.

1. Set `AI_API_KEY` in `.env` (an Anthropic API key; `ANTHROPIC_API_KEY` also works). `AI_PROVIDER` defaults to `anthropic` and `AI_MODEL` defaults to `claude-opus-5`.
2. **Coach** — when the key is present, `/api/coach` calls the Claude Messages API server-side (hint-first system prompt, per-plan daily limits enforced before the call, last 10 messages as context, server-side refusal fallbacks enabled). Responses are marked `demo:false`.
3. **Path generation** — `/api/onboarding` asks Claude for a personalized path (3 chapters × 2 tasks) constrained by a JSON schema via `output_config.format`. The result is normalized server-side and stored in `generated_paths`.
4. Without a key, or on any provider error/refusal/invalid payload, both features fall back: the coach to the deterministic Demo reply (`demo:true`), onboarding to the built-in `pathTemplates`.

### Trust boundary for generated paths

The model never sets anything that affects economy or access. The request schema has no reward fields, and the server assigns:

- **XP and coins** by chapter position (90/110/140 XP; coins = XP/6), so a path cannot inflate its own rewards.
- **Task and chapter ids** (`ai-<chapter>-<n>`), so ids stay stable and collision-free.
- **Slug, difficulty, duration and daily minutes** from the user's onboarding input, not from model output.

Every model-produced string is passed through `safeText` (strips `<>` and control characters, clamps length), quiz `answerIndex` is range-checked against the options actually present, and a path that fails normalization is discarded in favour of a template. Generated paths are private: `/api/path/:slug` returns 404 unless the caller is enrolled (or an admin).

Daily 3D Quest questions are **not** model-generated — they stay in the server-owned catalog so scoring remains server-authoritative.

5. Never execute model-generated code outside a sandbox.

## Daily 3D Quest

The browser imports `public/game.js` only after entering the game page and starting a permitted attempt. Dashboard pages do not load the WebGL engine.

The engine provides five template modes:

- Answer Gates
- Knowledge Escape Room
- Collect and Sort
- Build the Path
- Boss Quiz

The verified first version shares one modular WebGL foundation with mode-specific geometry, interactions and progression for all five templates. Five visual world themes are selected deterministically from the daily seed. The renderer uses lightweight primitives rather than unlicensed 3D assets.

### Add a world

Add a world entry in `src/catalog.js`, then extend the visual palette/objects in `public/game.js`. Keep the same server game definition and validation contract.

### Add a game mode

Add a mode in `src/catalog.js`, add a mode-specific interaction state in `public/game.js`, and keep question/event validation in `src/game.js` so clients cannot award their own score.

## Safety for minors

- Birth year is collected during registration.
- Young accounts create a parental-consent requirement.
- Profiles are private by default.
- No exact location or personal phone is exposed.
- No open chat between adults and minors exists.
- Marketplace has reporting.
- Uploads and payment proofs are not public static files.
- Leaderboards use display names only.
- The product does not buy correct answers or score advantages.

**Production note:** Demo parent approval is not sufficient for a real service. Connect a compliant parental-verification/legal flow appropriate to the launch jurisdictions.

## Security controls included

- Server-side authorization and feature gates.
- Scrypt password hashing.
- Signed HttpOnly/SameSite session cookie.
- Per-session CSRF token on mutations.
- CSP, frame protection, content-type protection and Permissions Policy.
- Basic IP rate limiting on sensitive auth routes.
- User-row isolation in all Demo API lookups.
- Input sanitation/length limits.
- Private upload directory and admin-only proof retrieval.
- File type/size validation.
- Server-validated game attempts and idempotent rewards.
- Admin role checks, duplicate approval prevention and audit actions.
- Soft account deletion and data export.

Before a public launch, add a production WAF/rate limiter, secure secret manager, database RLS review, malware scanning for uploads, email deliverability, observability, backup/restore and an independent security review.

## PWA

`public/manifest.webmanifest` and `public/sw.js` cache the core shell. API mutations remain online/server-authoritative. The app shows an Offline banner when connectivity is lost.

## Typography

The product CSS uses the approved `Heebo` font family name first, then Arial/sans-serif fallbacks. No font binary is bundled in this deliverable. For production, self-host a properly licensed Heebo webfont or use an approved font CDN and update CSP; this avoids silently redistributing font files.

## Deployment

The Demo can run on any Node host with persistent disk:

```bash
npm run build
cd dist
SESSION_SECRET='a-long-random-production-secret' DEMO_MODE=true node server.js
```

For a real public deployment, use PostgreSQL/private object storage rather than the JSON file and set `DEMO_MODE=false` only after real email, parent-verification and AI integrations are configured.

## Known first-version limits

- Demo persistence is a local JSON file, not multi-instance safe.
- Email verification/reset tokens are surfaced only in Demo; no email provider is wired.
- Google OAuth is architecture-ready but not active because no provider credentials/service were supplied.
- AI is a clearly labeled deterministic Demo adapter until `AI_API_KEY` is configured; with a key, the coach and path generation call Claude, and every other flow stays server-owned.
- bit is intentionally manual. No automatic bit settlement/API is claimed.
- Paid Marketplace purchases use the same manual bit review flow and approved purchases unlock an enrollment; automatic creator payouts are not included.
- Creator Studio, friend challenges and advanced league/season administration are data-model foundations rather than a full production social network.
- The five game modes share the same verified low-weight WebGL foundation in v1; additional mode-specific art/physics can be added through the template contract.
- The main runtime is dependency-free rather than Next.js/React because this environment could not install external packages. The architecture separates server, UI, game, AI and payment concerns so migration to Next.js/Supabase can be done without changing business rules.

## Production checklist

- Replace Demo credentials and `SESSION_SECRET`.
- Connect PostgreSQL/Supabase and private storage.
- Review RLS and legal requirements for minors.
- Connect transactional email and optional Google OAuth.
- Connect approved AI provider and schema validation.
- Provide only a verified `BIT_PAYMENT_URL`, or keep manual instructions.
- Add malware scanning and signed file delivery.
- Run accessibility audit with assistive technology.
- Run independent security/privacy review and jurisdiction-specific legal review.
