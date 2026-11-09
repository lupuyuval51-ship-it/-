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

`npm start` warns `dist/ is older than the source — run npm run build` when a
file in `src/` or `shared/` is newer than `dist/index.html`, and
`GET /api/health` reports the served build's time (`{ "ok": true, "build": "<ISO date>" }`).

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
| `ANTHROPIC_API_KEY` | — | Enables the AI Director. Never sent to the browser. A key with spaces, control or non-ASCII characters is refused at startup (logged without the key). |
| `PLOT_TWIST_MODEL` | `claude-opus-5-5` | Model used for episodes. |
| `PLOT_TWIST_EFFORT` | `medium` | `low` is faster, `high` is more considered. |
| `PLOT_TWIST_RATE_LIMIT` | `8` | Generations per client per 10 minutes (IPv6 clients are grouped by /64). Requests turned away as busy do not count. |
| `PLOT_TWIST_MAX_CONCURRENT` | `4` | Concurrent generations per server. Each client may also have at most 2 open at once. |
| `PLOT_TWIST_TIMEOUT_MS` | `120000` | Upper bound for one model attempt, response stream included. |
| `PLOT_TWIST_DEADLINE_MS` | `150000` | Overall budget for one generation, repair round included. A stalled provider ends as "took too long" and shows `Unreachable`. |
| `PLOT_TWIST_TRUST_PROXY` | — | Set `1` behind a trusted reverse proxy: the client is read from `X-Forwarded-For` and the public host from `X-Forwarded-Host`. See below. |
| `PLOT_TWIST_TRUSTED_HOPS` | `1` | Number of trusted proxies that append to `X-Forwarded-For`; the client is that many entries from the **right**. |
| `PLOT_TWIST_ALLOWED_ORIGINS` | — | Comma-separated extra origins allowed to request episodes, e.g. `https://plottwist.example,https://www.plottwist.example` (bare hosts work too). |
| `PORT` | `8787` | Production server port. |

The status pill shows the **verified** state: `Online` only after the key and
model check out (a free Models API call), `Key rejected`, `Key invalid`,
`Unreachable`, `Busy`, `Unstable`, `Not configured`, or `Off` when the server
itself is unreachable. The status is shared by every visitor, so only provider
problems change it: after the provider is busy, unreachable or stalls while
writing, that state holds for 30 seconds even if the Models API still answers;
one visitor's refused or rejected draft is only logged. `GET /api/status?refresh=1`
re-checks the provider at most every 15 seconds.

### Behind a reverse proxy

Set `PLOT_TWIST_TRUST_PROXY=1` only when every request reaches the server
through your proxy. Each proxy must **append** the address it saw to
`X-Forwarded-For` (anything to the left of it is whatever the client sent), and
the public host must arrive in `Host` or `X-Forwarded-Host` — otherwise every
generation is refused as cross-origin. With nginx:

```nginx
location / {
  proxy_pass http://127.0.0.1:8787;
  proxy_http_version 1.1;
  proxy_set_header Host $host;                                   # nginx's default is $proxy_host
  proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;   # appends the client address
  proxy_set_header X-Forwarded-Host $host;
  proxy_set_header X-Forwarded-Proto $scheme;
  proxy_buffering off;                                           # episodes stream as server-sent events
  proxy_read_timeout 180s;                                       # longer than PLOT_TWIST_DEADLINE_MS
}
```

With a second proxy in front (a CDN → nginx → server), set
`PLOT_TWIST_TRUSTED_HOPS=2`. If the proxy cannot forward the public host, list
the site's origin in `PLOT_TWIST_ALLOWED_ORIGINS` instead.

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
