# Web QA walkthrough

Reproduces the screenshot-based QA pass on the exported web build.

```bash
npm run export:web                 # builds dist/
npm run qa:serve                   # serves dist/ with SPA fallback on :4173 (keep running)
npm run qa:web                     # in another terminal: drives the app with Playwright, writes qa-shots/*.png + log.txt
```

`web-walkthrough.js` requires Playwright with Chromium available to Node
(`npm i -D playwright && npx playwright install chromium`). It walks through
onboarding → Discover → idea → Prompt Studio (copy / save) → search + filters →
Generate (demo mode) → Saved → Profile → English + light theme, and reloads to
confirm persistence. Browser console errors are written to `log.txt`.
