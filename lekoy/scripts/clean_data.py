#!/usr/bin/env python3
"""Normalise data/raw/ into data/cleaned/: encoding repair, boilerplate, PII.

Writes a `.stats.json` beside every output naming what was removed and why.
"""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "src"))

from lekoy.data.pipeline import clean_stage, read_jsonl, write_jsonl   # noqa: E402
from lekoy.data.registry import Registry                                # noqa: E402
from lekoy.paths import CLEANED, RAW                                    # noqa: E402


def outputs_for(path: Path) -> Path:
    return CLEANED / path.relative_to(RAW)


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--datasets", nargs="*", help="clean only these (by file stem)")
    ap.add_argument("--no-pii-redaction", action="store_true",
                    help="keep personal data verbatim; only for inspecting what is there")
    ap.add_argument("--force", action="store_true", help="reclean sources already done")
    args = ap.parse_args()

    files = sorted(RAW.rglob("*.jsonl"))
    if args.datasets:
        files = [f for f in files if f.stem in args.datasets]
    if not files:
        print("nothing in data/raw/ — run scripts/download_data.py first", file=sys.stderr)
        return 2

    registry = Registry.load()
    total_in = total_out = 0
    for path in files:
        out = outputs_for(path)
        if out.exists() and not args.force:
            print(f"[have] {path.stem}")
            continue
        records, stats = clean_stage(read_jsonl(path), path.stem,
                                     redact_pii=not args.no_pii_redaction)
        write_jsonl(out, records)
        stats.save(out)
        total_in += stats.seen
        total_out += stats.kept
        pii = stats.extra.get("pii_redacted") or {}
        pii_note = (" · redacted " + ", ".join(f"{v} {k}" for k, v in pii.items())) if pii else ""
        print(f"[ok  ] {path.stem:24s} {stats.seen:7d} -> {stats.kept:7d} "
              f"({stats.kept / stats.seen:.1%}){pii_note}" if stats.seen else
              f"[skip] {path.stem}: empty")
        if path.stem in registry.entries:
            registry.record_stage(path.stem, "clean", **{
                k: v for k, v in stats.as_dict().items() if k not in ("examples", "stage", "source")})

    registry.save()
    if total_in:
        print(f"\ncleaned {total_in:,} -> {total_out:,} records "
              f"({total_out / total_in:.1%} kept)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
