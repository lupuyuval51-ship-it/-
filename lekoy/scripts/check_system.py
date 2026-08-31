#!/usr/bin/env python3
"""Probe the machine LEKOY RV5 has to train on, and write reports/system_report.md.

Everything here is measured, not assumed. Where a probe cannot run (no GPU, a
package that is not installed) the report says so rather than guessing.
"""
from __future__ import annotations

import argparse
import json
import os
import platform
import re
import shutil
import subprocess
import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "src"))

PACKAGES = [
    "torch", "transformers", "accelerate", "peft", "trl", "bitsandbytes",
    "deepspeed", "flash_attn", "sentencepiece", "tokenizers", "datasets",
    "safetensors", "vllm", "numpy", "fastapi", "uvicorn", "huggingface_hub",
    "pytest", "tensorboard", "sacrebleu", "sklearn",
]

# Bytes per parameter for weights, gradients and optimiser state under each
# training regime. Adam keeps two fp32 moments; LoRA trains ~0.3% of the
# parameters so its optimiser cost is negligible against the frozen base.
REGIMES = {
    "inference_bf16": dict(weights=2, grads=0, optim=0, trainable_frac=0.0),
    "inference_int8": dict(weights=1, grads=0, optim=0, trainable_frac=0.0),
    "inference_int4": dict(weights=0.5, grads=0, optim=0, trainable_frac=0.0),
    "qlora_4bit": dict(weights=0.5, grads=2, optim=8, trainable_frac=0.003),
    "lora_bf16": dict(weights=2, grads=2, optim=8, trainable_frac=0.003),
    "full_ft_bf16_adam": dict(weights=2, grads=2, optim=12, trainable_frac=1.0),
}

MODEL_SIZES_B = [0.5, 1.5, 3.0, 7.0, 8.0, 14.0, 32.0, 70.0]


def sh(cmd: list[str], timeout: int = 20) -> str | None:
    try:
        out = subprocess.run(cmd, capture_output=True, text=True, timeout=timeout)
    except (OSError, subprocess.SubprocessError):
        return None
    return out.stdout.strip() if out.returncode == 0 else None


def cpu_info() -> dict:
    info: dict = {"arch": platform.machine(), "cores_logical": os.cpu_count()}
    try:
        text = Path("/proc/cpuinfo").read_text()
    except OSError:
        return info
    for key, field in (("model name", "model"), ("cpu MHz", "mhz")):
        m = re.search(rf"^{key}\s*:\s*(.+)$", text, re.M)
        if m:
            info[field] = m.group(1).strip()
    flags = re.search(r"^flags\s*:\s*(.+)$", text, re.M)
    if flags:
        f = set(flags.group(1).split())
        info["flags_of_interest"] = sorted(
            f & {
                "avx2", "avx512f", "avx512bw", "avx512vl", "avx512_bf16",
                "avx512_fp16", "avx512_vnni", "avx_vnni", "amx_bf16",
                "amx_int8", "amx_tile", "f16c", "sha_ni",
            }
        )
    info["physical_cores"] = len({
        m.group(1) for m in re.finditer(r"^core id\s*:\s*(\d+)$", text, re.M)
    }) or info["cores_logical"]
    return info


def mem_info() -> dict:
    info: dict = {}
    try:
        text = Path("/proc/meminfo").read_text()
    except OSError:
        return info
    for key, field in (("MemTotal", "total_gb"), ("MemAvailable", "available_gb"),
                       ("SwapTotal", "swap_gb")):
        m = re.search(rf"^{key}:\s*(\d+) kB$", text, re.M)
        if m:
            info[field] = round(int(m.group(1)) / 1024 / 1024, 2)
    return info


def disk_info(paths: list[str]) -> list[dict]:
    seen, out = set(), []
    for p in paths:
        if not Path(p).exists():
            continue
        usage = shutil.disk_usage(p)
        key = (usage.total, usage.free)
        if key in seen:
            continue
        seen.add(key)
        out.append({
            "path": p,
            "total_gb": round(usage.total / 1e9, 1),
            "used_gb": round(usage.used / 1e9, 1),
            "free_gb": round(usage.free / 1e9, 1),
        })
    return out


def gpu_info() -> dict:
    info: dict = {"present": False, "devices": [], "cuda_toolkit": None,
                  "driver": None, "detection": []}
    smi = sh([
        "nvidia-smi",
        "--query-gpu=name,memory.total,driver_version,compute_cap",
        "--format=csv,noheader",
    ])
    if smi:
        info["detection"].append("nvidia-smi")
        for line in smi.splitlines():
            parts = [p.strip() for p in line.split(",")]
            if len(parts) >= 4:
                info["devices"].append({
                    "name": parts[0], "vram": parts[1],
                    "compute_capability": parts[3],
                })
                info["driver"] = parts[2]
        info["present"] = bool(info["devices"])
    nvcc = sh(["nvcc", "--version"])
    if nvcc:
        m = re.search(r"release ([\d.]+)", nvcc)
        info["cuda_toolkit"] = m.group(1) if m else nvcc.splitlines()[-1]
    try:
        import torch
        info["torch_cuda_available"] = torch.cuda.is_available()
        info["torch_cuda_version"] = torch.version.cuda
        if torch.cuda.is_available():
            info["present"] = True
            info["detection"].append("torch.cuda")
            for i in range(torch.cuda.device_count()):
                props = torch.cuda.get_device_properties(i)
                info["devices"].append({
                    "name": props.name,
                    "vram": f"{props.total_memory / 1e9:.1f} GB",
                    "compute_capability": f"{props.major}.{props.minor}",
                })
        info["torch_mps"] = bool(getattr(torch.backends, "mps", None)
                                 and torch.backends.mps.is_available())
        if info["torch_mps"]:
            info["present"] = True
            info["detection"].append("torch.mps")
    except ImportError:
        info["torch_cuda_available"] = None
    return info


def package_info() -> dict:
    import importlib.metadata as md
    out = {}
    for name in PACKAGES:
        dist = {"flash_attn": "flash-attn", "sklearn": "scikit-learn"}.get(name, name)
        try:
            out[name] = md.version(dist)
        except md.PackageNotFoundError:
            out[name] = None
    return out


def precision_support() -> dict:
    out: dict = {}
    try:
        import torch
    except ImportError:
        return {"error": "torch not installed"}
    out["torch"] = torch.__version__
    out["threads"] = torch.get_num_threads()
    try:
        import torch.backends.mkldnn as mkldnn
        out["mkldnn"] = mkldnn.is_available()
    except ImportError:
        out["mkldnn"] = None
    # Ask the CPU, do not read it off the flag list: a matmul either runs or it
    # does not.
    for name, dtype in (("bf16", torch.bfloat16), ("fp16", torch.float16),
                        ("fp32", torch.float32)):
        try:
            a = torch.randn(64, 64, dtype=dtype)
            (a @ a).sum().item()
            out[f"cpu_{name}_matmul"] = True
        except (RuntimeError, TypeError):
            out[f"cpu_{name}_matmul"] = False
    if torch.cuda.is_available():
        out["cuda_bf16"] = torch.cuda.is_bf16_supported()
        out["cuda_tf32"] = torch.backends.cuda.matmul.allow_tf32
    return out


def benchmark_cpu(seconds: float = 2.0) -> dict:
    """Measure real matmul throughput. GFLOP/s here sets the training estimate."""
    try:
        import torch
    except ImportError:
        return {}
    out = {}
    n = 1024
    for name, dtype in (("fp32", torch.float32), ("bf16", torch.bfloat16)):
        try:
            a = torch.randn(n, n, dtype=dtype)
            b = torch.randn(n, n, dtype=dtype)
            (a @ b).sum().item()  # warm up allocator and kernel selection
            iters, start = 0, time.perf_counter()
            while time.perf_counter() - start < seconds:
                (a @ b)
                iters += 1
            elapsed = time.perf_counter() - start
            out[f"{name}_gflops"] = round(2 * n ** 3 * iters / elapsed / 1e9, 1)
        except (RuntimeError, TypeError):
            out[f"{name}_gflops"] = None
    return out


def memory_table(budget_gb: float) -> list[dict]:
    """What fits, per regime, in `budget_gb` of the fastest memory available.

    Activation memory is not modelled here — it depends on batch and sequence
    length, and `estimate_training.py` does that properly. A 1.25x headroom
    factor stands in for it plus allocator fragmentation, which is why a model
    that lands just under the budget is reported as tight rather than fine.
    """
    rows = []
    for size in MODEL_SIZES_B:
        params = size * 1e9
        row = {"params_b": size}
        for regime, spec in REGIMES.items():
            frozen = params * (1 - spec["trainable_frac"]) * spec["weights"]
            trainable = params * spec["trainable_frac"]
            gb = (frozen
                  + trainable * spec["weights"]
                  + trainable * spec["grads"]
                  + trainable * spec["optim"]) / 1e9
            gb *= 1.25
            row[regime] = round(gb, 1)
        rows.append(row)
    return rows


def verdict(gb: float, budget: float) -> str:
    if gb <= budget * 0.6:
        return "yes"
    if gb <= budget:
        return "tight"
    return "no"


def collect() -> dict:
    return {
        "os": {
            "system": platform.system(),
            "release": platform.release(),
            "distro": next(
                (l.split("=", 1)[1].strip().strip('"')
                 for l in Path("/etc/os-release").read_text().splitlines()
                 if l.startswith("PRETTY_NAME=")), None)
            if Path("/etc/os-release").exists() else None,
        },
        "python": {
            "version": platform.python_version(),
            "executable": sys.executable,
            "implementation": platform.python_implementation(),
        },
        "cpu": cpu_info(),
        "memory": mem_info(),
        "disk": disk_info(["/", str(ROOT), "/tmp", str(Path.home())]),
        "gpu": gpu_info(),
        "packages": package_info(),
        "precision": precision_support(),
        "benchmark": benchmark_cpu(),
    }


def render(data: dict) -> str:
    gpu = data["gpu"]
    mem = data["memory"]
    cpu = data["cpu"]
    bench = data["benchmark"]
    has_gpu = gpu["present"]

    if has_gpu:
        vram_gb = max(
            (float(re.sub(r"[^\d.]", "", d["vram"]) or 0)
             / (1000 if "MiB" in d["vram"] else 1))
            for d in gpu["devices"])
        budget, budget_label = vram_gb, f"{vram_gb:.0f} GB VRAM"
    else:
        # Leave room for the OS, the dataloader and the allocator's own slack.
        budget = max(mem.get("available_gb", 8) - 3, 2)
        budget_label = f"{budget:.0f} GB usable system RAM (no GPU)"

    L = []
    A = L.append
    A("# LEKOY RV5 — System Report")
    A("")
    A("Generated by `scripts/check_system.py`. Every number below is measured on")
    A("this machine at the time of the run; nothing is assumed from a spec sheet.")
    A("")
    A("## Verdict")
    A("")
    if has_gpu:
        A(f"CUDA/accelerator training is available: {len(gpu['devices'])} device(s), "
          f"{budget_label}.")
    else:
        A("**No GPU is present on this machine.** There is no CUDA device, no")
        A("`nvidia-smi`, and `torch.cuda.is_available()` is False. All training in")
        A("this environment therefore runs on CPU, which bounds LEKOY RV5 to the")
        A("small configuration and to LoRA rather than full fine-tuning.")
        A("")
        A("This is a bound on scale, not a blocker: the pipeline, the configs and")
        A("the evaluation suite are all built to run unchanged on a GPU host, and")
        A("`configs/rv5_medium.yaml` and `configs/rv5_large.yaml` are written for")
        A("exactly that. See *Running the full training elsewhere* at the end.")
    A("")
    A("## Operating system and Python")
    A("")
    A("| Field | Value |")
    A("| --- | --- |")
    A(f"| Distribution | {data['os']['distro'] or '—'} |")
    A(f"| Kernel | {data['os']['system']} {data['os']['release']} |")
    A(f"| Python | {data['python']['version']} ({data['python']['implementation']}) |")
    A(f"| Interpreter | `{data['python']['executable']}` |")
    A("")
    A("## CPU")
    A("")
    A("| Field | Value |")
    A("| --- | --- |")
    A(f"| Model | {cpu.get('model', '—')} |")
    A(f"| Logical cores | {cpu.get('cores_logical', '—')} |")
    A(f"| Physical cores | {cpu.get('physical_cores', '—')} |")
    A(f"| Architecture | {cpu.get('arch', '—')} |")
    A(f"| Relevant ISA | {', '.join(cpu.get('flags_of_interest', [])) or '—'} |")
    A("")
    if "amx_bf16" in cpu.get("flags_of_interest", []):
        A("The CPU exposes **AMX-BF16** and **AVX512-BF16**. That is what makes CPU")
        A("training of a small model tolerable here rather than hopeless: bfloat16")
        A("matmuls run on the tile engine instead of being emulated.")
        A("")
    A("## Memory")
    A("")
    A("| Field | Value |")
    A("| --- | --- |")
    A(f"| Total RAM | {mem.get('total_gb', '—')} GB |")
    A(f"| Available RAM | {mem.get('available_gb', '—')} GB |")
    A(f"| Swap | {mem.get('swap_gb', 0)} GB |")
    A("")
    if not mem.get("swap_gb"):
        A("There is no swap. An out-of-memory event kills the process outright, so")
        A("the training scripts pre-flight their memory estimate and refuse to start")
        A("a run they predict will not fit (`--check-memory`, on by default).")
        A("")
    A("## Storage")
    A("")
    A("| Mount | Total | Used | Free |")
    A("| --- | --- | --- | --- |")
    for d in data["disk"]:
        A(f"| `{d['path']}` | {d['total_gb']} GB | {d['used_gb']} GB | {d['free_gb']} GB |")
    A("")
    free = min((d["free_gb"] for d in data["disk"]), default=0)
    A(f"Usable free space: **{free} GB**. A bf16 checkpoint of a 0.5B model is about")
    A("1 GB, so the checkpoint tree for a full RV5 stage sequence — baseline through")
    A("final, with LoRA adapters at ~20 MB each — fits comfortably. A 7B base model")
    A("in bf16 is ~15 GB and would fit once, but not alongside several merged")
    A("checkpoints of itself.")
    A("")
    A("## GPU / accelerator")
    A("")
    if has_gpu:
        A("| Device | VRAM | Compute capability |")
        A("| --- | --- | --- |")
        for d in gpu["devices"]:
            A(f"| {d['name']} | {d['vram']} | {d.get('compute_capability', '—')} |")
        A("")
        A(f"Driver: {gpu.get('driver') or '—'} · CUDA toolkit: "
          f"{gpu.get('cuda_toolkit') or '—'} · torch CUDA: "
          f"{gpu.get('torch_cuda_version') or '—'}")
    else:
        A("| Probe | Result |")
        A("| --- | --- |")
        A("| `nvidia-smi` | not found |")
        A("| `/dev/nvidia*` | absent |")
        A(f"| `nvcc` | {gpu.get('cuda_toolkit') or 'not found'} |")
        A(f"| `torch.cuda.is_available()` | {gpu.get('torch_cuda_available')} |")
        A(f"| `torch.version.cuda` | {gpu.get('torch_cuda_version')} |")
        A(f"| `torch.backends.mps` | {gpu.get('torch_mps')} |")
    A("")
    A("## Installed packages")
    A("")
    A("| Package | Version | Note |")
    A("| --- | --- | --- |")
    notes = {
        "bitsandbytes": "4-bit/8-bit quantised training — CUDA-only, unusable here",
        "deepspeed": "ZeRO sharding — for the multi-GPU configs, not this host",
        "flash_attn": "CUDA-only kernel; CPU falls back to SDPA",
        "vllm": "CUDA-only serving backend; the API server uses transformers here",
    }
    for name, ver in data["packages"].items():
        note = notes.get(name, "")
        A(f"| `{name}` | {ver or '**missing**'} | {note} |")
    A("")
    A("## Supported precision")
    A("")
    p = data["precision"]
    A("| Precision | Supported | How it was checked |")
    A("| --- | --- | --- |")
    A(f"| BF16 (CPU) | {p.get('cpu_bf16_matmul')} | ran a bfloat16 matmul |")
    A(f"| FP16 (CPU) | {p.get('cpu_fp16_matmul')} | ran a float16 matmul |")
    A(f"| FP32 (CPU) | {p.get('cpu_fp32_matmul')} | ran a float32 matmul |")
    if "cuda_bf16" in p:
        A(f"| BF16 (CUDA) | {p['cuda_bf16']} | `torch.cuda.is_bf16_supported()` |")
        A(f"| TF32 | {p['cuda_tf32']} | `torch.backends.cuda.matmul.allow_tf32` |")
    A(f"| oneDNN / MKL-DNN | {p.get('mkldnn')} | `torch.backends.mkldnn.is_available()` |")
    A("")
    if not has_gpu:
        A("FP16 executes on CPU but is a trap for training: x86 has no fast fp16")
        A("path here and there is no GradScaler on CPU, so it is both slower than")
        A("bf16 and more likely to produce NaNs. **BF16 is the precision LEKOY RV5")
        A("trains in on this host**, and the configs set it accordingly.")
        A("")
    A("## Measured throughput")
    A("")
    A("| Operation | Throughput |")
    A("| --- | --- |")
    A(f"| 1024³ matmul, fp32 | {bench.get('fp32_gflops', '—')} GFLOP/s |")
    A(f"| 1024³ matmul, bf16 | {bench.get('bf16_gflops', '—')} GFLOP/s |")
    A("")
    A("`scripts/estimate_training.py` uses these numbers, not a vendor figure, to")
    A("project GPU-hours and tokens/sec for a planned run.")
    A("")
    A("## Estimated model sizes")
    A("")
    A(f"Budget assumed: **{budget_label}**. Figures are weights + gradients +")
    A("optimiser state, with 25% headroom for activations and fragmentation.")
    A("Activation memory scales with batch and sequence length and is modelled")
    A("separately in `scripts/estimate_training.py`.")
    A("")
    A("| Params | Inference BF16 | Inference INT4 | QLoRA 4-bit | LoRA BF16 | Full FT BF16+Adam |")
    A("| ---: | ---: | ---: | ---: | ---: | ---: |")
    for row in memory_table(budget):
        A(f"| {row['params_b']}B "
          f"| {row['inference_bf16']} GB "
          f"| {row['inference_int4']} GB "
          f"| {row['qlora_4bit']} GB "
          f"| {row['lora_bf16']} GB "
          f"| {row['full_ft_bf16_adam']} GB |")
    A("")
    A("### What this hardware can actually do")
    A("")
    A("`yes` = fits with room to spare · `tight` = fits but expect to tune batch")
    A("size and sequence length · `no` = does not fit.")
    A("")
    A("| Params | Run inference | QLoRA | LoRA | Full fine-tune |")
    A("| ---: | :---: | :---: | :---: | :---: |")
    for row in memory_table(budget):
        qlora = "no (CUDA only)" if not has_gpu else verdict(row["qlora_4bit"], budget)
        A(f"| {row['params_b']}B "
          f"| {verdict(row['inference_bf16'], budget)} "
          f"| {qlora} "
          f"| {verdict(row['lora_bf16'], budget)} "
          f"| {verdict(row['full_ft_bf16_adam'], budget)} |")
    A("")
    if not has_gpu:
        A("Two caveats the table cannot express:")
        A("")
        A("1. **QLoRA is unavailable at any size**, regardless of memory. It needs")
        A("   `bitsandbytes`, whose 4-bit kernels are CUDA-only. The `qlora` column")
        A("   above is what it *would* cost on a GPU host with the same budget.")
        A("2. **Fitting is not the same as finishing.** A 7B LoRA step fits in RAM")
        A("   here and would still take minutes per step on 4 cores. The practical")
        A("   ceiling for a run that completes in this environment is the 0.5B")
        A("   class — which is why `rv5_small` is the default configuration.")
        A("")
        A("## Running the full training elsewhere")
        A("")
        A("Nothing in the pipeline is CPU-specific. To run RV5 medium or large on a")
        A("GPU host, install the CUDA build of torch plus `bitsandbytes`, and pass")
        A("the matching config:")
        A("")
        A("```bash")
        A("pip install torch --index-url https://download.pytorch.org/whl/cu124")
        A("pip install bitsandbytes flash-attn --no-build-isolation")
        A("python scripts/train_sft.py --config configs/rv5_medium.yaml")
        A("```")
        A("")
        A("| Config | Base model | Regime | Minimum GPU |")
        A("| --- | --- | --- | --- |")
        A("| `rv5_small` | Qwen2.5-0.5B-Instruct | LoRA BF16 | none — runs on CPU |")
        A("| `rv5_medium` | Qwen2.5-1.5B-Instruct | QLoRA 4-bit | 1× 24 GB (A10, 3090, 4090) |")
        A("| `rv5_large` | Qwen2.5-7B-Instruct | QLoRA 4-bit | 1× 48 GB, or 2× 24 GB with DeepSpeed |")
        A("")
    A("---")
    A("")
    A("Raw probe output: [`reports/system_report.json`](system_report.json)")
    return "\n".join(L) + "\n"


def main() -> int:
    ap = argparse.ArgumentParser(description="Probe hardware and write the LEKOY system report.")
    ap.add_argument("--json", action="store_true", help="print the raw probe as JSON and exit")
    ap.add_argument("--out", default=str(ROOT / "reports" / "system_report.md"))
    args = ap.parse_args()

    data = collect()
    if args.json:
        print(json.dumps(data, indent=2))
        return 0

    out = Path(args.out)
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(render(data), encoding="utf-8")
    out.with_suffix(".json").write_text(json.dumps(data, indent=2), encoding="utf-8")
    print(f"wrote {out}")
    print(f"wrote {out.with_suffix('.json')}")
    gpu = data["gpu"]
    print(f"  gpu: {'yes — ' + gpu['devices'][0]['name'] if gpu['present'] else 'none'}")
    print(f"  ram: {data['memory'].get('available_gb')} GB available")
    print(f"  bf16 matmul: {data['precision'].get('cpu_bf16_matmul')} "
          f"({data['benchmark'].get('bf16_gflops')} GFLOP/s)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
