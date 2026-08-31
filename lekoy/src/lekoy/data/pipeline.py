"""The corpus pipeline: raw -> cleaned -> filtered -> deduplicated -> splits.

Each stage reads JSONL and writes JSONL, and each writes a sidecar `.stats.json`
saying what it did and why. That shape is deliberate. A pipeline that reports
only "kept 61%" is unusable when the number looks wrong, because the next
question is always which signal fired — so every stage keeps a histogram of
rejection reasons and a handful of worked examples of what it threw away.

Stages are resumable and idempotent: a stage whose output is newer than its
input is skipped unless `--force` is passed, so a failure in stage four does
not cost the three hours of stages one through three.
"""
from __future__ import annotations

import json
from collections import Counter
from dataclasses import dataclass, field
from pathlib import Path
from typing import Callable, Iterator

from . import dedup as dedup_mod
from .clean import clean_document
from .langid import detect
from .pii import redact
from .quality import score_conversation, score_document


def read_jsonl(path: Path) -> Iterator[dict]:
    with path.open(encoding="utf-8") as fh:
        for line_no, line in enumerate(fh, 1):
            line = line.strip()
            if not line:
                continue
            try:
                yield json.loads(line)
            except json.JSONDecodeError as exc:
                raise ValueError(f"{path}:{line_no}: invalid JSON — {exc}") from exc


def write_jsonl(path: Path, records: list[dict]) -> int:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8") as fh:
        for record in records:
            fh.write(json.dumps(record, ensure_ascii=False) + "\n")
    return len(records)


def text_of(record: dict) -> str:
    """The trainable text of a record, whatever shape it arrived in."""
    if "text" in record:
        return record["text"] or ""
    if "messages" in record:
        return "\n\n".join(m.get("content", "") for m in record["messages"])
    return ""


@dataclass
class StageStats:
    stage: str
    source: str
    seen: int = 0
    kept: int = 0
    reasons: Counter = field(default_factory=Counter)
    examples: list[dict] = field(default_factory=list)
    extra: dict = field(default_factory=dict)

    def drop(self, reason: str, record: dict, detail: str = "") -> None:
        self.reasons[reason] += 1
        if len(self.examples) < 8:
            self.examples.append({
                "reason": reason, "detail": detail,
                "preview": text_of(record)[:180],
                "source": record.get("source"),
            })

    def as_dict(self) -> dict:
        return {
            "stage": self.stage, "source": self.source,
            "seen": self.seen, "kept": self.kept,
            "dropped": self.seen - self.kept,
            "kept_fraction": round(self.kept / self.seen, 4) if self.seen else 0.0,
            "reasons": dict(self.reasons.most_common()),
            "examples": self.examples,
            **self.extra,
        }

    def save(self, path: Path) -> None:
        path.with_suffix(".stats.json").write_text(
            json.dumps(self.as_dict(), indent=2, ensure_ascii=False), encoding="utf-8")


# --- Stage 1: clean --------------------------------------------------------

def clean_stage(records: Iterator[dict], source: str, *,
                redact_pii: bool = True) -> tuple[list[dict], StageStats]:
    stats = StageStats("clean", source)
    pii_counts: Counter = Counter()
    out: list[dict] = []

    for record in records:
        stats.seen += 1
        if "messages" in record:
            messages = []
            broken = False
            for turn in record["messages"]:
                cleaned = clean_document(turn.get("content", ""),
                                         boilerplate=False, navigation=False)
                content = cleaned["text"]
                if redact_pii:
                    content, report = redact(content)
                    pii_counts.update(report.counts)
                if not content.strip():
                    broken = True
                    break
                messages.append({"role": turn["role"], "content": content})
            if broken:
                stats.drop("empty turn after cleaning", record)
                continue
            record = {**record, "messages": messages}
        else:
            cleaned = clean_document(record.get("text", ""))
            text = cleaned["text"]
            if redact_pii:
                text, report = redact(text)
                pii_counts.update(report.counts)
            if not text.strip():
                stats.drop("empty after cleaning", record)
                continue
            record = {**record, "text": text,
                      "clean": {k: v for k, v in cleaned.items() if k != "text"}}
        out.append(record)
        stats.kept += 1

    stats.extra["pii_redacted"] = dict(pii_counts)
    return out, stats


# --- Stage 2: quality filter ----------------------------------------------

# Minimum document length, by what the data is for. Prose from a web crawl
# below 200 characters is almost always navigation chrome; a benchmark question
# below 200 characters is just a question.
MIN_CHARS_BY_CATEGORY = {
    "pretrain": 200,
    "instruction": 24,
    "reasoning": 24,
    "coding": 24,
    "preference": 24,
    "evaluation": 1,
}


def filter_stage(records: Iterator[dict], source: str, *,
                 min_score: float = 0.5,
                 check_language: bool = True) -> tuple[list[dict], StageStats]:
    stats = StageStats("filter", source)
    languages: Counter = Counter()
    scores: list[float] = []
    out: list[dict] = []

    for record in records:
        stats.seen += 1
        # A record can opt out of the language check — cross-lingual seed data
        # answers in a different language on purpose.
        expected = record.get("language") if check_language else None
        if expected in ("multi", "code") or record.get("language_check") is False:
            expected = None

        category = record.get("category", "pretrain")
        min_chars = MIN_CHARS_BY_CATEGORY.get(category, 200)
        if "messages" in record:
            report = score_conversation(record["messages"], expected)
        else:
            report = score_document(record.get("text", ""), expected,
                                    min_chars=min_chars)
        # Evaluation sets are benchmark data, not training data. They are
        # carried through the pipeline so that leakage checking and tokenizer
        # analysis can see them, but discarding a benchmark item because it
        # scored poorly as prose would silently change what the benchmark
        # measures.
        if category == "evaluation":
            out.append({**record, "quality_score": report.score,
                        "quality_signals": report.signals})
            stats.kept += 1
            scores.append(report.score)
            continue

        code, _ = detect(text_of(record))
        languages[code.split(":")[0] if code.startswith("other") else code] += 1

        if report.score < min_score:
            reason = report.reasons[0] if report.reasons else f"score {report.score:.2f}"
            stats.drop(reason, record, f"score={report.score}")
            continue
        scores.append(report.score)
        out.append({**record, "quality_score": report.score,
                    "quality_signals": report.signals})
        stats.kept += 1

    stats.extra["detected_languages"] = dict(languages.most_common())
    stats.extra["mean_quality_score"] = (
        round(sum(scores) / len(scores), 4) if scores else None)
    return out, stats


# --- Stage 3: deduplicate --------------------------------------------------

def dedup_stage(records: list[dict], source: str, *, near: bool = True,
                threshold: float = 0.6) -> tuple[list[dict], StageStats]:
    stats = StageStats("dedup", source)
    stats.seen = len(records)

    # Evaluation sets pass through untouched. Belebele asks four questions
    # about each passage, so the passage text repeats by design — deduplicating
    # it deleted 412 of 900 English items and would have silently changed what
    # the benchmark measures.
    if records and records[0].get("category") == "evaluation":
        stats.kept = len(records)
        stats.extra["skipped"] = ("evaluation set: repeated passages are part "
                                  "of the benchmark's design")
        return list(records), stats

    keys = [(i, text_of(r)) for i, r in enumerate(records)]
    keep, dedup_stats = dedup_mod.deduplicate(keys, near=near, threshold=threshold)
    out = [records[i] for i in keep]
    stats.kept = len(out)
    stats.reasons["exact duplicate"] = dedup_stats.exact_duplicates
    stats.reasons["normalised duplicate"] = dedup_stats.normalised_duplicates
    stats.reasons["near duplicate"] = dedup_stats.near_duplicates
    stats.examples = dedup_stats.examples
    return out, stats


# --- Stage 4: split --------------------------------------------------------

def split_records(records: list[dict], *, validation: float = 0.02,
                  test: float = 0.02, seed: int = 20250901
                  ) -> dict[str, list[dict]]:
    """Deterministic train/validation/test split.

    Assignment is by a hash of the document text, not by shuffling. That makes
    the split stable when the corpus grows: adding a source does not silently
    move existing documents from train to test, which would invalidate every
    previously reported number.
    """
    import hashlib

    out: dict[str, list[dict]] = {"train": [], "validation": [], "test": []}
    for record in records:
        digest = hashlib.blake2b(
            f"{seed}:{text_of(record)}".encode("utf-8"), digest_size=8).digest()
        position = int.from_bytes(digest, "big") / float(1 << 64)
        if position < test:
            out["test"].append(record)
        elif position < test + validation:
            out["validation"].append(record)
        else:
            out["train"].append(record)
    return out


# --- Integrity -------------------------------------------------------------

def check_integrity(records: list[dict], *, max_chars: int = 200_000
                    ) -> tuple[list[dict], dict]:
    """Structural problems that would break tokenization or training.

    Run last, on the data that is about to be tokenized, because the earlier
    stages can introduce their own problems — a cleaner that empties a turn is
    exactly the kind of bug this catches.
    """
    problems: Counter = Counter()
    examples: list[dict] = []
    good: list[dict] = []

    def note(kind: str, record: dict) -> None:
        problems[kind] += 1
        if len(examples) < 8:
            examples.append({"problem": kind, "preview": text_of(record)[:160],
                             "source": record.get("source")})

    for record in records:
        text = text_of(record)
        if not text.strip():
            note("empty record", record)
            continue
        if len(text) > max_chars:
            note("extremely long record", record)
            continue
        if "\x00" in text:
            note("null byte", record)
            continue
        if "messages" in record:
            messages = record["messages"]
            if not isinstance(messages, list) or not messages:
                note("malformed messages", record)
                continue
            roles = [m.get("role") for m in messages]
            if any(r not in ("system", "user", "assistant") for r in roles):
                note("unknown role", record)
                continue
            if roles[-1] != "assistant":
                note("conversation does not end on an assistant turn", record)
                continue
            if any(not (m.get("content") or "").strip() for m in messages):
                note("empty turn", record)
                continue
        good.append(record)

    return good, {"checked": len(records), "ok": len(good),
                  "problems": dict(problems.most_common()), "examples": examples}


def run_stages(records: Iterator[dict], source: str, stages: list[Callable],
               ) -> tuple[list[dict], list[StageStats]]:
    data = list(records)
    all_stats: list[StageStats] = []
    for stage in stages:
        data, stats = stage(data, source)
        all_stats.append(stats)
        if not data:
            break
    return data, all_stats
