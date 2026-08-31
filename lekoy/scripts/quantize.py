#!/usr/bin/env python3
"""Produce smaller builds of a LEKOY RV5 export.

    python scripts/quantize.py --model release/LEKOY-RV5-SFT-v1 --format bf16 fp16
    python scripts/quantize.py --model release/LEKOY-RV5-Final --format int8 --verify
    python scripts/quantize.py --model release/LEKOY-RV5-Final --format gguf --gguf-type q4_k_m

Formats and what each needs:

    bf16 / fp16 / fp32   torch only — a dtype cast, works anywhere
    int8 / int4          bitsandbytes, which is CUDA-only
    gguf                 a llama.cpp checkout, for llama.cpp and Ollama

Rather than fail late, the script says up front which formats this host can
actually produce, and why the others cannot be produced here.
"""
from __future__ import annotations

import argparse
import json
import shutil
import subprocess
import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "src"))

from lekoy import FULL_NAME                                              # noqa: E402
from lekoy.identity import system_prompt                                 # noqa: E402

TORCH_DTYPES = {"bf16": "bfloat16", "fp16": "float16", "fp32": "float32"}
GGUF_TYPES = ["f16", "q8_0", "q6_k", "q5_k_m", "q4_k_m", "q4_0", "q3_k_m", "q2_k"]


def availability() -> dict[str, tuple[bool, str]]:
    """What can be produced on this host, checked rather than assumed."""
    out: dict[str, tuple[bool, str]] = {}
    try:
        import torch
        cuda = torch.cuda.is_available()
    except ImportError:
        return {f: (False, "torch is not installed") for f in
                ("bf16", "fp16", "fp32", "int8", "int4", "gguf")}

    for name in TORCH_DTYPES:
        out[name] = (True, "torch dtype cast")
    try:
        import bitsandbytes                                       # noqa: F401
        if cuda:
            out["int8"] = (True, "bitsandbytes on CUDA")
            out["int4"] = (True, "bitsandbytes NF4 on CUDA")
        else:
            reason = "bitsandbytes is installed but its kernels need a CUDA device"
            out["int8"] = out["int4"] = (False, reason)
    except ImportError:
        reason = "bitsandbytes is not installed (CUDA-only package)"
        out["int8"] = out["int4"] = (False, reason)

    converter = find_gguf_converter()
    out["gguf"] = ((converter is not None),
                   f"llama.cpp converter at {converter}" if converter
                   else "no llama.cpp checkout found; set LLAMA_CPP_DIR or pass "
                        "--llama-cpp-dir")
    return out


def find_gguf_converter() -> Path | None:
    import os
    candidates = []
    if (env := os.environ.get("LLAMA_CPP_DIR")):
        candidates.append(Path(env))
    candidates += [ROOT / "third_party" / "llama.cpp", Path.home() / "llama.cpp",
                   Path("/opt/llama.cpp")]
    for base in candidates:
        for name in ("convert_hf_to_gguf.py", "convert-hf-to-gguf.py"):
            script = base / name
            if script.exists():
                return script
    return None


def quantize_torch(model_path: Path, out: Path, fmt: str) -> dict:
    import torch
    from transformers import AutoModelForCausalLM, AutoTokenizer

    dtype = getattr(torch, TORCH_DTYPES[fmt])
    print(f"[{fmt}] loading and casting ...")
    model = AutoModelForCausalLM.from_pretrained(str(model_path), dtype=dtype)
    tokenizer = AutoTokenizer.from_pretrained(str(model_path))
    out.mkdir(parents=True, exist_ok=True)
    model.save_pretrained(str(out), safe_serialization=True)
    tokenizer.save_pretrained(str(out))
    return {"format": fmt, "dtype": TORCH_DTYPES[fmt],
            "size_bytes": sum(f.stat().st_size for f in out.rglob("*") if f.is_file()),
            "parameters": sum(p.numel() for p in model.parameters())}


def quantize_bnb(model_path: Path, out: Path, fmt: str) -> dict:
    import torch
    from transformers import (AutoModelForCausalLM, AutoTokenizer,
                              BitsAndBytesConfig)

    config = (BitsAndBytesConfig(load_in_8bit=True) if fmt == "int8"
              else BitsAndBytesConfig(load_in_4bit=True, bnb_4bit_quant_type="nf4",
                                      bnb_4bit_use_double_quant=True,
                                      bnb_4bit_compute_dtype=torch.bfloat16))
    print(f"[{fmt}] quantizing with bitsandbytes ...")
    model = AutoModelForCausalLM.from_pretrained(
        str(model_path), quantization_config=config, device_map="auto")
    tokenizer = AutoTokenizer.from_pretrained(str(model_path))
    out.mkdir(parents=True, exist_ok=True)
    model.save_pretrained(str(out), safe_serialization=True)
    tokenizer.save_pretrained(str(out))
    return {"format": fmt,
            "size_bytes": sum(f.stat().st_size for f in out.rglob("*") if f.is_file())}


def quantize_gguf(model_path: Path, out: Path, gguf_type: str,
                  converter: Path) -> dict:
    out.mkdir(parents=True, exist_ok=True)
    target = out / f"lekoy-rv5-{gguf_type}.gguf"
    intermediate = out / "lekoy-rv5-f16.gguf"

    print(f"[gguf] {converter} -> f16")
    proc = subprocess.run(
        [sys.executable, str(converter), str(model_path),
         "--outfile", str(intermediate), "--outtype", "f16"],
        capture_output=True, text=True, timeout=3600)
    if proc.returncode:
        raise RuntimeError(f"conversion failed: {(proc.stderr or proc.stdout)[-500:]}")

    if gguf_type == "f16":
        intermediate.rename(target)
    else:
        binary = next((p for p in (converter.parent / "build" / "bin" / "llama-quantize",
                                   converter.parent / "llama-quantize",
                                   converter.parent / "quantize") if p.exists()), None)
        if binary is None:
            raise RuntimeError(
                f"produced {intermediate.name} but found no llama-quantize binary "
                f"under {converter.parent}; build llama.cpp to go below f16")
        print(f"[gguf] {binary.name} -> {gguf_type}")
        proc = subprocess.run([str(binary), str(intermediate), str(target), gguf_type],
                              capture_output=True, text=True, timeout=3600)
        if proc.returncode:
            raise RuntimeError(f"quantize failed: {(proc.stderr or proc.stdout)[-500:]}")
        intermediate.unlink(missing_ok=True)
    return {"format": "gguf", "gguf_type": gguf_type, "file": target.name,
            "size_bytes": target.stat().st_size}


def verify_output(out: Path, fmt: str) -> dict:
    """Reload and generate. A quantized model that does not answer is not a
    smaller model, it is a broken one — and quantization is exactly where that
    happens silently."""
    if fmt == "gguf":
        return {"skipped": "GGUF verification needs llama.cpp at runtime"}
    import torch
    from transformers import AutoModelForCausalLM, AutoTokenizer

    tokenizer = AutoTokenizer.from_pretrained(str(out))
    model = AutoModelForCausalLM.from_pretrained(str(out))
    model.eval()
    messages = [{"role": "system", "content": system_prompt("he")},
                {"role": "user", "content": "מי אתה? ענה במשפט אחד."}]
    text = tokenizer.apply_chat_template(messages, tokenize=False,
                                         add_generation_prompt=True)
    inputs = tokenizer(text, return_tensors="pt")
    with torch.no_grad():
        generated = model.generate(**inputs, max_new_tokens=40, do_sample=False,
                                   pad_token_id=tokenizer.pad_token_id
                                   or tokenizer.eos_token_id)
    reply = tokenizer.decode(generated[0][inputs["input_ids"].shape[1]:],
                             skip_special_tokens=True).strip()
    print(f"  reload check -> {reply[:100]!r}")
    return {"passed": bool(reply), "sample": reply[:300]}


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--model", help="an exported model directory")
    ap.add_argument("--out", help="output root (default: <model>/../quantized)")
    ap.add_argument("--format", nargs="*", default=["bf16"],
                    choices=["bf16", "fp16", "fp32", "int8", "int4", "gguf"])
    ap.add_argument("--gguf-type", default="q4_k_m", choices=GGUF_TYPES)
    ap.add_argument("--llama-cpp-dir")
    ap.add_argument("--verify", action="store_true")
    ap.add_argument("--list", action="store_true",
                    help="show which formats this host can produce, and exit")
    args = ap.parse_args()

    available = availability()
    if args.list or not args.model:
        print(f"{FULL_NAME} — quantization formats available on this host\n")
        print(f"  {'format':8s} {'available':10s} note")
        for name, (ok, note) in available.items():
            print(f"  {name:8s} {('yes' if ok else 'no'):10s} {note}")
        if not args.model:
            print("\nPass --model to quantize a model directory.")
            return 0 if args.list else 2
        print()

    if args.llama_cpp_dir:
        import os
        os.environ["LLAMA_CPP_DIR"] = args.llama_cpp_dir
        available = availability()

    model_path = Path(args.model)
    if not model_path.is_absolute():
        model_path = ROOT / model_path
    if not model_path.exists():
        print(f"no model at {model_path}", file=sys.stderr)
        return 2
    root = Path(args.out) if args.out else model_path.parent / "quantized"
    if not root.is_absolute():
        root = ROOT / root

    original = sum(f.stat().st_size for f in model_path.rglob("*") if f.is_file())
    results, failures = [], []

    for fmt in args.format:
        ok, why = available[fmt]
        if not ok:
            print(f"[skip] {fmt}: {why}")
            failures.append((fmt, why))
            continue
        suffix = args.gguf_type if fmt == "gguf" else fmt
        out = root / f"{model_path.name}-{suffix}"
        if out.exists():
            shutil.rmtree(out)
        started = time.time()
        try:
            if fmt in TORCH_DTYPES:
                record = quantize_torch(model_path, out, fmt)
            elif fmt in ("int8", "int4"):
                record = quantize_bnb(model_path, out, fmt)
            else:
                record = quantize_gguf(model_path, out, args.gguf_type,
                                       find_gguf_converter())
        except Exception as exc:                                  # noqa: BLE001
            print(f"[FAIL] {fmt}: {type(exc).__name__}: {exc}", file=sys.stderr)
            failures.append((fmt, str(exc)[:200]))
            continue

        record["seconds"] = round(time.time() - started, 1)
        record["path"] = str(out.relative_to(ROOT))
        record["compression"] = round(original / record["size_bytes"], 2) \
            if record["size_bytes"] else None
        if args.verify:
            record["verification"] = verify_output(out, fmt)
        results.append(record)
        print(f"[ok  ] {fmt:6s} {record['size_bytes'] / 1e9:.2f} GB "
              f"({record['compression']}× smaller) in {record['seconds']}s")

    if results:
        report = root / "quantization.json"
        report.parent.mkdir(parents=True, exist_ok=True)
        report.write_text(json.dumps({
            "source": str(model_path.relative_to(ROOT)),
            "source_size_bytes": original,
            "host_support": {k: {"available": v[0], "note": v[1]}
                             for k, v in available.items()},
            "outputs": results,
            "failed": [{"format": f, "reason": r} for f, r in failures],
        }, indent=2, ensure_ascii=False), encoding="utf-8")
        print(f"\nwrote {report.relative_to(ROOT)}")

    return 1 if failures and not results else 0


if __name__ == "__main__":
    raise SystemExit(main())
