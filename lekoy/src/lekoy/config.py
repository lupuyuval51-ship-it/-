"""Config loading for LEKOY.

A config is YAML with one inheritance rule: `extends:` names another config
relative to `configs/`, and the child is deep-merged over it. That is enough
structure for `rv5_medium.yaml` to say only how it differs from `rv5_small.yaml`,
and little enough that a reader can hold the whole scheme in their head.

Every training parameter the RV5 plan calls for is a field on `TrainingConfig`,
and every one of them is overridable from the CLI — `--learning-rate 1e-5`
beats the file, so a sweep does not need a file per point.
"""
from __future__ import annotations

import argparse
import copy
import dataclasses
from dataclasses import dataclass, field, fields
from pathlib import Path
from typing import Any

import yaml

from .paths import CONFIGS


def _deep_merge(base: dict, over: dict) -> dict:
    out = copy.deepcopy(base)
    for k, v in over.items():
        if isinstance(v, dict) and isinstance(out.get(k), dict):
            out[k] = _deep_merge(out[k], v)
        else:
            out[k] = copy.deepcopy(v)
    return out


def load_yaml(path: str | Path, _seen: tuple[Path, ...] = (),
              _relative_to: Path | None = None) -> dict:
    """Load a YAML config, resolving `extends:` chains.

    A relative path is looked for beside the config that named it first, and
    only then in `configs/`. Without the first rule a config kept outside
    `configs/` — a sweep directory, a test fixture — cannot extend its own
    sibling, which is the natural thing to want.
    """
    p = Path(path)
    if not p.is_absolute() and not p.exists():
        candidates = ([_relative_to / path] if _relative_to else []) + [CONFIGS / path]
        p = next((c for c in candidates if c.exists()), candidates[-1])
    p = p.resolve()
    if p in _seen:
        chain = " -> ".join(s.name for s in _seen + (p,))
        raise ValueError(f"circular extends in config chain: {chain}")
    if not p.exists():
        raise FileNotFoundError(f"config not found: {path} (looked in {CONFIGS})")
    data = yaml.safe_load(p.read_text(encoding="utf-8")) or {}
    parent_name = data.pop("extends", None)
    if parent_name:
        parent = load_yaml(parent_name, _seen + (p,), p.parent)
        data = _deep_merge(parent, data)
    return data


@dataclass
class ModelConfig:
    """Which weights a config is about, and how they are loaded."""

    name: str = "Qwen/Qwen2.5-0.5B-Instruct"
    revision: str | None = None
    variant: str = "small"                 # small | medium | large
    trust_remote_code: bool = False
    torch_dtype: str = "bfloat16"          # bfloat16 | float16 | float32 | auto
    attn_implementation: str = "sdpa"      # sdpa | eager | flash_attention_2
    load_in_4bit: bool = False
    load_in_8bit: bool = False
    max_position_embeddings: int | None = None
    device_map: str | None = None


@dataclass
class LoRAConfig:
    enabled: bool = True
    r: int = 16
    alpha: int = 32
    dropout: float = 0.05
    bias: str = "none"
    target_modules: list[str] = field(default_factory=lambda: [
        "q_proj", "k_proj", "v_proj", "o_proj",
        "gate_proj", "up_proj", "down_proj",
    ])
    # Continued pretraining moves the whole distribution, so the embedding and
    # LM head are trained alongside the adapters there; SFT leaves them frozen.
    modules_to_save: list[str] = field(default_factory=list)


@dataclass
class TrainingConfig:
    output_dir: str = "checkpoints/rv5/sft"
    learning_rate: float = 2e-4
    batch_size: int = 1
    gradient_accumulation: int = 8
    epochs: float = 1.0
    max_steps: int = -1                    # -1 = run `epochs` to completion
    weight_decay: float = 0.01
    warmup_ratio: float = 0.03
    max_grad_norm: float = 1.0
    max_seq_length: int = 1024
    bf16: bool = True
    fp16: bool = False
    gradient_checkpointing: bool = False
    optimizer: str = "adamw_torch"
    scheduler: str = "cosine"
    seed: int = 20250901
    save_steps: int = 200
    eval_steps: int = 100
    logging_steps: int = 10
    save_total_limit: int = 3
    resume_from_checkpoint: str | None = None
    num_workers: int = 2
    packing: bool = False
    neftune_noise_alpha: float | None = None


@dataclass
class DataConfig:
    train_file: str | None = None
    validation_file: str | None = None
    test_file: str | None = None
    # The Hebrew/English/Spanish mixture. Reweighted after the base model's
    # per-language baseline is known — see docs/rv5_training_plan.md.
    language_mix: dict[str, float] = field(
        default_factory=lambda: {"hebrew": 0.40, "english": 0.40, "spanish": 0.20})
    max_samples: int | None = None
    min_quality_score: float = 0.5
    shuffle_seed: int = 20250901


@dataclass
class EvalConfig:
    suites: list[str] = field(default_factory=lambda: [
        "hebrew", "english", "spanish", "reasoning", "math", "coding",
        "translation", "instruction_following", "hallucination",
    ])
    max_new_tokens: int = 320
    temperature: float = 0.0
    batch_size: int = 1
    limit: int | None = None


@dataclass
class GenerationConfig:
    temperature: float = 0.7
    top_p: float = 0.9
    top_k: int = 50
    repetition_penalty: float = 1.05
    max_new_tokens: int = 1024
    do_sample: bool = True


@dataclass
class LekoyConfig:
    name: str = "rv5_small"
    family: str = "LEKOY"
    model_id: str = "RV5"
    description: str = ""
    model: ModelConfig = field(default_factory=ModelConfig)
    lora: LoRAConfig = field(default_factory=LoRAConfig)
    training: TrainingConfig = field(default_factory=TrainingConfig)
    data: DataConfig = field(default_factory=DataConfig)
    evaluation: EvalConfig = field(default_factory=EvalConfig)
    generation: GenerationConfig = field(default_factory=GenerationConfig)

    @property
    def full_name(self) -> str:
        return f"{self.family} {self.model_id}"

    @classmethod
    def from_dict(cls, data: dict) -> "LekoyConfig":
        sections = {
            "model": ModelConfig, "lora": LoRAConfig, "training": TrainingConfig,
            "data": DataConfig, "evaluation": EvalConfig,
            "generation": GenerationConfig,
        }
        kwargs: dict[str, Any] = {}
        for key, value in data.items():
            if key in sections:
                kwargs[key] = _build(sections[key], value, key)
            elif key in {f.name for f in fields(cls)}:
                kwargs[key] = value
            else:
                raise ValueError(
                    f"unknown top-level config key {key!r}; "
                    f"expected one of {sorted(f.name for f in fields(cls))}")
        return cls(**kwargs)

    @classmethod
    def load(cls, path: str | Path) -> "LekoyConfig":
        return cls.from_dict(load_yaml(path))

    def to_dict(self) -> dict:
        return dataclasses.asdict(self)

    def save(self, path: str | Path) -> None:
        p = Path(path)
        p.parent.mkdir(parents=True, exist_ok=True)
        p.write_text(
            yaml.safe_dump(self.to_dict(), sort_keys=False, allow_unicode=True),
            encoding="utf-8")


def _build(dc, value: dict, section: str):
    if not isinstance(value, dict):
        raise ValueError(f"config section {section!r} must be a mapping, got {type(value).__name__}")
    known = {f.name for f in fields(dc)}
    unknown = set(value) - known
    if unknown:
        raise ValueError(
            f"unknown key(s) in config section {section!r}: {sorted(unknown)}; "
            f"valid keys are {sorted(known)}")
    return dc(**value)


# --- CLI overrides ---------------------------------------------------------
#
# Any dotted path into the config can be set from the command line. The common
# training knobs also get a short flag, because `--learning-rate 1e-5` reads
# better in a shell history than `--set training.learning_rate=1e-5`.

_SHORTCUTS = {
    "model_name": "model.name",
    "output_dir": "training.output_dir",
    "learning_rate": "training.learning_rate",
    "batch_size": "training.batch_size",
    "gradient_accumulation": "training.gradient_accumulation",
    "epochs": "training.epochs",
    "max_steps": "training.max_steps",
    "weight_decay": "training.weight_decay",
    "warmup_ratio": "training.warmup_ratio",
    "max_seq_length": "training.max_seq_length",
    "gradient_checkpointing": "training.gradient_checkpointing",
    "optimizer": "training.optimizer",
    "scheduler": "training.scheduler",
    "save_steps": "training.save_steps",
    "eval_steps": "training.eval_steps",
    "logging_steps": "training.logging_steps",
    "seed": "training.seed",
    # resume_from_checkpoint is deliberately not a shortcut here: the training
    # scripts define --resume-from-checkpoint themselves, with the `auto`
    # handling that resolves it to the newest checkpoint on disk. Defining it
    # in both places is an argparse conflict, and the richer one should win.
    "lora_r": "lora.r",
    "lora_alpha": "lora.alpha",
    "lora_dropout": "lora.dropout",
    "train_file": "data.train_file",
    "validation_file": "data.validation_file",
    "max_samples": "data.max_samples",
}


def add_config_args(parser: argparse.ArgumentParser) -> argparse.ArgumentParser:
    parser.add_argument("--config", default="rv5_small.yaml",
                        help="config file, relative to configs/ or an explicit path")
    parser.add_argument("--set", action="append", default=[], metavar="KEY=VALUE",
                        help="override any dotted config key, e.g. --set training.bf16=false")
    for flag in _SHORTCUTS:
        parser.add_argument(f"--{flag.replace('_', '-')}", dest=flag, default=None)
    return parser


def _coerce(text: str) -> Any:
    lowered = text.strip().lower()
    if lowered in {"true", "yes"}:
        return True
    if lowered in {"false", "no"}:
        return False
    if lowered in {"none", "null"}:
        return None
    for cast in (int, float):
        try:
            return cast(text)
        except ValueError:
            pass
    if text.startswith("[") or text.startswith("{"):
        try:
            return yaml.safe_load(text)
        except yaml.YAMLError:
            pass
    return text


def _assign(data: dict, dotted: str, value: Any) -> None:
    parts = dotted.split(".")
    node = data
    for part in parts[:-1]:
        node = node.setdefault(part, {})
        if not isinstance(node, dict):
            raise ValueError(f"cannot set {dotted!r}: {part!r} is not a section")
    node[parts[-1]] = value


def config_from_args(args: argparse.Namespace) -> LekoyConfig:
    """Build a config from `--config`, then apply `--set` and shortcut flags."""
    data = load_yaml(args.config)
    for item in getattr(args, "set", []) or []:
        if "=" not in item:
            raise ValueError(f"--set expects KEY=VALUE, got {item!r}")
        key, _, raw = item.partition("=")
        _assign(data, key.strip(), _coerce(raw))
    for flag, dotted in _SHORTCUTS.items():
        value = getattr(args, flag, None)
        if value is not None:
            _assign(data, dotted, _coerce(str(value)))
    return LekoyConfig.from_dict(data)
