#!/usr/bin/env python3
"""Stage 5 — preference optimisation (DPO).

    python scripts/train_preference.py --set model.name=checkpoints/rv5/coding

Trains on pairs where a human ranked one reply above another for the same
prompt. The pairs come from OASST2's sibling rankings — 18,452 of them,
reconstructed by `src/lekoy/data/oasst.py` — which is human judgement rather
than a model asked to grade its own output.

Needs `trl`. DPO keeps a frozen reference copy of the policy in memory, so the
memory cost is roughly double an SFT run of the same model; the pre-flight
accounts for that and will refuse a run it predicts cannot fit.
"""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "src"))

from lekoy.config import add_config_args, config_from_args                # noqa: E402
from lekoy.paths import PREFERENCE                                        # noqa: E402
from lekoy.training.common import (attach_lora, count_parameters,         # noqa: E402
                                   estimate_memory, load_model,
                                   load_tokenizer, model_geometry,
                                   oom_advice, prepare_output_dir,
                                   resolve_resume, save_run_manifest,
                                   setup_environment)
from lekoy.training.dataset import read_jsonl                             # noqa: E402
from lekoy.training.experiment import Experiment                          # noqa: E402
from lekoy.training.trainer import add_training_args                      # noqa: E402


def to_dpo_rows(records: list[dict], tokenizer, system: str) -> list[dict]:
    """TRL wants rendered prompt / chosen / rejected strings.

    The prompt carries the whole conversation that preceded the reply, not just
    the last user turn: a reply is only better or worse in context.
    """
    rows = []
    for record in records:
        history = record.get("prompt") or []
        if not history or not record.get("chosen") or not record.get("rejected"):
            continue
        messages = history
        if not any(m.get("role") == "system" for m in messages):
            messages = [{"role": "system", "content": system}] + list(messages)
        rendered = tokenizer.apply_chat_template(
            messages, tokenize=False, add_generation_prompt=True)
        rows.append({"prompt": rendered,
                     "chosen": record["chosen"],
                     "rejected": record["rejected"]})
    return rows


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    add_config_args(ap)
    add_training_args(ap)
    ap.add_argument("--data-dir", default=str(PREFERENCE))
    ap.add_argument("--beta", type=float, default=0.1,
                    help="DPO beta; lower stays closer to the reference policy")
    ap.add_argument("--loss-type", default="sigmoid",
                    choices=["sigmoid", "hinge", "ipo"],
                    help="sigmoid is DPO; ipo is the regularised variant")
    args = ap.parse_args()

    try:
        from trl import DPOConfig, DPOTrainer
    except ImportError:
        print("preference training needs `trl`:\n"
              "    pip install trl\n\n"
              "It is in requirements-gpu.txt rather than requirements.txt "
              "because DPO holds a frozen reference model alongside the policy, "
              "which in practice means a GPU host.", file=sys.stderr)
        return 2
    try:
        from datasets import Dataset
    except ImportError:
        print("preference training needs `datasets`", file=sys.stderr)
        return 2

    config = config_from_args(args)
    if config.training.output_dir.endswith("/sft"):
        config.training.output_dir = "checkpoints/rv5/preference"
    # DPO on top of an aligned checkpoint is a nudge, not a reshaping. An SFT
    # learning rate here reliably destroys the model it is refining.
    if config.training.learning_rate > 5e-6:
        config.training.learning_rate = 5e-6
        print(f"[lr   ] capped at {config.training.learning_rate} for DPO "
              "(override with --learning-rate)")
    setup_environment(config)

    from lekoy.identity import system_prompt
    train_path = Path(args.data_dir) / "train.jsonl"
    if not train_path.exists():
        print(f"no data at {train_path} — run "
              "scripts/prepare_data.py --task preference first", file=sys.stderr)
        return 2

    tokenizer = load_tokenizer(config)
    system = system_prompt("he")
    train_rows = to_dpo_rows(read_jsonl(train_path, args.limit), tokenizer, system)
    if not train_rows:
        print("no usable preference pairs", file=sys.stderr)
        return 2
    eval_path = Path(args.data_dir) / "validation.jsonl"
    eval_rows = (to_dpo_rows(read_jsonl(eval_path, args.eval_limit), tokenizer, system)
                 if eval_path.exists() else [])
    print(f"[data ] {len(train_rows):,} training pairs, {len(eval_rows):,} validation")

    output_dir = prepare_output_dir(config, overwrite=args.overwrite,
                                    new_experiment=args.new_experiment)
    resume = resolve_resume(config, args.resume_from_checkpoint)

    model = load_model(config)
    if config.lora.enabled:
        model = attach_lora(model, config)
    total, trainable = count_parameters(model)
    hidden, layers = model_geometry(
        model.base_model.model if hasattr(model, "base_model") else model)
    estimate = estimate_memory(config, total, trainable, hidden, layers)
    # DPO holds a reference copy of the policy as well as the policy itself.
    doubled = estimate.total_gb + estimate.weights_gb
    print(f"[mem  ] {estimate.describe()}")
    print(f"[mem  ] plus a frozen reference model: ~{doubled:.2f} GB total")
    if doubled > estimate.budget_gb and args.memory_check:
        raise MemoryError(
            f"DPO needs about {doubled:.2f} GB against {estimate.budget_gb:.2f} GB "
            "available.\n\nTry:\n"
            + "\n".join(f"  {i}. {a}" for i, a in enumerate(oom_advice(config), 1))
            + "\n\nOr pass --no-memory-check to attempt it anyway.")

    experiment = Experiment.start(
        "preference", config, [{"path": str(train_path), "pairs": len(train_rows)}],
        args.notes or f"LEKOY RV5 DPO (beta={args.beta}, {args.loss_type})")
    print(f"[exp  ] {experiment.id}")

    dpo_config = DPOConfig(
        output_dir=str(output_dir),
        per_device_train_batch_size=config.training.batch_size,
        gradient_accumulation_steps=config.training.gradient_accumulation,
        num_train_epochs=config.training.epochs,
        max_steps=config.training.max_steps,
        learning_rate=config.training.learning_rate,
        warmup_ratio=config.training.warmup_ratio,
        lr_scheduler_type=config.training.scheduler,
        logging_steps=config.training.logging_steps,
        save_steps=config.training.save_steps,
        save_total_limit=config.training.save_total_limit,
        bf16=config.training.bf16,
        fp16=config.training.fp16,
        gradient_checkpointing=config.training.gradient_checkpointing,
        seed=config.training.seed,
        beta=args.beta,
        loss_type=args.loss_type,
        max_length=config.training.max_seq_length,
        max_prompt_length=config.training.max_seq_length // 2,
        report_to=["tensorboard"],
    )

    trainer = DPOTrainer(
        model=model,
        args=dpo_config,
        train_dataset=Dataset.from_list(train_rows),
        eval_dataset=Dataset.from_list(eval_rows) if eval_rows else None,
        processing_class=tokenizer,
    )

    try:
        result = trainer.train(resume_from_checkpoint=resume)
    except BaseException as exc:                                  # noqa: BLE001
        experiment.finish("failed", error=f"{type(exc).__name__}: {exc}")
        raise
    trainer.save_model(str(output_dir))
    tokenizer.save_pretrained(str(output_dir))

    summary = {
        "stage": "preference", "experiment": experiment.id,
        "output_dir": str(output_dir), "pairs": len(train_rows),
        "steps": int(result.global_step), "beta": args.beta,
        "loss_type": args.loss_type,
        "metrics": {k: (round(v, 5) if isinstance(v, float) else v)
                    for k, v in result.metrics.items()},
    }
    save_run_manifest(output_dir, config, experiment,
                      {"stage": "preference", "training_summary": summary})
    experiment.finish("completed", str(output_dir))
    (output_dir / "training_summary.json").write_text(
        json.dumps(summary, indent=2, ensure_ascii=False), encoding="utf-8")
    print("\n" + json.dumps(summary, indent=2, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
