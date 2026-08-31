"""The dataset registry: what LEKOY RV5 was trained on, and what it was not.

`data/datasets_registry.json` is the audit trail. Every source that reaches
disk gets an entry with its licence, size and measured token count; every
source that is refused gets an entry saying why. A rejection is recorded rather
than skipped silently, because "we considered this corpus and did not use it,
for this reason" is the answer a licence question actually needs.

The token counts here are measured with the selected base model's tokenizer,
not estimated from character counts — Hebrew's characters-per-token ratio is
different enough from English's that a character-based estimate would be wrong
by a factor that matters when planning a training budget.
"""
from __future__ import annotations

import hashlib
import json
from dataclasses import asdict, dataclass, field
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from ..paths import REGISTRY, ROOT


def _now() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


@dataclass
class Entry:
    name: str
    dataset: str
    config: str | None
    split: str
    language: str
    licence: str
    category: str
    status: str                        # included | rejected
    reason: str | None = None
    path: str | None = None
    file_size_bytes: int = 0
    num_documents: int = 0
    num_samples: int = 0
    approx_tokens: int | None = None
    tokenizer: str | None = None
    quality_score: float | None = None
    sha256: str | None = None
    notes: str = ""
    fetched_at: str = field(default_factory=_now)
    stages: dict[str, Any] = field(default_factory=dict)


class Registry:
    """Read-modify-write access to `data/datasets_registry.json`."""

    def __init__(self, path: Path, entries: dict[str, dict]):
        self.path = path
        self.entries = entries

    @classmethod
    def load(cls, path: Path | None = None) -> "Registry":
        path = Path(path or REGISTRY)
        if path.exists():
            payload = json.loads(path.read_text(encoding="utf-8"))
            return cls(path, payload.get("datasets", {}))
        return cls(path, {})

    def save(self) -> None:
        self.path.parent.mkdir(parents=True, exist_ok=True)
        included = [e for e in self.entries.values() if e["status"] == "included"]
        payload = {
            "family": "LEKOY",
            "model": "RV5",
            "updated_at": _now(),
            "summary": {
                "sources_included": len(included),
                "sources_rejected": len(self.entries) - len(included),
                "documents": sum(e.get("num_documents", 0) for e in included),
                "samples": sum(e.get("num_samples", 0) for e in included),
                "approx_tokens": sum(e.get("approx_tokens") or 0 for e in included),
                "by_language": self._sum_by(included, "language"),
                "by_category": self._sum_by(included, "category"),
                "licences": sorted({e["licence"] for e in included}),
            },
            "datasets": self.entries,
        }
        self.path.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n",
                             encoding="utf-8")

    @staticmethod
    def _sum_by(entries: list[dict], key: str) -> dict:
        out: dict[str, dict] = {}
        for e in entries:
            bucket = out.setdefault(e[key], {"documents": 0, "samples": 0, "approx_tokens": 0})
            bucket["documents"] += e.get("num_documents", 0)
            bucket["samples"] += e.get("num_samples", 0)
            bucket["approx_tokens"] += e.get("approx_tokens") or 0
        return out

    # --- writes ------------------------------------------------------------

    def record_raw(self, source, path: Path, records: list[dict]) -> Entry:
        docs = len(records)
        samples = sum(len(r["messages"]) // 2 if "messages" in r else 1 for r in records)
        entry = Entry(
            name=source.name, dataset=source.dataset, config=source.config,
            split=source.split, language=source.language, licence=source.licence,
            category=source.category, status="included",
            path=str(path.relative_to(ROOT)) if path.is_relative_to(ROOT) else str(path),
            file_size_bytes=path.stat().st_size, num_documents=docs,
            num_samples=samples, sha256=file_sha256(path), notes=source.notes)
        self.entries[source.name] = asdict(entry)
        return entry

    def reject(self, source, reason: str) -> None:
        self.entries[source.name] = asdict(Entry(
            name=source.name, dataset=source.dataset, config=source.config,
            split=source.split, language=source.language, licence=source.licence,
            category=source.category, status="rejected", reason=reason,
            notes=source.notes))

    def record_stage(self, name: str, stage: str, **fields) -> None:
        """Attach the outcome of a pipeline stage (clean, filter, dedup, tokenize)."""
        entry = self.entries.get(name)
        if entry is None:
            raise KeyError(f"{name!r} is not in the registry; run download_data.py first")
        entry.setdefault("stages", {})[stage] = {"at": _now(), **fields}

    def set_tokens(self, name: str, tokens: int, tokenizer: str) -> None:
        entry = self.entries.get(name)
        if entry is None:
            raise KeyError(f"{name!r} is not in the registry")
        entry["approx_tokens"] = tokens
        entry["tokenizer"] = tokenizer

    def set_quality(self, name: str, score: float) -> None:
        entry = self.entries.get(name)
        if entry is None:
            raise KeyError(f"{name!r} is not in the registry")
        entry["quality_score"] = round(score, 4)

    # --- reads -------------------------------------------------------------

    def included(self, category: str | None = None, language: str | None = None) -> list[dict]:
        out = [e for e in self.entries.values() if e["status"] == "included"]
        if category:
            out = [e for e in out if e["category"] == category]
        if language:
            out = [e for e in out if e["language"] == language]
        return out

    def licences(self) -> dict[str, list[str]]:
        by: dict[str, list[str]] = {}
        for e in self.included():
            by.setdefault(e["licence"], []).append(e["name"])
        return by


def file_sha256(path: Path, chunk: int = 1 << 20) -> str:
    h = hashlib.sha256()
    with path.open("rb") as fh:
        while block := fh.read(chunk):
            h.update(block)
    return h.hexdigest()
