# Play Console: Data safety form (draft answers)

> **Draft, derived from the code on 2026-10-29.** The operator submits this form and is responsible for
> it. Items marked **Decide** depend on production settings or legal advice. Re-check after every change
> that stores new data (the export allow-list in `server/src/modules/profile/account.ts` and its test
> list every table that holds user data).

Public URLs the form asks for (replace `<domain>`):

- Privacy policy: `https://<domain>/privacy`
- Account deletion: `https://<domain>/account-deletion`

## 1. Data collection and security

| Question | Answer | Why (code) |
|---|---|---|
| Does your app collect or share any of the required user data types? | **Yes** | Account, profile, workouts and food log are stored on the server (`server/src/db/migrations/*.sql`). |
| Is all of the user data collected by your app encrypted in transit? | **Yes**, provided production runs on HTTPS (a TWA requires HTTPS anyway) | `COOKIE_SECURE` defaults to on in production, HSTS is sent in production (`server/src/middleware/security.ts`). The app makes no requests to other origins (CSP `connect-src 'self'`). |
| Which methods of account creation does your app support? | **Username (email) and password** | `POST /api/auth/register` (`server/src/modules/auth/routes.ts`). No social sign-in. |
| Account deletion URL | `https://<domain>/account-deletion` | Public page, works signed out (`client/src/pages/legal/AccountDeletionPage.tsx`). |
| Can users request deletion of some data without deleting the account? | **Yes** | Food log entries, weigh-ins, workouts, plans, custom foods, saved meals and coach conversations each have a delete action in the app. |

## 2. Data types

"Shared" in Play's sense excludes service providers that process data on the developer's behalf. The
hosting provider and, if AI is enabled, Anthropic act as service providers. **Decide:** confirm that the
AI provider's terms for your account make it a processor (no use of the data for its own purposes); if
not, mark the types it receives as **shared** for *App functionality*.

Open Food Facts receives only barcode numbers from the server, with no account data, so it is not
user-data sharing.

| Play category › type | Collected | Shared | Processed ephemerally | Required / optional | Purposes | What exactly (code) |
|---|---|---|---|---|---|---|
| Personal info › Name | Yes | No | No | Required | App functionality, Account management | Display name (`users.display_name`). Sent in the coach context when AI is enabled. |
| Personal info › Email address | Yes | No | No | Required | Account management | Sign-in and password reset (`users.email`). Never sent to the AI provider. |
| Personal info › User IDs | Yes | No | No | Required | Account management | Internal account id (`users.id`, UUID). |
| Personal info › Other info | Yes | No | No | Required | App functionality, Personalization | Age and sex from the questionnaire (`profiles.age_years`, `profiles.sex`). The AI provider gets an age group, not the age. |
| Health and fitness › Health info | Yes | No | No | Required | App functionality, Personalization | Height, weight and weigh-ins, injuries and limitation notes, allergies, dietary restrictions, diet type, sleep hours, stress level, food log and nutrition targets, pre-workout check-ins (energy, soreness, sleep). |
| Health and fitness › Fitness info | Yes | No | No | Required | App functionality, Personalization | Experience, goal, activity level, equipment, schedule, strength benchmarks, plans, workouts and sets, personal records. |
| Messages › Other in-app messages | Yes | No (see above) | No | Optional | App functionality | Coach conversations (`coach_messages`), only if the user uses the coach. |
| Photos and videos › Photos | **Decide:** Yes only if AI is enabled | No (see above) | **Yes** | Optional | App functionality | Meal photo, resized on the device, sent once to the AI provider and not stored (`server/src/modules/nutrition/photo.ts`). Without AI the feature is unavailable and nothing is collected. |
| App activity › Other user-generated content | Yes | No | No | Optional | App functionality | Notes on workouts and food entries, free-text plan preferences, custom foods, saved meals, plan names. |
| Device or other IDs | **Decide:** Yes if push is enabled (VAPID keys set) | No | No | Optional | App functionality | Phone-notification subscription per device the user turned on: push-service endpoint URL, encryption keys, browser user agent (`push_subscriptions`), plus which reminders were sent (`push_deliveries`, purged after 30 days). Removed on turn-off, logout from all devices and account deletion. Delivered through the browser's push service (Google FCM for Chrome / the Android app). |
| App activity › App interactions | Yes | No | No | Required | App functionality, Fraud prevention / security | Times of coach messages and photo analyses for daily limits (`coach_usage`, `ai_usage_events`); points and achievements derived from use. |

Not collected: location (the server sends `Permissions-Policy: geolocation=()`), contacts, calendar,
audio, files, web browsing, financial info, payment info, advertising ID, crash logs
or diagnostics (no crash or analytics SDK; the server's request log has no user id, IP address, body or
cookies, `server/src/middleware/context.ts`).

**Decide (with counsel):** the server stores the IP address and browser user agent of each signed-in
session for security (`auth_sessions`, removed at logout or expiry). Play has no explicit type for an IP
address that is not used to derive location; it is disclosed in the privacy policy.

## 3. Security practices

| Question | Answer |
|---|---|
| Data is encrypted in transit | Yes (HTTPS) |
| Users can request that data be deleted | Yes: in the app (Profile → Privacy & data → Delete my account, immediate) and by email for people who cannot sign in (operator runs `node dist/server/db-cli.js delete-account <email> --yes`) |
| Committed to the Play Families Policy | Not applicable (the app does not target children) |
| Independent security review | No |

## 4. What deletion actually removes

`DELETE /api/account` (password + typed `DELETE`) deletes the `users` row; every user table references it
with `ON DELETE CASCADE`. `server/tests/profile-account.test.ts` seeds a row in every table that has a
`user_id` / `owner_user_id` column and checks that none remain. Not removed: product details cached from
Open Food Facts (shared catalog, no link to the user), server logs and backups kept by the hosting
provider (**Decide:** retention periods), data already processed by the AI provider (its terms), and
files or storage on the user's device.
