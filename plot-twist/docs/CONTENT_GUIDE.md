# PLOT TWIST — Episode Writing Guide

PLOT TWIST turns free time into a real-world adventure. The user is the main
character. They pick their circumstances, open one of three sealed envelopes,
play a three-stage branching episode in the real world, unlock a twist, and
save a cinematic poster.

**Primary audience: solo explorers.** Write every episode so one person can
enjoy it alone, comfortably and safely. Some episodes also support "with
others" — then add `crewTip`s that make the stage work for a group.

The exemplar is `src/content/adventures/undercover-tourist.ts`. Read it first.
It is the quality bar: match its specificity, rhythm and humor, but give your
episode its **own personality** (a different narrator, running bit, and vibe).

---

## 1. Data format

Each episode is one file: `src/content/adventures/<id>.ts`, default-exporting
an `Adventure` (see `shared/types.ts`). The library picks files up
automatically — do not edit any index file.

```ts
import type { Adventure } from '../../../shared/types.ts';
const myEpisode: Adventure = { id: 'my-episode', version: 1, source: 'curated', ... };
export default myEpisode;
```

Validate with:

```bash
node scripts/validate-content.ts my-episode.ts   # one file
npm run validate:content                          # all files
```

Errors must be zero. Read every warning and fix it unless you have a reason.

## 2. Structure rules (enforced by `shared/validate.ts`)

- **Exactly three stages on every path**: a stage-1 node → a stage-2 node →
  a stage-3 node → an ending. `start` points at the stage-1 node.
- **At least one meaningful branching choice.** The standard shape: stage 1
  ends with a `choice` (2 options) leading to two different stage-2 nodes; each
  branch has its own stage 2 and stage 3 and its own ending. You may add a
  second choice at the end of a stage-3 node (leading to two endings) when it
  adds real drama — never filler.
- **Later content must change because of the choice.** Different branches are
  different experiences (e.g. observational & reflective vs. creative &
  playful), not the same task reworded.
- **At least two endings**, each reachable.
- **Every stage has an `alternative`**: a different action that achieves the
  same story beat — for when the main action is impossible, uncomfortable or
  inaccessible (seated, indoors, no talking to anyone, no walking, quiet
  version). It must be genuinely doable, not "skip this".
- **A node has either `choice` or `next`, never both.**
- **Timing:** stage `minutes` along every path must sum to ≤ the episode's
  `minutes` (and should fill at least ~70% of it). Be honest — could a normal
  person really do this in that time, including reading the screen?
- **Each ending's `twist` must connect to something earlier in the story** —
  a stage-1 detail, a running bit, or a field note the user wrote. Start it
  with "Plot twist:" or land it unmistakably. It should reframe the episode,
  not just congratulate.
- **Each ending has a `closingLine`**: one memorable line, printed on the
  poster. Ideally it quotes the user's own field note via a template token.

## 3. Field notes and template tokens

A stage may have a `capture` — an optional one-line field note the user can
type ("The strangest detail you found"). Later text can quote it:

```
{{detail|a crooked blue door}}
```

`detail` is the capture key; after `|` is the fallback used when the user
skipped the note. A fallback is **always required**, and the sentence must
read naturally with either the note or the fallback. Only quote notes captured
in an **earlier** stage on the same path (or the same stage, in endings).
Tokens are allowed in narrative, action, alternative, amplify, crewTip, choice
prompt, twist and closingLine. Aim for 2–3 captures per path so the finale
and poster feel personal.

## 4. Voice and writing

- **Second person, present tense.** "You are a visitor from very far away."
- **Vivid and specific.** "a door painted the wrong blue", not "an interesting
  detail". Name the exact thing to do: how long, how many, where to look.
- **Lightly humorous**, never mocking the user or other people. Wry, warm,
  a little theatrical. One good joke beats three okay ones.
- **Concise.** Narrative: 1–3 sentences. Action: one clear instruction (2
  sentences max). Respect the soft limits in `shared/constants.ts`
  (`TEXT_LIMITS`) — they exist because this is read on a phone, outdoors.
- **Every episode has its own personality**: pick a narrator persona
  (`narrator`, e.g. "The Archivist", "Mission Control"), a `stageLabel`
  ("Clue", "Exhibit", "Prophecy", "Scene", "Dispatch"), and a running bit
  that pays off in the twist.
- **Titles:** "The …" titles are fine but not mandatory; 2–5 words, intriguing.
- **Tagline** (printed on the sealed envelope): mysterious, one sentence,
  never spoils the twist.
- **Intro** (revealed when the envelope opens): 2–4 sentences setting up the
  premise and the stakes. Make the user want to press "Start episode".

### Weirdness

`weirdness` is the episode's natural level: 1 = "Keep it chill" (calm,
grounded, gentle), 2 = "Surprise me" (an unexpected premise, playful rules),
3 = "Main character energy" (theatrical, bold, a little ridiculous — but still
safe and never at anyone else's expense).

`amplify` is an optional flourish per stage. The app highlights it as a
"Main character move" at weirdness 3, offers it as an optional "Feeling bold?"
hint at weirdness 2, and hides it at weirdness 1. Write amplifies that make the
stage braver or sillier, not longer.

### Moods

`moods` lists 1–3 of: `curious`, `creative`, `social`, `change` ("ready for
a change"), strongest first. They drive ranking, not filtering.

## 5. Practical and safety rules (non-negotiable)

- Ordinary items only: phone, pen, paper, things found in a normal home.
  `items: []` means nothing needed. Never assume a car, special gear, a pet,
  a garden, or a printer.
- Outside = **accessible public spaces**: streets, parks, benches, public
  squares, libraries, markets, cafés, public transport.
- **No** trespassing, rooftops, climbing structures, train tracks, standing in
  traffic, water hazards, dark isolated places, alcohol, or anything illegal.
- **Respect other people.** Never photograph or record strangers; no following
  people; no pranks; no pressure. Talking to a stranger may be offered but must
  always have an alternative that needs no interaction. Interactions are brief,
  kind and easy to decline (ask a vendor for a recommendation; compliment a
  barista). Buy something if you sit in a café.
- Leave no trace: don't take things that aren't free to take; don't litter;
  "souvenirs" are fallen leaves, free flyers, photos of objects, sketches.
- Content is all-ages: no romance with strangers, no drinking, no gambling for
  money ("coin flip" is fine).
- Public transport: plan the way back before leaving; prefer daylight or busy,
  well-lit places.
- **Costs are honest in ILS (₪).** `cost: { min, max }`. Free means max 0 —
  then nothing in the episode may require buying anything. Typical prices: bus
  or light-rail ride ₪6–8, coffee ₪12–20, pastry ₪10–18, market fruit ₪5–15,
  museum ticket ₪30–60, cinema ₪40–50.
- Light local flavor is welcome (a kiosk, a shuk/market, the light rail) but
  the episode must work in any city.

## 6. Self-review checklist

Before you are done, for each episode:

1. `node scripts/validate-content.ts <file>` → 0 errors.
2. Would a solo person actually enjoy doing this, alone, today?
3. Is every action specific enough to start within 10 seconds of reading it?
4. Does each alternative work for someone who can't or won't do the main
   action (seated / indoors / no interaction)?
5. Do the two branches *feel* different to play, not just read different?
6. Does each twist pay off something from earlier — ideally the user's note?
7. Does the episode fit its time and budget with margin?
8. Is it funny or delightful at least twice? Is anything cringe, preachy,
   or generic ("explore your surroundings")? Cut it.
9. Is anything unsafe, illegal, intrusive or embarrassing for others? Fix it.
10. Does it feel different from the other episodes in the library?
