#!/usr/bin/env python3
"""Fetch the LEKOY RV5 raw corpus from the hub into data/raw/.

Refuses any source whose licence is not on the permitted list, writes one JSONL
per source, and records what actually arrived in the dataset registry. Re-runs
are cheap: a shard already on disk at the right size is not fetched again.
"""
from __future__ import annotations

import argparse
import json
import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "src"))

from lekoy.data import catalogue                                   # noqa: E402
from lekoy.data.registry import Registry                           # noqa: E402
from lekoy.data.sources import SourceError, fetch                  # noqa: E402
from lekoy.paths import RAW, ensure                                # noqa: E402

CACHE = RAW / "_parquet"


def destination(source) -> Path:
    """Raw JSONL lands under the language it belongs to."""
    sub = {"hebrew": "hebrew", "english": "english", "spanish": "spanish"}.get(
        source.language, "")
    return (RAW / sub / f"{source.name}.jsonl") if sub else (RAW / f"{source.name}.jsonl")


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--datasets", nargs="*", help="fetch only these registry names")
    ap.add_argument("--categories", nargs="*",
                    choices=["pretrain", "instruction", "reasoning", "coding",
                             "preference", "evaluation"])
    ap.add_argument("--languages", nargs="*", choices=["hebrew", "english", "spanish"])
    ap.add_argument("--limit", type=int, help="cap rows per source (overrides the catalogue)")
    ap.add_argument("--force", action="store_true", help="refetch sources already on disk")
    ap.add_argument("--keep-parquet", action="store_true",
                    help="keep the downloaded shards; they are deleted by default "
                         "because they are much larger than the extracted JSONL")
    ap.add_argument("--list", action="store_true", help="show the catalogue and exit")
    args = ap.parse_args()

    if args.list:
        print(f"{'name':24s} {'lang':9s} {'category':12s} {'licence':14s} rows")
        for s in catalogue.ALL:
            mark = " " if s.permitted else "!"
            print(f"{mark}{s.name:23s} {s.language:9s} {s.category:12s} "
                  f"{s.licence:14s} {s.rows}")
        return 0

    sources = catalogue.select(args.datasets, args.categories, args.languages)
    if not sources:
        print("no sources matched the filters", file=sys.stderr)
        return 2

    ensure(CACHE, RAW / "hebrew", RAW / "english", RAW / "spanish")
    registry = Registry.load()
    failures: list[tuple[str, str]] = []

    for source in sources:
        out = destination(source)
        if not source.permitted:
            print(f"[skip] {source.name}: {source.rejection_reason}")
            registry.reject(source, source.rejection_reason)
            continue
        if out.exists() and not args.force:
            existing = sum(1 for _ in out.open(encoding="utf-8"))
            print(f"[have] {source.name}: {existing} records already at {out.relative_to(ROOT)}")
            continue

        if args.limit:
            source.rows = min(source.rows, args.limit)
        print(f"[get ] {source.name} <- {source.dataset}"
              f"{'/' + source.config if source.config else ''} "
              f"({source.licence}, up to {source.rows} rows)")
        started = time.time()
        try:
            records = fetch(source, CACHE)
        except SourceError as exc:
            print(f"[FAIL] {source.name}: {exc}", file=sys.stderr)
            failures.append((source.name, str(exc)))
            registry.reject(source, f"fetch failed: {exc}")
            continue

        if not records:
            print(f"[FAIL] {source.name}: fetch returned no usable rows", file=sys.stderr)
            failures.append((source.name, "no usable rows"))
            registry.reject(source, "fetch returned no usable rows")
            continue

        out.parent.mkdir(parents=True, exist_ok=True)
        with out.open("w", encoding="utf-8") as fh:
            for record in records:
                fh.write(json.dumps(record, ensure_ascii=False) + "\n")
        elapsed = time.time() - started
        print(f"[ok  ] {source.name}: {len(records)} records, "
              f"{out.stat().st_size / 1e6:.1f} MB, {elapsed:.0f}s")
        registry.record_raw(source, out, records)

    if not args.keep_parquet:
        freed = 0
        for shard in CACHE.glob("*.parquet"):
            freed += shard.stat().st_size
            shard.unlink()
        if freed:
            print(f"[tidy] removed {freed / 1e9:.1f} GB of parquet shards "
                  "(pass --keep-parquet to keep them)")

    registry.save()
    print(f"\nregistry: {registry.path.relative_to(ROOT)}")
    if failures:
        print(f"\n{len(failures)} source(s) failed:", file=sys.stderr)
        for name, why in failures:
            print(f"  {name}: {why[:160]}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
