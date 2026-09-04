# Better games — 4 September 2026

A single batch aimed at the games the app creates: what the questions are made of, how the
learner is helped while playing, and what happens after the last wave. Nothing here touches
scoring authority, rewards or the anti-cheat timing rules.

## What changed

### The questions

| Before | After |
|---|---|
| Every created game was a `knowledge-arena`. The five other engines existed only for the daily quest. | The create form has a **mode picker**: the same eight questions play in any of the six modes. The mode is stored with the game, shown in the saved list and on the game card, and rejected with 400 if it is not one of the six. |
| The model's `answer` index was stored as returned. A model (and a curated task bank) puts the correct option first far more often than a third of the time, and a learner who notices stops reading. | Every question's options are **re-ordered by a deterministic permutation** derived from the topic and the prompt, applied identically to Hebrew and English so option 2 means the same thing in both. Verified with a fixture whose eight answers are all index 0. |
| "All of the above" survived the schema. | Refused server-side (`AI_GAME_INVALID`) in both languages, because a positional option cannot stay true once the order is shuffled. The prompt asks the model not to write them in the first place. |
| Demo arithmetic distractors were `answer + 1 + index` and `answer − 1 − index`: eliminable by size alone. | Distractors are the **mistakes a learner actually makes**: one group too few or too many in multiplication; a dropped carry, an off-by-one or the difference instead of the sum in addition; a borrowing slip or adding instead of subtracting; the group size instead of the group count in division; forgetting the divide or the multiply step in a fraction of a quantity. Explanations now name the two wrong options and say what error produces them. |
| The build-the-path daily quest offered the **same two task titles** as distractors on nearly every question, and on "what comes after X?" it offered X itself. | Distractors are the neighbouring steps (the one after the answer, the one before the prompt), rotating through the path, and the step quoted in the prompt is never an option. |
| The Claude prompt asked for eight level-appropriate questions. | It also asks for easiest-to-hardest ordering, sub-topic coverage, a recall/application mix, misconception-based distractors of similar length and form, no numbering, a hint that does not paraphrase the answer, and an explanation that says why each wrong option is wrong. |

### While playing

- Every question now carries its own **hint** to the client — the generated `hint`, or the first
  hint of the curated task the daily quest drew from. A hint that quotes the correct option is
  withheld (the same guard the game coach already applied). The 3D arena, which had no hint
  control at all, gets a lightbulb button beside the question; the other modes keep their
  footer button and now show the question-specific text instead of the generic sentence.

### After the last wave

- The finish result includes a **review** of every answered question: the prompt, the option the
  learner chose, the correct option, and the explanation. The results screen renders it as a
  collapsible list with a mark per question. Unanswered questions are not revealed — a second
  attempt is still ahead — and the attempt history in `state` stays as light as before.
- A created game can be **deleted** by its owner. Ownership closes, an attempt still in flight
  is expired so it cannot be finished for a reward later, reads and starts return 404, and the
  `daily_games` row is retained for the audit trail. Results and XP already earned stay.

### Found on the way

- On a **390 px-tall landscape phone**, the fire button of the 3D arena sat 18 px below the
  bottom edge of the screen in the production build. The lobby's `.quest-stage` rule in
  `globals.css` sets `min-height: 360px`, the player's own `min-height: 0` lives in a sheet that
  the production bundle loads *first*, so the lobby rule won and the stage overflowed its flex
  slot by 30 px. The dev server orders the sheets the other way, which is why the phone e2e
  journey had passed there. The player now claims the rule with a more specific selector.
- An open hint panel **outlived the answer**: it sits above the feedback panel, so after
  submitting with the hint open the "continue" button could not be clicked until the hint was
  closed by hand. Caught by the browser pass the moment hints became worth opening. Submitting an
  answer now closes the hint.

## Verification

- `pnpm typecheck`, `pnpm lint`, `pnpm build` — clean.
- `pnpm test` — **94 passed** (86 + 8 new). Each new test was run against the previous `src/`
  with the tests stashed in place: all eight fail there and pass here.
- `pnpm test:e2e` against the production build on `localhost:3100` — **8 passed** (1.2 min),
  after the landscape fix above; the first run had failed exactly there, 7 of 8.
- Scripted browser pass over the same build, phone viewport, Hebrew, no console or page errors:
  the mode picker at 320 px and 390 px without horizontal overflow; a Boss Quiz created from the
  form (8 hints delivered, no answer key in the payload), listed as "אתגר הבוס · העיר העתידנית",
  started into the boss engine (boss status bar present, arena HUD absent); the footer hint
  showing the question's own text; a full round in 2D producing a review of 8 items with 4 marked
  wrong, each with the chosen and correct options and the explanation; the daily arena's
  lightbulb opening the curated task hint plus the aiming tip; deleting the created game from the
  list through the confirmation dialog, leaving the list empty.

## Left open

- The daily quest keeps its `v2` identifier, so a day whose quest was already generated before
  this deploy keeps the old distractors until midnight. New days use the new logic.
- Hints are free. Charging a hint against the streak multiplier would need a `hint_used` column
  on `game_events` and a migration; not done here.
- The question count is still fixed at eight because the arena's wave count is a schema
  literal and the phone journey pins it.
