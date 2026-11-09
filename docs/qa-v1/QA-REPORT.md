# LEVELUP AI — QA Report

## Automated release gates

The release was reset to deterministic Demo data and verified with the repository's executable gates:

- `npm run typecheck` — passed (`10 modules OK`).
- `npm run lint` — passed (`release scan OK`).
- `npm test` — passed (`9/9` integration tests).
- `npm run build` — passed and generated `dist/`.
- `npm run test:dist` — passed (`dist smoke: healthy`).
- Source runtime health check — passed with `status: healthy`, `demoMode: true`, version `1.0.0`.

The integration suite covers the highest-risk flows: plan pricing/features, Free 3D blocking, idempotent task XP, manual bit proof and Admin approval, permission refresh, duplicate-approval prevention, server-authoritative game validation and duplicate-finish prevention, minor parental-consent gating, Marketplace favorite/reporting, weekly challenge joining, creator moderation, paid Marketplace purchase/unlock, purchased-path enrollment/completion and post-start review eligibility.

Raw command output is retained in this directory (`typecheck-output.txt`, `lint-output.txt`, `test-output.txt`, `build-output.txt`, `dist-smoke-output.txt`, `health-output.txt`).

## Browser / visual QA limitation

A real-browser visual pass could not be certified inside this execution environment. The installed system Chromium is governed by a managed policy containing `URLBlocklist: ["*"]`, which blocks local application pages before render. A separate Playwright browser installation was attempted, but the browser binary download failed because outbound DNS/CDN access was unavailable.

The managed browser policy was **not** modified or bypassed. Therefore this release does **not** claim completed screenshot-based visual QA. Responsive CSS, RTL/LTR behavior, focus states, touch controls and reduced-motion handling are implemented in code, but a final human/browser visual sweep at the requested viewport list should be performed on a normal workstation before public launch.

## External-service boundary

The runnable release intentionally uses Demo adapters where external credentials/services were not supplied. Production launch still requires PostgreSQL/Supabase (or equivalent), private object storage, transactional email, compliant parental verification, an approved AI provider and production security/observability review. bit remains a deliberate manual-review payment flow; no automatic bit API is claimed.
