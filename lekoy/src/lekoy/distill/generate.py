"""Running the faculty: one teacher at a time, over the whole prompt set.

The loop is teacher-major, not prompt-major, and that ordering is the whole
design. Loading a 32B model costs a minute and 60 GB of I/O; loading it once
and asking it 5,000 questions amortises that, while loading it per prompt does
not. So a run is a sequence of passes, each pass one teacher, each pass
independently resumable.

Resumability matters more here than anywhere else in the project. A hundred
teachers over a real prompt set is days of GPU time, and it will be interrupted
— by an OOM on teacher 37, by a spot instance, by a hub outage. Every response
is appended to `data/distill/responses.jsonl` as it is produced, and a restart
reads what is already there and skips it. Nothing is held in memory that would
be lost.

Teachers are never asked to identify themselves, and the LEKOY system prompt is
deliberately *not* used: a teacher's answer to "who are you" is Qwen or Llama,
and that answer must never reach the student. Identity is trained from
`data/seed.py`, by hand, and from nowhere else.
"""
from __future__ import annotations

import json
import time
from dataclasses import dataclass
from pathlib import Path
from typing import Callable, Iterable

from ..paths import DATA
from .prompts import Prompt
from .teachers import Teacher

DISTILL = DATA / "distill"
RESPONSES = DISTILL / "responses.jsonl"

# The teacher is asked to be a good answerer, not to be LEKOY. Nothing in this
# prompt names the project, because a teacher that echoes it would poison the
# identity data the student is separately taught.
TEACHER_SYSTEM = (
    "You are a careful expert assistant. Answer the user's request directly and "
    "completely. If the request states an output format, obey it exactly. "
    "If the request is in Hebrew or Spanish, answer in that same language."
)


@dataclass
class Pass:
    """What one teacher produced, and what it cost."""
    teacher: str
    prompts: int
    produced: int
    skipped: int
    failed: int
    seconds: float
    tokens: int = 0

    @property
    def tokens_per_second(self) -> float:
        return round(self.tokens / self.seconds, 1) if self.seconds else 0.0

    def as_dict(self) -> dict:
        return {"teacher": self.teacher, "prompts": self.prompts,
                "produced": self.produced, "skipped": self.skipped,
                "failed": self.failed, "seconds": round(self.seconds, 1),
                "tokens": self.tokens, "tokens_per_second": self.tokens_per_second}


def completed(path: Path | None = None) -> set[tuple[str, str]]:
    """(teacher, prompt_id) pairs already on disk, so a restart skips them."""
    path = Path(path or RESPONSES)
    if not path.exists():
        return set()
    done: set[tuple[str, str]] = set()
    with path.open(encoding="utf-8") as handle:
        for line in handle:
            line = line.strip()
            if not line:
                continue
            try:
                row = json.loads(line)
            except json.JSONDecodeError:
                # A run killed mid-write leaves one truncated line. Skipping it
                # is correct: the pair simply gets regenerated.
                continue
            done.add((row["teacher"], row["prompt_id"]))
    return done


def run_teacher(teacher: Teacher, prompts: Iterable[Prompt], *,
                out: Path | None = None,
                max_new_tokens: int = 512,
                temperature: float = 0.2,
                dtype: str = "bfloat16",
                device: str | None = None,
                trust_remote_code: bool = False,
                skip: set[tuple[str, str]] | None = None,
                on_response: Callable[[str, str], None] | None = None) -> Pass:
    """Load one teacher, answer every prompt, append each response as it lands.

    Imports of `InferenceEngine` are deferred so that the registry, the planner
    and the tests all work on a host with no torch installed — which is most of
    the places this code is read.
    """
    from ..inference.engine import GenerationSettings, InferenceEngine

    out = Path(out or RESPONSES)
    out.parent.mkdir(parents=True, exist_ok=True)
    skip = skip if skip is not None else completed(out)
    prompts = list(prompts)

    pending = [p for p in prompts if (teacher.id, p.id) not in skip]
    if not pending:
        return Pass(teacher.id, len(prompts), 0, len(prompts), 0, 0.0)

    started = time.time()
    engine = InferenceEngine(teacher.id, dtype=dtype, device=device,
                             trust_remote_code=trust_remote_code)
    settings = GenerationSettings(temperature=temperature,
                                  max_new_tokens=max_new_tokens)

    produced = failed = tokens = 0
    with out.open("a", encoding="utf-8") as handle:
        for prompt in pending:
            messages = [{"role": "system", "content": prompt.system or TEACHER_SYSTEM},
                        {"role": "user", "content": prompt.text}]
            try:
                result = engine.generate(messages, settings, add_system=False)
            except Exception as exc:                      # noqa: BLE001
                # One teacher failing one prompt must not end the pass. The
                # failure is recorded so the report can say which teacher is
                # unreliable rather than showing a silently shorter corpus.
                failed += 1
                handle.write(json.dumps(
                    {"teacher": teacher.id, "prompt_id": prompt.id, "role": prompt.role,
                     "error": f"{type(exc).__name__}: {exc}"[:300]},
                    ensure_ascii=False) + "\n")
                handle.flush()
                continue

            tokens += result.get("completion_tokens", 0)
            produced += 1
            handle.write(json.dumps(
                {"teacher": teacher.id, "prompt_id": prompt.id, "role": prompt.role,
                 "language": prompt.language, "verify": prompt.verify,
                 "response": result["text"],
                 "completion_tokens": result.get("completion_tokens", 0),
                 "finish_reason": result.get("finish_reason", "stop")},
                ensure_ascii=False) + "\n")
            handle.flush()
            if on_response:
                on_response(prompt.id, result["text"])

    return Pass(teacher.id, len(prompts), produced, len(prompts) - len(pending),
                failed, time.time() - started, tokens)


def load_responses(path: Path | None = None) -> dict[str, dict[str, str]]:
    """Everything generated so far, as {prompt_id: {teacher: response}}."""
    path = Path(path or RESPONSES)
    out: dict[str, dict[str, str]] = {}
    if not path.exists():
        return out
    with path.open(encoding="utf-8") as handle:
        for line in handle:
            line = line.strip()
            if not line:
                continue
            try:
                row = json.loads(line)
            except json.JSONDecodeError:
                continue
            if "error" in row:
                continue
            out.setdefault(row["prompt_id"], {})[row["teacher"]] = row["response"]
    return out
