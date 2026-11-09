# LEVELUP AI engineering notes

- Runtime is dependency-free Node.js 20+ for the verified Demo build.
- Keep plan permissions centralized in `src/config.js`; never gate by price in UI.
- FREE must not start full Daily 3D Quest. BASIC/PLUS/PRO can.
- Manual bit payment never activates access until an admin approves the order.
- Game score and rewards are calculated server-side from validated events.
- Proof files are private and only admin can retrieve them.
- Minor profiles default to private. No open chat or precise location exposure.
- Hebrew/RTL is default and English/LTR must remain functional.

## Rules added with the master product contract (2026-11)

- Read `docs/PRODUCT_DECISIONS.md` and `docs/CONTRACTS.md` before changing anything. File ownership per agent is
  defined there.
- Product name is LEVEL UP AI. Brand palette is forest green, gold, cream and white (tokens in `public/styles.css`).
- The Node runtime stays dependency-free. Browser libraries may only be vendored under `public/vendor/` with
  their license; no CDN, no inline scripts (CSP `script-src 'self'`).
- A curated catalog game is authoritative only through `src/games/engine.js`: the server re-simulates every
  submitted program. XP comes from server policy, never from a GameSpec or a client verdict.
- Free catalog rule: one-time choice of 12 Level C topics or 1 Level B topic. Daily 3D Quest stays paid.
- Registration is 13+. Ads may only be requested for Free users who are certainly 18+ and consented, and never
  on game, video, lesson, Studio, checkout, coach or admin screens. Unknown status means no ads.
- No live ads, live billing, paid generation, service provisioning or public deployment without explicit
  founder approval.
- Content status may not exceed `TECHNICALLY_VALIDATED` without a recorded human review; playtime without human
  samples is `AWAITING_VALIDATION`. Never report counts that were not measured.
