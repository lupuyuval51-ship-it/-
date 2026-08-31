#!/usr/bin/env python3
"""Project the cost of a training run before starting it.

Takes a model size, a token budget and a hardware description; returns VRAM,
GPU-hours, storage and tokens/sec, with a feasibility verdict. The CPU numbers
come from the matmul benchmark in reports/system_report.json — measured on this
machine, not quoted from a spec sheet.

    python scripts/estimate_training.py --config rv5_small.yaml --tokens 50M
    python scripts/estimate_training.py --params 7B --tokens 2B --gpu a100-80 --gpus 8
    python scripts/estimate_training.py --list-gpus
"""
from __future__ import annotations

import argparse
import json
import math
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "src"))

from lekoy.config import LekoyConfig                                    # noqa: E402
from lekoy.paths import REPORTS                                         # noqa: E402

# Peak dense BF16 throughput, TFLOP/s, from vendor specification sheets. These
# are ceilings: the achieved fraction below is what a real training loop gets.
GPUS = {
    "cpu":       dict(tflops=None, memory_gb=None, achieved=0.35,
                      note="measured from reports/system_report.json"),
    "t4":        dict(tflops=65,   memory_gb=16,  achieved=0.30, note="fp16, no bf16"),
    "l4":        dict(tflops=121,  memory_gb=24,  achieved=0.35),
    "a10":       dict(tflops=125,  memory_gb=24,  achieved=0.35),
    "rtx3090":   dict(tflops=71,   memory_gb=24,  achieved=0.35),
    "rtx4090":   dict(tflops=165,  memory_gb=24,  achieved=0.40),
    "a100-40":   dict(tflops=312,  memory_gb=40,  achieved=0.45),
    "a100-80":   dict(tflops=312,  memory_gb=80,  achieved=0.50),
    "h100":      dict(tflops=989,  memory_gb=80,  achieved=0.45),
    "h200":      dict(tflops=989,  memory_gb=141, achieved=0.45),
}

# Known model geometries, so --params can be a name as well as a number.
KNOWN_MODELS = {
    "Qwen/Qwen2.5-0.5B-Instruct": dict(params=0.494e9, hidden=896,  layers=24),
    "Qwen/Qwen2.5-1.5B-Instruct": dict(params=1.54e9,  hidden=1536, layers=28),
    "Qwen/Qwen2.5-7B-Instruct":   dict(params=7.62e9,  hidden=3584, layers=28),
}

SUFFIXES = {"k": 1e3, "m": 1e6, "b": 1e9, "t": 1e12}


def parse_count(text: str) -> float:
    """Accept 50M, 2.5B, 1_000_000."""
    text = str(text).strip().replace("_", "").replace(",", "")
    m = re.fullmatch(r"([\d.]+)\s*([kmbt]?)", text, re.IGNORECASE)
    if not m:
        raise argparse.ArgumentTypeError(f"cannot read a count from {text!r}")
    return float(m.group(1)) * SUFFIXES.get(m.group(2).lower(), 1.0)


def measured_cpu_tflops() -> float | None:
    path = REPORTS / "system_report.json"
    if not path.exists():
        return None
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError:
        return None
    gflops = (data.get("benchmark") or {}).get("bf16_gflops")
    return gflops / 1000 if gflops else None


def flops_per_token(params: float, trainable_fraction: float) -> float:
    """Forward+backward FLOPs per token.

    6N for full training — 2N forward, 4N backward. LoRA still pays the full
    forward and the full backward *activation* pass through the frozen base;
    only the weight-gradient computation shrinks. That makes it about 4N,
    which is why LoRA is roughly a third cheaper in compute rather than the
    300× its trainable-parameter count would suggest. Getting this wrong is
    the most common way a training estimate comes out absurdly optimistic.
    """
    if trainable_fraction >= 0.99:
        return 6 * params
    return 4 * params + 2 * params * trainable_fraction


def estimate(params: float, tokens: float, gpu: str, gpu_count: int,
             batch_size: int, seq_length: int, hidden: int, layers: int,
             trainable_fraction: float, precision_bytes: float,
             optimizer_bytes: float, gradient_checkpointing: bool) -> dict:
    spec = GPUS[gpu]
    tflops = spec["tflops"]
    if gpu == "cpu":
        tflops = measured_cpu_tflops()
        if tflops is None:
            return {"error": "no CPU benchmark; run scripts/check_system.py first"}

    achieved = tflops * spec["achieved"] * 1e12
    # Scaling is sub-linear past one device: gradient all-reduce costs
    # bandwidth. 0.9 per doubling is a conservative, commonly observed figure.
    scaling = 1.0 if gpu_count == 1 else gpu_count * (0.9 ** math.log2(gpu_count))
    cluster = achieved * scaling

    total_flops = flops_per_token(params, trainable_fraction) * tokens
    seconds = total_flops / cluster
    tokens_per_sec = tokens / seconds if seconds else 0

    trainable = params * trainable_fraction
    weights = params * precision_bytes
    gradients = trainable * 2
    optimizer = trainable * optimizer_bytes
    per_layer = batch_size * seq_length * hidden * 2 * 8
    layer_factor = math.sqrt(layers) if gradient_checkpointing else layers
    activations = per_layer * layer_factor
    peak = (weights + gradients + optimizer + activations) / 1e9

    # Storage: one bf16 copy of the merged model, plus checkpoints. LoRA
    # adapters are small; a full-fine-tune checkpoint is the model again.
    checkpoint = (params * 2 if trainable_fraction >= 0.99 else trainable * 2) / 1e9
    storage = params * 2 / 1e9 + checkpoint * 3

    return {
        "params": params,
        "tokens": tokens,
        "gpu": gpu,
        "gpu_count": gpu_count,
        "peak_tflops": tflops,
        "achieved_tflops": achieved / 1e12,
        "cluster_tflops": cluster / 1e12,
        "total_petaflops": total_flops / 1e15,
        "seconds": seconds,
        "hours": seconds / 3600,
        "gpu_hours": seconds / 3600 * gpu_count,
        "tokens_per_second": tokens_per_sec,
        "peak_memory_gb": peak,
        "memory_budget_gb": spec["memory_gb"],
        "storage_gb": storage,
        "trainable_params": trainable,
        "trainable_fraction": trainable_fraction,
    }


def render(result: dict, label: str) -> str:
    if "error" in result:
        return f"{label}: {result['error']}"
    hours = result["hours"]
    if hours < 1:
        duration = f"{hours * 60:.0f} minutes"
    elif hours < 48:
        duration = f"{hours:.1f} hours"
    else:
        duration = f"{hours / 24:.1f} days"

    lines = [
        f"### {label}",
        "",
        f"| Field | Value |",
        f"| --- | --- |",
        f"| Model | {result['params'] / 1e9:.2f}B parameters |",
        f"| Trainable | {result['trainable_params'] / 1e6:.1f}M "
        f"({result['trainable_fraction']:.1%}) |",
        f"| Token budget | {result['tokens'] / 1e9:.3f}B |",
        f"| Hardware | {result['gpu_count']}× {result['gpu']} |",
        f"| Peak throughput | {result['peak_tflops']:.0f} TFLOP/s |",
        f"| Assumed achieved | {result['achieved_tflops']:.0f} TFLOP/s per device |",
        f"| Total compute | {result['total_petaflops']:.2f} PFLOP |",
        f"| **Wall clock** | **{duration}** |",
        f"| GPU-hours | {result['gpu_hours']:.1f} |",
        f"| Throughput | {result['tokens_per_second']:,.0f} tokens/sec |",
        f"| Peak memory | {result['peak_memory_gb']:.2f} GB |",
        f"| Storage | {result['storage_gb']:.1f} GB |",
        "",
    ]

    budget = result["memory_budget_gb"]
    warnings = []
    if budget and result["peak_memory_gb"] > budget:
        warnings.append(
            f"**Will not fit.** Needs {result['peak_memory_gb']:.1f} GB, the "
            f"{result['gpu']} has {budget} GB. Reduce sequence length or batch "
            "size, enable gradient checkpointing, or use 4-bit loading.")
    elif budget and result["peak_memory_gb"] > budget * 0.85:
        warnings.append(
            f"**Tight.** {result['peak_memory_gb']:.1f} GB of {budget} GB — "
            "expect to tune batch size, and expect fragmentation to bite on a "
            "long run.")
    if hours > 24 * 7:
        warnings.append(
            f"**{hours / 24:.0f} days on this hardware.** Either add devices "
            "or cut the token budget; a run this long will be interrupted, so "
            "check that --resume-from-checkpoint works before starting it.")
    elif hours > 24:
        warnings.append(
            "Over a day. Set `save_steps` so an interruption costs at most an "
            "hour, and verify resume works before leaving it.")
    if result["gpu"] == "cpu":
        warnings.append(
            "CPU estimate, from the measured matmul benchmark on this host. "
            "Real throughput will be lower: attention, the optimiser step and "
            "the dataloader are not pure matmul, and 4 cores have no headroom "
            "to overlap them.")
    for warning in warnings:
        lines.append(f"> {warning}")
        lines.append("")
    return "\n".join(lines)


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--config", help="read model and training settings from a LEKOY config")
    ap.add_argument("--params", help="model size, e.g. 7B — overrides --config")
    ap.add_argument("--tokens", default="50M", help="training token budget, e.g. 2B")
    ap.add_argument("--gpu", default=None, choices=sorted(GPUS),
                    help="hardware (default: cpu, or the config's implied device)")
    ap.add_argument("--gpus", type=int, default=1)
    ap.add_argument("--batch-size", type=int)
    ap.add_argument("--seq-length", type=int)
    ap.add_argument("--hidden", type=int, default=2048)
    ap.add_argument("--layers", type=int, default=24)
    ap.add_argument("--full-finetune", action="store_true",
                    help="assume full fine-tuning rather than LoRA")
    ap.add_argument("--compare", nargs="*", metavar="GPU",
                    help="also estimate on these devices")
    ap.add_argument("--out", help="write the report to a markdown file")
    ap.add_argument("--list-gpus", action="store_true")
    args = ap.parse_args()

    if args.list_gpus:
        print(f"{'device':10s} {'TFLOP/s':>9s} {'memory':>8s}  note")
        for name, spec in GPUS.items():
            print(f"{name:10s} {str(spec['tflops'] or '—'):>9s} "
                  f"{str(spec['memory_gb'] or '—'):>7s}G  {spec.get('note', '')}")
        return 0

    params = hidden = layers = None
    batch_size, seq_length = args.batch_size or 1, args.seq_length or 1024
    trainable_fraction = 1.0 if args.full_finetune else 0.02
    precision_bytes, optimizer_bytes, checkpointing = 2.0, 12.0, False
    gpu = args.gpu

    if args.config:
        config = LekoyConfig.load(args.config)
        geometry = KNOWN_MODELS.get(config.model.name)
        if geometry:
            params, hidden, layers = geometry["params"], geometry["hidden"], geometry["layers"]
        batch_size = args.batch_size or config.training.batch_size
        seq_length = args.seq_length or config.training.max_seq_length
        checkpointing = config.training.gradient_checkpointing
        if config.lora.enabled and not args.full_finetune:
            # LoRA on all seven projections at rank r is roughly 2% of a Qwen
            # model's parameters at r=16, scaling with r.
            trainable_fraction = min(0.02 * config.lora.r / 16, 0.5)
        precision_bytes = 0.5 if config.model.load_in_4bit else (
            1.0 if config.model.load_in_8bit else 2.0)
        if config.training.optimizer.endswith("8bit"):
            optimizer_bytes = 2.0
        if gpu is None:
            gpu = "cpu" if config.model.variant == "small" else "a10"

    if args.params:
        params = parse_count(args.params)
    if params is None:
        print("give --params or a --config with a known model", file=sys.stderr)
        return 2
    hidden = args.hidden if args.hidden != 2048 or hidden is None else hidden
    layers = args.layers if args.layers != 24 or layers is None else layers
    gpu = gpu or "cpu"
    tokens = parse_count(args.tokens)

    devices = [(gpu, args.gpus)] + [(g, args.gpus) for g in (args.compare or [])]
    sections = [
        "# LEKOY RV5 — Training Estimate", "",
        f"Token budget {tokens / 1e9:.3f}B · model {params / 1e9:.2f}B · "
        f"batch {batch_size} × seq {seq_length}"
        f"{' · gradient checkpointing' if checkpointing else ''}"
        f"{' · full fine-tune' if args.full_finetune else ' · LoRA'}", "",
    ]
    for device, count in devices:
        result = estimate(params, tokens, device, count, batch_size, seq_length,
                          hidden, layers, trainable_fraction, precision_bytes,
                          optimizer_bytes, checkpointing)
        sections.append(render(result, f"{count}× {device}"))

    report = "\n".join(sections)
    print(report)
    if args.out:
        Path(args.out).parent.mkdir(parents=True, exist_ok=True)
        Path(args.out).write_text(report + "\n", encoding="utf-8")
        print(f"wrote {args.out}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
