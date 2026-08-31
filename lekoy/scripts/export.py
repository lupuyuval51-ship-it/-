#!/usr/bin/env python3
"""Turn a training output into a model directory that stands on its own.

    python scripts/export.py --checkpoint checkpoints/rv5/sft --out release/LEKOY-RV5-SFT-v1
    python scripts/export.py --checkpoint checkpoints/rv5/final --out release/LEKOY-RV5-Final --verify

Merges LoRA adapters into the base weights where there are any, copies the
tokenizer, writes a manifest and a README, and — with --verify — reloads the
result and generates from it, because a checkpoint that has not been reloaded
is a checkpoint that might not load.
"""
from __future__ import annotations

import argparse
import json
import shutil
import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "src"))

from lekoy import FAMILY, FULL_NAME, MODEL, __version__                  # noqa: E402
from lekoy.config import LekoyConfig                                     # noqa: E402
from lekoy.identity import system_prompt                                 # noqa: E402

VERSION_NAMES = {
    "baseline": "LEKOY-RV5-Base",
    "continued_pretraining": "LEKOY-RV5-Pretrain-v1",
    "sft": "LEKOY-RV5-SFT-v1",
    "reasoning": "LEKOY-RV5-Reasoning-v1",
    "coding": "LEKOY-RV5-Code-v1",
    "preference": "LEKOY-RV5-Aligned-v1",
    "release_candidate": "LEKOY-RV5-RC1",
    "final": "LEKOY-RV5-Final",
}


def read_manifest(checkpoint: Path) -> dict:
    path = checkpoint / "lekoy_run.json"
    if path.exists():
        try:
            return json.loads(path.read_text(encoding="utf-8"))
        except json.JSONDecodeError:
            pass
    return {}


def export(checkpoint: Path, out: Path, config: LekoyConfig, *,
           dtype: str, base_model: str | None) -> dict:
    import torch
    from transformers import AutoModelForCausalLM, AutoTokenizer

    torch_dtype = {"bfloat16": torch.bfloat16, "float16": torch.float16,
                   "float32": torch.float32}[dtype]
    adapter_config = checkpoint / "adapter_config.json"
    merged = False

    if adapter_config.exists():
        from peft import PeftModel
        adapter = json.loads(adapter_config.read_text(encoding="utf-8"))
        base = base_model or adapter.get("base_model_name_or_path") or config.model.name
        print(f"[merge] {checkpoint.name} (LoRA r={adapter.get('r')}) into {base}")
        model = AutoModelForCausalLM.from_pretrained(base, dtype=torch_dtype)
        model = PeftModel.from_pretrained(model, str(checkpoint))
        model = model.merge_and_unload()
        merged = True
        tokenizer_source = (str(checkpoint)
                            if (checkpoint / "tokenizer_config.json").exists() else base)
    else:
        print(f"[copy ] {checkpoint.name} (full weights)")
        base = base_model or config.model.name
        model = AutoModelForCausalLM.from_pretrained(str(checkpoint), dtype=torch_dtype)
        tokenizer_source = str(checkpoint)

    tokenizer = AutoTokenizer.from_pretrained(tokenizer_source)
    out.mkdir(parents=True, exist_ok=True)
    model.save_pretrained(str(out), safe_serialization=True)
    tokenizer.save_pretrained(str(out))

    size = sum(f.stat().st_size for f in out.rglob("*") if f.is_file())
    return {
        "merged_lora": merged,
        "base_model": base,
        "dtype": dtype,
        "parameters": sum(p.numel() for p in model.parameters()),
        "size_bytes": size,
        "files": sorted(f.name for f in out.iterdir() if f.is_file()),
    }


def verify(out: Path) -> dict:
    """Reload from disk and generate. The only proof that an export worked."""
    import torch
    from transformers import AutoModelForCausalLM, AutoTokenizer

    print("[check] reloading the exported directory ...")
    started = time.time()
    tokenizer = AutoTokenizer.from_pretrained(str(out))
    model = AutoModelForCausalLM.from_pretrained(str(out), dtype=torch.bfloat16)
    model.eval()

    checks = []
    for prompt in ("מי אתה?", "What is 2 + 2?"):
        messages = [{"role": "system", "content": system_prompt("he")},
                    {"role": "user", "content": prompt}]
        text = tokenizer.apply_chat_template(messages, tokenize=False,
                                             add_generation_prompt=True)
        inputs = tokenizer(text, return_tensors="pt")
        with torch.no_grad():
            output = model.generate(**inputs, max_new_tokens=40, do_sample=False,
                                    pad_token_id=tokenizer.pad_token_id
                                    or tokenizer.eos_token_id)
        reply = tokenizer.decode(output[0][inputs["input_ids"].shape[1]:],
                                 skip_special_tokens=True).strip()
        checks.append({"prompt": prompt, "response": reply, "ok": bool(reply)})
        print(f"  {prompt!r} -> {reply[:90]!r}")

    return {"reload_seconds": round(time.time() - started, 1),
            "generation_checks": checks,
            "passed": all(c["ok"] for c in checks)}


def write_readme(out: Path, name: str, manifest: dict, details: dict) -> None:
    (out / "README.md").write_text(f"""# {name}

`{name}` is a released checkpoint of **{FULL_NAME}**, the first model in the
{FAMILY} family.

| Field | Value |
| --- | --- |
| Family | {FAMILY} |
| Model | {MODEL} |
| Full name | {FULL_NAME} |
| Release name | {name} |
| Training stage | {manifest.get('stage', 'unknown')} |
| Base model | {details['base_model']} |
| Parameters | {details['parameters'] / 1e6:.0f}M |
| Precision | {details['dtype']} |
| LoRA merged | {'yes' if details['merged_lora'] else 'no adapters to merge'} |
| Size on disk | {details['size_bytes'] / 1e9:.2f} GB |
| Languages | Hebrew, English, Spanish |
| Pipeline version | {__version__} |

## Loading it

```python
from transformers import AutoModelForCausalLM, AutoTokenizer

tokenizer = AutoTokenizer.from_pretrained("{name}")
model = AutoModelForCausalLM.from_pretrained("{name}")
```

The weights are self-contained: the LoRA adapters are merged in, and nothing
is fetched at inference time.

## Serving it

```bash
python scripts/serve.py --model {name}
python scripts/chat.py  --model {name}
```

## Licence

Inherited from the base model, `{details['base_model']}`. See `MODEL_CARD.md`
in the LEKOY repository for the full statement, the training data provenance
and the measured benchmark results.
""", encoding="utf-8")


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--checkpoint", required=True)
    ap.add_argument("--out", help="destination (default: release/<version name>)")
    ap.add_argument("--config", default="rv5_small.yaml")
    ap.add_argument("--base-model", help="base weights, if the adapter does not name them")
    ap.add_argument("--dtype", default="bfloat16",
                    choices=["bfloat16", "float16", "float32"])
    ap.add_argument("--name", help="release name (default: from the training stage)")
    ap.add_argument("--verify", action="store_true",
                    help="reload the export and generate from it")
    ap.add_argument("--overwrite", action="store_true")
    args = ap.parse_args()

    checkpoint = Path(args.checkpoint)
    if not checkpoint.is_absolute():
        checkpoint = ROOT / checkpoint
    if not checkpoint.exists():
        print(f"no checkpoint at {checkpoint}", file=sys.stderr)
        return 2

    config = LekoyConfig.load(args.config)
    manifest = read_manifest(checkpoint)
    stage = manifest.get("stage", checkpoint.name)
    name = args.name or VERSION_NAMES.get(stage, f"LEKOY-RV5-{checkpoint.name}")
    out = Path(args.out) if args.out else ROOT / "release" / name
    if not out.is_absolute():
        out = ROOT / out

    if out.exists() and any(out.iterdir()):
        if not args.overwrite:
            print(f"{out} already exists; pass --overwrite to replace it",
                  file=sys.stderr)
            return 1
        shutil.rmtree(out)

    print(f"[export] {checkpoint.relative_to(ROOT)} -> {out.relative_to(ROOT)} "
          f"as {name}")
    details = export(checkpoint, out, config, dtype=args.dtype,
                     base_model=args.base_model)

    record = {
        "family": FAMILY, "model": MODEL, "full_name": FULL_NAME,
        "release_name": name, "exported_from": str(checkpoint.relative_to(ROOT)),
        "stage": stage, "experiment_id": manifest.get("experiment_id"),
        "git_commit": manifest.get("git_commit"),
        "pipeline_version": __version__,
        "system_prompt": system_prompt("he"),
        **details,
    }
    if args.verify:
        record["verification"] = verify(out)
        if not record["verification"]["passed"]:
            print("[FAIL] the exported model reloaded but generated nothing",
                  file=sys.stderr)

    (out / "lekoy_release.json").write_text(
        json.dumps(record, indent=2, ensure_ascii=False), encoding="utf-8")
    write_readme(out, name, manifest, details)

    print(f"\n[ok] {name}")
    print(f"  {details['parameters'] / 1e6:.0f}M parameters · "
          f"{details['size_bytes'] / 1e9:.2f} GB · {details['dtype']}")
    print(f"  {out.relative_to(ROOT)}")
    if args.verify:
        print(f"  reload check: {'passed' if record['verification']['passed'] else 'FAILED'}")
    return 0 if not args.verify or record["verification"]["passed"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
