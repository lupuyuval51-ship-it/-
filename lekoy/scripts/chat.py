#!/usr/bin/env python3
"""Talk to LEKOY RV5 from the terminal.

    python scripts/chat.py                                   # the default checkpoint
    python scripts/chat.py --model checkpoints/rv5/sft
    python scripts/chat.py --temperature 0.2 --language en

Commands inside the session:
    /new /reset      start a new conversation
    /system <text>   replace the system prompt
    /temp <value>    change the sampling temperature
    /tokens          token counts for the conversation so far
    /save <path>     write the conversation to JSON
    /info            what is loaded
    /help  /exit
"""
from __future__ import annotations

import argparse
import json
import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "src"))

from lekoy import FULL_NAME                                              # noqa: E402
from lekoy.config import LekoyConfig                                     # noqa: E402
from lekoy.identity import system_prompt                                 # noqa: E402
from lekoy.inference.engine import GenerationSettings, InferenceEngine   # noqa: E402

DEFAULT_CHECKPOINTS = [
    "checkpoints/rv5/final", "checkpoints/rv5/release_candidate",
    "checkpoints/rv5/preference", "checkpoints/rv5/coding",
    "checkpoints/rv5/reasoning", "checkpoints/rv5/sft",
    "checkpoints/rv5/continued_pretraining",
]

# ANSI, disabled when stdout is not a terminal so piped output stays clean.
class Ink:
    def __init__(self, enabled: bool):
        self.on = enabled

    def __call__(self, code: str, text: str) -> str:
        return f"\033[{code}m{text}\033[0m" if self.on else text

    def dim(self, t): return self("2", t)
    def bold(self, t): return self("1", t)
    def cyan(self, t): return self("36", t)
    def green(self, t): return self("32", t)
    def red(self, t): return self("31", t)


def resolve_model(requested: str | None) -> str:
    """The newest trained checkpoint, or the base model if there is none yet."""
    if requested:
        return requested
    for candidate in DEFAULT_CHECKPOINTS:
        path = ROOT / candidate
        if path.exists() and any(path.iterdir()):
            return str(path)
    return LekoyConfig.load("rv5_small.yaml").model.name


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--model", help="checkpoint, adapter directory or hub id")
    ap.add_argument("--base-model", help="base weights, when --model is a bare adapter")
    ap.add_argument("--config", default="rv5_small.yaml")
    ap.add_argument("--language", default="he", choices=["he", "en", "es"],
                    help="which system prompt to open with")
    ap.add_argument("--system", help="an explicit system prompt, overriding --language")
    ap.add_argument("--temperature", type=float)
    ap.add_argument("--top-p", type=float)
    ap.add_argument("--top-k", type=int)
    ap.add_argument("--max-new-tokens", type=int)
    ap.add_argument("--no-stream", action="store_true")
    ap.add_argument("--no-color", action="store_true")
    ap.add_argument("--prompt", help="answer this one prompt and exit")
    args = ap.parse_args()

    config = LekoyConfig.load(args.config)
    settings = GenerationSettings.from_config(config)
    for name in ("temperature", "top_p", "top_k", "max_new_tokens"):
        value = getattr(args, name)
        if value is not None:
            setattr(settings, name, value)

    ink = Ink(sys.stdout.isatty() and not args.no_color)
    model_path = resolve_model(args.model)
    print(ink.dim(f"loading {model_path} ..."), flush=True)
    try:
        engine = InferenceEngine(model_path, base_model=args.base_model,
                                 dtype=config.model.torch_dtype)
    except Exception as exc:                                   # noqa: BLE001
        print(ink.red(f"could not load {model_path}: {exc}"), file=sys.stderr)
        return 1

    info = engine.info()
    print(ink.bold(f"\n{FULL_NAME}"))
    print(ink.dim(f"  {info.get('parameters', 0) / 1e6:.0f}M parameters · "
                  f"{info.get('backend')} · {info.get('device', 'cpu')} · "
                  f"loaded in {info.get('load_seconds')}s"))
    if info.get("stage"):
        print(ink.dim(f"  stage: {info['stage']} · experiment "
                      f"{info.get('experiment', '?')}"))
    print(ink.dim("  /help for commands, /exit to quit\n"))

    system = args.system or system_prompt(args.language)
    history: list[dict] = []

    def answer(text: str) -> None:
        history.append({"role": "user", "content": text})
        messages = [{"role": "system", "content": system}] + history
        print(ink.green(f"{FULL_NAME}: "), end="", flush=True)
        started = time.time()
        pieces: list[str] = []
        produced = 0
        try:
            if args.no_stream:
                result = engine.generate(messages, settings, add_system=False)
                print(result["text"])
                pieces = [result["text"]]
                produced = result["completion_tokens"]
            else:
                for chunk in engine.stream(messages, settings, add_system=False):
                    if chunk["text"]:
                        print(chunk["text"], end="", flush=True)
                        pieces.append(chunk["text"])
                    produced = chunk.get("completion_tokens", produced)
                print()
        except KeyboardInterrupt:
            print(ink.dim("\n  [interrupted]"))
        elapsed = time.time() - started
        reply = "".join(pieces).strip()
        if reply:
            history.append({"role": "assistant", "content": reply})
        print(ink.dim(f"  {produced} tokens · {elapsed:.1f}s · "
                      f"{produced / elapsed:.1f} tok/s\n" if elapsed else ""))

    if args.prompt:
        answer(args.prompt)
        return 0

    while True:
        try:
            line = input(ink.cyan("you: ")).strip()
        except (EOFError, KeyboardInterrupt):
            print()
            return 0
        if not line:
            continue

        if line.startswith("/"):
            command, _, rest = line.partition(" ")
            command, rest = command.lower(), rest.strip()
            if command in ("/exit", "/quit", "/q"):
                return 0
            if command in ("/new", "/reset", "/clear"):
                history.clear()
                print(ink.dim("  new conversation\n"))
            elif command == "/system":
                if rest:
                    system = rest
                    print(ink.dim("  system prompt replaced\n"))
                else:
                    print(ink.dim(f"  {system}\n"))
            elif command in ("/temp", "/temperature"):
                try:
                    settings.temperature = float(rest)
                    print(ink.dim(f"  temperature = {settings.temperature}\n"))
                except ValueError:
                    print(ink.red(f"  not a number: {rest!r}\n"))
            elif command == "/tokens":
                total = engine.count_tokens(
                    system + "".join(m["content"] for m in history))
                print(ink.dim(f"  {len(history)} turns · ~{total} tokens · "
                              f"context {engine.info().get('context_length')}\n"))
            elif command == "/save":
                target = Path(rest or "conversation.json")
                target.write_text(json.dumps(
                    {"system": system, "messages": history,
                     "model": model_path}, indent=2, ensure_ascii=False),
                    encoding="utf-8")
                print(ink.dim(f"  saved to {target}\n"))
            elif command == "/info":
                print(ink.dim("  " + json.dumps(engine.info(), indent=2,
                                                ensure_ascii=False) + "\n"))
            elif command == "/help":
                print(ink.dim(__doc__.split("Commands inside the session:")[1]))
            else:
                print(ink.red(f"  unknown command {command}; /help for the list\n"))
            continue

        answer(line)


if __name__ == "__main__":
    raise SystemExit(main())
