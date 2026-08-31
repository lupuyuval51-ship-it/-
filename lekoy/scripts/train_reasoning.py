#!/usr/bin/env python3
"""Stage 3 — reasoning training.

Mechanically this is SFT over a reasoning-weighted mixture, so it shares
train_sft.py's loop rather than duplicating it. What differs is the data and
the defaults: a lower learning rate, because this stage runs on top of an
already instruction-tuned checkpoint and is meant to sharpen it rather than
reshape it.

    python scripts/train_reasoning.py --config rv5_small.yaml \
        --set model.name=checkpoints/rv5/sft
"""
from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "src"))
sys.path.insert(0, str(ROOT / "scripts"))

from lekoy.paths import REASONING                                        # noqa: E402


def main() -> int:
    import train_sft
    argv = sys.argv[1:]
    if not any(a.startswith("--data-dir") for a in argv):
        argv += ["--data-dir", str(REASONING)]
    if not any("training.output_dir" in a for a in argv):
        argv += ["--set", "training.output_dir=checkpoints/rv5/reasoning"]
    if not any(a.startswith("--learning-rate") for a in argv):
        argv += ["--learning-rate", "1e-4"]
    if not any(a.startswith("--notes") for a in argv):
        argv += ["--notes", "LEKOY RV5 reasoning stage"]
    sys.argv = [sys.argv[0]] + argv
    return train_sft.main()


if __name__ == "__main__":
    raise SystemExit(main())
