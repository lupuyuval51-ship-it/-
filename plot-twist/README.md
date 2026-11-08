# PLOT TWIST

**Give us some free time. We'll give you a story.**

PLOT TWIST turns free time into a personalized real-world adventure for solo
explorers. Choose your circumstances, open one of three sealed envelopes, play
a three-stage branching episode in the real world, unlock the twist, and keep a
cinematic poster of every episode in your own series.

```
Choose your circumstances → three mysterious envelopes → open one →
play a branching episode → unlock the twist → save the episode poster
```

## Run it

Requires **Node.js 22.18 or newer** (the server runs TypeScript directly).

```bash
npm install
npm run dev          # app + API on http://localhost:5173
```

Production:

```bash
npm run build
npm start            # serves dist/ + API on http://localhost:8787 (PORT to change)
```

### Turn on the AI Director (optional)

Without a key the app runs fully on the curated archive and says so in the UI
("AI · Off"). To let the AI Director write one personalized envelope per draw,
set a key **on the server**:

```bash
cp .env.example .env     # then set ANTHROPIC_API_KEY=...
npm run dev              # or npm start
```

| Variable | Default | Purpose |
|---|---|---|
| `ANTHROPIC_API_KEY` | — | Enables the AI Director. Never sent to the browser. |
| `PLOT_TWIST_MODEL` | `claude-opus-5-5` | Model used for episodes. |
| `PLOT_TWIST_EFFORT` | `medium` | `low` is faster, `high` is more considered. |
| `PLOT_TWIST_RATE_LIMIT` | `8` | Generations per client IP per 10 minutes. |
| `PLOT_TWIST_MAX_CONCURRENT` | `4` | Concurrent generations per server. |
| `PLOT_TWIST_TRUST_PROXY` | — | Set `1` behind a trusted proxy (rate limit by X-Forwarded-For). |
| `PORT` | `8787` | Production server port. |

The status pill shows the **verified** state: `Online` only after the key and
model check out (a free Models API call), `Key rejected`, `Unreachable`,
`Busy`, `Not configured`, or `Off` when the server itself is unreachable.

## What's inside

- **Set the scene** — time (15/30/60/120 min), budget (free / ₪30 / ₪100), home
  or outside, solo or with others, mood, and the *How weird are we getting
  today?* dial. The dial changes the content (ranking, "main character moves",
  the AI's tone) **and** the atmosphere: *Keep it chill* is premium-minimal,
  *Surprise me* is cinematic mystery, *Main character energy* goes playful and
  colorful.
- **Three envelopes** — distinct kinds of experience that all respect the hard
  constraints. Open any, read the intro, duration, items and cost, then
  commit. Draw again any time. If nothing fits, the app explains the clash and
  offers one-tap single-constraint fixes.
- **Play** — three progressive stages, a branching choice that changes the
  later stages and the ending, an alternative challenge for every stage,
  optional field notes that come back later in the story and on the poster, a
  timer that never counts paused time, pause/resume, save & exit, and
  automatic recovery after a refresh.
- **Finale** — the twist, the ending and closing line, a recap of your choices,
  traits earned, a one-sentence journal entry, and a procedural poster
  (Canvas) you can **download as PNG** or share (native share → clipboard
  fallback). After your first episode you name your series.
- **My Series** — the poster gallery, each episode's recap, and four traits
  (Curiosity, Creativity, Boldness, Connection) that level up as you play.
- **AI Director** — writes one personalized episode per draw (two curated
  envelopes stay instant). Output is constrained by a JSON schema, converted to
  the same content model as curated episodes, validated (structure, timing,
  budget, setting, company, template tokens) and safety-screened; one repair
  round is tried, otherwise a curated episode takes the slot.

## Project layout

```
shared/     content model, validator, AI episode schema — used by app AND server
server/     AI Director API (Node, no framework) + production static server
src/
  content/  16 curated branching episodes (one file each)
  engine/   matching · run state machine · progression (pure, tested)
  state/    persistence (localStorage, validated on load) + React store
  poster/   procedural Canvas posters, PNG export, share
  ai/       browser client for the AI Director (SSE)
  ui/       design system components and screens
docs/       CONTENT_GUIDE.md (writing rules) · ARCHITECTURE.md (module contracts)
tests/      vitest unit + integration tests (incl. the real SDK against a mock API)
e2e/        Playwright journey checks against the production build
```

## Quality checks

```bash
npm run typecheck
npm test                 # unit + integration
npm run validate:content # every curated episode against the content model
npm run e2e              # production build + real browser: full journey, AI, layout
```

`npm run e2e` uses the system Playwright and a local Anthropic-compatible mock
(`e2e/mockAnthropic.ts`), so the AI path is exercised without a real key.
