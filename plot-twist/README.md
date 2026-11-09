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
The check uses the project the build belongs to (the nearest folder above it
with a `package.json`), so another build folder, such as `PLOT_TWIST_DIST=e2e/.dist`,
is checked too and named in the warning.

The production server answers only `GET` and `HEAD` for the app (anything else
gets `405` with `Allow: GET, HEAD`), never serves hidden files (`/.env`, `/.git/…`;
`/.well-known/` is the exception), and serves a file only if its real path,
symlinks resolved, is inside the build folder.

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
| `PLOT_TWIST_RATE_LIMIT` | `8` | Generations per client per window (10 minutes by default). IPv6 clients are grouped by /64, and each /48 also shares 4× this limit. Requests turned away as busy do not count. |
| `PLOT_TWIST_RATE_WINDOW_MS` | `600000` | Length of that window, from 1 second up to 24 hours. A visitor who reaches the limit is told how long to wait ("in about 10 minutes", "in about 2 hours"). |
| `PLOT_TWIST_MAX_CONCURRENT` | `4` | Concurrent generations per server. Each client may also have at most 2 open at once (an IPv6 /48 at most 4), and the last free slot is kept for a client that has none open. |
| `PLOT_TWIST_TIMEOUT_MS` | `120000` | Upper bound for one model attempt, response stream included. |
| `PLOT_TWIST_DEADLINE_MS` | `150000` | Overall budget for one generation, repair round included. A repair round starts only if the budget left is at least what the first draft took. |
| `PLOT_TWIST_TRUST_PROXY` | — | Set `1` behind a trusted reverse proxy: the client is read from `X-Forwarded-For` and the public host from `X-Forwarded-Host`. See below. |
| `PLOT_TWIST_TRUSTED_HOPS` | `1` | Number of trusted proxies that append to `X-Forwarded-For`; the client is that many entries from the **right**. |
| `PLOT_TWIST_ALLOWED_ORIGINS` | — | Comma-separated extra origins allowed to request episodes, e.g. `https://plottwist.example,https://www.plottwist.example:8443` (bare hosts such as `plottwist.example` or `[::1]:5173` work too). No wildcards: list every origin. An entry that can never match a browser's `Origin` (a `*`, a `;` or space instead of a comma, another scheme, a host with characters other than `a-z 0-9 . -`) is ignored with a warning at startup. |
| `PORT` | `8787` | Production server port. |

The status pill shows the **verified** state as `AI` plus one word: `AI Online`
only after the key and model check out (a free Models API call), `AI Checking`,
`AI Busy`, `AI Unstable`, `AI Offline` (the AI provider or the PLOT TWIST server
can't be reached right now), `AI Off` (no key on this server) or `AI Error` (the
key or model is wrong). Tapping it opens the status sheet with the precise state
— `Key rejected`, `Key invalid`, `No access`, `Model unavailable`,
`Unreachable`, `Not configured`, and so on — and what it means. When the AI
Director turns this browser away for a while (its rate limit, a full server, or
too many episodes being written from the same connection or network), the pill
says `AI Busy` in every tab, the sheet says which of these it is and for how
long, and envelopes come from the archive until the pause ends — a reload
doesn't reset it. A limit the AI provider hits while writing is not blamed on
the visitor: that envelope comes from the archive, and the pill shows the
server's own word for it. The status is shared by every visitor, so only provider
problems change it: after the provider is busy, unreachable or stalls while
writing, that state holds for 30 seconds even if the Models API still answers,
and then the next status request or generation request checks again. One
visitor's refused or rejected draft is only logged. `GET /api/status?refresh=1`
re-checks the provider at most every 15 seconds.

A **stall** is a provider that sends nothing at all (no response headers, no
event, not even a keep-alive ping) for 30 seconds, or for half of
`PLOT_TWIST_TIMEOUT_MS` if that is shorter; it ends as "took too long" and shows
`Unreachable`. A generation that is still streaming when it runs out of time
(the attempt cap, or the deadline cutting a repair round) fails only that
request: it falls back to a curated episode, is logged, and leaves the status
alone.

### Behind a reverse proxy

Set `PLOT_TWIST_TRUST_PROXY=1` only when every request reaches the server
through your proxy. Each proxy must **append** the address it saw to
`X-Forwarded-For` (anything to the left of it is whatever the client sent), and
the public host, **port included**, must arrive in `Host` or `X-Forwarded-Host`
— it is compared with the browser's `Origin`, so otherwise every generation is
refused as cross-origin. With nginx:

```nginx
location / {
  proxy_pass http://127.0.0.1:8787;
  proxy_http_version 1.1;
  proxy_set_header Host $http_host;                              # the host the browser asked for, with its port
  proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;   # appends the client address
  proxy_set_header X-Forwarded-Host $http_host;
  proxy_set_header X-Forwarded-Proto $scheme;
  proxy_buffering off;                                           # episodes stream as server-sent events
  proxy_read_timeout 180s;                                       # longer than PLOT_TWIST_DEADLINE_MS
}
```

Use `$http_host`, not `$host`: nginx's `$host` never includes the port, while a
browser's `Origin` does (`https://plottwist.example:8443`), so on a non-default
port `$host` refuses every generation. (nginx's default `Host` is `$proxy_host`,
the upstream address, which never matches.) If your proxy cannot forward the host
with its port, list the site's origin, port included, in
`PLOT_TWIST_ALLOWED_ORIGINS` instead.

With a second proxy in front (a CDN → nginx → server), set
`PLOT_TWIST_TRUSTED_HOPS=2`.

## What's inside

- **Set the scene** — the *How weird are we getting today?* dial first, then
  time (15/30/60/120 min), budget (free / ₪30 / ₪100), home or outside, solo or
  with others, and mood. The dial changes the content (ranking, "main character moves",
  the AI's tone) **and** the atmosphere: *Keep it chill* is premium-minimal,
  *Surprise me* is cinematic mystery, *Main character energy* goes playful and
  colorful.
- **Three envelopes** — distinct kinds of experience that all respect the hard
  constraints. Open any, read the intro, duration, items and cost, then
  commit (Back closes the letter). *Draw again* deals episodes you have not
  seen yet before repeating any; when everything that fits is already on the
  table, it says so and offers one-tap single-constraint fixes — as it does
  when nothing fits at all.
- **Play** — three progressive stages, a branching choice that changes the
  later stages and the ending, an alternative challenge for every stage,
  optional field notes that come back later in the story and on the poster, a
  timer that never counts paused time, pause/resume, save & exit, and
  automatic recovery after a refresh. Leaving an episode pauses it; a long
  absence (refresh, background tab, sleeping device) pauses the clock and
  credits at most a fair share of the time away. A double tap can never make
  a blind choice or skip a stage.
- **Finale** — the twist, the ending and closing line, a recap of your choices,
  traits earned, a one-sentence journal entry, and a procedural poster
  (Canvas) you can **download as PNG** or share (native share → clipboard
  fallback). After your first episode you name your series.
- **My Series** — the poster gallery, each episode's recap, and four traits
  (Curiosity, Creativity, Boldness, Connection) that level up as you play.
  Everything lives in this browser (no account). Several open tabs stay in
  sync, and an older tab can never erase an episode finished in another;
  field notes and the journal are saved while you type.
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
npm run e2e              # production build + real browser: journey, AI, fallback, layout, conflicts, resilience
```

`npm run e2e` uses the system Playwright and a local Anthropic-compatible mock
(`e2e/mockAnthropic.ts`), so the AI path is exercised without a real key.
