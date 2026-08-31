"""The prompt sets the faculty is asked to answer.

A distillation corpus is only as good as the questions behind it, and the
questions have to satisfy two constraints that pull against each other:

  * They must cover what RV5 is bad at — Hebrew generation, maths, answering
    under a stated output format. `reports/rv5_training_report.md` names these.
  * They must share nothing with the evaluation suites. RV5's eval items are
    held out, and a distilled corpus is the easiest way in the world to leak
    them back in, because the teacher will happily answer an eval question.

The second constraint is enforced rather than intended: `mixture.py` runs every
generated sample through `data/dedup.find_leakage` against `eval/` before it is
written, and a prompt that collides is dropped and counted.

Code prompts carry their own assertions. That is the whole reason the faculty
is 43% code: a code sample can be *checked* — the function runs or it does not
— so the corpus can be scaled without a human reading it. A Hebrew sample
cannot be checked that way, only sampled and reviewed, which is why the Hebrew
prompt set is small and its verification is consensus plus a language check.
"""
from __future__ import annotations

import json
from dataclasses import dataclass, field
from pathlib import Path
from typing import Iterator


@dataclass
class Prompt:
    """One question for the faculty, and how its answers will be judged."""
    id: str
    role: str                       # code | hebrew | math | multilingual | ...
    language: str                   # hebrew | english | spanish | none
    text: str
    verify: str                     # execute | consensus | language | format
    entry: str | None = None        # for `execute`: the function that must exist
    tests: list[str] = field(default_factory=list)
    answer: str | None = None       # for `consensus`: a known answer, if we have one
    requirement: dict = field(default_factory=dict)   # for `format`
    system: str | None = None

    def messages(self) -> list[dict]:
        out = [{"role": "system", "content": self.system}] if self.system else []
        return out + [{"role": "user", "content": self.text}]


def read_prompts(path: str | Path, limit: int | None = None) -> list[Prompt]:
    """Read a prompt set from JSONL."""
    prompts: list[Prompt] = []
    with Path(path).open(encoding="utf-8") as handle:
        for line in handle:
            line = line.strip()
            if not line or line.startswith("#"):
                continue
            row = json.loads(line)
            prompts.append(Prompt(
                id=row["id"], role=row["role"], language=row.get("language", "none"),
                text=row["text"], verify=row["verify"], entry=row.get("entry"),
                tests=row.get("tests", []), answer=row.get("answer"),
                requirement=row.get("requirement", {}), system=row.get("system")))
            if limit and len(prompts) >= limit:
                break
    return prompts


def write_prompts(prompts: list[Prompt], path: str | Path) -> Path:
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8") as handle:
        for p in prompts:
            row = {"id": p.id, "role": p.role, "language": p.language,
                   "text": p.text, "verify": p.verify}
            if p.entry:
                row["entry"] = p.entry
            if p.tests:
                row["tests"] = p.tests
            if p.answer is not None:
                row["answer"] = p.answer
            if p.requirement:
                row["requirement"] = p.requirement
            if p.system:
                row["system"] = p.system
            handle.write(json.dumps(row, ensure_ascii=False) + "\n")
    return path


# --- The seed prompt set ----------------------------------------------------
#
# Small and hand-written, in the same spirit as `data/seed.py`: enough to run
# the pipeline end to end and to demonstrate each verification path. A real run
# expands it with `scripts/build_prompts.py --from-corpus`, which mines prompts
# from the deduplicated corpus rather than inventing them.

def _code(n: int, text: str, entry: str, tests: list[str]) -> Prompt:
    return Prompt(id=f"gen_code_{n:03d}", role="code", language="english",
                  text=text, verify="execute", entry=entry, tests=tests)


SEED_CODE = [
    _code(1, "Write a Python function `chunk(items, size)` that splits a list "
             "into consecutive chunks of at most `size` elements. Return a list "
             "of lists. Raise ValueError if size < 1.",
          "chunk",
          ["assert chunk([1,2,3,4,5], 2) == [[1,2],[3,4],[5]]",
           "assert chunk([], 3) == []",
           "try:\n    chunk([1], 0)\n    raise SystemExit('no ValueError')\nexcept ValueError:\n    pass"]),
    _code(2, "Write a Python function `normalise_spaces(text)` that collapses "
             "every run of whitespace into a single space and strips the ends.",
          "normalise_spaces",
          ["assert normalise_spaces('  a   b \\n c ') == 'a b c'",
           "assert normalise_spaces('') == ''"]),
    _code(3, "Write a Python function `top_k(counts, k)` taking a dict of "
             "item -> count and returning the k items with the highest counts, "
             "ties broken alphabetically, as a list.",
          "top_k",
          ["assert top_k({'a': 3, 'b': 1, 'c': 3}, 2) == ['a', 'c']",
           "assert top_k({'x': 1}, 5) == ['x']"]),
    _code(4, "כתוב פונקציה בפייתון בשם `sum_digits(n)` שמקבלת מספר שלם ומחזירה "
             "את סכום ספרותיו. עבור מספר שלילי, החזר את סכום הספרות של הערך המוחלט.",
          "sum_digits",
          ["assert sum_digits(1234) == 10", "assert sum_digits(-56) == 11",
           "assert sum_digits(0) == 0"]),
    _code(5, "Escribe una función de Python `es_primo(n)` que devuelva True si "
             "n es primo y False en caso contrario.",
          "es_primo",
          ["assert es_primo(2) is True", "assert es_primo(1) is False",
           "assert es_primo(97) is True", "assert es_primo(91) is False"]),
]

SEED_HEBREW = [
    Prompt(id="gen_he_001", role="hebrew", language="hebrew", verify="language",
           text="הסבר בשלוש שורות מה ההבדל בין 'סמיכות' ל'שייכות' בעברית, עם דוגמה לכל אחת."),
    Prompt(id="gen_he_002", role="hebrew", language="hebrew", verify="language",
           text="כתוב פסקה קצרה בעברית תקנית על היתרונות של תחבורה ציבורית בעיר גדולה."),
    Prompt(id="gen_he_003", role="hebrew", language="hebrew", verify="language",
           text="נסח מחדש את המשפט הבא ברישום פורמלי: 'תשמע, זה ממש לא הסתדר לנו עם הספק הזה'."),
]

SEED_MATH = [
    Prompt(id="gen_math_001", role="math", language="hebrew", verify="consensus",
           text="חולצה עולה 120 שקלים ויש עליה הנחה של 25%. כמה עולה החולצה אחרי ההנחה? "
                "ענה במספר בלבד.", answer="90"),
    Prompt(id="gen_math_002", role="math", language="hebrew", verify="consensus",
           text="רכב נסע 240 קילומטרים בשלוש שעות. מה המהירות הממוצעת בקמ\"ש? ענה במספר בלבד.",
           answer="80"),
]

SEED_FORMAT = [
    Prompt(id="gen_fmt_001", role="multilingual", language="hebrew", verify="format",
           text="מהי בירת ספרד? ענה במילה אחת בלבד.",
           requirement={"max_words": 2}),
    Prompt(id="gen_fmt_002", role="multilingual", language="english", verify="format",
           text="Is the Earth's atmosphere mostly nitrogen? Answer yes or no only.",
           requirement={"one_of": ["yes", "no"]}),
]


def seed_prompts() -> list[Prompt]:
    """Every hand-written prompt, in one list."""
    return [*SEED_CODE, *SEED_HEBREW, *SEED_MATH, *SEED_FORMAT]


def by_role(prompts: list[Prompt], role: str) -> Iterator[Prompt]:
    return (p for p in prompts if p.role == role)
