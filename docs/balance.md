# Game balance report

Produced by the bot-playthrough simulation in `src/lib/game/sim-balance/`. Re-run it with `npm run balance`
(deterministic, about 10 s); `tests/unit/balance.test.ts` runs a smaller version on every `npm run check`.

## How it works

- A bot plays a finished spec through the **real server reducer** (`processEvent`): talk, open, hint, answer, collect,
  visit, enter area, finish. It only sends legal moves; a rejected move is itself reported as a finding.
- Skills (per-attempt chance of a right answer, retry chance, hint habit, how many gems it picks up, pace):
  `perfect` (100%), `p70` (70% first try, 85% on retry), `p40` (40% first try, 70% on retry), and `rusher`
  (70%, leaves through a portal the moment it opens).
- Time is estimated from the content (reading speed, items to arrange, feedback, explanations) plus **real walking
  distance** in the generated world (`buildWorld` positions, `WALK_SPEED`, x1.5 detour). It is a model, not a stopwatch:
  the numbers are good for comparing games and catching outliers, not for promising a learner "exactly 9 minutes".
- Corpus (341 games, 5 seeds each x 4 skills): study-engine games from 16 hand-written note sets (he + en; terms only,
  steps only, Q&A only, numbers, plain prose, short, long mixed) in FULL and FAST, every demo template (6 subjects x 5
  game types x FULL/FAST x he/en), games grown with "Extend Existing Game" until full (up to 4 areas / 24 challenges),
  and 80 fuzzed note sets of random shape.
- Outlier rules (`findOutliers`): stuck, a perfect player below 3 stars, score above max, rejected moves, a finished
  40% player with 0 stars, FAST outside 2-10 min, FULL outside 3-30 min (average learner), declared length more than
  2x off, and a weak player taking more than 3x the strong player's time.

## Results after the fixes (median / worst, minutes of the simulated learner)

| Group | perfect | 70% | 40% | stars 70% (2 / 3) | stars 40% (1 / 2 / 3) | stuck |
| --- | --- | --- | --- | --- | --- | --- |
| engine FULL | 7.9 / 9.3 | 10.3 / 13.5 | 14.2 / 17.9 | 41% / 58% | 27% / 71% / 2% | 0 |
| engine FAST | 3.5 / 4.0 | 4.5 / 7.1 | 6.3 / 8.8 | 41% / 57% | 17% / 70% / 13% | 0 |
| demo FULL | 7.3 / 8.5 | 9.2 / 12.2 | 12.9 / 17.0 | 41% / 59% | 13% / 83% / 4% | 0 |
| demo FAST | 3.3 / 3.7 | 4.2 / 5.7 | 5.9 / 8.2 | 48% / 52% | 18% / 71% / 11% | 0 |
| extended (up to 24 questions) | 10.0 / 16.0 | 13.2 / 22.9 | 17.9 / 31.6 | 57% / 43% | 14% / 85% / 2% | 0 |

Events per game: 13-15 (FAST) and 28-35 (FULL) at median, 39-49 for the extended games. A perfect player always finishes
with 3 stars; nobody who finishes gets 0 stars; no bot (including the portal rusher) got stuck in any of the 341 games.

## Findings and fixes

1. **Declared length was 2-3x too long.** Templates and the engine hard-coded 18-22 minutes (FULL) and 6-10 (FAST); the
   simulated average learner needs about 9-10 and 4. A wrong estimate also made FAST and FULL look alike on the
   library card. Fix: `src/lib/game/spec/estimate.ts` computes the length from the spec (think time per challenge +
   walking/feedback per question + notes/guide stops, fitted to the simulation) and `validateGameSpec` writes it, so
   it holds for templates, the engine, extensions and AI output alike. Tested to stay within 25% (or 2 min) of the
   simulation for the whole corpus.
2. **The score could exceed the maximum.** A flawless run through an adaptive game (harder variants are served after a
   streak and pay more) scored above `maxScore` (e.g. 730 / 680) in 35 demo games (Python loops, Spanish verbs in both
   languages); the percentage was silently clamped but the HUD and the results screen printed the impossible number.
   Fix: `maxScore` now counts the best variant a challenge can be replaced by, and `summarize` never reports a
   score above its own maximum (the timed bonus is on top of the base maximum on purpose, so a perfect player is not
   punished for being slow).
3. **Portals could strand a player.** Portals are one-way. A spec whose portal opens before the area's own missions are
   done (the extension code chains extra areas with an empty requirement list; AI output can do the same) lets the player
   leave objectives behind that can never be completed, so the game could not be finished. Reproduced with the rusher
   bot on a modified template. Fix: `sealPortals` in the validator makes every portal also wait for the area's final
   missions (and `crossCheck` then rejects a spec where that would deadlock). Existing generators already satisfied it,
   so no shipped game changes.
4. **No fix needed (checked):** star thresholds (60% / 85%) separate the skills well: 70% players earn 3 stars about
   half the time, 40% players almost always 2 (or 1 when they lean on hints) and rarely 3; attempt multipliers
   (1 / 0.6 / 0.3), the hint penalty and the 3-attempts-then-reveal rule never produced a zero-star finish or a stuck
   state; effort-only points (gems and mission bonuses) are about 20% of the maximum (15-25% across the
   corpus). That is the one soft spot: a player who answers nothing right on the first try but finishes still keeps
   that share, which is why 40% players land on 2 stars so often. Left as is on purpose (finishing and exploring
   deserve credit); lower `MISSION_BONUS` if 2 stars should become harder to get.

## Known limits and ideas

- A 40% player in a FULL game is revealed the answer to about 0.4-0.5 questions on average; the "review" list covers it.
- Extended games reach 23 minutes for a 70% player and 32 for a 40% player at the 24-question cap. That is long but
  intentional (the player chose to extend); a future "chapter break" save point would help.
- The bot's time model assumes careful reading. Real players skim; expect real sessions to be 20-30% shorter.
- Not covered: platformer hazards and falling (movement physics is `engine/sim.ts`, not the reducer), and AI-generated
  games (they get the same estimate and portal sealing through the validator).
