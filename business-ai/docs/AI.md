# BUSINESS AI — AI layer (Edge Functions)

The AI features run in two Supabase Edge Functions (Deno 2). The app never talks to Anthropic and never
sees the API key. Contracts: `supabase/functions/_shared/domain/ai-api.ts` (request/response/SSE types),
`domain/plan.ts`, `domain/marketing.ts`, `domain/entitlements.ts` (quotas). Architecture: `ARCHITECTURE.md` §5.

| Function | Transport | Actions |
|---|---|---|
| `ai` | `POST` JSON → JSON | `plan.generate` (202, background), `plan.regenerateSection`, `roadmap.generate`, `roadmap.recommend`, `marketing.generate`, `finance.propose` |
| `advisor` | `POST` JSON → `text/event-stream` | contextual chat with proposed actions |

## 1. Code map (`supabase/functions/`)

```
ai/index.ts            Deno.serve entrypoint → handleAi (ai/handler.ts)
ai/handler.ts          auth → zod validation → config check → tier limits → dispatch
ai/actions.ts          one function per action (+ background plan generation, roadmap persistence)
advisor/index.ts       Deno.serve entrypoint → handleAdvisor (advisor/handler.ts)
advisor/handler.ts     auth → validation → ownership → reservation → SSE stream → persistence
_shared/config.ts      env configuration (injectable getter for tests)
_shared/deps.ts        injectable handler dependencies (config, provider factory, waitUntil, clock, ids)
_shared/http.ts        CORS (incl. OPTIONS), json(), errorResponse(), body size limit
_shared/errors.ts      AppError, status per AiErrorCode, PostgREST/SQLSTATE → AiErrorCode
_shared/auth.ts        user client (caller JWT, RLS) / service client, requireUser()
_shared/usage.ts       reserve → run → finalize (always, in finally), stale reservation release
_shared/context.ts     business context loaded through the USER client, truncated, rendered for prompts
_shared/outputs.ts     non-domain AI schemas + conversions (ids, minor units, trimming, action validation)
_shared/sse.ts         SSE encoding/writer (+ a parser used by tests)
_shared/runtime.ts     EdgeRuntime.waitUntil wrapper, jsonb helpers
_shared/ai/provider.ts      provider interface (complete = structured output, streamChat = advisor)
_shared/ai/anthropic.ts     Anthropic SDK implementation
_shared/ai/structured.ts    generateStructured(provider, {schema}) generic over a zod schema
_shared/ai/json-schema.ts   zod → structured-outputs JSON Schema
_shared/ai/pricing.ts       prices and cost math (USD micros)
_shared/ai/errors.ts        SDK error → AiErrorCode, AiCallError (carries consumed usage)
_shared/prompts/*.ts        system prompts: common (stable, cached), plan, roadmap, marketing, finance, advisor
tests/*_test.ts             Deno tests (unit + integration)
```

`supabase/functions/deno.json` is the import map for local checks/tests; `ai/deno.json` and `advisor/deno.json`
carry the same runtime imports because Supabase resolves dependencies per function. Keep the three in sync:

| Import | Version |
|---|---|
| `zod` | `npm:zod@4.6.7` |
| `@supabase/supabase-js` | `npm:@supabase/supabase-js@2.119.0` |
| `@anthropic-ai/sdk` | `npm:@anthropic-ai/sdk@1.4.0` (1.5.0/1.6.0 were < 24 h old and blocked by Deno's minimum dependency age policy when this was written) |
| `@std/assert` (tests only, root deno.json) | `jsr:@std/assert@1.0.19` |

## 2. Claude API usage

All calls go through `AnthropicProvider` (official SDK, `client.beta.messages.stream(...)` + `finalMessage()`):

- **Model** `AI_MODEL`, default `claude-opus-5-5`. Thinking is always on for this model, so no `thinking` parameter
  is sent (never `disabled` / `budget_tokens`). Depth is set with `output_config.effort`:
  `medium` for plan sections, section regeneration, roadmap, recommendations and the finance proposal; `low`
  for marketing and the advisor (`ai/actions.ts` `AI_BUDGETS`, `advisor/handler.ts` `ADVISOR_BUDGET`).
- **Never sent:** `temperature`, `top_p`, `top_k`, assistant prefill, forced `tool_choice` (`any`/`tool`).
- **Structured outputs:** `output_config.format = { type: 'json_schema', schema }`. The schema comes from the zod
  schema via `toStrictJsonSchema` (keeps `enum`/`const`/`anyOf`/`required`, sets `additionalProperties: false`,
  moves unsupported length/range/count keywords into the description as `Constraints: {...}`). The SDK's
  `zodOutputFormat` helper was not used because it also moves `enum`/`const` into descriptions. The response
  text is parsed and **re-validated with the zod schema**; any mismatch is `ai_invalid_output`.
- **Stop reasons:** `refusal` → `ai_refused` (422, `details.category` from `stop_details` when present);
  `max_tokens` → `ai_invalid_output` (502). Text is read from every `text` block in order; thinking and
  `fallback` blocks are ignored.
- **Refusal fallbacks:** every request sends `fallbacks: "default"` with beta `server-side-fallback-2026-07-01`
  (typed in the SDK's beta params; no body hacks needed). Cost is computed per attempt from `usage.iterations`.
- **Streaming:** every call streams (long outputs, no HTTP timeouts). The advisor forwards text deltas to the
  client as they arrive.
- **Prompt caching:** system = `[stable prompt (cache_control: ephemeral), task + locale]`. The stable prompt
  (`prompts/common.ts` `STABLE_SYSTEM_PROMPT`) contains no dates, ids or locale so its prefix is byte-identical.
- **Advisor tool:** one strict tool `propose_actions` (`strict: true`, `tool_choice: auto`). Its input is
  `AdvisorAction` without `id` (money in integer minor units) plus `follow_ups` (≤ 3). The prompt tells the
  model to call it at most once, at the end, only when concrete steps help. Input is validated per action
  with `AdvisorActionSchema` (invalid actions are dropped, never the reply), ids are assigned server-side,
  at most 5 actions. A tool call cut off by `max_tokens` is discarded. `eager_input_streaming` is left off so
  the API keeps validating strict tool input.
- **Client:** created with explicit `apiKey` (`ANTHROPIC_API_KEY`), `baseURL` (`AI_API_BASE_URL`, default
  `https://api.anthropic.com` — the ambient `ANTHROPIC_BASE_URL` is never used), `maxRetries`
  (`AI_MAX_RETRIES`) and `timeout` (`AI_TIMEOUT_MS`; for streams this bounds the wait for the response to start).
  SDK 1.x sends API version `2026-10-21` and the key as `Authorization: Bearer`.

## 3. Configuration

| Env | Default | Purpose |
|---|---|---|
| `ANTHROPIC_API_KEY` | — (required) | Secret. Missing → `503 not_configured` before anything is reserved or written. |
| `AI_MODEL` | `claude-opus-5-5` | Model for all features (recorded on usage rows, plan versions and messages). |
| `AI_API_BASE_URL` | `https://api.anthropic.com` | Override only for tests (fake server). |
| `AI_MAX_RETRIES` | `2` | SDK retries (408/409/429/5xx/connection). 0–10. |
| `AI_TIMEOUT_MS` | `120000` | Per request. 1000–900000. |
| `CORS_ALLOWED_ORIGINS` | empty (= `*`) | Optional comma-separated allow list. The API uses bearer tokens, no cookies. |
| `SUPABASE_URL`, `SUPABASE_ANON_KEY` (or `SUPABASE_PUBLISHABLE_KEY`), `SUPABASE_SERVICE_ROLE_KEY` (or `SUPABASE_SECRET_KEY`) | injected by Supabase | Clients. |

Template: `supabase/functions/.env.example`.

## 4. Actions, writes and status codes

Common order: CORS/method → `requireUser` (401) → body (64 KB max) + zod (400 `invalid_request` with
`details.issues`) → `ANTHROPIC_API_KEY` (503) → business through RLS (another user's id → 404 `not_found`) →
preconditions → **reserve usage** (429) → model → validate → persist → finalize usage.

| Action | Success | Writes (user JWT, RLS) | Preconditions / errors |
|---|---|---|---|
| `plan.generate` | `202 {planVersionId, status:'generating'}` | `ensure_business_plan`, `plan_versions` (origin `ai_generated`, model) → background: 15 `plan_sections` (upsert), version `ready` + `finance_proposal`, `business_plans.current_version_id`, `businesses.stage` idea→planning, first AI roadmap | 412 without a `business_idea` answer; 409 while another generation of this plan is running |
| `plan.regenerateSection` | `200 {sectionKey, content}` | none (proposal; the app saves it with `save_plan_section(..., 'ai')`) | 412 without a ready plan |
| `roadmap.generate` | `200 {phases, milestones, tasks}` | `replace_ai_roadmap` (replace mode, after the model succeeded), `roadmap_phases` upsert, `milestones`, `tasks` (`source 'ai'`), `task_dependencies` | 409 in `create` mode when AI tasks exist; 412 without a ready plan |
| `roadmap.recommend` | `200 {suggestions}` | none | — |
| `marketing.generate` | `201 {asset}` | `marketing_assets` (origin `ai`) | — |
| `finance.propose` | `200 {proposal}` | none | — |

Background generation (`plan.generate`): `EdgeRuntime.waitUntil` keeps the worker alive after the 202 (outside
the Edge Runtime the handler awaits the work). The three `PLAN_GENERATION_GROUPS` and the finance proposal run in
parallel; the first failing group aborts the others and the version becomes `failed` with `error_code` = the
public error code. The finance proposal is optional (a failure leaves `finance_proposal` null). Roadmap creation
afterwards uses its own `roadmap_generation` reservation and never affects the plan. The app polls the version.

Roadmap dates: `starts_on` = today (UTC) is stored on **all three** `roadmap_phases` rows (it is the roadmap's day
0); phase windows are days 0–30 / 30–60 / 60–90. `milestones.target_date` and `tasks.due_date` = `starts_on` +
`offset_days`. Dependency refs are resolved inside the payload; unknown, self, duplicate and cycle-creating
refs are ignored.

Finance proposal: the model answers in major units of `businesses.currency`; the server converts with
`toMinorUnits` and clamps to the DB ranges (money 0…1e13, growth −50…100 %, units 2 decimals).

### Advisor SSE

Request `AdvisorRequestSchema`. Errors before the stream starts (401/400/404/429/503) are JSON. Then:

```
event: meta     data: {"conversationId","userMessageId"}
event: delta    data: {"text"}                      (0..n)
event: actions  data: {"actions": AdvisorAction[], "followUps": string[]}   (always sent, may be empty)
event: done     data: {"assistantMessageId"}
— or —
event: error    data: {"code","message"}
```

Headers: `content-type: text/event-stream; charset=utf-8`, `cache-control: no-cache, no-transform`, CORS.
A `: keep-alive` comment is sent every 15 s. Order of work: business ownership and the conversation are checked
with the user client; `advisor_message` is reserved; a new conversation is created (title = first 60 chars of
the message) and the user message inserted with the service role; then context + the last 20 messages
(plain text, previously proposed actions rendered as a short note) are sent to the model. The assistant message
(content, actions, follow_ups, model, tokens) is inserted with the service role; on error it is stored with
`status 'error'` only when partial text exists. `last_message_at` is bumped by the DB trigger on insert. Client
disconnects abort the model call.

### Error codes

| Code | HTTP | Typical cause |
|---|---|---|
| `unauthorized` | 401 | missing/invalid JWT |
| `forbidden` | 403 | RLS/permission (42501) |
| `not_found` | 404 | business/conversation not visible to the caller |
| `invalid_request` | 400 | body/zod, check violation; 405 for non-POST |
| `conflict` | 409 | AI roadmap exists (create mode), generation already running |
| `precondition_failed` | 412 | missing business idea / plan |
| `quota_exceeded`, `cost_cap_reached` | 429 | `reserve_ai_usage` |
| `rate_limited` | 429 | Anthropic 429 (`Retry-After: 30`) |
| `ai_unavailable` | 503 | connection/timeout, 408/409/5xx/529, cancelled |
| `ai_refused` | 422 | `stop_reason: refusal` |
| `ai_invalid_output` | 502 | non-JSON, schema mismatch, `max_tokens`, nothing usable |
| `not_configured` | 503 | no key, Anthropic 401/403/404 (bad key / model) |
| `internal` | 500 | anything else (logged with operation, never returned) |

## 5. Cost controls and limits

- **Quotas & cap** (`domain/entitlements.ts`, tier from `current_tier()`): per-feature monthly calls (free:
  plan 2, section 10, roadmap 3, recommendations 10, advisor 30, marketing 10, finance 3) and a monthly cost cap
  (free 1.5 USD, pro 25 USD). `reserve_ai_usage` counts reserved+success rows atomically under a per-user lock,
  **before** the model is called. Error rows do not use quota but their cost counts towards the cap.
- **One reservation per user action:** `plan.generate` = one `plan_generation` for all four calls; the automatic
  roadmap = one `roadmap_generation`.
- **Always finalized** (`runReserved` `finally`): success or error, with input (incl. cache read/write) and output
  tokens and `cost_usd_micros`. Tokens of refused/invalid/truncated answers are billed (carried by `AiCallError`).
- **Pricing** (USD / 1M tokens = micros / token): `claude-opus-5-5` 4/20, `claude-sonnet-5-5` 2/10,
  `claude-haiku-5-5` 0.10/0.50; fallback targets `claude-opus-5` and `claude-opus-4-8` 5/25, `claude-sonnet-5`
  2/10; unknown → Opus 5.5. Cache reads 0.1×, cache writes 1.25× input. Rounded up to a whole micro.
- **Self-healing:** reservations still `reserved` after 15 min (worker killed by the runtime limit) are finalized
  as `error`/`stale_reservation` before the next reservation; `generating` plan versions older than 10 min are
  marked `failed` (`ai_unavailable`) on the next `plan.generate`.
- **Output budgets:** `max_tokens` 32 000 (plan group, roadmap), 16 000 (section, recommendations, marketing,
  finance), 8 000 (advisor). The cost cap is checked before a call, so one call can overshoot it slightly.
- **Input limits:** body 64 KB; advisor message 4 000 chars; instructions 1 000; rendered context ≤ 48 000 chars
  (idea 4 000, fields 1 500, plan: 6 statements × 400 chars per section, the section being rewritten in full up to
  1 500 chars per statement, 15 finance lines per type, 40 open tasks, 20 milestones, 10 goals, 6 months of
  actuals aggregated per month); history 20 messages × 2 000 chars; stored assistant content ≤ 40 000 chars.

## 6. Prompt-injection and data defenses

- All business data and free-text instructions are wrapped in `<business_data>` / `<user_request>`; tag-like
  sequences of those names inside the data are neutralized (`escapeData`), so data cannot close the envelope.
- The stable system prompt declares those blocks untrusted, says instructions inside them are ignored, forbids
  revealing the system prompt, and states the model cannot act — it only proposes.
- Honesty rules: no invented statistics/sources/research, numbers are estimates, validation steps included,
  basis labels (`user_provided` only for restated user input, `assumption`, `ai_estimate`; never `verified`).
- Outputs are schema-validated; the advisor's actions are only proposals executed by the app after a tap.
- Context is loaded only through the caller's RLS client; the service role is used solely for usage RPCs and
  advisor message inserts after the ownership check. No secrets in prompts. Logs contain codes and operation
  names only (no prompts, no user content).

## 7. Tests

```bash
cd business-ai
npm run check:functions        # deno check ai/index.ts advisor/index.ts
npm run test:functions         # deno test (unit + integration) — needs the local Supabase stack
cd supabase/functions && deno task test   # same, and reads keys with `supabase status` (--allow-run=supabase)
```

- `deno test` runs only `supabase/functions/tests/` (`deno.json` `test.include`); jest tests in
  `_shared/domain/` are excluded.
- Unit: pricing/cost math, error mapping, injection escaping, prompts, output conversions and action validation,
  JSON Schema compatibility, SSE encoding.
- Integration (`tests/integration_test.ts`): creates three users with the auth admin API, a business + onboarding
  through PostgREST as each user, starts the fake Anthropic server in-process on a random port and calls
  `handleAi` / `handleAdvisor` directly (background work awaited). Covers plan generation (15 sections, finance
  proposal, roadmap, usage), regeneration without writes, cross-user isolation (404), quota and cost cap (429),
  advisor SSE + persistence + history, refusal/invalid/truncated/rate-limit/auth error mapping, failed generation,
  concurrency guard, stale cleanup, roadmap modes, recommendations, marketing, finance. Users are deleted at the end.
  Keys: env `SUPABASE_URL`/`SUPABASE_ANON_KEY`/`SUPABASE_SERVICE_ROLE_KEY` → `supabase status` (if
  `--allow-run=supabase`) → the CLI's public local demo keys. `SKIP_SUPABASE_INTEGRATION=1` skips the suite.

### Fake Anthropic server (`e2e/fake-anthropic/server.mjs`)

Dependency-free Node server for tests only (production code never references it; it is reached only by setting
`AI_API_BASE_URL`). `PORT` (default 8787), `HOST` (default 0.0.0.0), `FAKE_ANTHROPIC_QUIET=1`,
`FAKE_ANTHROPIC_DELAY_MS`. It emulates `POST /v1/messages` (JSON and SSE), generates deterministic schema-valid
JSON for `output_config.format`, returns a `propose_actions` tool call when that tool is offered, answers in
Hebrew when the request contains Hebrew, and returns 400 for parameters the real API rejects (sampling params,
non-adaptive thinking, forced tool choice, prefill, `fallbacks` without the beta header, unsupported schema
keywords). Scenarios: API key `fake-key-invalid|rate-limit|overloaded|bad-request`; request text
`[[fake:refusal]]`, `[[fake:max_tokens]]`, `[[fake:invalid_json]]`, `[[fake:fallback]]`.

### Serving locally with the edge runtime

```bash
PORT=8787 node e2e/fake-anthropic/server.mjs &
cat > /tmp/ai.env <<'EOF'
ANTHROPIC_API_KEY=test-key-not-secret
AI_API_BASE_URL=http://host.docker.internal:8787
EOF
supabase functions serve --env-file /tmp/ai.env
# POST http://127.0.0.1:54321/functions/v1/ai  (Authorization: Bearer <user access token>)
```

The edge runtime downloads the npm packages on first boot. Behind a TLS-intercepting proxy the container fails
with `invalid peer certificate: UnknownIssuer`; seed its Deno cache volume
(`supabase_edge_runtime_<project>` → `/root/.cache/deno`) from the host cache
(`~/.cache/deno/npm/registry.npmjs.org`) or run without the proxy.

## 8. Deploy

```bash
supabase secrets set ANTHROPIC_API_KEY=sk-ant-...        # required
supabase secrets set AI_MODEL=claude-opus-5-5             # optional overrides (AI_MAX_RETRIES, AI_TIMEOUT_MS, CORS_ALLOWED_ORIGINS)
supabase functions deploy ai advisor
```

Never set `AI_API_BASE_URL` in production. Both functions keep JWT verification on (default) and verify the user
again with `auth.getUser()`.

## 9. Known limitations

- Background writes use the caller's JWT; a token that expires during a generation (default JWT lifetime 1 h,
  generation takes minutes) makes the version fail and the user can retry.
- Plan section inserts and the version status flip are separate statements (the DB guards make partial states
  harmless: a version only becomes `ready`/current after all sections were written).
- Roadmap persistence is not transactional: a DB failure mid-way can leave part of a new roadmap; rerun in
  `replace_ai_items` mode.
- Edge Function wall-clock limits (150 s free / 400 s paid) bound plan generation; interrupted generations are
  cleaned up as described in §5.
