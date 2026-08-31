"""A small, balanced sample of the real corpus, for measuring tokenizers.

Tokenizer fertility is a property of text, so it has to be measured on the text
LEKOY RV5 will actually see — not on a handful of sentences chosen to make a
point. This builds a fixed, seeded sample from `data/raw/`, so every candidate
tokenizer is measured on byte-identical input and a re-run reproduces the
numbers in `reports/tokenizer_report.md`.
"""
from __future__ import annotations

import json
import random
import re
from pathlib import Path

from ..paths import RAW

# Sources sampled per language, and how much of each. Web text, encyclopaedic
# text and instruction text tokenize differently; a probe drawn from only one
# of them would measure that register rather than the language.
PROBE_MIX = {
    "hebrew": [("hplt2_hebrew", 400), ("fineweb2_hebrew", 400),
               ("wikipedia_hebrew", 400), ("xp3x_hebrew", 300)],
    "english": [("wikipedia_english", 500), ("ultrachat_english", 300),
                ("aya_english", 300), ("gsm8k", 200)],
    "spanish": [("wikipedia_spanish", 500), ("hplt2_spanish", 500),
                ("aya_spanish", 300)],
}

MAX_CHARS = 4000    # per document, so one long article cannot dominate
MIN_CHARS = 120
SEED = 20250901


def _text_of(record: dict) -> str | None:
    if "text" in record:
        return record["text"]
    if "messages" in record:
        return "\n\n".join(m["content"] for m in record["messages"])
    return None


def _load(name: str, language: str, count: int, rng: random.Random) -> list[str]:
    path = RAW / language / f"{name}.jsonl"
    if not path.exists():
        path = RAW / f"{name}.jsonl"
    if not path.exists():
        return []
    # Reservoir sample, so the probe is not just the head of the file — the
    # first thousand rows of a crawl shard are correlated in ways the corpus
    # as a whole is not.
    reservoir: list[str] = []
    seen = 0
    with path.open(encoding="utf-8") as fh:
        for line in fh:
            try:
                record = json.loads(line)
            except json.JSONDecodeError:
                continue
            text = _text_of(record)
            if not text or len(text) < MIN_CHARS:
                continue
            text = text[:MAX_CHARS]
            seen += 1
            if len(reservoir) < count:
                reservoir.append(text)
            else:
                j = rng.randrange(seen)
                if j < count:
                    reservoir[j] = text
    return reservoir


def build(seed: int = SEED) -> dict[str, list[str]]:
    rng = random.Random(seed)
    corpus: dict[str, list[str]] = {}
    for language, mix in PROBE_MIX.items():
        docs: list[str] = []
        for name, count in mix:
            docs.extend(_load(name, language, count, rng))
        rng.shuffle(docs)
        corpus[language] = docs
    return corpus


def save(corpus: dict[str, list[str]], path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(corpus, ensure_ascii=False), encoding="utf-8")


def load(path: Path) -> dict[str, list[str]]:
    return json.loads(path.read_text(encoding="utf-8"))


# --- Hebrew-specific probes ------------------------------------------------
#
# Aggregate fertility hides the failures that matter most for Hebrew. A
# tokenizer can look respectable on running prose and still spend four tokens
# on a single inflected verb, or split a word at the wrong place when a prefix
# is attached. These probes name the specific behaviours the RV5 brief calls
# out, so the report can say which candidate handles them rather than only
# which one has the better average.

HEBREW_PROBES: dict[str, list[str]] = {
    "common words": ["שלום", "בית", "ילד", "ספר", "מים", "עבודה", "מחשב", "אוכל"],
    "prefixed forms": ["והבית", "כשהילד", "מהמחשב", "לעבודה", "שבספר", "ובמים"],
    "gender and number": ["הולך", "הולכת", "הולכים", "הולכות",
                          "כתב", "כתבה", "כתבו", "כותבות"],
    "verb inflection": ["לכתוב", "כותב", "כתבתי", "אכתוב", "נכתב", "הכתיב"],
    "construct state": ["בית ספר", "עורך דין", "כלב הבית", "ראש הממשלה"],
    "slang": ["אחי", "סבבה", "וואלה", "נראלי", "יאללה", "בטח", "אשכרה"],
    "with niqqud": ["שָׁלוֹם", "מָתֵמָטִיקָה", "יֶלֶד", "בַּיִת"],
    "geresh and gershayim": ["צה\"ל", "ד\"ר", "ג'ירפה", "צ'ק", "ז'קט", "ארה\"ב"],
    "numbers in Hebrew": ["ב-2024", "15 ק\"מ", "פי 3", "מספר 7", "‎50%"],
    "loanwords": ["אינטרנט", "טלוויזיה", "קומפיוטר", "אלגוריתם", "סטטיסטיקה"],
    "Hebrew with English": ["תכתוב לי function בפייתון",
                            "ה-API הזה לא עובד",
                            "צריך לעשות deploy למערכת"],
    "code switching": ["Explain לי איך לבנות את זה",
                       "אני רוצה שתענה in English",
                       "Write the code אבל תסביר לי בעברית"],
}

SPANISH_PROBES: dict[str, list[str]] = {
    "accented words": ["corazón", "también", "árbol", "íntimo", "número"],
    "eñe": ["año", "niño", "señor", "mañana", "español"],
    "inflection": ["hablar", "hablo", "hablaste", "hablaríamos", "hubiéramos"],
    "peninsular": ["vosotros habéis", "coger el ordenador", "el móvil"],
    "latin american": ["ustedes tienen", "tomar la computadora", "el celular"],
    "punctuation": ["¿Cómo estás?", "¡Qué bien!", "—dijo ella—"],
}

ENGLISH_PROBES: dict[str, list[str]] = {
    "common words": ["hello", "house", "child", "book", "water", "work"],
    "morphology": ["running", "unbelievable", "internationalization"],
    "code": ["def main():", "const x = 42;", "SELECT * FROM users;"],
}


def word_count(text: str) -> int:
    """Words, for a definition that behaves the same in all three scripts."""
    return len(re.findall(r"[^\W\d_]+", text, re.UNICODE))


def sentence_count(text: str) -> int:
    parts = [p for p in re.split(r"[.!?׃؟…]+|\n{2,}", text) if p.strip()]
    return max(len(parts), 1)
