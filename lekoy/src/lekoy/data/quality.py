"""Quality scoring for corpus documents.

Every document gets a score in 0..1 and a breakdown of how it got there. The
breakdown matters more than the number: when a filter pass drops 40% of a
shard, the question is always *which* signal fired, and a bare score cannot
answer it.

The signals are cheap by design — this runs over the whole corpus on 4 cores.
They are also, deliberately, mostly language-agnostic: repetition, information
density and formatting damage look the same in Hebrew, English and Spanish.
Where a signal cannot be language-agnostic, it is parameterised by script
rather than special-cased, because a threshold tuned on English word lengths
would quietly discard correct Hebrew.
"""
from __future__ import annotations

import math
import re
from collections import Counter
from dataclasses import dataclass, field

from .langid import detect, script_profile

WORD_RE = re.compile(r"[^\W\d_]+", re.UNICODE)
SENTENCE_END_RE = re.compile(r"[.!?׃…]")

# Spam markers. Kept small and high-precision: a false positive here throws
# away a real document, which is worse than letting one spam page through.
SPAM_PATTERNS = [
    r"\b(?:buy|order|purchase)\s+(?:now|online|cheap)\b",
    r"\b(?:free|cheap)\s+(?:shipping|download|trial|viagra|casino)\b",
    r"\b(?:click here|visit our website|limited time offer)\b",
    r"\b(?:seo|backlink|link building|guest post)\s+(?:service|package)",
    r"(?:casino|poker|betting|gambling)\s+(?:online|bonus|site)",
    r"\bקנו?\s+(?:עכשיו|אונליין)\b",
    r"\b(?:הימורים|קזינו)\s+(?:אונליין|באינטרנט)\b",
    r"\bcompre\s+(?:ahora|en línea)\b",
]
SPAM_RE = re.compile("|".join(f"(?:{p})" for p in SPAM_PATTERNS), re.IGNORECASE)

# Text that survived extraction but is not prose.
JUNK_PATTERNS = [
    r"\{\{[^}]{0,60}\}\}",                  # unrendered template syntax
    r"\[\[[^\]]{0,60}\]\]",                 # wiki markup
    r"<[a-z][^>]{0,80}>",                   # leftover HTML tags
    r"&[a-z]{2,8};",                        # unescaped entities
    r"\bLorem ipsum\b",
]
JUNK_RE = re.compile("|".join(f"(?:{p})" for p in JUNK_PATTERNS), re.IGNORECASE)

REPLACEMENT_CHAR = "�"

# Below this, an answer is scored on structure alone — see score_conversation.
SHORT_ANSWER_CHARS = 40


@dataclass
class QualityReport:
    score: float
    signals: dict[str, float] = field(default_factory=dict)
    reasons: list[str] = field(default_factory=list)

    @property
    def passed(self) -> bool:
        return self.score >= 0.5


def _entropy(text: str, sample: int = 4000) -> float:
    """Shannon entropy per character, normalised to 0..1.

    Catches two opposite failures with one number: a document that repeats one
    string has very low entropy, and one that is base64 or a hash dump has
    very high entropy with no linguistic structure. Both are junk.
    """
    sample_text = text[:sample]
    if not sample_text:
        return 0.0
    counts = Counter(sample_text)
    total = len(sample_text)
    bits = -sum((c / total) * math.log2(c / total) for c in counts.values())
    return min(bits / 6.0, 1.0)          # ~6 bits is normal for natural prose


def _repetition(text: str, n: int = 10) -> float:
    """Fraction of n-grams that are duplicates. 0 is good."""
    words = WORD_RE.findall(text.lower())
    if len(words) < n * 2:
        return 0.0
    grams = [" ".join(words[i:i + n]) for i in range(len(words) - n + 1)]
    unique = len(set(grams))
    return 1.0 - unique / len(grams)


def _line_repetition(text: str) -> float:
    lines = [l.strip() for l in text.split("\n") if l.strip()]
    if len(lines) < 4:
        return 0.0
    return 1.0 - len(set(lines)) / len(lines)


def _information_density(text: str) -> float:
    """Type-token ratio, length-corrected.

    Raw TTR falls as documents get longer, so a long good article would score
    below a short mediocre one. Dividing by sqrt(n) is the standard correction
    and makes the number comparable across lengths.
    """
    words = WORD_RE.findall(text.lower())
    if len(words) < 10:
        return 0.0
    return min(len(set(words)) / math.sqrt(len(words)) / 4.0, 1.0)


def _formatting(text: str) -> float:
    """Is this shaped like prose? Punctuation, sentence length, line structure."""
    if not text:
        return 0.0
    sentences = [s for s in SENTENCE_END_RE.split(text) if s.strip()]
    words = WORD_RE.findall(text)
    if not words:
        return 0.0
    score = 1.0
    if sentences:
        mean_words = len(words) / len(sentences)
        # Under 3 words per sentence is a fragment list; over 60 is a wall of
        # text with the punctuation stripped by a bad extractor.
        if mean_words < 3 or mean_words > 60:
            score -= 0.4
    else:
        score -= 0.3                      # no sentence-final punctuation at all
    letters = sum(1 for c in text if c.isalpha())
    if letters / len(text) < 0.45:
        score -= 0.3                      # mostly digits, symbols or markup
    upper = sum(1 for c in text if c.isupper())
    if letters and upper / letters > 0.5:
        score -= 0.2                      # SHOUTING, or an extracted headline block
    return max(score, 0.0)


def _encoding_quality(text: str) -> float:
    if not text:
        return 0.0
    bad = text.count(REPLACEMENT_CHAR)
    profile = script_profile(text)
    score = 1.0 - min(bad / max(len(text) / 500, 1), 1.0)
    # A document written in three scripts at once is usually an extraction
    # failure that has spliced several pages together.
    scripts = sum(1 for k, v in profile.items() if v > 0.1)
    if scripts >= 3:
        score -= 0.3
    return max(score, 0.0)


def score_document(text: str, expected_language: str | None = None,
                   min_chars: int = 200) -> QualityReport:
    """Score one document. Returns the score, every signal, and why."""
    reasons: list[str] = []
    signals: dict[str, float] = {}

    if len(text) < min_chars:
        return QualityReport(0.0, {"length": 0.0},
                             [f"shorter than {min_chars} characters"])

    language, confidence = detect(text)
    signals["language_confidence"] = round(confidence, 3)
    signals["detected_language"] = language           # type: ignore[assignment]
    if expected_language:
        target = {"hebrew": "he", "english": "en", "spanish": "es"}.get(
            expected_language, expected_language)
        ok = language == target or (target == "he" and language == "mixed")
        if not ok:
            return QualityReport(
                0.0, signals,
                [f"detected {language}, source claims {expected_language}"])

    entropy = _entropy(text)
    repetition = _repetition(text)
    line_repetition = _line_repetition(text)
    density = _information_density(text)
    formatting = _formatting(text)
    encoding = _encoding_quality(text)
    spam_hits = len(SPAM_RE.findall(text))
    junk_hits = len(JUNK_RE.findall(text))

    signals.update({
        "entropy": round(entropy, 3),
        "repetition_10gram": round(repetition, 3),
        "line_repetition": round(line_repetition, 3),
        "information_density": round(density, 3),
        "formatting": round(formatting, 3),
        "encoding": round(encoding, 3),
        "spam_hits": spam_hits,
        "junk_hits": junk_hits,
    })

    # Weighted sum of the positive signals, then explicit penalties. Kept as a
    # sum rather than a product so that one mediocre signal cannot zero a
    # document that is fine on every other axis.
    score = (0.20 * entropy
             + 0.25 * density
             + 0.25 * formatting
             + 0.15 * encoding
             + 0.15 * (1.0 - max(repetition, line_repetition)))

    if repetition > 0.35:
        score -= 0.25
        reasons.append(f"repetitive: {repetition:.0%} of 10-grams are duplicates")
    if line_repetition > 0.4:
        score -= 0.20
        reasons.append(f"{line_repetition:.0%} of lines are duplicates")
    if spam_hits:
        score -= min(0.15 * spam_hits, 0.45)
        reasons.append(f"{spam_hits} spam marker(s)")
    if junk_hits > 3:
        score -= 0.20
        reasons.append(f"{junk_hits} markup/junk fragment(s)")
    if entropy < 0.45:
        score -= 0.20
        reasons.append("very low character entropy")
    if encoding < 0.6:
        score -= 0.20
        reasons.append("damaged encoding or mixed scripts")
    if confidence < 0.5 and language not in ("mixed",):
        score -= 0.10
        reasons.append(f"low language confidence ({confidence:.2f})")

    return QualityReport(round(max(0.0, min(score, 1.0)), 4), signals, reasons)


def score_conversation(messages: list[dict], expected_language: str | None = None
                       ) -> QualityReport:
    """Score an instruction sample.

    The failures that matter in instruction data are structural — an empty
    turn, a missing answer, roles out of order — and they are invisible to a
    prose scorer, which would happily give a well-written question with no
    answer a good mark.
    """
    if not messages:
        return QualityReport(0.0, {}, ["no messages"])
    roles = [m.get("role") for m in messages]
    contents = [m.get("content") or "" for m in messages]

    reasons: list[str] = []
    if any(not c.strip() for c in contents):
        return QualityReport(0.0, {"turns": len(messages)}, ["an empty turn"])
    if roles[-1] != "assistant":
        return QualityReport(0.0, {"turns": len(messages)},
                             [f"last turn is {roles[-1]!r}, not an assistant reply"])
    if "user" not in roles:
        return QualityReport(0.0, {"turns": len(messages)}, ["no user turn"])
    for a, b in zip(roles, roles[1:]):
        if a == b == "user" or a == b == "assistant":
            reasons.append(f"two consecutive {a} turns")
            break

    answers = [c for r, c in zip(roles, contents) if r == "assistant"]
    body = "\n\n".join(answers)
    signals: dict[str, float] = {"turns": len(messages), "answer_chars": len(body)}

    # Prose signals are meaningless below about a sentence. "4" is a complete,
    # correct answer to "how much is 2+2", and entropy and type-token ratio
    # would both score it near zero — so a short answer is scored structurally
    # instead of being run through the prose scorer and failed by it.
    if len(body) < SHORT_ANSWER_CHARS:
        signals["short_answer"] = 1.0
        score = 0.75 - (0.20 if reasons else 0.0)
        return QualityReport(round(max(0.0, score), 4), signals, reasons)

    inner = score_document(body, expected_language, min_chars=1)
    signals.update(inner.signals)
    score = inner.score
    if reasons:
        score -= 0.15
    return QualityReport(round(max(0.0, min(score, 1.0)), 4), signals,
                         reasons + inner.reasons)
