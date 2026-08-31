"""Shared machinery for every LEKOY training stage.

Model loading, LoRA attachment, the memory pre-flight, checkpoint safety and
the OOM adviser. Each training script is then only its own data shaping and
loss — which is the part that actually differs between continued pretraining,
SFT and preference optimisation.
"""
from __future__ import annotations

import gc
import json
import math
import os
import re
import shutil
import sys
from dataclasses import dataclass
from pathlib import Path

from ..config import LekoyConfig
from ..paths import ROOT

# Bytes per trainable parameter for AdamW's two fp32 moments, plus the fp32
# master copy that mixed precision keeps.
ADAM_BYTES_PER_PARAM = 12


def setup_environment(config: LekoyConfig) -> None:
    """Thread and allocator settings, before torch does anything expensive."""
    import torch

    os.environ.setdefault("TOKENIZERS_PARALLELISM", "false")
    os.environ.setdefault("HF_HOME", str(ROOT / ".hf_cache"))
    if not torch.cuda.is_available():
        # On CPU, oversubscribing threads is worse than leaving one core free:
        # the dataloader and the main process fight for the same cores and the
        # step time gets noisier, not lower.
        threads = max(1, (os.cpu_count() or 2) - 1)
        torch.set_num_threads(threads)
    torch.manual_seed(config.training.seed)


def resolve_dtype(name: str):
    import torch
    return {"bfloat16": torch.bfloat16, "float16": torch.float16,
            "float32": torch.float32, "auto": None}.get(name, torch.bfloat16)


@dataclass
class MemoryEstimate:
    weights_gb: float
    gradients_gb: float
    optimizer_gb: float
    activations_gb: float
    total_gb: float
    budget_gb: float
    device: str

    @property
    def fits(self) -> bool:
        return self.total_gb <= self.budget_gb

    @property
    def headroom(self) -> float:
        return self.budget_gb - self.total_gb

    def describe(self) -> str:
        return (f"weights {self.weights_gb:.2f} + grads {self.gradients_gb:.2f} "
                f"+ optim {self.optimizer_gb:.2f} + activations "
                f"{self.activations_gb:.2f} = {self.total_gb:.2f} GB "
                f"against {self.budget_gb:.2f} GB of {self.device}")


def available_memory_gb() -> tuple[float, str]:
    import torch
    if torch.cuda.is_available():
        free, _total = torch.cuda.mem_get_info()
        return free / 1e9, "VRAM"
    try:
        text = Path("/proc/meminfo").read_text()
        m = re.search(r"^MemAvailable:\s*(\d+) kB$", text, re.M)
        if m:
            # Leave 2 GB for the OS, the tokenizer and the dataloader workers.
            return max(int(m.group(1)) / 1024 / 1024 - 2.0, 0.5), "system RAM"
    except OSError:
        pass
    return 8.0, "system RAM (assumed)"


def estimate_memory(config: LekoyConfig, total_params: int,
                    trainable_params: int, hidden_size: int,
                    num_layers: int) -> MemoryEstimate:
    """Predict peak memory, before allocating any of it.

    Approximate by construction — activation memory in particular depends on
    which kernels the backend picks. It is a pre-flight that refuses obviously
    impossible runs, not a guarantee, and it errs toward over-estimating
    because this machine has no swap and an OOM kills the process outright.
    """
    training = config.training
    bytes_per_param = 0.5 if config.model.load_in_4bit else (
        1.0 if config.model.load_in_8bit else
        (2.0 if training.bf16 or training.fp16 else 4.0))

    weights = total_params * bytes_per_param
    gradients = trainable_params * (2.0 if training.bf16 or training.fp16 else 4.0)
    optimizer = trainable_params * ADAM_BYTES_PER_PARAM
    if training.optimizer.endswith("8bit"):
        optimizer = trainable_params * 2.0

    # Activations: roughly (batch x sequence x hidden x layers), with a factor
    # for the residual stream, attention and MLP intermediates. Gradient
    # checkpointing recomputes rather than stores, leaving ~sqrt(layers).
    tokens = training.batch_size * training.max_seq_length
    per_layer = tokens * hidden_size * 2 * 8
    layer_factor = math.sqrt(num_layers) if training.gradient_checkpointing else num_layers
    activations = per_layer * layer_factor

    budget, device = available_memory_gb()
    total = (weights + gradients + optimizer + activations) / 1e9
    return MemoryEstimate(
        weights_gb=weights / 1e9, gradients_gb=gradients / 1e9,
        optimizer_gb=optimizer / 1e9, activations_gb=activations / 1e9,
        total_gb=total, budget_gb=budget, device=device)


def oom_advice(config: LekoyConfig, estimate: MemoryEstimate | None = None) -> list[str]:
    """Concrete next steps after an OOM, ordered by what to try first.

    Ordered by cost to the result rather than by size of saving: raising
    accumulation is free, halving the sequence length changes what the model
    can learn.
    """
    training = config.training
    advice: list[str] = []
    if training.batch_size > 1:
        advice.append(
            f"--batch-size {training.batch_size // 2} "
            f"--gradient-accumulation {training.gradient_accumulation * 2}  "
            "(same effective batch, half the activation memory)")
    else:
        advice.append(
            f"--gradient-accumulation {training.gradient_accumulation * 2}  "
            "(batch is already 1; accumulate more steps instead)")
    if not training.gradient_checkpointing:
        advice.append(
            "--set training.gradient_checkpointing=true  "
            "(recomputes activations; ~30% slower, large memory saving)")
    if training.max_seq_length > 512:
        advice.append(
            f"--max-seq-length {training.max_seq_length // 2}  "
            "(attention is quadratic in this; last resort, it changes what "
            "the model sees)")
    if not (config.model.load_in_4bit or config.model.load_in_8bit):
        import torch
        if torch.cuda.is_available():
            advice.append(
                "--set model.load_in_4bit=true  (QLoRA; needs bitsandbytes and CUDA)")
        else:
            advice.append(
                "4-bit loading would help but bitsandbytes is CUDA-only — "
                "not available on this host")
    if not training.optimizer.endswith("8bit") and config.lora.enabled:
        advice.append("--optimizer adamw_bnb_8bit  (quarter the optimiser state; CUDA only)")
    if config.model.variant != "small":
        advice.append("--config rv5_small.yaml  (a smaller model configuration)")
    if estimate and not estimate.fits:
        advice.append(f"estimate said this would not fit: {estimate.describe()}")
    return advice


class OutOfMemory(RuntimeError):
    """An OOM, carrying the advice rather than only the traceback."""

    def __init__(self, original: BaseException, advice: list[str]):
        self.original = original
        self.advice = advice
        lines = "\n".join(f"  {i}. {a}" for i, a in enumerate(advice, 1))
        super().__init__(
            f"out of memory during training.\n\n"
            f"Original error: {type(original).__name__}: "
            f"{str(original)[:300]}\n\nTry, in this order:\n{lines}\n")


def is_oom(exc: BaseException) -> bool:
    text = str(exc).lower()
    return (isinstance(exc, (MemoryError,))
            or "out of memory" in text
            or "cuda oom" in text
            or "can't allocate" in text
            or "cannot allocate memory" in text)


def free_memory() -> None:
    import torch
    gc.collect()
    if torch.cuda.is_available():
        torch.cuda.empty_cache()


# --- Model loading ---------------------------------------------------------

def load_tokenizer(config: LekoyConfig, path: str | None = None):
    from transformers import AutoTokenizer

    tokenizer = AutoTokenizer.from_pretrained(
        path or config.model.name,
        revision=config.model.revision,
        trust_remote_code=config.model.trust_remote_code)
    if tokenizer.pad_token is None:
        # Qwen has no dedicated pad token. Using EOS is standard, and the
        # collator masks pad positions out of the loss regardless.
        tokenizer.pad_token = tokenizer.eos_token
    tokenizer.padding_side = "right"
    return tokenizer


def load_model(config: LekoyConfig, path: str | None = None, *,
               for_training: bool = True):
    import torch
    from transformers import AutoModelForCausalLM

    kwargs: dict = {
        "dtype": resolve_dtype(config.model.torch_dtype),
        "trust_remote_code": config.model.trust_remote_code,
    }
    if config.model.revision:
        kwargs["revision"] = config.model.revision
    if config.model.attn_implementation:
        kwargs["attn_implementation"] = config.model.attn_implementation
    if config.model.device_map:
        kwargs["device_map"] = config.model.device_map

    if config.model.load_in_4bit or config.model.load_in_8bit:
        if not torch.cuda.is_available():
            raise RuntimeError(
                "load_in_4bit/8bit requires bitsandbytes, which is CUDA-only, "
                "and this host has no CUDA device. Run with "
                "--set model.load_in_4bit=false, or use configs/rv5_small.yaml.")
        from transformers import BitsAndBytesConfig
        kwargs["quantization_config"] = BitsAndBytesConfig(
            load_in_4bit=config.model.load_in_4bit,
            load_in_8bit=config.model.load_in_8bit,
            bnb_4bit_compute_dtype=resolve_dtype(config.model.torch_dtype),
            bnb_4bit_quant_type="nf4",
            bnb_4bit_use_double_quant=True)

    model = AutoModelForCausalLM.from_pretrained(path or config.model.name, **kwargs)
    if for_training:
        model.config.use_cache = False       # incompatible with checkpointing
    return model


def attach_lora(model, config: LekoyConfig):
    from peft import LoraConfig, get_peft_model, prepare_model_for_kbit_training

    if config.model.load_in_4bit or config.model.load_in_8bit:
        model = prepare_model_for_kbit_training(
            model, use_gradient_checkpointing=config.training.gradient_checkpointing)

    lora = LoraConfig(
        r=config.lora.r, lora_alpha=config.lora.alpha,
        lora_dropout=config.lora.dropout, bias=config.lora.bias,
        target_modules=list(config.lora.target_modules),
        modules_to_save=list(config.lora.modules_to_save) or None,
        task_type="CAUSAL_LM")
    return get_peft_model(model, lora)


def count_parameters(model) -> tuple[int, int]:
    total = sum(p.numel() for p in model.parameters())
    trainable = sum(p.numel() for p in model.parameters() if p.requires_grad)
    return total, trainable


def model_geometry(model) -> tuple[int, int]:
    cfg = model.config
    return (getattr(cfg, "hidden_size", 2048),
            getattr(cfg, "num_hidden_layers", 24))


# --- Checkpoint safety -----------------------------------------------------

def prepare_output_dir(config: LekoyConfig, *, overwrite: bool = False,
                       new_experiment: bool = False) -> Path:
    """Never destroy a checkpoint without being told to.

    An output directory that already holds a checkpoint is an error by default.
    `--overwrite` says so explicitly; `--new-experiment` sidesteps it by
    picking `<dir>-002`. Silently resuming into an occupied directory is the
    behaviour that loses a week of training, so it is not an option.
    """
    out = Path(config.training.output_dir)
    if not out.is_absolute():
        out = ROOT / out
    # Deduplicated: "*.safetensors" and "adapter_model.safetensors" match the
    # same file, and --overwrite would then try to unlink it twice.
    existing = sorted({*out.glob("checkpoint-*"), *out.glob("*.safetensors"),
                       *out.glob("adapter_model.bin")})
    if existing and not overwrite:
        if new_experiment:
            n = 2
            while (candidate := out.with_name(f"{out.name}-{n:03d}")).exists():
                n += 1
            candidate.mkdir(parents=True, exist_ok=True)
            config.training.output_dir = str(candidate)
            return candidate
        raise FileExistsError(
            f"{out} already contains a checkpoint ({len(existing)} artefact(s)).\n"
            f"  --resume-from-checkpoint {out}   continue that run\n"
            f"  --new-experiment                 write to {out.name}-002 instead\n"
            f"  --overwrite                      delete it and start over")
    if existing and overwrite:
        print(f"[warn] --overwrite: removing {len(existing)} artefact(s) from {out}",
              file=sys.stderr)
        for path in existing:
            shutil.rmtree(path) if path.is_dir() else path.unlink()
    out.mkdir(parents=True, exist_ok=True)
    return out


def latest_checkpoint(directory: str | Path) -> Path | None:
    directory = Path(directory)
    if not directory.exists():
        return None
    checkpoints = sorted(
        (p for p in directory.glob("checkpoint-*") if p.is_dir()),
        key=lambda p: int(p.name.rsplit("-", 1)[-1]) if p.name.rsplit("-", 1)[-1].isdigit() else -1)
    return checkpoints[-1] if checkpoints else None


def resolve_resume(config: LekoyConfig, requested: str | None) -> str | None:
    """Turn `--resume-from-checkpoint` into a concrete path.

    `auto` means the newest checkpoint in the output directory — the form you
    want after an interruption, when you do not remember the step number.
    """
    requested = requested or config.training.resume_from_checkpoint
    if not requested:
        return None
    if requested in ("auto", "latest", "true"):
        found = latest_checkpoint(config.training.output_dir)
        if not found:
            print(f"[warn] --resume-from-checkpoint auto: no checkpoint in "
                  f"{config.training.output_dir}; starting fresh", file=sys.stderr)
            return None
        print(f"[resume] {found}")
        return str(found)
    path = Path(requested)
    if not path.exists():
        raise FileNotFoundError(f"no checkpoint at {path}")
    return str(path)


def save_run_manifest(out: Path, config: LekoyConfig, experiment, extra: dict) -> None:
    """What produced these weights, written next to them.

    A checkpoint directory that does not say which config and which data made
    it is a checkpoint you cannot trust three weeks later.
    """
    (out / "lekoy_run.json").write_text(json.dumps({
        "family": config.family, "model": config.model_id,
        "full_name": config.full_name, "config_name": config.name,
        "base_model": config.model.name,
        "experiment_id": experiment.id if experiment else None,
        "git_commit": experiment.git_commit if experiment else None,
        "config": config.to_dict(), **extra,
    }, indent=2, ensure_ascii=False), encoding="utf-8")
