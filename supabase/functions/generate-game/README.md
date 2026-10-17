# `generate-game`: LEVEL UP AI for the Android app

Supabase project **levelup-ai** (`zfkjkbyzurhidhpkzpxr`), Edge Function `generate-game`, `verify_jwt = false`
(the caller's token comes from the app's project, **levelup-app**, so the function checks it itself).

What it does, in order (source and tests: `src/server/ai/edge/generate-game.ts`, `tests/unit/ai-edge*.test.ts`):
1. Only `POST` from the app's WebView origins; a `levelup-app` sign-in is required (`/auth/v1/user` of that project).
2. The body is a generation request (`generationRequestSchema`). Topic-library games and extensions are refused: the
   phone builds those itself, without AI.
3. Without an AI key it answers `503 AI_UNAVAILABLE` and nothing is used.
4. One game at a time per learner and `AI_DAILY_LIMIT` (default 5) per 24 hours, reserved in `public.ai_requests`
   (`supabase/ai/migrations/`). A failed generation releases its slot: it never costs anything.
5. The same pipeline as the website's server (prompts, repair loop, `validateGameSpec`), then `clampToFeatureTier`
   (`AI_FEATURE_TIER`, default `A`), `fitForDevice(…, "phone")` and `validateGameSpec` once more. The answer is the
   validated spec, labelled `generator.kind = "ai"`; the app validates it again before saving it.

## Secrets (Edge Functions → Secrets of levelup-ai; never in the app, never in the repo)

| Name | |
|---|---|
| `ANTHROPIC_API_KEY` | Claude. Optional `ANTHROPIC_MODEL` (default `claude-opus-5-5`). |
| `OPENAI_API_KEY` + `OPENAI_BASE_URL` + `OPENAI_MODEL` | Any OpenAI-compatible endpoint (OpenAI, DeepSeek `https://api.deepseek.com/v1`, …). |
| `AI_PROVIDER` | `auto` (default: Anthropic if set, else OpenAI-compatible), `anthropic` or `openai`. |
| `AI_DAILY_LIMIT`, `AI_FEATURE_TIER` | Optional limits. |

`SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are provided by Supabase.

## Building and deploying

`game.js` is generated: `node scripts/build-ai-function.mjs`. The deployed `index.ts` is one line that imports
`game.js` from this public repository **at a pinned commit** (`raw.githubusercontent.com/<owner>/<repo>/<commit>/…`), so a
deploy is reproducible and later pushes never change what runs. To update: rebuild, commit and push `game.js`, then
deploy `index.ts` with the new commit id (`verify_jwt = false`).
