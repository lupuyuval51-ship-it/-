"""Language identification for the three LEKOY languages, plus a "not ours" verdict.

Deliberately not a model. This runs over every document in the corpus on 4 CPU
cores, and a neural detector would cost more than the rest of the cleaning
pipeline put together. It is also not needed: Hebrew is trivially separable by
script, and Spanish and English separate cleanly on function words and
orthography, which is the only hard case.

The corpus needs this because source labels lie. The HPLT `heb_Hebr` shard
contains Punjabi documents — found while checking tokenizer round-trips, not by
looking for it. Trusting the label would have put Punjabi in the Hebrew
training mix.
"""
from __future__ import annotations

import re
import unicodedata
from collections import Counter

# Unicode ranges, checked by codepoint rather than by regex property classes so
# the behaviour does not depend on the host's Unicode build.
HEBREW = (0x0590, 0x05FF)
HEBREW_PRESENTATION = (0xFB1D, 0xFB4F)
ARABIC = (0x0600, 0x06FF)
CYRILLIC = (0x0400, 0x04FF)
GREEK = (0x0370, 0x03FF)
CJK = (0x4E00, 0x9FFF)
HIRAGANA_KATAKANA = (0x3040, 0x30FF)
HANGUL = (0xAC00, 0xD7AF)
DEVANAGARI = (0x0900, 0x097F)
GURMUKHI = (0x0A00, 0x0A7F)          # Punjabi — the contaminant actually found
BENGALI = (0x0980, 0x09FF)
TAMIL = (0x0B80, 0x0BFF)
THAI = (0x0E00, 0x0E7F)

NON_LATIN_SCRIPTS = {
    "arabic": ARABIC, "cyrillic": CYRILLIC, "greek": GREEK, "cjk": CJK,
    "kana": HIRAGANA_KATAKANA, "hangul": HANGUL, "devanagari": DEVANAGARI,
    "gurmukhi": GURMUKHI, "bengali": BENGALI, "tamil": TAMIL, "thai": THAI,
}

# Niqqud, cantillation and the Hebrew punctuation marks. Counted separately:
# a document that is 30% combining marks is vocalised text, which is a
# different register rather than a different language.
NIQQUD = (0x0591, 0x05C7)

# Function words. Chosen to be frequent, short, and — critically — not shared
# between the two languages. "no", "un", "en", "son", "sin", "para" all appear
# in English text often enough to be useless as evidence.
SPANISH_MARKERS = frozenset("""
que de la el los las una unos unas por con para como pero cuando donde
porque también más muy sobre entre desde hasta durante aunque mientras
sus sus del al lo su este esta estos estas ese esa aquel ser estar hacer
tiene tienen puede pueden debe deben había habían fue fueron es son
""".split())

ENGLISH_MARKERS = frozenset("""
the of and to in that is was for it with as his on be at by this have
from or one had not but what all were when we there can an your which
their said if do will each about how up out them then she many some so
""".split())

# Orthography that only one of the two languages has.
SPANISH_CHARS = frozenset("ñ¿¡")
SPANISH_ACCENTS = frozenset("áéíóúü")

WORD_RE = re.compile(r"[^\W\d_]+", re.UNICODE)


def _in(cp: int, span: tuple[int, int]) -> bool:
    return span[0] <= cp <= span[1]


def script_profile(text: str) -> dict[str, float]:
    """Fraction of *letters* in each script. Punctuation and digits are shared
    between all languages, so counting them dilutes the signal that matters."""
    counts: Counter[str] = Counter()
    letters = 0
    for ch in text:
        if not ch.isalpha():
            continue
        letters += 1
        cp = ord(ch)
        if _in(cp, HEBREW) or _in(cp, HEBREW_PRESENTATION):
            counts["hebrew"] += 1
            continue
        if cp < 0x0250 or _in(cp, (0x1E00, 0x1EFF)):
            counts["latin"] += 1
            continue
        for name, span in NON_LATIN_SCRIPTS.items():
            if _in(cp, span):
                counts[name] += 1
                break
        else:
            counts["other"] += 1
    if not letters:
        return {}
    return {k: v / letters for k, v in counts.items()}


def niqqud_ratio(text: str) -> float:
    """Combining Hebrew marks per Hebrew letter. >0.2 means vocalised text."""
    letters = marks = 0
    for ch in text:
        cp = ord(ch)
        if _in(cp, NIQQUD):
            marks += 1
        elif _in(cp, HEBREW) and ch.isalpha():
            letters += 1
    return marks / letters if letters else 0.0


def _latin_language(text: str) -> tuple[str, float]:
    """Split Latin-script text into Spanish or English."""
    words = [w.lower() for w in WORD_RE.findall(text)]
    if len(words) < 5:
        # Too short for function-word evidence. Orthography is the only signal
        # left, and where it is silent the honest answer is "unknown" — not
        # "English", which is what a default-to-the-majority-language guess
        # would say and would then be wrong about every short Spanish string.
        lowered = text.lower()
        if any(c in lowered for c in SPANISH_CHARS):
            return "es", 0.7
        return "unknown", 0.0

    total = len(words)
    es_hits = sum(1 for w in words if w in SPANISH_MARKERS)
    en_hits = sum(1 for w in words if w in ENGLISH_MARKERS)
    lowered = text.lower()
    # ñ and inverted punctuation are decisive; accents are strong but appear in
    # English loanwords ("café", "naïve") so they count for less.
    hard = sum(lowered.count(c) for c in SPANISH_CHARS)
    soft = sum(lowered.count(c) for c in SPANISH_ACCENTS)

    es_score = es_hits / total + hard * 0.05 + (soft / total) * 0.5
    en_score = en_hits / total
    if es_score == en_score == 0:
        # No function words from either language matched. Common in headings,
        # lists and product names; not evidence for English.
        return "unknown", 0.0
    if es_score >= en_score:
        return "es", min(es_score / (es_score + en_score + 1e-9), 1.0)
    return "en", min(en_score / (es_score + en_score + 1e-9), 1.0)


def detect(text: str, min_chars: int = 20) -> tuple[str, float]:
    """Return (language code, confidence in 0..1).

    Codes are `he`, `en`, `es`, `mixed` for genuine code-switching, and
    `other` for anything outside the three LEKOY languages. `mixed` is a
    verdict, not a failure: Hebrew-with-English is a register RV5 must handle,
    and those documents are kept and routed to the code-switching data rather
    than discarded.
    """
    text = text.strip()
    if len(text) < min_chars:
        return "unknown", 0.0

    profile = script_profile(text)
    if not profile:
        return "unknown", 0.0

    hebrew = profile.get("hebrew", 0.0)
    latin = profile.get("latin", 0.0)
    foreign = sum(v for k, v in profile.items()
                  if k not in ("hebrew", "latin"))

    # A script that is neither Hebrew nor Latin, in any quantity worth noting,
    # means the document is not one of ours. This is the check that catches the
    # Punjabi in the HPLT Hebrew shard.
    if foreign > 0.15:
        dominant = max((k for k in profile if k not in ("hebrew", "latin")),
                       key=lambda k: profile[k])
        return f"other:{dominant}", min(foreign, 1.0)

    if hebrew >= 0.85:
        return "he", hebrew
    if hebrew >= 0.20:
        # Enough Hebrew to be Hebrew, enough Latin to be code-switched. Which
        # one leads decides how the document is treated downstream.
        return "mixed", hebrew
    if latin >= 0.85:
        code, confidence = _latin_language(text)
        return code, confidence
    if hebrew > latin:
        return "he", hebrew
    code, confidence = _latin_language(text)
    return code, confidence * latin


def matches(text: str, expected: str, min_confidence: float = 0.5) -> bool:
    """Is `text` in the language a source claims it is in?

    `mixed` counts as Hebrew: a Hebrew document with English technical terms in
    it is Hebrew, and rejecting it would strip exactly the code-switched text
    the brief asks RV5 to handle.
    """
    code, confidence = detect(text)
    target = {"hebrew": "he", "english": "en", "spanish": "es"}.get(expected, expected)
    if code == target:
        return confidence >= min_confidence
    if target == "he" and code == "mixed":
        return True
    return False


def summarise(texts: list[str]) -> dict[str, int]:
    """Language histogram over a list of documents, for reports."""
    counts: Counter[str] = Counter()
    for text in texts:
        code, _ = detect(text)
        counts[code.split(":")[0] if code.startswith("other") else code] += 1
    return dict(counts.most_common())


def strip_control(text: str) -> str:
    """Remove control and format characters, keeping the ones RTL text needs.

    Hebrew text legitimately carries RLM/LRM and the isolate marks, which are
    Cf-category and would be stripped by a naive `unicodedata.category` filter
    — taking the directional information with them.
    """
    keep = {"\n", "\t", "‎", "‏", "⁦", "⁧", "⁨", "⁩"}
    return "".join(
        ch for ch in text
        if ch in keep or unicodedata.category(ch)[0] not in ("C",))
