"""Detecting and redacting personal data in the training corpus.

Web-crawled text contains phone numbers, email addresses and national ID
numbers, and a model trained on them can emit them. This runs before
tokenization so that what is memorised is the redaction, not the number.

The Israeli ID check is a real check-digit validation, not a nine-digit regex.
Nine consecutive digits appear constantly in ordinary text — years, prices,
product codes — and a pattern match alone would redact them all. Validating
the Luhn-style check digit takes the false-positive rate from unusable to
negligible.
"""
from __future__ import annotations

import re
from dataclasses import dataclass, field

EMAIL_RE = re.compile(r"\b[\w.+-]{1,64}@[\w-]{1,63}\.[\w.]{2,24}\b")

# International, Israeli and Spanish forms. Anchored on separators so that a
# bare run of digits inside a longer number is not matched.
PHONE_RE = re.compile(
    r"(?<![\d\w])(?:"
    r"\+\d{1,3}[-.\s]?\(?\d{1,4}\)?[-.\s]?\d{3}[-.\s]?\d{4}"      # +972 52 123 4567
    r"|0\d{1,2}[-.\s]?\d{3}[-.\s]?\d{4}"                          # 052-123-4567
    r"|\(\d{3}\)\s?\d{3}[-.\s]?\d{4}"                             # (555) 123-4567
    r")(?![\d\w])")

IL_ID_RE = re.compile(r"(?<!\d)(\d{9})(?!\d)")
CREDIT_CARD_RE = re.compile(r"(?<!\d)((?:\d[ -]?){13,19})(?!\d)")
IBAN_RE = re.compile(r"\b[A-Z]{2}\d{2}[A-Z0-9]{11,30}\b")
IPV4_RE = re.compile(r"\b(?:\d{1,3}\.){3}\d{1,3}\b")
SPANISH_DNI_RE = re.compile(r"\b(\d{8})[-\s]?([A-HJ-NP-TV-Z])\b")

DNI_LETTERS = "TRWAGMYFPDXBNJZSQVHLCKE"


def valid_israeli_id(digits: str) -> bool:
    """The Israeli ID check digit. Doubling alternate digits, casting out nines."""
    if len(digits) != 9 or not digits.isdigit():
        return False
    if len(set(digits)) == 1:          # 000000000, 111111111 — placeholders
        return False
    total = 0
    for i, ch in enumerate(digits):
        value = int(ch) * (1 if i % 2 == 0 else 2)
        total += value if value < 10 else value - 9
    return total % 10 == 0


def valid_luhn(digits: str) -> bool:
    digits = re.sub(r"[ -]", "", digits)
    if not digits.isdigit() or not 13 <= len(digits) <= 19:
        return False
    total, alternate = 0, False
    for ch in reversed(digits):
        value = int(ch)
        if alternate:
            value *= 2
            if value > 9:
                value -= 9
        total += value
        alternate = not alternate
    return total % 10 == 0


def valid_dni(number: str, letter: str) -> bool:
    return DNI_LETTERS[int(number) % 23] == letter.upper()


def valid_ipv4(text: str) -> bool:
    parts = text.split(".")
    return len(parts) == 4 and all(p.isdigit() and int(p) <= 255 for p in parts)


@dataclass
class PIIReport:
    counts: dict[str, int] = field(default_factory=dict)
    examples: dict[str, list[str]] = field(default_factory=dict)

    @property
    def total(self) -> int:
        return sum(self.counts.values())

    @property
    def clean(self) -> bool:
        return self.total == 0


def scan(text: str, examples: int = 2) -> PIIReport:
    report = PIIReport()

    def note(kind: str, value: str) -> None:
        report.counts[kind] = report.counts.get(kind, 0) + 1
        bucket = report.examples.setdefault(kind, [])
        if len(bucket) < examples:
            bucket.append(value)

    for m in EMAIL_RE.finditer(text):
        note("email", m.group(0))
    for m in PHONE_RE.finditer(text):
        note("phone", m.group(0))
    for m in IL_ID_RE.finditer(text):
        if valid_israeli_id(m.group(1)):
            note("israeli_id", m.group(1))
    for m in CREDIT_CARD_RE.finditer(text):
        if valid_luhn(m.group(1)):
            note("credit_card", m.group(1))
    for m in IBAN_RE.finditer(text):
        note("iban", m.group(0))
    for m in SPANISH_DNI_RE.finditer(text):
        if valid_dni(m.group(1), m.group(2)):
            note("spanish_dni", m.group(0))
    for m in IPV4_RE.finditer(text):
        if valid_ipv4(m.group(0)):
            note("ip_address", m.group(0))
    return report


def redact(text: str) -> tuple[str, PIIReport]:
    """Replace personal data with typed placeholders.

    Typed rather than a single [REDACTED]: the placeholder is what the model
    learns to emit in that position, and "[EMAIL]" at least teaches it that an
    email address goes there.
    """
    report = scan(text)
    text = EMAIL_RE.sub("[EMAIL]", text)
    text = PHONE_RE.sub("[PHONE]", text)
    text = IL_ID_RE.sub(lambda m: "[ID]" if valid_israeli_id(m.group(1)) else m.group(0), text)
    text = CREDIT_CARD_RE.sub(
        lambda m: "[CARD]" if valid_luhn(m.group(1)) else m.group(0), text)
    text = IBAN_RE.sub("[IBAN]", text)
    text = SPANISH_DNI_RE.sub(
        lambda m: "[DNI]" if valid_dni(m.group(1), m.group(2)) else m.group(0), text)
    text = IPV4_RE.sub(lambda m: "[IP]" if valid_ipv4(m.group(0)) else m.group(0), text)
    return text, report
