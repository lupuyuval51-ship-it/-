#!/usr/bin/env python3
"""Stage 1 — continued pretraining, to move Hebrew before instruction tuning.

    python scripts/train_pretrain.py --config rv5_small.yaml

Plain causal language modelling on the Hebrew-weighted corpus. Sequences are
packed, so no compute goes to padding.

This stage also trains the embedding and LM head alongside the LoRA adapters
(`lora.modules_to_save`). Continued pretraining moves the whole token
distribution rather than a response style, and adapters on the projections
alone cannot express that — a Hebrew token whose embedding is poor stays poor.
It costs memory, which is why SFT does not do it.
"""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "src"))

from lekoy.config import add_config_args, config_from_args                # noqa: E402
from lekoy.training.common import load_tokenizer, setup_environment       # noqa: E402
from lekoy.training.dataset import load_text_dataset                      # noqa: E402
from lekoy.training.trainer import add_training_args, run_training        # noqa: E402


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    add_config_args(ap)
    add_training_args(ap)
    ap.add_argument("--data-dir", default=str(ROOT / "data" / "pretrain"))
    ap.add_argument("--no-packing", dest="packing", action="store_false", default=True)
    ap.add_argument("--train-embeddings", action="store_true", default=True,
                    help="also train embed_tokens and lm_head (on by default here)")
    args = ap.parse_args()

    config = config_from_args(args)
    if args.train_embeddings and config.lora.enabled and not config.lora.modules_to_save:
        config.lora.modules_to_save = ["embed_tokens", "lm_head"]
    # Continued pretraining at the SFT learning rate is how a model forgets
    # everything else it knew. An order of magnitude lower is the usual choice.
    if config.training.learning_rate > 5e-5:
        config.training.learning_rate = 5e-5
        print(f"[lr   ] capped at {config.training.learning_rate} for continued "
              "pretraining (override with --learning-rate)")
    setup_environment(config)

    data_dir = Path(args.data_dir)
    train_path = data_dir / "train.jsonl"
    if not train_path.exists():
        print(f"no data at {train_path} — run "
              "scripts/prepare_data.py --task pretrain first", file=sys.stderr)
        return 2
    if not config.training.output_dir.endswith("continued_pretraining"):
        config.training.output_dir = "checkpoints/rv5/continued_pretraining"

    tokenizer = load_tokenizer(config)
    train = load_text_dataset(train_path, tokenizer, config.training.max_seq_length,
                              args.limit, args.packing)
    eval_path = data_dir / "validation.jsonl"
    evaluation = (load_text_dataset(eval_path, tokenizer,
                                    config.training.max_seq_length,
                                    args.eval_limit, args.packing)
                  if eval_path.exists() else None)
    if not len(train):
        print("training set is empty after tokenization", file=sys.stderr)
        return 2

    summary = run_training(
        config, "continued_pretraining", train, evaluation, tokenizer, args=args,
        datasets_used=[{"path": str(train_path), "examples": len(train)}],
        notes=args.notes or "LEKOY RV5 Hebrew continued pretraining")
    print("\n" + json.dumps(summary, indent=2, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
