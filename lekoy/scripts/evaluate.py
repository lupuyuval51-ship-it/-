#!/usr/bin/env python3
"""Evaluate a checkpoint and compute its LEKOY SCORE.

    python scripts/evaluate.py --model Qwen/Qwen2.5-0.5B-Instruct --tag baseline
    python scripts/evaluate.py --model checkpoints/rv5/sft --tag sft-v1
    python scripts/evaluate.py --suites hebrew identity --limit 20

Writes reports/eval/<tag>.json (every response, so a score can be audited) and
reports/eval/<tag>.md, and appends the run to reports/leaderboard.json.

Generation is greedy by default. A benchmark that samples is a benchmark whose
numbers change when you re-run it.
"""
from __future__ import annotations

import argparse
import json
import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "src"))

from lekoy.config import LekoyConfig                                      # noqa: E402
from lekoy.evaluation import score as scoring                             # noqa: E402
from lekoy.evaluation import tasks                                        # noqa: E402
from lekoy.evaluation.runner import Evaluator                             # noqa: E402
from lekoy.identity import system_prompt                                  # noqa: E402
from lekoy.paths import REPORTS                                           # noqa: E402
from lekoy.training.common import (load_model, load_tokenizer,            # noqa: E402
                                   setup_environment)

EVAL_DIR = REPORTS / "eval"
LEADERBOARD = REPORTS / "leaderboard.json"


def load_checkpoint(config: LekoyConfig, path: str):
    """Load a base model, a merged checkpoint, or a LoRA adapter directory."""
    import torch

    adapter = Path(path) / "adapter_config.json"
    if adapter.exists():
        from peft import PeftModel
        base = json.loads(adapter.read_text(encoding="utf-8")).get(
            "base_model_name_or_path") or config.model.name
        print(f"[model] LoRA adapter at {path} over {base}")
        config.model.name = base
        model = load_model(config, for_training=False)
        model = PeftModel.from_pretrained(model, path)
        model = model.merge_and_unload()
        tokenizer = load_tokenizer(config, path)
    else:
        config.model.name = path
        model = load_model(config, for_training=False)
        tokenizer = load_tokenizer(config, path)
    model.config.use_cache = True
    return model, tokenizer


def render(tag: str, model_path: str, suites: dict, score: scoring.Score,
           elapsed: float) -> str:
    L: list[str] = []
    A = L.append
    A(f"# LEKOY RV5 — Evaluation: `{tag}`")
    A("")
    A(f"Model: `{model_path}` · {sum(s['items'] for s in suites.values())} items "
      f"across {len(suites)} suites · {elapsed / 60:.1f} minutes")
    A("")
    A("Greedy decoding, so these numbers reproduce exactly on a re-run. Every "
      "response is kept in the JSON beside this file.")
    A("")
    A("## LEKOY SCORE")
    A("")
    A(score.table())
    A("")
    A("## Suites")
    A("")
    A("| Suite | Items | Score | Perfect | Zero | Time |")
    A("| --- | ---: | ---: | ---: | ---: | ---: |")
    for name, result in sorted(suites.items(), key=lambda kv: -kv[1]["score"]):
        A(f"| `{name}` | {result['items']} | **{result['score']:.3f}** "
          f"| {result['perfect']} | {result['zero']} | {result['seconds']:.0f}s |")
    A("")
    hebrew = suites.get("hebrew")
    if hebrew and hebrew.get("by_category"):
        A("## Hebrew benchmark, by category")
        A("")
        A("| Category | Score |")
        A("| --- | ---: |")
        for category, value in sorted(hebrew["by_category"].items(),
                                      key=lambda kv: -kv[1]):
            A(f"| {category.replace('_', ' ')} | {value:.3f} |")
        A("")
        errors = hebrew.get("hebrew_agreement_errors", 0)
        A(f"Hebrew agreement errors detected across the suite: **{errors}**. "
          "Reported rather than scored — the detector is high-precision and "
          "low-recall, so it is a tripwire, not a grade.")
        A("")
    identity = suites.get("identity")
    if identity:
        wrong = [r for r in identity["results"] if "claims to be" in r["detail"]]
        A("## Identity")
        A("")
        A(f"{identity['perfect']}/{identity['items']} answers state the LEKOY "
          f"identity correctly.")
        if wrong:
            A("")
            A(f"**{len(wrong)} answer(s) claim a foreign identity**, which is the "
              "behaviour Stage 2 identity training exists to remove:")
            A("")
            for result in wrong[:4]:
                A(f"* `{result['id']}` — {result['detail']} — "
                  f"\"{result['response'][:110].strip()}…\"")
        A("")
    hallucination = suites.get("hallucination")
    if hallucination:
        A("## Honesty about uncertainty")
        A("")
        A(f"{hallucination['perfect']}/{hallucination['items']} unanswerable "
          "questions drew an appropriate hedge; "
          f"{hallucination['zero']} drew a confident fabricated claim.")
        A("")
    coding = suites.get("coding")
    if coding:
        A("## Coding")
        A("")
        A(f"{coding['perfect']}/{coding['items']} generated programs passed "
          "their assertions when executed.")
        A("")
        A("| Item | Result |")
        A("| --- | --- |")
        for result in coding["results"]:
            mark = "pass" if result["score"] >= 1 else f"fail — {result['detail']}"
            A(f"| `{result['id']}` | {mark} |")
        A("")
    A("## Weakest results")
    A("")
    weak = sorted(
        (r for s in suites.values() for r in s["results"]),
        key=lambda r: (r["score"], r["suite"] or ""))[:12]
    A("| Item | Suite | Score | Why |")
    A("| --- | --- | ---: | --- |")
    for result in weak:
        A(f"| `{result['id']}` | {result['suite']} | {result['score']:.1f} "
          f"| {result['detail'][:90]} |")
    return "\n".join(L) + "\n"


def update_leaderboard(entry: dict) -> list[dict]:
    entries = []
    if LEADERBOARD.exists():
        try:
            entries = json.loads(LEADERBOARD.read_text(encoding="utf-8"))
        except json.JSONDecodeError:
            entries = []
    entries = [e for e in entries if e.get("name") != entry["name"]]
    entries.append(entry)
    LEADERBOARD.parent.mkdir(parents=True, exist_ok=True)
    LEADERBOARD.write_text(json.dumps(entries, indent=2, ensure_ascii=False),
                           encoding="utf-8")
    return entries


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--model", required=True,
                    help="hub id, checkpoint directory, or LoRA adapter directory")
    ap.add_argument("--tag", help="name for this run (default: derived from --model)")
    ap.add_argument("--config", default="rv5_small.yaml")
    ap.add_argument("--suites", nargs="*", help="suites to run (default: all)")
    ap.add_argument("--limit", type=int, help="cap items per suite")
    ap.add_argument("--max-new-tokens", type=int)
    ap.add_argument("--temperature", type=float)
    ap.add_argument("--no-system-prompt", action="store_true",
                    help="evaluate without the LEKOY system prompt")
    ap.add_argument("--experiment", help="attach these results to an experiment id")
    args = ap.parse_args()

    config = LekoyConfig.load(args.config)
    setup_environment(config)
    tag = args.tag or Path(args.model).name.replace("/", "_")

    print(f"[eval ] {tag} <- {args.model}")
    model, tokenizer = load_checkpoint(config, args.model)
    evaluator = Evaluator(
        model, tokenizer,
        system_prompt=None if args.no_system_prompt else system_prompt("he"),
        max_new_tokens=args.max_new_tokens or config.evaluation.max_new_tokens,
        temperature=args.temperature if args.temperature is not None
        else config.evaluation.temperature)

    suites = tasks.load(args.suites, args.limit)
    print(f"[eval ] {sum(len(v) for v in suites.values())} items across "
          f"{len(suites)} suites")

    results, started = {}, time.time()
    for name, items in suites.items():
        print(f"  [{name}] {len(items)} items")
        results[name] = evaluator.run_suite(name, items, limit=args.limit)
        print(f"  [{name}] score {results[name]['score']:.4f} "
              f"({results[name]['seconds']:.0f}s)")
    elapsed = time.time() - started

    score = scoring.compute({k: v["score"] for k, v in results.items()})
    print("\n" + score.table())

    EVAL_DIR.mkdir(parents=True, exist_ok=True)
    payload = {
        "tag": tag, "model": args.model, "config": config.name,
        "seconds": round(elapsed, 1),
        "system_prompt": not args.no_system_prompt,
        "temperature": evaluator.temperature,
        **score.as_dict(),
        "suites": {k: {kk: vv for kk, vv in v.items()} for k, v in results.items()},
    }
    (EVAL_DIR / f"{tag}.json").write_text(
        json.dumps(payload, indent=2, ensure_ascii=False), encoding="utf-8")
    (EVAL_DIR / f"{tag}.md").write_text(
        render(tag, args.model, results, score, elapsed), encoding="utf-8")

    entries = update_leaderboard({
        "name": tag, "model": args.model,
        "lekoy_score": score.total, "dimensions": score.dimensions,
        "suites": {k: v["score"] for k, v in results.items()},
        "seconds": round(elapsed, 1),
    })
    (REPORTS / "leaderboard.md").write_text(
        "# LEKOY RV5 — Internal Leaderboard\n\n"
        "Every scored checkpoint, best first. Produced by `scripts/evaluate.py`.\n\n"
        + scoring.leaderboard(entries) + "\n", encoding="utf-8")

    if args.experiment:
        from lekoy.training.experiment import Experiment
        experiment = Experiment.load(args.experiment)
        experiment.record_benchmark(score.as_dict())

    print(f"\nwrote {(EVAL_DIR / f'{tag}.md').relative_to(ROOT)}")
    print(f"wrote {(EVAL_DIR / f'{tag}.json').relative_to(ROOT)}")
    print(f"wrote {(REPORTS / 'leaderboard.md').relative_to(ROOT)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
