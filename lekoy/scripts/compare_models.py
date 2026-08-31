#!/usr/bin/env python3
"""Compare checkpoints and decide whether one may be promoted.

    python scripts/compare_models.py --baseline baseline --candidate sft-v1
    python scripts/compare_models.py --all
    python scripts/compare_models.py --baseline baseline --candidate rc1 --gate

Reads the evaluation results in reports/eval/ rather than re-running anything,
so a comparison is cheap and always refers to the exact numbers that were
written down.

`--gate` exits non-zero when the candidate fails the regression check, so it
can sit in front of a promotion step in a script.
"""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "src"))

from lekoy.evaluation.score import (REGRESSION_THRESHOLDS, Score,         # noqa: E402
                                    leaderboard, regression_check)
from lekoy.paths import REPORTS                                           # noqa: E402

EVAL_DIR = REPORTS / "eval"


def load_run(tag: str) -> dict:
    path = EVAL_DIR / f"{tag}.json"
    if not path.exists():
        available = sorted(p.stem for p in EVAL_DIR.glob("*.json"))
        raise FileNotFoundError(
            f"no evaluation for {tag!r}. Run scripts/evaluate.py --tag {tag} "
            f"first. Available: {available or 'none'}")
    return json.loads(path.read_text(encoding="utf-8"))


def suite_scores(run: dict) -> dict[str, float]:
    """Suite name -> score, whichever shape the file stores.

    The full evaluation JSON keeps the whole suite result (score, items,
    every response) under `suites`; the leaderboard keeps only the number.
    The comparison wants the number either way.
    """
    out = {}
    for name, value in (run.get("suites") or {}).items():
        out[name] = value["score"] if isinstance(value, dict) else value
    return out


def as_score(run: dict) -> Score:
    return Score(total=run["lekoy_score"], dimensions=run["dimensions"],
                 missing=run.get("missing_dimensions", []),
                 coverage=run.get("coverage", 1.0))


def suite_table(runs: list[tuple[str, dict]]) -> str:
    names = sorted({s for _, run in runs for s in suite_scores(run)})
    header = "| Suite | " + " | ".join(f"`{tag}`" for tag, _ in runs) + " |"
    rule = "| --- |" + " ---: |" * len(runs)
    lines = [header, rule]
    for suite in names:
        cells = []
        values = [suite_scores(run).get(suite) for _, run in runs]
        best = max((v for v in values if v is not None), default=None)
        for value in values:
            if value is None:
                cells.append("—")
            elif best is not None and abs(value - best) < 1e-9 and len(runs) > 1:
                cells.append(f"**{value:.3f}**")
            else:
                cells.append(f"{value:.3f}")
        lines.append(f"| `{suite}` | " + " | ".join(cells) + " |")
    return "\n".join(lines)


def render(baseline_tag: str, candidate_tag: str, baseline: dict,
           candidate: dict, verdict, previous: tuple[str, dict] | None) -> str:
    L: list[str] = []
    A = L.append
    A("# LEKOY RV5 — Model Comparison")
    A("")
    A(f"Candidate `{candidate_tag}` against baseline `{baseline_tag}`"
      + (f", with the previous checkpoint `{previous[0]}` for context." if previous
         else "."))
    A("")
    A("## Verdict")
    A("")
    if verdict.passed:
        A(f"**{candidate_tag} passes the regression check.** "
          f"LEKOY SCORE {baseline['lekoy_score'] * 100:.2f} → "
          f"{candidate['lekoy_score'] * 100:.2f} "
          f"({verdict.score_delta * 100:+.2f}).")
    else:
        A(f"**{candidate_tag} fails the regression check and must not be "
          f"promoted.** {len(verdict.blocking)} dimension(s) fell further than "
          "their threshold allows.")
    A("")
    A("```")
    A(verdict.summary())
    A("```")
    A("")
    A("## Dimensions")
    A("")
    runs = [(baseline_tag, baseline)]
    if previous:
        runs.append(previous)
    runs.append((candidate_tag, candidate))
    A("| Dimension | " + " | ".join(f"`{t}`" for t, _ in runs)
      + " | Change | Threshold | |")
    A("| --- |" + " ---: |" * len(runs) + " ---: | ---: | :---: |")
    for dimension in sorted(set(baseline["dimensions"]) | set(candidate["dimensions"])):
        before = baseline["dimensions"].get(dimension)
        after = candidate["dimensions"].get(dimension)
        cells = [f"{run['dimensions'].get(dimension, float('nan')):.3f}"
                 if run["dimensions"].get(dimension) is not None else "—"
                 for _, run in runs]
        if before and after is not None:
            change = (after - before) / before
            change_text = f"{change:+.1%}"
            limit = REGRESSION_THRESHOLDS.get(dimension, 0.10)
            mark = ("blocked" if dimension in verdict.blocking
                    else ("up" if change > 0.001 else
                          ("down" if change < -0.001 else "flat")))
        else:
            change_text, limit, mark = "—", REGRESSION_THRESHOLDS.get(dimension, 0.10), ""
        A(f"| {dimension} | " + " | ".join(cells)
          + f" | {change_text} | −{limit:.0%} | {mark} |")
    A("")
    A("## Suites")
    A("")
    A(suite_table(runs))
    A("")
    if verdict.blocking:
        A("## Why this is blocked")
        A("")
        for dimension, reason in verdict.blocking.items():
            A(f"* **{dimension}** — {reason}")
        A("")
        A("A checkpoint that improves one dimension while destroying several "
          "others is not an improvement, whatever the total says. The "
          "thresholds are in `src/lekoy/evaluation/score.py` and are meant to "
          "be argued with — but changed deliberately, not per-run.")
        A("")
    A("## Wins and losses by suite")
    A("")
    wins, losses = [], []
    for suite, after in suite_scores(candidate).items():
        before = suite_scores(baseline).get(suite)
        if before is None:
            continue
        delta = after - before
        (wins if delta > 0.005 else losses if delta < -0.005 else []).append(
            (suite, before, after, delta))
    A(f"**{len(wins)} suite(s) improved, {len(losses)} regressed.**")
    A("")
    if wins:
        A("| Improved | Before | After | Change |")
        A("| --- | ---: | ---: | ---: |")
        for suite, before, after, delta in sorted(wins, key=lambda t: -t[3]):
            A(f"| `{suite}` | {before:.3f} | {after:.3f} | +{delta:.3f} |")
        A("")
    if losses:
        A("| Regressed | Before | After | Change |")
        A("| --- | ---: | ---: | ---: |")
        for suite, before, after, delta in sorted(losses, key=lambda t: t[3]):
            A(f"| `{suite}` | {before:.3f} | {after:.3f} | {delta:.3f} |")
        A("")
    return "\n".join(L) + "\n"


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--baseline", default="baseline")
    ap.add_argument("--candidate")
    ap.add_argument("--previous", help="an earlier RV5 checkpoint, for context")
    ap.add_argument("--all", action="store_true",
                    help="print the leaderboard over every evaluated checkpoint")
    ap.add_argument("--gate", action="store_true",
                    help="exit non-zero if the candidate fails the regression check")
    ap.add_argument("--out", help="write the comparison to a markdown file")
    args = ap.parse_args()

    if args.all or not args.candidate:
        path = REPORTS / "leaderboard.json"
        if not path.exists():
            print("no evaluations yet — run scripts/evaluate.py first", file=sys.stderr)
            return 2
        entries = json.loads(path.read_text(encoding="utf-8"))
        print(leaderboard(entries))
        return 0

    try:
        baseline = load_run(args.baseline)
        candidate = load_run(args.candidate)
    except FileNotFoundError as exc:
        print(exc, file=sys.stderr)
        return 2
    previous = None
    if args.previous:
        try:
            previous = (args.previous, load_run(args.previous))
        except FileNotFoundError as exc:
            print(f"[warn] {exc}", file=sys.stderr)

    verdict = regression_check(as_score(baseline), as_score(candidate))
    report = render(args.baseline, args.candidate, baseline, candidate,
                    verdict, previous)
    print(report)

    out = Path(args.out) if args.out else \
        REPORTS / f"comparison_{args.baseline}_vs_{args.candidate}.md"
    if not out.is_absolute():
        out = ROOT / out
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(report, encoding="utf-8")
    print(f"wrote {out.relative_to(ROOT)}")

    if args.gate and not verdict.passed:
        print("\nGATE FAILED: this checkpoint must not be promoted.", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
