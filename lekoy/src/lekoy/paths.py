"""One place that knows where things live, so no module guesses."""
from __future__ import annotations

from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]

CONFIGS = ROOT / "configs"
DATA = ROOT / "data"
DOCS = ROOT / "docs"
EVAL = ROOT / "eval"
CHECKPOINTS = ROOT / "checkpoints"
EXPERIMENTS = ROOT / "experiments"
REPORTS = ROOT / "reports"
SCRIPTS = ROOT / "scripts"
WEB = ROOT / "src" / "lekoy" / "web"

RAW = DATA / "raw"
CLEANED = DATA / "cleaned"
FILTERED = DATA / "filtered"
DEDUPLICATED = DATA / "deduplicated"
INSTRUCTION = DATA / "instruction"
REASONING = DATA / "reasoning"
CODING = DATA / "coding"
PREFERENCE = DATA / "preference"
TOKENIZED = DATA / "tokenized"

REGISTRY = DATA / "datasets_registry.json"

LANGUAGES = ("hebrew", "english", "spanish")
LANG_CODES = {"hebrew": "he", "english": "en", "spanish": "es"}
CODE_TO_LANG = {v: k for k, v in LANG_CODES.items()}


def ensure(*paths: Path) -> None:
    for p in paths:
        p.mkdir(parents=True, exist_ok=True)
