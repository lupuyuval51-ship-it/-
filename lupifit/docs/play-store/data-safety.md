# Play Console: Data safety form (draft answers)

> **Draft, derived from the code on 2026-10-30.** The operator submits this form and is responsible for it.
> Items marked **Decide** depend on legal advice. Re-check after every change that stores new data or sends
> anything off the phone.

The app on Google Play is the **device-mode** app (`android/`, see `docs/device-mode.md`): no account, no
LUPU-FIT server, all data stored on the phone. Part 1 is for it. Part 2 keeps the answers for the hosted-mode
app (`android-twa/`), in case that one is ever the listing instead.

## Part 1: the device-mode app (the app on Google Play)

### What leaves the phone (the facts the answers rest on)

| Data flow | Who receives it | Code |
| --- | --- | --- |
| Barcode lookup: the barcode number the person types, when they tap Look up | Open Food Facts (`https://world.openfoodfacts.org`), directly from the phone, over HTTPS. Like any web request it also carries the phone's IP address and the WebView's standard headers (user agent: Android and WebView version). No name, no account, no health or diary data. | `server/src/modules/nutrition/barcode.ts` (`fetchOffProduct`), run in the device worker |
| Backup file | Only where the person sends it through Android's share sheet (Files, Drive, e-mail …). The app does not send it anywhere by itself. | `client/src/features/device/backup.ts`, `client/src/platform/native/files.ts` |
| Android's own backup (if the person turned it on) | Android/Google, under the person's Google account: the WebView's IndexedDB and Local Storage. End-to-end encrypted on Android 9+; on Android 7–8 not end-to-end encrypted. | `android/app/src/main/res/xml/data_extraction_rules.xml`, `backup_rules.xml` |
| Nothing else | The page's CSP allows only `'self'` and `https://world.openfoodfacts.org`; no analytics, crash-reporting, ads or AI SDK; no Firebase. Reminders are local notifications (no push service). | `client/vite.config.ts` (`DEVICE_CSP`), `android/app/build.gradle`, `package.json` |

Everything the person enters (profile, health and fitness data, food log, coach conversations …) is processed
**only on the device**. Google's Data safety rules do not require declaring data that is only accessed or
processed on the device and never sent off it.

### 1. Data collection and security

| Question | Suggested answer | Why |
| --- | --- | --- |
| Does your app collect or share any of the required user data types? | **Yes** (only because of the barcode lookup, see below) | **Decide:** a barcode number is product data, not data about the person, and the person sends it at their own request. If counsel agrees it is not "user data", the answer can be **No** (then the label says "No data collected"). Declaring it is the cautious choice: the lookup reveals which product the person is about to log in a health app. |
| Is all of the user data collected by your app encrypted in transit? | **Yes** | The only transfer (the barcode lookup) uses HTTPS (`OPENFOODFACTS_BASE_URL` is `https://world.openfoodfacts.org`; the CSP allows no other remote host). |
| Which methods of account creation does your app support? | **My app does not allow users to create an account** | There is no sign-up, sign-in, e-mail or password in the app. The app makes an internal record with a random id and key on first launch; it never leaves the phone and the person never sees it (`client/src/device/worker/session.ts`). **Decide** with counsel; if Play treats this record as an account, the deletion URL below covers it. |
| Account deletion URL | Not needed without accounts. If the form asks anyway: the static page `…/account-deletion.html` (see "Public URLs") | It explains erasing the data on the phone and uninstalling. |
| Do you provide a way for users to request that their data is deleted? | **Yes**: in the app, Profile → Your data on this phone → Erase all data, and by uninstalling | The barcode numbers sent to Open Food Facts are not held by the developer; the privacy policy says so. |

### 2. Data types (with "Yes" above)

| Play category › type | Collected | Shared | Processed ephemerally | Required / optional | Purposes |
| --- | --- | --- | --- | --- | --- |
| App activity › In-app search history | Yes: the barcode numbers the person looks up | **No**: sent at the person's own request to a service the screen names ("Only the barcode number is sent, to Open Food Facts"); Play's user-initiated-transfer exception applies. **Decide** with counsel. | **No** (the developer cannot vouch for Open Food Facts' retention) | Optional | App functionality |

Not collected (nothing leaves the phone): personal info (the name typed on the first screen stays on the phone;
no e-mail, no phone number), health and fitness info, messages (coach conversations), photos and videos (no
camera permission; no meal-photo feature), audio, files and docs (a backup file is created and sent only by the
person through the share sheet), calendar, contacts, location, web browsing, financial info, device or other
IDs, app info and performance (no crash or analytics SDK).

Data handled by Google itself (Play's install records, Android vitals crash and ANR statistics for people who
share usage and diagnostics, Android's own backup) is Google's processing under the person's Google account,
not the app's collection. **Decide:** confirm with the current Play help text that Android's backup of app
data does not need to be declared (the developer cannot read those copies).

### 3. Security practices

| Question | Answer |
| --- | --- |
| Data is encrypted in transit | Yes (HTTPS for the barcode lookup) |
| Users can request that data be deleted | Yes: erase in the app, or uninstall (nothing is held by the developer) |
| Committed to the Play Families Policy | Not applicable (the app does not target children) |
| Independent security review | No |

### Public URLs the forms ask for
There is no LUPU-FIT website in device mode. `npm run legal:static` writes the device-mode legal pages as
static HTML to `dist/legal/` (Hebrew at the top level, English in `en/`); upload that folder to any static host
(see `docs/device-mode.md`, "Legal pages and the store listing") and use:

- Privacy policy: `https://<static host>/privacy.html` (English: `…/en/privacy.html`)
- Data deletion (only if asked): `https://<static host>/account-deletion.html`

Fill the `[placeholders]` and get the lawyer review before publishing them (`checklist.md`).

## Part 2: the hosted-mode app (`android-twa/`, only if it becomes the listing)

Public URLs: `https://<domain>/privacy`, `https://<domain>/account-deletion` (the server build shows the
hosted-service texts).

### Data collection and security

| Question | Answer | Why (code) |
|---|---|---|
| Does your app collect or share any of the required user data types? | **Yes** | Account, profile, workouts and food log are stored on the server (`server/src/db/migrations/*.sql`). |
| Is all of the user data collected by your app encrypted in transit? | **Yes**, provided production runs on HTTPS (a TWA requires HTTPS anyway) | `COOKIE_SECURE` defaults to on in production, HSTS is sent in production (`server/src/middleware/security.ts`). The app makes no requests to other origins (CSP `connect-src 'self'`). |
| Which methods of account creation does your app support? | **Username (email) and password** | `POST /api/auth/register` (`server/src/modules/auth/routes.ts`). No social sign-in. |
| Account deletion URL | `https://<domain>/account-deletion` | Public page, works signed out (`client/src/pages/legal/AccountDeletionPage.tsx`). |
| Can users request deletion of some data without deleting the account? | **Yes** | Food log entries, weigh-ins, workouts, plans, custom foods, saved meals and coach conversations each have a delete action in the app. |

"Shared" in Play's sense excludes service providers that process data on the developer's behalf. The
hosting provider and, if AI is enabled, Anthropic act as service providers. **Decide:** confirm that the
AI provider's terms for your account make it a processor (no use of the data for its own purposes); if
not, mark the types it receives as **shared** for *App functionality*. Open Food Facts receives only barcode
numbers from the server, with no account data, so it is not user-data sharing.

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

### Security practices

| Question | Answer |
| --- | --- |
| Data is encrypted in transit | Yes (HTTPS) |
| Users can request that data be deleted | Yes: in the app (Profile → Privacy & data → Delete my account, immediate) and by email for people who cannot sign in (operator runs `node dist/server/db-cli.js delete-account <email> --yes`) |
| Committed to the Play Families Policy | Not applicable (the app does not target children) |
| Independent security review | No |

### What deletion actually removes

`DELETE /api/account` (password + typed `DELETE`) deletes the `users` row; every user table references it
with `ON DELETE CASCADE`. `server/tests/profile-account.test.ts` seeds a row in every table that has a
`user_id` / `owner_user_id` column and checks that none remain. Not removed: product details cached from
Open Food Facts (shared catalog, no link to the user), server logs and backups kept by the hosting
provider (**Decide:** retention periods), data already processed by the AI provider (its terms), and
files or storage on the user's device.
