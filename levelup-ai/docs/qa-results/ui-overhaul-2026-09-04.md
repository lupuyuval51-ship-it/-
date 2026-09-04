# Interface overhaul — 4 September 2026

A design pass over the whole application. The trigger was blunt feedback that the interface
looked generated rather than designed. Reading the stylesheet confirmed it: **82 hard-coded hex
colours lived outside the token block**, which is both the reason the light theme was broken and
the reason nothing looked like it belonged to the same product.

## The defect underneath

`globals.css` defined a token block and then ignored it. Panels, borders and text on the
dashboard, the marketing page and the quest banner carried literal navy values. In dark mode that
passed unnoticed. In **light mode the page turned white and those panels stayed dark**, so the
dashboard rendered as white chrome wrapped around dark navy cards. It was not a theme; it was a
dark design with a light background bolted on.

The fix was not to delete the dark values. Some panels are *meant* to be dark in both themes —
the daily-quest banner and the marketing showcase are the product's spotlight surface. Those now
use a deliberate `--ink-*` scale that stays dark on purpose, and everything else uses theme
tokens that flip. One hard-coded colour remains, the modal scrim, which is correct as-is.

| | Before | After |
|---|---|---|
| Hard-coded colours outside `:root` | 82 | 1 (the modal scrim) |
| Light theme | Dark cards on a white page | Flips correctly; spotlight panels stay dark by design |

## What changed

**Tokens.** A surface ramp (`bg → surface → elevated → raised`), a second border weight, soft
tints for accent/success/warning/error, three layered shadows plus an accent glow, a focus-ring
token, and an easing curve. The light palette was rebuilt against the same scale rather than
being a handful of overrides.

**Depth.** Every panel built from the same recipe (hairline border on a surface fill) picked up
one radius and one hairline shadow, so 14 panels stopped reading as flat rectangles. A single
wide radial glow behind the page keeps a full-height dark screen from looking like a slab.

**Components.**

- *Buttons* — gradient fill with an accent glow, hover and pressed states, and a shared focus ring.
- *Focus* — one visible keyboard-only ring on every interactive element.
- *Form controls* — filled inputs with a real focus treatment, a styled file button, a custom
  range track and thumb, and toggles that grew from 34 px to a 42 px pill with a shadowed knob.
  These were browser defaults before, which is what made Settings look unfinished.
- *Navigation* — the active item gains an inline-edge rail, so it is not colour alone.
- *Progress* — 5 px flat bar to an 8 px rounded gradient with a soft glow.
- *Cards* — path, marketplace and enrollment cards lift on hover with the cover art scaling
  slightly under the clip.
- *Tags* — pill-shaped, with accent and success variants.

**Layout.**

- The dashboard's secondary column was a stack of sections separated by hairlines, which read as
  leftovers floating in the margin. Each is now a card, matching the primary column.
- The "my paths" row is denser: a larger cover, and the trailing chevron is now a disc that fills
  on hover instead of a bare glyph adrift in the padding.
- Settings groups became cards with tinted section icons.
- The weekly streak marks became stretched pills instead of 25 px circles.
- FAQ rows became cards with a rotating chevron.

## A second bug found on the way

The landing page's "let's solve it together" call to action rendered as a **grey browser-default
button**. `.text-link` set a colour but never reset `background` or `border`, and the class is
used on a `<button>` as well as on links. It now resets both and carries a 44 px target.

## Verification

- `pnpm typecheck`, `pnpm lint`, `pnpm build` — clean.
- `pnpm test` — **94 passed**, unchanged.
- `pnpm test:e2e` against the production build — **8 passed**, including the phone arena journey
  whose assertions on 44 px thumb targets and horizontal overflow cover the restyled controls.
- Browser pass over a production build at 1280 px and 390 px, dark and light, with no console or
  page errors: landing, dashboard, paths, quest, marketplace, coach, settings and pricing.
  Before and after screenshots were captured for each.
- The mobile bottom navigation was measured rather than eyeballed: `position: fixed`, bottom edge
  at 844 px in an 844 px viewport. It appears mid-page in full-page screenshots, which is a
  capture artifact, not a layout bug.

## Left open

- The coach screen's empty conversation is a tall blank area before the first message. It fills
  as soon as the learner writes, so it was left alone rather than padded with decoration.
- Path cover art is dark-themed illustration, so those thumbnails stay dark on a light card. That
  reads as intended (a screenshot in a frame) but a light-mode variant of the artwork would be
  better.
- The type scale is still a fixed rem ladder. Fluid clamping would hold the hero better between
  1280 px and 1920 px.
