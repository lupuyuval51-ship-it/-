#!/usr/bin/env python3
"""Score every document in data/cleaned/ and keep what passes.

Quality scoring and language verification. The language check is the one that
matters most here: source labels are wrong often enough that trusting them puts
Punjabi in the Hebrew corpus — see docs/base_model_selection.md.
"""
from __future__ import annotations

import argparse
import json
import sys
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "src"))

from lekoy.data.pipeline import filter_stage, read_jsonl, write_jsonl    # noqa: E402
from lekoy.data.registry import Registry                                 # noqa: E402
from lekoy.paths import CLEANED, FILTERED                                # noqa: E402


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--datasets", nargs="*")
    ap.add_argument("--min-score", type=float, default=0.5)
    ap.add_argument("--no-language-check", action="store_true")
    ap.add_argument("--force", action="store_true")
    args = ap.parse_args()

    files = sorted(CLEANED.rglob("*.jsonl"))
    files = [f for f in files if not f.name.endswith(".stats.json")]
    if args.datasets:
        files = [f for f in files if f.stem in args.datasets]
    if not files:
        print("nothing in data/cleaned/ — run scripts/clean_data.py first", file=sys.stderr)
        return 2

    registry = Registry.load()
    rollup: Counter = Counter()
    total_in = total_out = 0
    for path in files:
        out = FILTERED / path.relative_to(CLEANED)
        if out.exists() and not args.force:
            print(f"[have] {path.stem}")
            continue
        records, stats = filter_stage(
            read_jsonl(path), path.stem, min_score=args.min_score,
            check_language=not args.no_language_check)
        write_jsonl(out, records)
        stats.save(out)
        total_in += stats.seen
        total_out += stats.kept
        rollup.update(stats.reasons)
        top = ", ".join(f"{k} ({v})" for k, v in stats.reasons.most_common(2))
        print(f"[ok  ] {path.stem:24s} {stats.seen:7d} -> {stats.kept:7d} "
              f"({stats.kept / max(stats.seen, 1):.1%}) "
              f"mean_q={stats.extra.get('mean_quality_score')} | {top}")
        if path.stem in registry.entries:
            registry.record_stage(path.stem, "filter", **{
                k: v for k, v in stats.as_dict().items() if k not in ("examples", "stage", "source")})
            if stats.extra.get("mean_quality_score") is not None:
                registry.set_quality(path.stem, stats.extra["mean_quality_score"])

    registry.save()
    if total_in:
        print(f"\nfiltered {total_in:,} -> {total_out:,} ({total_out / total_in:.1%} kept)")
        print("\ntop rejection reasons across the corpus:")
        for reason, count in rollup.most_common(12):
            print(f"  {count:8,d}  {reason}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
