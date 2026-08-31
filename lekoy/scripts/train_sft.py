#!/usr/bin/env python3
"""Stage 2 — supervised fine-tuning of LEKOY RV5 on instruction data.

    python scripts/train_sft.py --config rv5_small.yaml
    python scripts/train_sft.py --limit 200 --set training.max_steps=5   # smoke test
    python scripts/train_sft.py --resume-from-checkpoint auto

Trains on the assistant turns only. Prompt tokens are masked out of the loss —
see src/lekoy/training/dataset.py for why that matters.
"""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "src"))

from lekoy.config import add_config_args, config_from_args                # noqa: E402
from lekoy.paths import INSTRUCTION                                       # noqa: E402
from lekoy.training.common import load_tokenizer, setup_environment       # noqa: E402
from lekoy.training.dataset import load_chat_dataset                      # noqa: E402
from lekoy.training.trainer import add_training_args, run_training        # noqa: E402


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    add_config_args(ap)
    add_training_args(ap)
    ap.add_argument("--data-dir", default=str(INSTRUCTION),
                    help="directory holding train.jsonl / validation.jsonl")
    ap.add_argument("--no-mask-prompt", dest="mask_prompt", action="store_false",
                    default=True, help="train on prompt tokens too (not recommended)")
    args = ap.parse_args()

    config = config_from_args(args)
    setup_environment(config)

    data_dir = Path(args.data_dir)
    train_path = data_dir / "train.jsonl"
    eval_path = data_dir / "validation.jsonl"
    if not train_path.exists():
        print(f"no training data at {train_path} — run "
              "scripts/prepare_data.py --task sft first", file=sys.stderr)
        return 2

    tokenizer = load_tokenizer(config)
    print(f"[data ] {train_path}")
    train = load_chat_dataset(train_path, tokenizer, config.training.max_seq_length,
                              args.limit, args.mask_prompt)
    evaluation = None
    if eval_path.exists():
        evaluation = load_chat_dataset(eval_path, tokenizer,
                                       config.training.max_seq_length,
                                       args.eval_limit, args.mask_prompt)
    if not len(train):
        print("training set is empty after tokenization", file=sys.stderr)
        return 2

    summary = run_training(
        config, "sft", train, evaluation, tokenizer, args=args,
        datasets_used=[{"path": str(train_path), "examples": len(train)}],
        notes=args.notes or "LEKOY RV5 supervised fine-tuning")
    print("\n" + json.dumps(summary, indent=2, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
