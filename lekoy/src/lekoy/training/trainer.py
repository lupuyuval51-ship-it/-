"""The training loop shared by every LEKOY stage.

A thin wrapper over `transformers.Trainer`: the wrapper exists to add the four
things the RV5 brief requires that the base Trainer does not provide — a memory
pre-flight, OOM advice instead of a bare traceback, experiment logging, and a
checkpoint directory that cannot be silently overwritten.
"""
from __future__ import annotations

import json
import math
import sys
import time
from pathlib import Path

from ..config import LekoyConfig
from .common import (OutOfMemory, attach_lora, count_parameters, estimate_memory,
                     free_memory, is_oom, load_model, load_tokenizer,
                     model_geometry, oom_advice, prepare_output_dir,
                     resolve_resume, save_run_manifest, setup_environment)
from .dataset import Collator
from .experiment import Experiment


class ExperimentCallback:
    """Mirror Trainer logs into the experiment record.

    Implemented as a duck-typed callback rather than a TrainerCallback subclass
    so that importing this module does not require transformers — the config
    and estimator tooling import it on machines with no ML stack installed.
    """

    def __init__(self, experiment: Experiment, total_tokens: int | None = None):
        self.experiment = experiment
        self.total_tokens = total_tokens
        self.started = time.time()

    def on_log(self, args, state, control, logs=None, **kwargs):
        if not logs:
            return
        elapsed = time.time() - self.started
        record = {"step": state.global_step, "elapsed_s": round(elapsed, 1), **logs}
        if self.total_tokens and state.max_steps:
            done = state.global_step / state.max_steps
            record["progress"] = round(done, 4)
            if done > 0:
                record["eta_s"] = round(elapsed / done - elapsed)
        if "loss" in logs:
            try:
                record["perplexity"] = round(math.exp(min(logs["loss"], 20)), 3)
            except (OverflowError, ValueError):
                pass
        self.experiment.log(**record)


def build_callback(experiment: Experiment, total_tokens: int | None):
    from transformers import TrainerCallback

    inner = ExperimentCallback(experiment, total_tokens)

    class _Callback(TrainerCallback):
        def on_log(self, args, state, control, logs=None, **kwargs):
            inner.on_log(args, state, control, logs=logs, **kwargs)

    return _Callback()


def training_arguments(config: LekoyConfig, output_dir: Path, has_eval: bool):
    import torch
    from transformers import TrainingArguments

    training = config.training
    # transformers refuses bf16 unless it is told the run is on CPU on purpose
    # — "Your setup doesn't support bf16/gpu". On this host bf16 is exactly
    # what we want: the CPU has AMX-BF16, and fp32 would be several times
    # slower for no benefit.
    on_cpu = not torch.cuda.is_available()
    kwargs = dict(
        output_dir=str(output_dir),
        per_device_train_batch_size=training.batch_size,
        per_device_eval_batch_size=max(training.batch_size, 1),
        gradient_accumulation_steps=training.gradient_accumulation,
        num_train_epochs=training.epochs,
        max_steps=training.max_steps,
        learning_rate=training.learning_rate,
        weight_decay=training.weight_decay,
        warmup_ratio=training.warmup_ratio,
        max_grad_norm=training.max_grad_norm,
        lr_scheduler_type=training.scheduler,
        optim=training.optimizer,
        logging_steps=training.logging_steps,
        save_steps=training.save_steps,
        save_total_limit=training.save_total_limit,
        seed=training.seed,
        data_seed=training.seed,
        bf16=training.bf16,
        fp16=training.fp16,
        gradient_checkpointing=training.gradient_checkpointing,
        dataloader_num_workers=training.num_workers,
        report_to=["tensorboard"],
        logging_dir=str(output_dir / "logs"),
        save_safetensors=True,
        remove_unused_columns=False,
        label_names=["labels"],
        use_cpu=on_cpu,
    )
    if has_eval:
        kwargs["eval_strategy"] = "steps"
        kwargs["eval_steps"] = training.eval_steps
    # `eval_strategy` was `evaluation_strategy` before transformers 4.41 and
    # `use_cache`/`gradient_checkpointing_kwargs` moved around too. Rather than
    # pinning a version, drop arguments this install does not accept.
    import inspect
    accepted = set(inspect.signature(TrainingArguments.__init__).parameters)
    unknown = [k for k in kwargs if k not in accepted]
    if unknown:
        if "eval_strategy" in unknown and "evaluation_strategy" in accepted:
            kwargs["evaluation_strategy"] = kwargs.pop("eval_strategy")
            unknown.remove("eval_strategy")
        for key in unknown:
            kwargs.pop(key)
    return TrainingArguments(**kwargs)


def run_training(config: LekoyConfig, stage: str, train_dataset, eval_dataset,
                 tokenizer, *, args, datasets_used: list[dict],
                 notes: str = "") -> dict:
    """Load, pre-flight, train, save. Returns a summary of what happened."""
    from transformers import Trainer

    output_dir = prepare_output_dir(config, overwrite=args.overwrite,
                                    new_experiment=args.new_experiment)
    resume = resolve_resume(config, args.resume_from_checkpoint)

    print(f"[model] loading {config.model.name}")
    model = load_model(config)
    if config.lora.enabled:
        model = attach_lora(model, config)
    total, trainable = count_parameters(model)
    hidden, layers = model_geometry(
        model.base_model.model if hasattr(model, "base_model") else model)
    print(f"[model] {total / 1e6:.1f}M parameters, {trainable / 1e6:.2f}M trainable "
          f"({trainable / total:.2%})")

    estimate = estimate_memory(config, total, trainable, hidden, layers)
    print(f"[mem  ] {estimate.describe()}")
    if not estimate.fits:
        message = ("this run is predicted not to fit in memory:\n  "
                   + estimate.describe() + "\n\nTry:\n"
                   + "\n".join(f"  {i}. {a}" for i, a in
                               enumerate(oom_advice(config, estimate), 1))
                   + "\n\nPass --no-memory-check to attempt it anyway.")
        if args.memory_check:
            raise MemoryError(message)
        print(f"[warn ] {message}", file=sys.stderr)

    stats = train_dataset.stats()
    print(f"[data ] train: {json.dumps(stats)}")
    if eval_dataset is not None:
        print(f"[data ] eval:  {json.dumps(eval_dataset.stats())}")

    experiment = Experiment.start(stage, config, datasets_used, notes)
    experiment.log(event="start", train_examples=len(train_dataset),
                   train_tokens=stats.get("tokens_total"),
                   trainable_params=trainable, total_params=total,
                   memory_estimate_gb=round(estimate.total_gb, 3))
    print(f"[exp  ] {experiment.id} -> {experiment.path}")

    trainer = Trainer(
        model=model,
        args=training_arguments(config, output_dir, eval_dataset is not None),
        train_dataset=train_dataset,
        eval_dataset=eval_dataset,
        data_collator=Collator(tokenizer),
        callbacks=[build_callback(experiment, stats.get("tokens_total"))],
    )

    started = time.time()
    try:
        result = trainer.train(resume_from_checkpoint=resume)
    except KeyboardInterrupt:
        print("\n[stop ] interrupted — saving what we have", file=sys.stderr)
        trainer.save_model(str(output_dir / "interrupted"))
        experiment.finish("interrupted", str(output_dir / "interrupted"))
        raise
    except BaseException as exc:
        free_memory()
        if is_oom(exc):
            experiment.finish("failed", error=f"OOM: {exc}")
            raise OutOfMemory(exc, oom_advice(config, estimate)) from exc
        experiment.finish("failed", error=f"{type(exc).__name__}: {exc}")
        raise
    elapsed = time.time() - started

    trainer.save_model(str(output_dir))
    tokenizer.save_pretrained(str(output_dir))

    metrics = dict(result.metrics)
    if eval_dataset is not None:
        metrics.update(trainer.evaluate())
    tokens = stats.get("tokens_total", 0)
    summary = {
        "stage": stage,
        "experiment": experiment.id,
        "output_dir": str(output_dir),
        "seconds": round(elapsed, 1),
        "steps": int(result.global_step),
        "train_examples": len(train_dataset),
        "train_tokens": tokens,
        "tokens_per_second": round(tokens * config.training.epochs / elapsed, 1)
        if elapsed else None,
        "metrics": {k: (round(v, 5) if isinstance(v, float) else v)
                    for k, v in metrics.items()},
    }
    if "eval_loss" in metrics:
        try:
            summary["eval_perplexity"] = round(math.exp(min(metrics["eval_loss"], 20)), 3)
        except (OverflowError, ValueError):
            pass

    save_run_manifest(output_dir, config, experiment,
                      {"stage": stage, "datasets": datasets_used,
                       "training_summary": summary,
                       "dataset_stats": stats})
    experiment.log(event="finish", **{k: v for k, v in summary.items()
                                      if k != "metrics"})
    experiment.finish("completed", str(output_dir))
    (output_dir / "training_summary.json").write_text(
        json.dumps(summary, indent=2, ensure_ascii=False), encoding="utf-8")
    return summary


def add_training_args(parser):
    """CLI flags every training stage shares."""
    parser.add_argument("--resume-from-checkpoint", metavar="PATH|auto",
                        help="continue a run; 'auto' picks the newest checkpoint")
    parser.add_argument("--overwrite", action="store_true",
                        help="delete an existing checkpoint in the output directory")
    parser.add_argument("--new-experiment", action="store_true",
                        help="write to <output_dir>-002 rather than failing")
    parser.add_argument("--no-memory-check", dest="memory_check",
                        action="store_false", default=True,
                        help="start even when the pre-flight predicts an OOM")
    parser.add_argument("--limit", type=int, help="cap training examples, for a smoke test")
    parser.add_argument("--eval-limit", type=int, default=200)
    parser.add_argument("--notes", default="")
    return parser
