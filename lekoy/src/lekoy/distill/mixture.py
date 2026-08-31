"""Turning verified teacher responses into a corpus the trainer can read.

Three things happen here, and the order matters.

**One sample per prompt, not one per teacher.** Forty code teachers answering
the same question correctly is one training sample, not forty — writing all
forty would teach the student that this particular function is forty times more
important than everything else in the corpus. The best accepted answer wins and
the rest are counted, not kept.

**Deduplication, then leakage.** Generated corpora repeat themselves far more
than scraped ones do: ask a hundred teachers to reverse a string and you get a
hundred near-identical functions. The existing MinHash/LSH machinery from
`data/dedup.py` handles that. Leakage against `eval/` is checked afterwards and
separately, because a distilled corpus is the easiest way in the world to leak
an evaluation set back into training — the teacher will cheerfully answer an
eval question, and the answer will look like excellent training data.

**Provenance travels with the sample.** Every record carries the teacher that
produced it, the verification that accepted it, and the difficulty band. When
the next evaluation moves, "which teacher wrote the data behind this dimension"
is a query, not an investigation.
"""
from __future__ import annotations

import json
from collections import Counter
from dataclasses import dataclass, field
from pathlib import Path

from ..data import dedup
from ..paths import EVAL, LANGUAGES
from .generate import load_responses
from .prompts import Prompt
from .verify import ItemOutcome, difficulty, verify_item

# A generated sample this close to an evaluation item is treated as the
# evaluation item. The threshold matches the one the data pipeline already
# uses for leakage, so the two stages cannot disagree about what a collision is.
LEAKAGE_THRESHOLD = 0.6


@dataclass
class MixtureStats:
    """What the build kept and what it threw away, by reason."""
    prompts: int = 0
    responses: int = 0
    solved: int = 0
    unsolved: int = 0
    written: int = 0
    duplicates: int = 0
    leaked: int = 0
    by_role: Counter = field(default_factory=Counter)
    by_language: Counter = field(default_factory=Counter)
    by_teacher: Counter = field(default_factory=Counter)
    by_difficulty: Counter = field(default_factory=Counter)
    rejections: Counter = field(default_factory=Counter)

    def as_dict(self) -> dict:
        return {
            "prompts": self.prompts, "responses": self.responses,
            "solved": self.solved, "unsolved": self.unsolved,
            "written": self.written, "duplicates_removed": self.duplicates,
            "leaked_removed": self.leaked,
            "by_role": dict(self.by_role.most_common()),
            "by_language": dict(self.by_language.most_common()),
            "by_teacher": dict(self.by_teacher.most_common()),
            "by_difficulty": dict(self.by_difficulty.most_common()),
            "rejection_reasons": dict(self.rejections.most_common(25)),
        }


def _best(outcome: ItemOutcome) -> dict | None:
    """The answer to keep out of everything the faculty accepted.

    Shortest wins among equally-verified answers. That is not an aesthetic
    preference: RV5's v4 checkpoint failed because its SFT corpus taught it
    that answers are long restatements of the question, and the shortest
    correct answer is the one least likely to carry that habit.
    """
    if not outcome.accepted:
        return None
    return min(outcome.accepted, key=lambda r: len(r["response"]))


def _eval_texts(eval_dir: Path | None = None) -> list[tuple[int, str]]:
    """Every evaluation item, as text, for the leakage check."""
    eval_dir = Path(eval_dir or EVAL)
    texts: list[tuple[int, str]] = []
    if not eval_dir.exists():
        return texts
    for path in sorted(eval_dir.rglob("*.jsonl")):
        with path.open(encoding="utf-8") as handle:
            for line in handle:
                line = line.strip()
                if not line:
                    continue
                try:
                    row = json.loads(line)
                except json.JSONDecodeError:
                    continue
                parts = [str(row.get(k, "")) for k in
                         ("question", "prompt", "text", "answer", "instruction")]
                joined = " ".join(p for p in parts if p).strip()
                if joined:
                    texts.append((len(texts), joined))
    return texts


def build(prompts: list[Prompt], *, responses_path: Path | None = None,
          eval_dir: Path | None = None, quorum: int = 3,
          majority: float = 0.6, drop_trivial: bool = False
          ) -> tuple[list[dict], MixtureStats, list[ItemOutcome]]:
    """Verify every response, keep one sample per prompt, dedup, check leakage."""
    responses = load_responses(responses_path)
    stats = MixtureStats(prompts=len(prompts))
    records: list[dict] = []
    outcomes: list[ItemOutcome] = []

    for prompt in prompts:
        answers = responses.get(prompt.id, {})
        stats.responses += len(answers)
        if not answers:
            stats.unsolved += 1
            continue

        outcome = verify_item(answers, prompt, quorum=quorum, majority=majority)
        outcomes.append(outcome)
        for rejected in outcome.rejected:
            stats.rejections[rejected["judgement"]["detail"][:80]] += 1

        if not outcome.solved:
            stats.unsolved += 1
            continue
        stats.solved += 1

        band = difficulty(outcome)
        stats.by_difficulty[band] += 1
        if drop_trivial and band == "trivial":
            continue

        best = _best(outcome)
        records.append({
            "messages": [{"role": "user", "content": prompt.text},
                         {"role": "assistant", "content": best["response"]}],
            "source": "distill",
            "prompt_id": prompt.id,
            "language": prompt.language,
            "category": prompt.role,
            "teacher": best["teacher"],
            "verified_by": best["judgement"]["method"],
            "agreement": round(outcome.agreement, 3),
            "difficulty": band,
            "teachers_asked": len(answers),
            "teachers_accepted": len(outcome.accepted),
        })

    records = _dedup(records, stats)
    records = _drop_leakage(records, stats, eval_dir)

    for record in records:
        stats.by_role[record["category"]] += 1
        stats.by_language[record["language"]] += 1
        stats.by_teacher[record["teacher"]] += 1
    stats.written = len(records)
    return records, stats, outcomes


def _dedup(records: list[dict], stats: MixtureStats) -> list[dict]:
    """Drop near-identical samples. A hundred teachers repeat themselves."""
    if len(records) < 2:
        return records
    documents = [(i, r["messages"][-1]["content"]) for i, r in enumerate(records)]
    keep, _ = dedup.deduplicate(documents, near=True)
    kept = set(keep)
    stats.duplicates = len(records) - len(kept)
    return [r for i, r in enumerate(records) if i in kept]


def _drop_leakage(records: list[dict], stats: MixtureStats,
                  eval_dir: Path | None) -> list[dict]:
    """Refuse any generated sample that collides with an evaluation item."""
    evaluation = _eval_texts(eval_dir)
    if not evaluation or not records:
        return records
    train = [(i, r["messages"][0]["content"] + " " + r["messages"][-1]["content"])
             for i, r in enumerate(records)]
    hits = dedup.find_leakage(train, evaluation, threshold=LEAKAGE_THRESHOLD)
    leaked = {hit["train_key"] for hit in hits}
    stats.leaked = len(leaked)
    return [r for i, r in enumerate(records) if i not in leaked]


def language_mix(records: list[dict]) -> dict[str, float]:
    """The realised language mixture, to compare against the configured one."""
    counts = Counter(r["language"] for r in records if r["language"] in LANGUAGES)
    total = sum(counts.values())
    return {lang: round(counts.get(lang, 0) / total, 4) for lang in LANGUAGES} if total \
        else {lang: 0.0 for lang in LANGUAGES}


def write(records: list[dict], path: str | Path) -> Path:
    """Write the corpus in the same JSONL shape `training/dataset.py` reads."""
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8") as handle:
        for record in records:
            handle.write(json.dumps(record, ensure_ascii=False) + "\n")
    return path
