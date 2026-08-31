#!/usr/bin/env python3
"""Materialise the evaluation suites into eval/ as JSONL.

    python scripts/build_eval.py
    python scripts/build_eval.py --suites hebrew coding

The suites are defined in Python — that is where the scoring logic lives and it
has to stay next to the items. But a benchmark nobody can read is a benchmark
nobody can check, so this writes every suite out as plain JSONL under `eval/`,
one directory per suite, with a README saying what each item is scored on.

The written files are a view, not the source: `scripts/evaluate.py` reads the
Python definitions. Re-run this after changing a suite.
"""
from __future__ import annotations

import argparse
import json
import sys
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "src"))

from lekoy.evaluation import tasks                                       # noqa: E402
from lekoy.evaluation.score import DIMENSION_SUITES, WEIGHTS             # noqa: E402
from lekoy.paths import EVAL                                             # noqa: E402

SCORER_NOTES = {
    "choice": "multiple choice; the letter is extracted from free-form text",
    "numeric": "the final number in the response must match",
    "exact": "normalised exact match",
    "contains": "the reference string must appear in the response",
    "format": "an explicit formatting constraint, checked field by field",
    "language": "the response must be in the language it was asked in",
    "uncertainty": "an unanswerable question; hedging passes, a confident "
                   "specific claim fails",
    "identity": "the response must state the LEKOY identity and must not claim "
                "a foreign one",
    "code": "the generated program is executed against assertions",
}

# Which suite belongs in which directory. Suites the LEKOY SCORE folds into one
# dimension are grouped together, so the tree matches the score.
FOLDERS = {
    "hebrew": "hebrew", "belebele_hebrew": "hebrew", "global_mmlu_hebrew": "hebrew",
    "english": "english", "belebele_english": "english",
    "global_mmlu_english": "english",
    "spanish": "spanish", "belebele_spanish": "spanish",
    "global_mmlu_spanish": "spanish",
    "reasoning": "reasoning", "math": "math", "gsm8k": "math",
    "coding": "coding", "translation": "translation",
    "instruction_following": "instruction_following",
    "hallucination": "hallucination", "identity": "hallucination",
}


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--suites", nargs="*")
    ap.add_argument("--out", default=str(EVAL))
    args = ap.parse_args()

    out_root = Path(args.out)
    suites = tasks.load(args.suites)
    written: dict[str, int] = {}

    for name, items in suites.items():
        folder = out_root / FOLDERS.get(name, name)
        folder.mkdir(parents=True, exist_ok=True)
        path = folder / f"{name}.jsonl"
        with path.open("w", encoding="utf-8") as fh:
            for item in items:
                fh.write(json.dumps(item, ensure_ascii=False) + "\n")
        written[name] = len(items)
        print(f"  {name:24s} {len(items):5d} -> {path.relative_to(ROOT)}")

    total = sum(written.values())
    scorers = Counter(item["scorer"] for items in suites.values() for item in items)

    lines = [
        "# LEKOY RV5 — Evaluation Suites", "",
        f"{total:,} items across {len(suites)} suites. Written by",
        "`scripts/build_eval.py` from the definitions in",
        "`src/lekoy/evaluation/tasks.py`, which is where the scoring logic lives",
        "and therefore where the items have to live too. These files are a view",
        "for reading and checking; `scripts/evaluate.py` reads the Python.", "",
        "## Suites", "",
        "| Suite | Items | Directory | Feeds |",
        "| --- | ---: | --- | --- |",
    ]
    for name, count in sorted(written.items(), key=lambda kv: -kv[1]):
        dimension = next((d for d, s in DIMENSION_SUITES.items() if name in s), "—")
        weight = f"{dimension} ({WEIGHTS[dimension]:.0%})" if dimension in WEIGHTS else "—"
        lines.append(f"| `{name}` | {count} | `{FOLDERS.get(name, name)}/` | {weight} |")
    lines += ["", "## Scorers", "",
              "Every item is scored deterministically. No suite uses a model to",
              "judge another model's output: an LLM-judge score cannot be",
              "reproduced by someone else, and a benchmark whose numbers cannot",
              "be reproduced is not evidence.", "",
              "| Scorer | Items | How |", "| --- | ---: | --- |"]
    for scorer, count in scorers.most_common():
        lines.append(f"| `{scorer}` | {count} | {SCORER_NOTES.get(scorer, '')} |")
    lines += ["", "## Held out of training", "",
              "`scripts/deduplicate.py --check-leakage` asserts that no training",
              "document overlaps these items, and it runs before every training",
              "stage rather than after. A benchmark passage that is also in the",
              "training mixture turns the benchmark into a memorisation test.", ""]

    (out_root / "README.md").write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(f"\n{total:,} items · wrote {(out_root / 'README.md').relative_to(ROOT)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
