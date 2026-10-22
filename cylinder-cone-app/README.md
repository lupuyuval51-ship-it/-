# Surface area of a cylinder and a cone

A small, dependency-free lesson app (Hebrew/RTL by default, English/LTR toggle).

It has three tabs for the selected shape:

- **למידה / Learn**: the unrolled net of the shape, and the formulas with the reasoning behind them.
- **מחשבון / Calculator**: sliders for r and h, a drawing of the solid, and a step-by-step calculation.
- **תרגול / Practice**: random questions with hints, a full worked solution, and a running score.

## Run

Open `index.html` in a browser. No build step and no server are needed.

## Single HTML file

`cylinder-cone.html` is the same app packed into one self-contained file (CSS and JavaScript inlined, no external references). Send or open that file alone. Regenerate it after changing any source file:

```bash
npm run build
```

## Test

```bash
npm test
```

The tests cover the formulas, the practice question generator, and the answer checker (`geometry.test.js`).

## Files

- `geometry.js`: formulas, practice question generator, and answer checker. Runs in the browser and in Node.
- `app.js`: UI, strings in Hebrew and English, and SVG drawings.
- `styles.css`: layout and light/dark colors.
- `build-single-file.js`: packs the three files above into `cylinder-cone.html`.
