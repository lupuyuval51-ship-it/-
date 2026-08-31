#!/usr/bin/env python3
"""Serve LEKOY RV5 over a local OpenAI-compatible API, with the web chat.

    python scripts/serve.py
    python scripts/serve.py --model checkpoints/rv5/sft --port 8080
    python scripts/serve.py --host 0.0.0.0            # reachable off this machine

Then:
    http://localhost:8000/app        the web chat
    http://localhost:8000/docs       the generated API reference
    http://localhost:8000/health

Inference is local. The OpenAI-shaped schema exists so existing clients work;
nothing is forwarded to OpenAI or to any other provider.
"""
from __future__ import annotations

import argparse
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "src"))

from lekoy import FULL_NAME                                              # noqa: E402
from lekoy.config import LekoyConfig                                     # noqa: E402
from lekoy.paths import WEB                                              # noqa: E402


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--model", help="checkpoint, adapter directory or hub id")
    ap.add_argument("--base-model")
    ap.add_argument("--config", default="rv5_small.yaml")
    ap.add_argument("--host", default="127.0.0.1")
    ap.add_argument("--port", type=int, default=8000)
    ap.add_argument("--max-tokens", type=int, default=1024)
    ap.add_argument("--cors-origin", action="append", dest="cors_origins")
    ap.add_argument("--no-web", action="store_true", help="API only")
    ap.add_argument("--reload", action="store_true")
    args = ap.parse_args()

    import uvicorn

    sys.path.insert(0, str(ROOT / "scripts"))
    from chat import resolve_model

    from lekoy.api.server import create_app
    from lekoy.inference.engine import InferenceEngine

    config = LekoyConfig.load(args.config)
    model_path = resolve_model(args.model)
    print(f"loading {model_path} ...")
    engine = InferenceEngine(model_path, base_model=args.base_model,
                             dtype=config.model.torch_dtype)
    info = engine.info()
    print(f"\n{FULL_NAME} · {info.get('parameters', 0) / 1e6:.0f}M parameters · "
          f"{info.get('backend')} on {info.get('device')}")

    app = create_app(engine, default_max_tokens=args.max_tokens,
                     allow_origins=args.cors_origins,
                     web_dir=None if args.no_web else WEB)

    base = f"http://{'localhost' if args.host in ('127.0.0.1', '0.0.0.0') else args.host}:{args.port}"
    if not args.no_web:
        print(f"  web chat   {base}/app")
    print(f"  api docs   {base}/docs")
    print(f"  health     {base}/health")
    print(f"  chat       POST {base}/v1/chat/completions\n")
    uvicorn.run(app, host=args.host, port=args.port, log_level="info")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
