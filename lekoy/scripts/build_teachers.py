#!/usr/bin/env python3
"""Build `data/teachers_registry.json` from the live Hugging Face model API.

Every fact in the registry — licence, parameter count, gating — is read from
the hub at build time. Re-running this is how the project notices that a
teacher's licence changed, which is not hypothetical: the Llama licence
reversed its position on output-distillation between 3.0 and 3.1.

    python scripts/build_teachers.py                 # build and write
    python scripts/build_teachers.py --dry-run       # show, write nothing
    python scripts/build_teachers.py --check         # fail if the file is stale
"""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "src"))

from lekoy.distill import registry, report    # noqa: E402
from lekoy.distill.registry import CODE_FLOOR, TARGET  # noqa: E402
from lekoy.paths import REPORTS                        # noqa: E402


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__,
                                     formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--out", type=Path, default=registry.TEACHERS_REGISTRY)
    parser.add_argument("--dry-run", action="store_true",
                        help="probe and report, write nothing")
    parser.add_argument("--check", action="store_true",
                        help="exit non-zero if the registry on disk is out of date")
    parser.add_argument("--quiet", action="store_true")
    args = parser.parse_args()

    seen = [0]

    def progress(model_id: str, detail: str) -> None:
        seen[0] += 1
        if not args.quiet:
            print(f"  [{seen[0]:>3}] {model_id:<52} {detail}", flush=True)

    if not args.quiet:
        print("Probing the hub for every candidate teacher.\n")
    payload = registry.build(progress=progress)
    summary = payload["summary"]

    print(f"\n  candidates   {summary['candidates']}")
    print(f"  selected     {summary['selected']}  (target {TARGET})")
    print(f"  code         {summary['code_teachers']}  (floor {CODE_FLOOR})")
    print(f"  hebrew       {summary['hebrew_teachers']}")
    print(f"  rejected     {summary['rejected']}")
    print(f"  licences     {summary['unconditional']} unconditional, "
          f"{summary['conditional']} conditional")
    print(f"  tiers        " + ", ".join(f"{k} {v}" for k, v in summary["by_tier"].items()))

    if payload["release_obligations"]:
        print("\n  Obligations a release distilled from this faculty inherits:")
        for line in payload["release_obligations"]:
            print(f"    - {line}")

    shortfall = []
    if summary["selected"] < TARGET:
        shortfall.append(f"only {summary['selected']} of {TARGET} teachers cleared "
                         f"the licence gate")
    if summary["code_teachers"] < CODE_FLOOR:
        shortfall.append(f"only {summary['code_teachers']} of {CODE_FLOOR} required "
                         f"code teachers cleared the licence gate")
    for line in shortfall:
        print(f"\n  SHORT: {line}", file=sys.stderr)

    if args.dry_run:
        print("\n  --dry-run: nothing written")
        return 1 if shortfall else 0

    if args.check:
        if not args.out.exists():
            print(f"\n  {args.out} does not exist", file=sys.stderr)
            return 1
        old = json.loads(args.out.read_text(encoding="utf-8"))
        drift = _drift(old, payload)
        if drift:
            print(f"\n  {len(drift)} change(s) since the registry was written:",
                  file=sys.stderr)
            for line in drift:
                print(f"    {line}", file=sys.stderr)
            return 1
        print("\n  registry is up to date")
        return 0

    path = registry.save(payload, args.out)
    print(f"\n  wrote {path}")
    markdown = report.write(payload, REPORTS / "teacher_faculty.md")
    print(f"  wrote {markdown}")
    return 1 if shortfall else 0


def _drift(old: dict, new: dict) -> list[str]:
    """What changed on the hub since the registry was last written."""
    def index(payload: dict) -> dict[str, dict]:
        return {e["id"]: e for e in payload.get("teachers", []) + payload.get("rejected", [])}

    before, after = index(old), index(new)
    lines = []
    for model_id in sorted(set(before) | set(after)):
        a, b = before.get(model_id), after.get(model_id)
        if a is None:
            lines.append(f"+ {model_id} (new candidate)")
        elif b is None:
            lines.append(f"- {model_id} (no longer a candidate)")
        else:
            for field in ("licence", "licence_verdict", "params", "gated", "status"):
                if a.get(field) != b.get(field):
                    lines.append(f"~ {model_id}: {field} {a.get(field)!r} -> {b.get(field)!r}")
    return lines


if __name__ == "__main__":
    raise SystemExit(main())
