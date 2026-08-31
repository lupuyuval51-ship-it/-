"""Scoring functions for the LEKOY evaluation suites.

Every metric here is deterministic and needs no second model to judge. That is
a constraint the environment imposes — there is no GPU to run a judge on — but
it is also the right default: an LLM-judge score cannot be reproduced by
someone else, and a benchmark whose numbers cannot be reproduced is not
evidence.

Where a task genuinely needs judgement (open-ended Hebrew writing quality) the
suite scores what can be scored objectively — is it in the right language, does
it follow the format, does it agree in gender and number — and says so, rather
than dressing a guess up as a measurement.
"""
from __future__ import annotations

import re
import unicodedata
from collections import Counter

from ..data.langid import detect

MC_LETTERS = "ABCDEFGH"


def normalise_answer(text: str) -> str:
    """Lowercase, strip articles and punctuation. The standard QA normalisation,
    extended so Hebrew's prefixed definite article does not defeat it."""
    text = unicodedata.normalize("NFC", text).strip().casefold()
    text = re.sub(r"\b(a|an|the|el|la|los|las|un|una)\b", " ", text)
    text = re.sub(r"[^\w\s]", " ", text, flags=re.UNICODE)
    return re.sub(r"\s+", " ", text).strip()


def exact_match(prediction: str, reference: str) -> float:
    return float(normalise_answer(prediction) == normalise_answer(reference))


def contains(prediction: str, reference: str) -> float:
    return float(normalise_answer(reference) in normalise_answer(prediction))


def token_f1(prediction: str, reference: str) -> float:
    """Word-overlap F1. The usual partial-credit metric for short answers."""
    p = normalise_answer(prediction).split()
    r = normalise_answer(reference).split()
    if not p or not r:
        return float(p == r)
    common = Counter(p) & Counter(r)
    overlap = sum(common.values())
    if not overlap:
        return 0.0
    precision, recall = overlap / len(p), overlap / len(r)
    return 2 * precision * recall / (precision + recall)


def extract_choice(text: str, num_options: int = 4) -> str | None:
    """Pull a multiple-choice answer out of free-form generation.

    Models answer multiple choice in every imaginable format — "B", "(b)",
    "The answer is B.", "2", "תשובה ב". Anchoring on the first plausible
    marker rather than searching the whole string matters: a model that says
    "B, because unlike C..." has answered B, and a last-match rule would score
    it as C.
    """
    letters = MC_LETTERS[:num_options]
    patterns = [
        rf"\b(?:answer|respuesta|תשובה)\s*(?:is|es|:|היא)?\s*[\(\[]?([{letters}])\b",
        rf"^\s*[\(\[]?([{letters}])[\)\].:,]",
        rf"^\s*([{letters}])\s*$",
        rf"\b([{letters}])[\)\.]\s",
    ]
    for pattern in patterns:
        m = re.search(pattern, text.strip(), re.IGNORECASE | re.MULTILINE)
        if m:
            return m.group(1).upper()
    # Hebrew letter answers: א ב ג ד.
    m = re.search(r"\b([אבגד])\b", text)
    if m:
        return letters[("אבגד".index(m.group(1)))] if "אבגד".index(m.group(1)) < num_options else None
    # A bare digit, 1-indexed.
    m = re.search(r"^\s*[\(\[]?([1-8])[\)\].:,]?\s*$", text.strip(), re.MULTILINE)
    if m and int(m.group(1)) <= num_options:
        return letters[int(m.group(1)) - 1]
    # Last resort: a lone letter anywhere.
    m = re.search(rf"\b([{letters}])\b", text)
    return m.group(1).upper() if m else None


NUMBER_RE = re.compile(r"-?\d[\d,]*\.?\d*")


def extract_number(text: str) -> float | None:
    """The final number in a response — the answer, in a worked solution."""
    text = text.replace("،", ",")
    # Prefer a number after an explicit answer marker.
    marked = re.search(
        r"(?:answer|respuesta|תשובה|=|####)\s*(?:is|es|:|היא)?\s*"
        r"\**\s*(-?\d[\d,]*\.?\d*)", text, re.IGNORECASE)
    candidates = [marked.group(1)] if marked else NUMBER_RE.findall(text)
    if not candidates:
        return None
    try:
        return float(candidates[-1].replace(",", ""))
    except ValueError:
        return None


def numeric_match(prediction: str, reference: str, tolerance: float = 1e-4) -> float:
    got, want = extract_number(prediction), extract_number(reference)
    if got is None or want is None:
        return 0.0
    return float(abs(got - want) <= max(tolerance, abs(want) * tolerance))


def language_match(prediction: str, expected: str) -> float:
    """Did the model answer in the language it was asked in?

    A model that answers a Hebrew question in English has failed the task
    regardless of whether the content is right, and this is the single most
    common multilingual regression — so it is scored on its own rather than
    folded into a quality number where it would be invisible.
    """
    code, confidence = detect(prediction)
    target = {"hebrew": "he", "english": "en", "spanish": "es"}.get(expected, expected)
    if code == target:
        return 1.0
    if target == "he" and code == "mixed":
        return 0.8              # Hebrew with English technical terms is fine
    if code == "unknown":
        return 0.5              # too short to tell; do not punish "4"
    return 0.0


HEBREW_LETTERS = re.compile(r"[֐-׿]")


def hebrew_agreement_errors(text: str) -> list[str]:
    """Gender and number agreement mistakes, from a small pattern set.

    High-precision and low-recall on purpose. It catches the specific errors a
    model trained on translated Hebrew actually makes — a feminine subject with
    a masculine verb, a masculine numeral with a feminine noun — and stays
    quiet otherwise. It is a regression tripwire, not a grammar checker, and it
    is reported as a count rather than folded into a score, because a false
    positive should be visible rather than silently costing marks.
    """
    errors = []
    # Feminine noun with the masculine numeral form: "שלושה בנות".
    for m in re.finditer(r"\b(שניים|שלושה|ארבעה|חמישה|שישה|שבעה|שמונה|תשעה|עשרה)\s+"
                         r"(\S*(?:ות|יות))\b", text):
        errors.append(f"masculine numeral with feminine noun: {m.group(0)}")
    # Masculine plural noun with the feminine numeral form: "שלוש בנים".
    for m in re.finditer(r"\b(שתיים|שתי|שלוש|ארבע|חמש|שש|שבע|שמונֶה|תשע|עשר)\s+"
                         r"(\S*ים)\b", text):
        if not m.group(2).endswith(("ותים", "יים")):
            errors.append(f"feminine numeral with masculine noun: {m.group(0)}")
    # "היא" with a masculine past-tense verb, and "הוא" with a feminine one.
    for m in re.finditer(r"\bהיא\s+(הלך|כתב|אמר|עשה|ראה|בא|נתן|לקח|ידע)\b", text):
        errors.append(f"feminine pronoun with masculine verb: {m.group(0)}")
    for m in re.finditer(r"\bהוא\s+(הלכה|כתבה|אמרה|עשתה|ראתה|באה|נתנה|לקחה|ידעה)\b", text):
        errors.append(f"masculine pronoun with feminine verb: {m.group(0)}")
    return errors


def format_compliance(prediction: str, requirement: dict) -> tuple[float, list[str]]:
    """Did the answer obey an explicit formatting instruction?

    Instruction following is measured by checking the constraint that was
    actually stated, so each item carries its own requirement rather than being
    scored against a generic rubric.
    """
    failures: list[str] = []
    text = prediction.strip()

    if (n := requirement.get("max_words")) and len(text.split()) > n:
        failures.append(f"more than {n} words ({len(text.split())})")
    if (n := requirement.get("min_words")) and len(text.split()) < n:
        failures.append(f"fewer than {n} words ({len(text.split())})")
    if (n := requirement.get("exact_lines")):
        lines = [l for l in text.split("\n") if l.strip()]
        if len(lines) != n:
            failures.append(f"{len(lines)} lines, expected exactly {n}")
    if requirement.get("json"):
        import json as _json
        body = re.sub(r"^```(?:json)?\s*|\s*```$", "", text, flags=re.MULTILINE).strip()
        try:
            parsed = _json.loads(body)
        except _json.JSONDecodeError as exc:
            failures.append(f"not valid JSON ({exc.msg})")
        else:
            for key in requirement.get("json_keys", []):
                if key not in parsed:
                    failures.append(f"JSON is missing the key {key!r}")
    for needle in requirement.get("must_contain", []):
        if needle.casefold() not in text.casefold():
            failures.append(f"does not contain {needle!r}")
    # Any-of, for translation: a correct rendering may pick any of several
    # valid words, and requiring all of them would fail good translations.
    if (options := requirement.get("must_contain_any")):
        if not any(o.casefold() in text.casefold() for o in options):
            failures.append(f"contains none of {options}")
    for needle in requirement.get("must_not_contain", []):
        if needle.casefold() in text.casefold():
            failures.append(f"contains {needle!r}, which was excluded")
    if (prefix := requirement.get("starts_with")) and not text.startswith(prefix):
        failures.append(f"does not start with {prefix!r}")
    if requirement.get("no_markdown") and re.search(r"[*_`#]{1,}", text):
        failures.append("contains markdown formatting")
    if (lang := requirement.get("language")) and language_match(text, lang) < 0.8:
        failures.append(f"not written in {lang}")

    return (1.0 if not failures else 0.0), failures


def uncertainty_expressed(text: str) -> bool:
    """Does the answer admit it does not know?

    The hallucination suite asks questions with no knowable answer. Scoring
    them means detecting a hedge, in three languages.
    """
    markers = [
        r"\b(?:i (?:don'?t|do not) know|i'?m not (?:sure|certain)|i cannot|i can'?t know)\b",
        r"\b(?:no (?:tengo|puedo) (?:forma de )?saber|no lo sé|no estoy seguro)\b",
        r"\b(?:unable to|no way to) (?:know|determine|verify)\b",
        r"אני לא יודע|איני יודע|אין לי (?:דרך|גישה|מידע)|לא בטוח|קשה לדעת|"
        r"אין לי אפשרות|לא ידוע לי|אין באפשרותי",
        r"\b(?:approximately|roughly|estimate|around)\b|בערך|בסביבות|הערכה|כ-",
    ]
    return any(re.search(p, text, re.IGNORECASE) for p in markers)


def fabricated_specific_claim(text: str) -> bool:
    """A confident, specific-sounding claim with no hedge.

    The failure mode the hallucination suite is looking for is not a wrong
    answer; it is a *precise* wrong answer, stated without qualification.
    """
    if uncertainty_expressed(text):
        return False
    return bool(re.search(r"\b\d{2,}(?:[.,]\d+)?\s*(?:%|percent|אחוז|por ciento)?\b", text)
                or re.search(r"\b(?:19|20)\d{2}\b", text))
