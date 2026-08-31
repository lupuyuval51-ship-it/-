#!/usr/bin/env python3
"""Tokenize prepared datasets, and report what they cost in tokens.

    python scripts/tokenize_data.py --task sft
    python scripts/tokenize_data.py --task all --report

Named `tokenize_data.py`, not `tokenize.py`. Python puts a script's own
directory first on `sys.path`, so a file called `scripts/tokenize.py` shadows
the standard library's `tokenize` module for *every other script in the same
directory* — and `linecache` imports `tokenize` lazily, so the failure surfaces
as a circular-import error from an unrelated script, minutes into a run. This
was not theoretical: it broke `scripts/evaluate.py` on the baseline run.

Two jobs. It writes token-id files to data/tokenized/ so a training run does
not re-tokenize the corpus on every restart, and it fills in the token counts
in the dataset registry — measured with the selected tokenizer, because a
character-based estimate is wrong by 1.75× for Hebrew on this tokenizer and
that is exactly the size of error that ruins a training budget.
"""
from __future__ import annotations

import argparse
import json
import sys
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "src"))

from lekoy.config import LekoyConfig                                      # noqa: E402
from lekoy.data.registry import Registry                                  # noqa: E402
from lekoy.paths import (CODING, DATA, INSTRUCTION, PREFERENCE,           # noqa: E402
                         REASONING, REPORTS, TOKENIZED)
from lekoy.training.common import load_tokenizer                          # noqa: E402
from lekoy.training.dataset import (ChatDataset, TextDataset,             # noqa: E402
                                    read_jsonl)

TASK_DIRS = {
    "sft": INSTRUCTION,
    "reasoning": REASONING,
    "coding": CODING,
    "preference": PREFERENCE,
    "pretrain": DATA / "pretrain",
}


def tokenize_split(path: Path, tokenizer, max_length: int, chat: bool) -> tuple[list[dict], dict]:
    records = read_jsonl(path)
    if not records:
        return [], {"examples": 0}
    if chat:
        dataset = ChatDataset(records, tokenizer, max_length)
    else:
        dataset = TextDataset(records, tokenizer, max_length, packing=True)
    rows = [{"input_ids": e["input_ids"], "labels": e["labels"]} for e in dataset]
    return rows, dataset.stats()


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--task", default="sft", choices=[*TASK_DIRS, "all"])
    ap.add_argument("--config", default="rv5_small.yaml")
    ap.add_argument("--max-length", type=int)
    ap.add_argument("--report", action="store_true",
                    help="also measure raw corpus token counts into the registry")
    args = ap.parse_args()

    config = LekoyConfig.load(args.config)
    tokenizer = load_tokenizer(config)
    max_length = args.max_length or config.training.max_seq_length
    print(f"[tok  ] {config.model.name} · vocab {len(tokenizer):,} · "
          f"max_length {max_length}")

    tasks = list(TASK_DIRS) if args.task == "all" else [args.task]
    summary: dict[str, dict] = {}

    for task in tasks:
        directory = TASK_DIRS[task]
        if task == "preference":
            print(f"\n=== {task} ===\n  skipped: preference pairs are tokenized "
                  "by the DPO trainer, which needs the prompt and both "
                  "completions kept apart")
            continue
        chat = task != "pretrain"
        print(f"\n=== {task} ===")
        task_stats = {}
        for split in ("train", "validation", "test"):
            path = directory / f"{split}.jsonl"
            if not path.exists():
                continue
            rows, stats = tokenize_split(path, tokenizer, max_length, chat)
            out = TOKENIZED / split / f"{task}.jsonl"
            out.parent.mkdir(parents=True, exist_ok=True)
            with out.open("w", encoding="utf-8") as fh:
                for row in rows:
                    fh.write(json.dumps(row) + "\n")
            task_stats[split] = stats
            print(f"  {split:11s} {stats.get('examples', 0):7,d} examples · "
                  f"{stats.get('tokens_total', 0):10,d} tokens · "
                  f"mean {stats.get('mean_length', 0)} -> {out.relative_to(ROOT)}")
        summary[task] = task_stats

    if args.report:
        print("\n=== raw corpus token counts ===")
        registry = Registry.load()
        for name, entry in registry.entries.items():
            if entry["status"] != "included" or not entry.get("path"):
                continue
            path = ROOT / entry["path"]
            if not path.exists():
                continue
            tokens = 0
            for record in read_jsonl(path):
                text = record.get("text") or "\n\n".join(
                    m.get("content", "") for m in record.get("messages", []))
                if text:
                    tokens += len(tokenizer(text, add_special_tokens=False)["input_ids"])
            registry.set_tokens(name, tokens, config.model.name)
            print(f"  {name:24s} {tokens:12,d} tokens")
        registry.save()
        totals = Counter()
        for entry in registry.included():
            totals[entry["language"]] += entry.get("approx_tokens") or 0
        print("\n  by language: " + ", ".join(
            f"{k}={v:,}" for k, v in totals.most_common()))
        print(f"  total: {sum(totals.values()):,} tokens")

    report = REPORTS / "tokenization.json"
    report.parent.mkdir(parents=True, exist_ok=True)
    report.write_text(json.dumps(summary, indent=2, ensure_ascii=False),
                      encoding="utf-8")
    print(f"\nwrote {report.relative_to(ROOT)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
