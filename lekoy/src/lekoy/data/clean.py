"""Normalisation and boilerplate removal.

Everything here is reversible in intent — it removes text that is not language,
not text that is inconvenient. Encoding repair, whitespace normalisation and
the removal of cookie banners and navigation chrome are all in that category.
Judgements about whether a *document* is worth training on live in `quality.py`;
this module only decides what the document says.

Two Hebrew-specific concerns shape this module:

  * **Directional marks are content.** RLM, LRM and the isolate characters are
    Unicode Cf, and the obvious "strip all control characters" pass removes
    them — which silently breaks the rendering of every Hebrew sentence that
    contains an English word or a number.
  * **Final letters are not spelling variants.** ך ם ן ף ץ are distinct
    letters, not decorations, and NFKC leaves them alone. Some scraped text
    uses the Hebrew Presentation Forms block instead; those are folded back.
"""
from __future__ import annotations

import html
import re
import unicodedata

from .langid import strip_control

# Mojibake: UTF-8 read as Latin-1 and re-encoded. Very common in scraped
# Hebrew, where it turns every letter into a two-character sequence.
MOJIBAKE_MARKERS = ("Ã¢â‚¬", "Ã©", "Ã¨", "â€™", "â€œ", "â€\x9d", "Ã\x97", "×\x90", "×\x91")

# Boilerplate. Matched per line rather than over the whole document, so one
# cookie banner does not discard the article beneath it.
BOILERPLATE_PATTERNS = [
    # Cookie and privacy notices — English, Hebrew, Spanish.
    r"\b(we use cookies|this (site|website) uses cookies|cookie policy)\b",
    r"\b(accept all cookies|manage (your )?(cookie )?preferences)\b",
    r"אתר זה (משתמש|עושה שימוש) ב(עוגיות|קובצי cookie)",
    r"\b(utilizamos cookies|este sitio (web )?utiliza cookies)\b",
    # Navigation and page chrome.
    r"^\s*(home|about( us)?|contact( us)?|sitemap|privacy policy|terms of (use|service))\s*$",
    r"^\s*(דף הבית|אודות|צור קשר|תנאי שימוש|מפת האתר|מדיניות פרטיות)\s*$",
    r"^\s*(inicio|acerca de|contacto|mapa del sitio|política de privacidad)\s*$",
    # Social and sharing widgets.
    r"\b(share on (facebook|twitter|whatsapp)|follow us on)\b",
    r"(שתפו|שיתוף) ב(פייסבוק|טוויטר|וואטסאפ)",
    # Subscription and consent nags.
    r"\b(subscribe to our newsletter|sign up for our newsletter)\b",
    r"\b(enable javascript|javascript is (disabled|required))\b",
    r"\b(click here to (continue|read more)|read more\s*»)\s*$",
    # Tracking and analytics strings that survive extraction.
    r"(utm_source=|utm_medium=|gclid=|fbclid=)",
    r"\b(googletagmanager|google-analytics\.com|doubleclick\.net)\b",
    # Rights footers.
    r"^\s*(©|copyright)\s*\d{4}",
    r"^\s*כל הזכויות שמורות\s*",
    r"^\s*todos los derechos reservados\s*$",
]
# Case folding is applied to the whole alternation rather than per branch:
# Python rejects an inline (?i) flag anywhere but the start of a pattern, and
# folding is harmless for the Hebrew branches, which have no case.
BOILERPLATE_RE = re.compile(
    "|".join(f"(?:{p})" for p in BOILERPLATE_PATTERNS), re.IGNORECASE)

# GSM8K's calculator annotations. RV5 should learn the arithmetic, not the
# markup — the brief is explicit that reasoning data should teach the answer,
# not a scratchpad format.
CALCULATOR_RE = re.compile(r"<<[^>]{0,80}?>>")

URL_RE = re.compile(r"https?://\S+|www\.\S+")
EMAIL_RE = re.compile(r"\b[\w.+-]+@[\w-]+\.[\w.]{2,}\b")
MULTISPACE_RE = re.compile(r"[ \t  -   　]+")
MULTINEWLINE_RE = re.compile(r"\n{3,}")
REPEATED_PUNCT_RE = re.compile(r"([!?.,;:־–—])\1{3,}")

# Hebrew Presentation Forms -> the ordinary letters, for scraped text that
# used the compatibility block.
PRESENTATION_FORMS = {
    "שׁ": "ש", "שׂ": "ש", "שּׁ": "ש", "שּׂ": "ש",
    "אַ": "א", "אָ": "א", "אּ": "א", "בּ": "ב",
    "גּ": "ג", "דּ": "ד", "הּ": "ה", "וּ": "ו",
    "זּ": "ז", "טּ": "ט", "יּ": "י", "ךּ": "ך",
    "כּ": "כ", "לּ": "ל", "מּ": "מ", "נּ": "נ",
    "סּ": "ס", "ףּ": "ף", "פּ": "פ", "צּ": "צ",
    "קּ": "ק", "רּ": "ר", "שּ": "ש", "תּ": "ת",
}
PRESENTATION_TABLE = str.maketrans(PRESENTATION_FORMS)


def looks_mojibake(text: str) -> bool:
    sample = text[:4000]
    return sum(sample.count(m) for m in MOJIBAKE_MARKERS) >= 3


def repair_encoding(text: str) -> str:
    """Undo one round of UTF-8-read-as-Latin-1, if that is what happened.

    Only applied when the result is demonstrably better — decoding a correctly
    encoded document this way would destroy it, so the repair is kept only if
    the mojibake markers actually go away.
    """
    if not looks_mojibake(text):
        return text
    for encoding in ("latin-1", "cp1252"):
        try:
            candidate = text.encode(encoding, errors="strict").decode("utf-8", errors="strict")
        except (UnicodeEncodeError, UnicodeDecodeError):
            continue
        if not looks_mojibake(candidate):
            return candidate
    return text


def normalise(text: str) -> str:
    """Canonical form: NFC, real quotes, no stray control characters.

    NFC rather than NFKC. NFKC would fold the Hebrew presentation forms for us,
    but it also rewrites ﬁ to fi, superscripts to digits and — the reason it is
    disqualifying here — some Hebrew punctuation to Latin lookalikes. The
    presentation forms are handled explicitly instead.
    """
    text = html.unescape(text)
    text = text.translate(PRESENTATION_TABLE)
    text = unicodedata.normalize("NFC", text)
    text = strip_control(text)
    text = text.replace("​", "").replace("﻿", "")
    text = MULTISPACE_RE.sub(" ", text)
    text = REPEATED_PUNCT_RE.sub(r"\1\1\1", text)
    text = MULTINEWLINE_RE.sub("\n\n", text)
    return "\n".join(line.rstrip() for line in text.split("\n")).strip()


def strip_boilerplate(text: str) -> tuple[str, int]:
    """Drop boilerplate lines. Returns the text and how many lines went."""
    kept, dropped = [], 0
    for line in text.split("\n"):
        if line.strip() and BOILERPLATE_RE.search(line):
            dropped += 1
            continue
        kept.append(line)
    return MULTINEWLINE_RE.sub("\n\n", "\n".join(kept)).strip(), dropped


def strip_navigation(text: str, max_line_words: int = 4,
                     min_run: int = 4) -> tuple[str, int]:
    """Remove runs of very short lines — extracted navigation menus.

    A single short line is a heading; six in a row are a menu. Requiring a run
    is what separates the two, and it is why this is not merely a minimum line
    length filter.
    """
    lines = text.split("\n")
    keep = [True] * len(lines)
    run: list[int] = []
    for i, line in enumerate(lines + [""]):
        stripped = line.strip()
        short = bool(stripped) and len(stripped.split()) <= max_line_words \
            and not stripped.endswith((".", "!", "?", ":", "׃"))
        if short:
            run.append(i)
            continue
        if len(run) >= min_run:
            for j in run:
                keep[j] = False
        run = []
    dropped = keep.count(False)
    return MULTINEWLINE_RE.sub(
        "\n\n", "\n".join(l for l, k in zip(lines, keep) if k)).strip(), dropped


def redact_urls(text: str, replacement: str = "[URL]") -> str:
    return URL_RE.sub(replacement, text)


def clean_document(text: str, *, boilerplate: bool = True,
                   navigation: bool = True,
                   calculator_annotations: bool = True) -> dict:
    """Full clean of one document, with a record of what was removed."""
    original_len = len(text)
    text = repair_encoding(text)
    repaired = len(text) != original_len
    text = normalise(text)
    dropped_boiler = dropped_nav = 0
    if boilerplate:
        text, dropped_boiler = strip_boilerplate(text)
    if navigation:
        text, dropped_nav = strip_navigation(text)
    if calculator_annotations:
        text = CALCULATOR_RE.sub("", text)
    return {
        "text": text,
        "original_chars": original_len,
        "chars": len(text),
        "encoding_repaired": repaired,
        "boilerplate_lines_removed": dropped_boiler,
        "navigation_lines_removed": dropped_nav,
    }
