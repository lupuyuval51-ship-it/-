# LEVEL UP AI — Product decisions

Decisions are numbered and dated. A decision marked **PROPOSED** was taken by the lead engineer under the
founder's delegation ("do what you think") and can be changed in one place; **CONFIRMED** came from the founder.

Implementation window: starts 2026-11-09T20:24:31Z, hard stop 2026-11-10T04:24:31Z (8 h, shared by 3 agents).

## Founder decisions (2026-11-09)

The founder answered the three opening questions with "do what you think", which adopts the recommended option
of each question.

| ID | Decision | Status |
|---|---|---|
| D-001 | **Launch audience is 13+** (teens and adults). Registration under 13 is refused. Ages 13–15 still need parental consent (existing rule). | CONFIRMED (option 1a) |
| D-002 | **Ads are shown only to Free users who are certainly 18+** and gave ad consent. Ages 13–17 get Free without ads until real parental verification and a legal review exist. Because only the birth *year* is stored, "certainly 18+" means `currentYear - birthYear >= 19`. | CONFIRMED (option 1a) |
| D-003 | **Free catalog access**: a "track" is one *topic* with its four games. Levels: C = beginner, B = intermediate, A = advanced (a topic has one level). A Free user chooses **once**: up to 12 Level C topics **or** 1 Level B topic. The first unlock fixes the mode; it does not reset and cannot be switched without upgrading. Level A is paid only. | CONFIRMED (option 2a) |
| D-004 | **Daily 3D Quest stays paid** exactly as before (`canPlayFull3DGames`); Free keeps the preview. | CONFIRMED (option 2a) |
| D-005 | **First game to perfect**: programming logic. The player programs a maintenance rover (sequences, loops, conditions) to restore a research station. Runs are re-simulated on the server. | CONFIRMED (option 3a) |

## Engineering decisions taken under delegation

| ID | Decision | Why | Status |
|---|---|---|---|
| D-010 | Keep the existing dependency-free Node.js server and JSON store for this window. Supabase is **not** provisioned. A migration file for the new tables is kept in `docs/`. | The contract forbids provisioning without approval and says not to migrate a working alternative unnecessarily. | PROPOSED |
| D-011 | Vendor **three.js r170 (MIT)** as a static file in `public/vendor/three/`. No CDN, no `npm install`; the Node runtime stays dependency-free. | The hand-written cube renderer cannot carry a 20-minute 3D game with lighting, picking and animation. | PROPOSED |
| D-012 | **Legacy Basic** stays in the plan matrix so existing holders keep their rights and can renew, but it is no longer offered to new buyers. Basic holders see no ads (they pay). Basic unlocks Level C and B topics; Level A needs Plus/Pro (maps to the old "premium worlds" flag). | The new monetization is Free / Plus / Pro. Existing entitlements must be preserved, not silently removed. | PROPOSED |
| D-013 | Hebrew stays the default locale (existing project rule); every new screen ships complete in English and Hebrew. Curated game content, narration and videos are authored in **English first**; content objects are `{en, he?}` so Hebrew can be added per item. A Hebrew UI shows English content with a visible "English content" note where no translation exists. | Reconciles AGENTS.md ("Hebrew default") with the master contract ("initial complete interface: English"). | PROPOSED |
| D-014 | Content lifecycle: `PLANNED → DRAFT → TECHNICALLY_VALIDATED → EDUCATIONALLY_REVIEWED → PLAYTESTED → APPROVED → PUBLISHED`. In `DEMO_MODE=true` learners may open `TECHNICALLY_VALIDATED` content with a visible "Preview — awaiting review" label. With `DEMO_MODE=false` only `PUBLISHED` content is playable. | No human educational review or human playtest can happen inside this window, and those gates must not be faked. | PROPOSED |
| D-015 | Full game video: target **1,800.0 s**, declared tolerance **±1.0 s** on container, video-stream and audio-stream durations (ffprobe). Recaps: 45–90 s. | Required to be declared before validation. | PROPOSED |
| D-016 | Narration uses a free, locally run, commercially usable TTS model if one can be installed and verified; otherwise narrated media is reported as BLOCKED. No paid narration, image or video generation is used without explicit approval. The connected Higgsfield/Canva/Gamma accounts are not used. | Spending needs explicit approval. | PROPOSED |
| D-017 | Studio allowances (centralized in `src/config.js`): Free 2 generations/month, 1 saved project; Basic 5 / 3; Plus 20 / 15; Pro 100 / 100 and may submit for publication. Edits count as generations. User-made games grant no XP. | Paid tiers must differ by real allowances; rewards must not be farmable. | PROPOSED |
| D-018 | No live ad provider. A policy engine, placements and a clearly labeled **test** adapter are built; live delivery stays off behind a global kill switch and missing provider configuration. Rewarded ads are not implemented (no server-verifiable completion available). | No approved publisher account exists. | PROPOSED |
| D-019 | No real AI provider key is configured in this environment, and the coding session's own credentials are not used as a product backend. The Studio pipeline therefore runs with a deterministic rule-based designer and procedural level generator, labeled as such; the model-assisted designer activates only when `AI_API_KEY` is set. | Truthful labeling; no invented API access. | PROPOSED |
| D-020 | XP for curated games is assigned by server policy (per first-time mission completion and game completion), never by a GameSpec field. | Generated or user-editable data must not control the economy. | PROPOSED |

## Open items that need the founder

- Confirm or change D-012 (Basic), D-013 (default language), D-017 (allowances).
- Approve (or not) a paid narration voice and any paid media generation, after the measured pilot numbers in `docs/COST_MODEL.md`.
- Approve (or not) provisioning Supabase and a public deployment.
- Supply an ad publisher account and a consent platform decision before any live ads.
- A real parental-verification provider and legal review before minors can see ads or the product launches publicly.
