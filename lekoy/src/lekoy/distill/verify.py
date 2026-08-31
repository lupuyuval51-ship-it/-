"""Deciding whether a teacher's answer is worth training on.

This is the part that makes a hundred teachers better than one, and it is not
averaging. Averaging a hundred models gives you the average model. What a bench
of teachers actually provides is **disagreement**, and disagreement is a
measurement: when nine code teachers pass an item's assertions and one fails,
the nine are right and the item is easy; when all ten fail, the item is beyond
the faculty and belongs in the report rather than in the corpus.

Four verifiers, in descending order of how much they can be trusted:

  `execute`   — run the code against assertions. A pass is a fact.
  `consensus` — n teachers, independently, produced the same answer. Strong for
                maths, where answers are comparable; useless for prose.
  `language`  — the response is actually in the language it was asked for, and
                is not the Latin-script-inside-Hebrew soup that RV5 currently
                produces (`עבודה היא דרך לitura`). A necessary condition, not a
                sufficient one.
  `format`    — the response obeys the stated output constraint. This is the
                exact capability RV5's v4 checkpoint lost, and the reason
                `global_mmlu_hebrew` scored 0.053, below the 0.25 chance floor.

Nothing here trusts a teacher because it is large or popular. A 480B model's
FizzBuzz still has to pass FizzBuzz.
"""
from __future__ import annotations

import re
import subprocess
import sys
import tempfile
from collections import Counter
from dataclasses import dataclass, field
from pathlib import Path

from ..data import langid
from ..evaluation import metrics
from ..evaluation.runner import extract_code
from .prompts import Prompt

# Hebrew that has Latin letters welded into the middle of a word — the
# signature failure in RV5's own eval responses. A teacher that does this is
# not producing Hebrew training data, whatever the script ratio says.
_LATIN_IN_HEBREW_WORD = re.compile(r"[֐-׿][A-Za-z]|[A-Za-z][֐-׿]")

# A refusal is a valid model response and a worthless training sample.
_REFUSALS = (
    "i cannot", "i can't", "i'm sorry", "i am sorry", "as an ai",
    "לא אוכל", "אני מצטער", "כמודל שפה", "no puedo", "lo siento",
)


@dataclass
class Judgement:
    """What happened when one response was checked."""
    ok: bool
    method: str
    detail: str
    score: float = 0.0

    def as_dict(self) -> dict:
        return {"ok": self.ok, "method": self.method, "detail": self.detail,
                "score": round(self.score, 4)}


@dataclass
class ItemOutcome:
    """Every teacher's answer to one prompt, and which of them survived."""
    prompt_id: str
    accepted: list[dict] = field(default_factory=list)
    rejected: list[dict] = field(default_factory=list)
    agreement: float = 0.0
    note: str = ""

    @property
    def solved(self) -> bool:
        return bool(self.accepted)


def looks_like_refusal(text: str) -> bool:
    lowered = text.strip().lower()[:120]
    return any(marker in lowered for marker in _REFUSALS)


def hebrew_is_clean(text: str) -> tuple[bool, str]:
    """Reject the specific way RV5 currently breaks Hebrew.

    Script ratio alone passes `עבודה היא דרך לitura וליצירת אמנות` — most of it
    is Hebrew. What condemns it is a Latin run welded inside a Hebrew word, so
    that is checked directly rather than inferred from a ratio.
    """
    hits = _LATIN_IN_HEBREW_WORD.findall(text)
    if hits:
        return False, f"latin letters inside a Hebrew word ({len(hits)} place(s))"
    profile = langid.script_profile(text)
    for script in ("arabic", "cyrillic", "devanagari"):
        if profile.get(script, 0.0) > 0.02:
            return False, f"{profile[script]:.0%} {script} script in a Hebrew response"
    return True, "clean"


def verify_execute(response: str, prompt: Prompt, timeout: int = 10) -> Judgement:
    """Run the generated function against the prompt's assertions."""
    code = extract_code(response)
    if not code.strip():
        return Judgement(False, "execute", "no code in the response")
    if prompt.entry and f"def {prompt.entry}" not in code:
        return Judgement(False, "execute", f"does not define {prompt.entry}()")

    harness = code + "\n\n" + "\n".join(prompt.tests) + "\nprint('PASS')\n"
    with tempfile.TemporaryDirectory() as tmp:
        script = Path(tmp) / "candidate.py"
        script.write_text(harness, encoding="utf-8")
        try:
            proc = subprocess.run([sys.executable, "-I", str(script)],
                                  capture_output=True, text=True,
                                  timeout=timeout, cwd=tmp)
        except subprocess.TimeoutExpired:
            return Judgement(False, "execute", f"timed out after {timeout}s")
        except OSError as exc:
            return Judgement(False, "execute", f"could not run: {exc}")

    if proc.returncode == 0 and "PASS" in proc.stdout:
        return Judgement(True, "execute", "all assertions passed", 1.0)
    error = (proc.stderr or proc.stdout or "").strip().splitlines()
    return Judgement(False, "execute",
                     error[-1][:160] if error else f"exit code {proc.returncode}")


def verify_language(response: str, prompt: Prompt) -> Judgement:
    """The response is in the language asked for, and is not script soup."""
    if looks_like_refusal(response):
        return Judgement(False, "language", "the teacher refused the prompt")
    if len(response.strip()) < 20:
        return Judgement(False, "language", "too short to be a training sample")
    if prompt.language == "hebrew":
        clean, why = hebrew_is_clean(response)
        if not clean:
            return Judgement(False, "language", why)
    score = metrics.language_match(response, prompt.language)
    if score < 1.0:
        detected, confidence = langid.detect(response)
        return Judgement(False, "language",
                         f"asked for {prompt.language}, got {detected} ({confidence:.2f})")
    return Judgement(True, "language", f"is {prompt.language}", score)


def verify_format(response: str, prompt: Prompt) -> Judgement:
    """The response obeys the output constraint the prompt stated."""
    if prompt.requirement:
        score, failures = metrics.format_compliance(response, prompt.requirement)
        if failures:
            return Judgement(False, "format", "; ".join(failures)[:160], score)
        return Judgement(True, "format", "meets the stated constraint", score)
    return Judgement(bool(response.strip()), "format", "no constraint declared")


def _answer_key(response: str, prompt: Prompt) -> str | None:
    """The comparable part of a response, for consensus.

    Maths answers compare as numbers; anything else compares as its normalised
    text. A teacher that wraps the right number in three paragraphs still
    agrees with one that emitted the bare number, which is the point.
    """
    if prompt.role == "math" or prompt.verify == "consensus":
        value = metrics.extract_number(response)
        if value is not None:
            return f"{value:.6g}"
    normalised = metrics.normalise_answer(response)
    return normalised or None


def verify_consensus(responses: dict[str, str], prompt: Prompt,
                     quorum: int = 3, majority: float = 0.6) -> ItemOutcome:
    """Accept the answer the faculty agrees on, if enough of them agree.

    `quorum` is the number of teachers that must have answered at all before
    agreement means anything: two models agreeing is a coincidence. `majority`
    is the share of answering teachers that must land on the same value.

    When the prompt has a known answer, agreement is checked against it as well
    — a faculty can agree and be wrong, and this is the only place we can catch
    that without a human.
    """
    outcome = ItemOutcome(prompt_id=prompt.id)
    keyed = {t: _answer_key(r, prompt) for t, r in responses.items()}
    answered = {t: k for t, k in keyed.items() if k is not None}

    if len(answered) < quorum:
        outcome.note = (f"only {len(answered)} of {len(responses)} teachers produced "
                        f"a comparable answer; quorum is {quorum}")
        outcome.rejected = [{"teacher": t, "response": responses[t],
                             "judgement": Judgement(False, "consensus",
                                                    outcome.note).as_dict()}
                            for t in responses]
        return outcome

    counts = Counter(answered.values())
    winner, votes = counts.most_common(1)[0]
    outcome.agreement = votes / len(answered)

    if outcome.agreement < majority:
        outcome.note = (f"no majority: best answer {winner!r} held by "
                        f"{votes}/{len(answered)} teachers")
    elif prompt.answer is not None:
        expected = _answer_key(prompt.answer, prompt)
        if expected is not None and winner != expected:
            outcome.note = (f"the faculty agreed on {winner!r}, which is wrong; "
                            f"the answer is {expected!r}")
            outcome.rejected = [{"teacher": t, "response": responses[t],
                                 "judgement": Judgement(False, "consensus",
                                                        outcome.note).as_dict()}
                                for t in responses]
            return outcome

    for teacher, response in responses.items():
        agreed = keyed.get(teacher) == winner and outcome.agreement >= majority
        judgement = Judgement(
            agreed, "consensus",
            (f"agrees with {votes}/{len(answered)} of the faculty"
             if agreed else outcome.note or f"answered {keyed.get(teacher)!r}, "
                                            f"faculty says {winner!r}"),
            outcome.agreement)
        record = {"teacher": teacher, "response": response,
                  "judgement": judgement.as_dict()}
        (outcome.accepted if agreed else outcome.rejected).append(record)
    return outcome


def verify_item(responses: dict[str, str], prompt: Prompt,
                quorum: int = 3, majority: float = 0.6) -> ItemOutcome:
    """Check every teacher's answer to one prompt by that prompt's own method."""
    if prompt.verify == "consensus":
        return verify_consensus(responses, prompt, quorum, majority)

    check = {"execute": verify_execute,
             "language": verify_language,
             "format": verify_format}[prompt.verify]

    outcome = ItemOutcome(prompt_id=prompt.id)
    for teacher, response in responses.items():
        judgement = check(response, prompt)
        record = {"teacher": teacher, "response": response,
                  "judgement": judgement.as_dict()}
        (outcome.accepted if judgement.ok else outcome.rejected).append(record)
    if responses:
        outcome.agreement = len(outcome.accepted) / len(responses)
    if not outcome.accepted:
        outcome.note = ("no teacher produced an acceptable answer — the item is "
                        "beyond this faculty, or the prompt is broken")
    return outcome


def difficulty(outcome: ItemOutcome) -> str:
    """What the spread of teacher answers says about the item itself.

    A prompt every teacher solves teaches the student very little that a
    smaller corpus would not. A prompt none of them solves teaches it nothing
    at all. The useful band is in between, and this labels it so the mixture
    can be weighted rather than merely filtered.
    """
    if not outcome.accepted:
        return "unsolved"
    if outcome.agreement >= 0.95:
        return "trivial"
    if outcome.agreement >= 0.5:
        return "moderate"
    return "hard"
