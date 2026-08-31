#!/usr/bin/env python3
"""Deduplicate data/filtered/ into data/deduplicated/, and check eval leakage.

    python scripts/deduplicate.py                  # dedupe every source
    python scripts/deduplicate.py --check-leakage  # train vs eval overlap only

The leakage check is the important one and is meant to be run before every
training stage. A benchmark passage that is also in the training mix turns the
benchmark into a memorisation test.
"""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "src"))

from lekoy.data.dedup import find_leakage                                # noqa: E402
from lekoy.data.pipeline import (dedup_stage, read_jsonl, text_of,       # noqa: E402
                                 write_jsonl)
from lekoy.data.registry import Registry                                 # noqa: E402
from lekoy.paths import DEDUPLICATED, FILTERED, REPORTS                  # noqa: E402

EVAL_SOURCES = ("belebele", "global_mmlu", "gsm8k_test")


def is_eval(path: Path) -> bool:
    return any(path.stem.startswith(prefix) or path.stem == prefix
               for prefix in EVAL_SOURCES)


def check_leakage(threshold: float, limit: int | None) -> int:
    train_files = [p for p in sorted(DEDUPLICATED.rglob("*.jsonl"))
                   if not p.name.endswith(".stats.json") and not is_eval(p)]
    if not train_files:
        train_files = [p for p in sorted(FILTERED.rglob("*.jsonl"))
                       if not p.name.endswith(".stats.json") and not is_eval(p)]
    eval_files = [p for p in sorted(FILTERED.rglob("*.jsonl"))
                  if not p.name.endswith(".stats.json") and is_eval(p)]
    if not eval_files:
        print("no evaluation sources found; nothing to check against", file=sys.stderr)
        return 2

    evaluation: list[tuple[int, str]] = []
    eval_origin: dict[int, str] = {}
    for path in eval_files:
        for record in read_jsonl(path):
            key = len(evaluation)
            evaluation.append((key, text_of(record)))
            eval_origin[key] = path.stem
    print(f"indexed {len(evaluation):,} evaluation documents from "
          f"{len(eval_files)} source(s)")

    all_leaks: list[dict] = []
    for path in train_files:
        train: list[tuple[int, str]] = []
        for i, record in enumerate(read_jsonl(path)):
            if limit and i >= limit:
                break
            train.append((i, text_of(record)))
        leaks = find_leakage(train, evaluation, threshold=threshold)
        for leak in leaks:
            leak["train_source"] = path.stem
            leak["eval_source"] = eval_origin[leak["eval_key"]]
        all_leaks.extend(leaks)
        marker = "LEAK" if leaks else "ok  "
        print(f"[{marker}] {path.stem:24s} {len(train):7,d} docs · {len(leaks)} overlap(s)")

    report = REPORTS / "leakage_report.json"
    report.parent.mkdir(parents=True, exist_ok=True)
    report.write_text(json.dumps({
        "threshold": threshold,
        "evaluation_documents": len(evaluation),
        "leaks": all_leaks[:200],
        "total_leaks": len(all_leaks),
    }, indent=2, ensure_ascii=False), encoding="utf-8")

    print(f"\n{len(all_leaks)} overlapping document(s) — wrote "
          f"{report.relative_to(ROOT)}")
    if all_leaks:
        print("\nWorst offenders:")
        for leak in sorted(all_leaks, key=lambda l: -l["jaccard"])[:5]:
            print(f"  {leak['jaccard']:.2f}  {leak['train_source']} <-> {leak['eval_source']}")
            print(f"        {leak['train_preview'][:90]}")
        return 1
    print("No training document overlaps the evaluation sets at this threshold.")
    return 0


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--datasets", nargs="*")
    ap.add_argument("--threshold", type=float, default=0.6,
                    help="Jaccard threshold for a near duplicate (default 0.6)")
    ap.add_argument("--no-near", action="store_true",
                    help="exact and normalised passes only; much faster")
    ap.add_argument("--check-leakage", action="store_true",
                    help="check training data against the evaluation sets and exit")
    ap.add_argument("--leakage-limit", type=int,
                    help="cap documents per training source during the leakage check")
    ap.add_argument("--force", action="store_true")
    args = ap.parse_args()

    if args.check_leakage:
        return check_leakage(args.threshold, args.leakage_limit)

    files = [p for p in sorted(FILTERED.rglob("*.jsonl"))
             if not p.name.endswith(".stats.json")]
    if args.datasets:
        files = [f for f in files if f.stem in args.datasets]
    if not files:
        print("nothing in data/filtered/ — run scripts/filter_data.py first", file=sys.stderr)
        return 2

    registry = Registry.load()
    total_in = total_out = 0
    for path in files:
        out = DEDUPLICATED / path.relative_to(FILTERED)
        if out.exists() and not args.force:
            print(f"[have] {path.stem}")
            continue
        records, stats = dedup_stage(list(read_jsonl(path)), path.stem,
                                     near=not args.no_near, threshold=args.threshold)
        write_jsonl(out, records)
        stats.save(out)
        total_in += stats.seen
        total_out += stats.kept
        r = stats.reasons
        print(f"[ok  ] {path.stem:24s} {stats.seen:7d} -> {stats.kept:7d} "
              f"({stats.kept / max(stats.seen, 1):.1%}) "
              f"exact={r['exact duplicate']} norm={r['normalised duplicate']} "
              f"near={r['near duplicate']}")
        if path.stem in registry.entries:
            registry.record_stage(path.stem, "dedup", **{
                k: v for k, v in stats.as_dict().items() if k not in ("examples", "stage", "source")})

    registry.save()
    if total_in:
        print(f"\ndeduplicated {total_in:,} -> {total_out:,} ({total_out / total_in:.1%} kept)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
