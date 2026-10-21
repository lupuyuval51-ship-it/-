# `verify-purchase`: server-side check of Google Play purchases

Supabase project **levelup-app** (`yhxwgfgodxbzdvaqtqjz`), Edge Function `verify-purchase`, **JWT verification on**.
**Not deployed yet.** Source and tests: `src/server/play/verify.ts`, `tests/unit/play-verify.test.ts`; the app side is
`mobile/src/cloud/purchases.ts` and `src/lib/offline/billing-verify.ts` (`tests/unit/play-verify-client.test.ts`).

What it does, in order:
1. `POST` only, from the app's WebView origins, with the learner's sign-in (checked against this project's Auth).
2. The body is `{ "purchases": [{ "productId", "purchaseToken" }] }`, 1 to 6 entries, only our four products
   (`levelup_plus`, `levelup_pro`, `levelup_plus_lifetime`, `levelup_pro_lifetime`).
3. It asks Google's Play Developer API about each token with the service account (`subscriptionsv2.get` for subscriptions,
   `products.get` for the one-time products). The plan and the end date are **Google's**; the product the phone names only picks the API.
   A token Google does not know (400/404/410) is `NOT_FOUND`. Google or the function not set up: `503` (`UNAVAILABLE` / `NOT_CONFIGURED`),
   never a verdict.
4. `claim_play_purchase` stores the verdict (product, plan, valid, end date, SHA-256 of the token) unless another account already holds
   the token; then it is `CLAIMED` and the answer is not `definitive`.
5. The answer: `{ plan, expiresAt, definitive, verifiedAt, results[] }`. The phone only applies a `definitive` answer.

## Secrets (Edge Functions → Secrets of levelup-app; never in the app, never in the repo)

| Name | |
|---|---|
| `PLAY_SERVICE_ACCOUNT_JSON` | The whole JSON key file of the Google service account (needs "View financial data" for the app in the Play Console). |
| `PLAY_PACKAGE_NAME` | Optional; default `app.levelup.learn3d`. |

`SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are provided by Supabase. Without `PLAY_SERVICE_ACCOUNT_JSON` the function answers
`503 NOT_CONFIGURED` and the app keeps the plan Play reported.

## Building and deploying

`index.ts` is generated and readable: `node scripts/build-verify-function.mjs`. Apply `supabase/migrations/20261021000000_play_purchases.sql`
first, then deploy `index.ts` with JWT verification **on**. Owner steps (Google Cloud, Play Console): `docs/play-release.md`,
"Server-side purchase check".
