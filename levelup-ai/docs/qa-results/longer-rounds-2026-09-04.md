# Longer rounds and a real question bank — 4 September 2026

The request was for bigger games with many more questions. The blocker was that **eight was a
constant, not a setting**: it appeared as `z.literal(8)` on the wave count, `.length(8)` on the
question array, `Array.from({ length: 8 })` in two generators, and a fixed `waveCount: 8` in the
daily quest. A round could not be any other length.

## Rounds are now 8 to 24 questions

The learner picks the length in the create form. Everything that used to assume eight follows it:

| | Before | After |
|---|---|---|
| Questions per round | 8, fixed | 8, 12, 16, 20 or 24 |
| Arena waves | `z.literal(8)` | one wave per question, checked server-side |
| Clock | `durationMinutes × 60` | `durationMinutes × 60 × questions ÷ 8` |
| AI token budget and timeout | fixed | scale with the round |

The duration picker was relabelled from "game length" to **pace**: it sets the pace of a standard
eight-question round, and a longer round keeps that pace instead of squeezing 24 questions into
three minutes. Three minutes with 24 questions is a nine-minute round, and the form states the
resulting total under the picker rather than leaving the learner to work it out.

Two server-side guards were added, because a longer round is easy to fake:

- The draft schema is **pinned to the requested length**, so a model answering a 24-question
  request with 8 questions is rejected and retried, not silently accepted.
- `waveCount` must equal the question count. A mismatch desyncs the arena, so it is refused.

## The Demo bank is ten families, not one

Asking for 24 questions is pointless if the generator repeats itself. Two changes:

**Computed maths went from five families to ten** — multiplication, addition, subtraction,
division and fraction-of-a-quantity, plus **percentages, averages, powers, sequences and
rectangle area**. Every one is computed and self-verifying, with distractors drawn from the
mistake a learner actually makes: the perimeter instead of the area, the sum instead of the mean,
doubling instead of squaring, repeating the last term instead of continuing the sequence.

A topic that names one operation still practises only that operation. A **general** maths topic
used to fall through to multiplication for every slot, so a long round was 24 near-identical
products; it now rotates through the whole family set. A 24-question general round covers all ten
topics, and operand sizes grow with position so the round ramps.

**A curated topic shortens rather than pads.** Demo mode for a non-maths topic draws on a finite
bank from the built-in paths. Asking for 24 questions there would have meant three repeats of
every question. The round is now capped at one clearly-labelled review pass over the bank, and
the on-screen notice says exactly how many questions it was shortened to and why.

## A defect the new tests caught

The percentage hint read "first find one percent of 100, then multiply it by 10" — and for
`10% of 100` the answer *is* 10, so the hint stated it. The hint now teaches the method without
restating either number.

## Verification

- `pnpm typecheck`, `pnpm lint`, `pnpm build` — clean.
- `pnpm test` — **100 passed** (94 + 6 new). The new tests do not compile against the previous
  `src/`, because `questionCount` did not exist there; that is the proof they cover new ground.
  One of them verifies **every question in a 24-question general round against its own
  arithmetic** — all ten families, 24 of 24 checked — rather than trusting the generator.
- `pnpm test:e2e` against the production build — **8 passed**.
- Browser pass on a 390 px phone against the production build, no console or page errors:
  picked 24 questions, saw "24 שאלות · בערך 9 דקות משחק", generated a round with **24 distinct
  prompts across 10 topic families**, `waveCount` 24 and `timeLimit` 540 s, no answer key in the
  payload, a 24-tick progress bar, a HUD reading "גל 1/24", and the arena playing a sequence
  question with correct options.

## Left open

- The daily quest is still eight questions. Its pool is the six question-bearing tasks of one
  curated path, so a longer daily round would be mostly review; extending it needs more authored
  content, not a schema change.
- A long AI round costs proportionally more per generation, and the daily generation quota still
  counts rounds rather than questions. A 24-question round and an 8-question round cost the same
  quota today.
- The 24-tick progress bar is legible but tight on a 320 px phone; a compacted form (a count
  rather than a tick per question) would read better at the longest lengths.
