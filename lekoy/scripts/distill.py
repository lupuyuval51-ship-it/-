#!/usr/bin/env python3
"""Generate LEKOY training data from the faculty of teacher models.

    python scripts/distill.py --list                          # who is on the faculty
    python scripts/distill.py --plan --gpu h100 --bits 4      # what a run would cost
    python scripts/distill.py --role code --max-vram 24       # run the code teachers
    python scripts/distill.py --build-mixture --out data/distill/sft.jsonl

A run is resumable. Every response is appended as it is produced, and starting
again skips what is already on disk — which matters, because a hundred teachers
over a real prompt set is measured in GPU-days.
"""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "src"))

from lekoy.distill import generate, mixture, plan, registry            # noqa: E402
from lekoy.distill.licences import PERMITTED                           # noqa: E402
from lekoy.distill.prompts import read_prompts, seed_prompts, write_prompts  # noqa: E402
from lekoy.paths import REPORTS                                        # noqa: E402


def parse_args() -> argparse.Namespace:
    p = argparse.ArgumentParser(description=__doc__,
                                formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("--list", action="store_true", help="print the faculty and exit")
    p.add_argument("--plan", action="store_true", help="project the run's cost and exit")
    p.add_argument("--build-mixture", action="store_true",
                   help="verify existing responses and write the corpus")

    p.add_argument("--role", choices=["code", "hebrew", "multilingual", "reasoning",
                                      "math", "general"],
                   help="restrict to teachers with this role")
    p.add_argument("--max-vram", type=float, metavar="GB",
                   help="skip teachers whose weights do not fit in this much memory")
    p.add_argument("--bits", type=int, default=16, choices=[4, 8, 16],
                   help="weight precision, for both the fit check and the estimate")
    p.add_argument("--unconditional-only", action="store_true",
                   help="only teachers whose licence attaches no obligation")
    p.add_argument("--no-gated", action="store_true",
                   help="skip teachers that need hub credentials")
    p.add_argument("--limit-teachers", type=int)

    p.add_argument("--prompts", type=Path, help="prompt set JSONL (default: the seed set)")
    p.add_argument("--limit-prompts", type=int)
    p.add_argument("--write-seed-prompts", type=Path,
                   help="write the hand-written seed prompts to this path and exit")

    p.add_argument("--gpu", default="a100-80", choices=sorted(plan.ACCELERATORS))
    p.add_argument("--batch", type=int, default=16)
    p.add_argument("--max-new-tokens", type=int, default=512)
    p.add_argument("--temperature", type=float, default=0.2)
    p.add_argument("--trust-remote-code", action="store_true")

    p.add_argument("--responses", type=Path, default=generate.RESPONSES)
    p.add_argument("--out", type=Path, default=generate.DISTILL / "sft.jsonl")
    p.add_argument("--quorum", type=int, default=3)
    p.add_argument("--majority", type=float, default=0.6)
    p.add_argument("--drop-trivial", action="store_true",
                   help="omit prompts every teacher solved; they teach the student least")
    return p.parse_args()


def faculty(args) -> list:
    teachers = registry.load()
    chosen = registry.filter_teachers(
        teachers, role=args.role, max_vram_gb=args.max_vram, bits=args.bits,
        unconditional_only=args.unconditional_only,
        include_gated=not args.no_gated)
    return chosen[:args.limit_teachers] if args.limit_teachers else chosen


def do_list(teachers) -> int:
    print(f"{'teacher':<48}{'size':>9}  {'tier':<9} {'licence':<26}role")
    print("-" * 116)
    for t in teachers:
        size = f"{t.billions}B" if t.billions else "?"
        mark = " " if t.verdict.status == PERMITTED else "*"
        licence = t.verdict.licence[:24]
        print(f"{t.id:<48}{size:>9}  {t.tier:<9} {mark}{licence:<25}"
              f"{'/'.join(t.roles())}")
    conditional = [t for t in teachers if t.verdict.status != PERMITTED]
    print(f"\n{len(teachers)} teachers, "
          f"{sum(1 for t in teachers if 'code' in t.roles())} of them code.")
    if conditional:
        print(f"* {len(conditional)} carry a licence obligation; "
              f"see data/teachers_registry.json -> release_obligations")
    return 0


def do_plan(teachers, args, prompts) -> int:
    run = plan.plan_run(teachers, accelerator=args.gpu, bits=args.bits,
                        batch=args.batch, prompts=len(prompts),
                        tokens_each=args.max_new_tokens)
    d = run.as_dict()
    print(f"  faculty          {d['teachers_planned']} teachers "
          f"({d['teachers_runnable']} fit on one {args.gpu} at {args.bits}-bit)")
    print(f"  prompts          {d['prompts']:,}")
    print(f"  responses        {d['responses']:,}")
    print(f"  wall clock       {d['total_hours']:,.0f} h  ({d['total_days']:,.1f} days)")
    print(f"  indicative cost  ${d['indicative_usd']:,.0f}  (on-demand list price, "
          f"one accelerator, sequential)")
    if run.skipped:
        print(f"\n  {len(run.skipped)} teacher(s) skipped:")
        for t in run.skipped[:10]:
            print(f"    {t.teacher:<48} {t.note}")
        if len(run.skipped) > 10:
            print(f"    ... and {len(run.skipped) - 10} more")

    REPORTS.mkdir(parents=True, exist_ok=True)
    out = REPORTS / "distill_plan.json"
    out.write_text(json.dumps(d, indent=2) + "\n", encoding="utf-8")
    print(f"\n  wrote {out}")
    return 0


def do_generate(teachers, args, prompts) -> int:
    done = generate.completed(args.responses)
    print(f"{len(teachers)} teachers x {len(prompts)} prompts "
          f"= {len(teachers) * len(prompts):,} responses "
          f"({len(done):,} already on disk)\n")
    passes = []
    for index, teacher in enumerate(teachers, 1):
        print(f"[{index}/{len(teachers)}] {teacher.id}", flush=True)
        try:
            result = generate.run_teacher(
                teacher, prompts, out=args.responses,
                max_new_tokens=args.max_new_tokens, temperature=args.temperature,
                trust_remote_code=args.trust_remote_code, skip=done)
        except Exception as exc:                                   # noqa: BLE001
            # A teacher that cannot be loaded at all — gated, missing, OOM — is
            # not a reason to abandon the other ninety-nine.
            print(f"    could not run: {type(exc).__name__}: {exc}", file=sys.stderr)
            continue
        passes.append(result.as_dict())
        print(f"    {result.produced} produced, {result.skipped} skipped, "
              f"{result.failed} failed, {result.seconds:.0f}s "
              f"({result.tokens_per_second} tok/s)")
        done |= {(teacher.id, p.id) for p in prompts}

    REPORTS.mkdir(parents=True, exist_ok=True)
    (REPORTS / "distill_passes.json").write_text(
        json.dumps(passes, indent=2) + "\n", encoding="utf-8")
    return 0


def do_mixture(args, prompts) -> int:
    records, stats, _ = mixture.build(
        prompts, responses_path=args.responses, quorum=args.quorum,
        majority=args.majority, drop_trivial=args.drop_trivial)
    path = mixture.write(records, args.out)
    summary = stats.as_dict()
    summary["language_mix"] = mixture.language_mix(records)

    print(f"  prompts        {summary['prompts']:,}")
    print(f"  responses      {summary['responses']:,}")
    print(f"  solved         {summary['solved']:,}   unsolved {summary['unsolved']:,}")
    print(f"  duplicates     {summary['duplicates_removed']:,} removed")
    print(f"  leakage        {summary['leaked_removed']:,} removed")
    print(f"  written        {summary['written']:,} -> {path}")
    print(f"  language mix   {summary['language_mix']}")
    if summary["rejection_reasons"]:
        print("\n  why responses were rejected:")
        for reason, count in list(summary["rejection_reasons"].items())[:10]:
            print(f"    {count:>6}  {reason}")

    stats_path = Path(str(path) + ".stats.json")
    stats_path.write_text(json.dumps(summary, indent=2, ensure_ascii=False) + "\n",
                          encoding="utf-8")
    print(f"\n  wrote {stats_path}")
    return 0


def main() -> int:
    args = parse_args()

    if args.write_seed_prompts:
        path = write_prompts(seed_prompts(), args.write_seed_prompts)
        print(f"wrote {len(seed_prompts())} seed prompts to {path}")
        return 0

    prompts = (read_prompts(args.prompts, args.limit_prompts) if args.prompts
               else seed_prompts()[:args.limit_prompts] if args.limit_prompts
               else seed_prompts())

    if args.build_mixture:
        return do_mixture(args, prompts)

    try:
        teachers = faculty(args)
    except FileNotFoundError as exc:
        print(exc, file=sys.stderr)
        return 1
    if not teachers:
        print("no teacher matches those filters", file=sys.stderr)
        return 1

    if args.list:
        return do_list(teachers)
    if args.plan:
        return do_plan(teachers, args, prompts)
    return do_generate(teachers, args, prompts)


if __name__ == "__main__":
    raise SystemExit(main())
