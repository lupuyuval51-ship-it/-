"""Cleaning, language identification, quality scoring, PII and deduplication."""
from __future__ import annotations

import pytest

from lekoy.data.clean import (clean_document, looks_mojibake, normalise,
                              repair_encoding, strip_boilerplate,
                              strip_navigation)
from lekoy.data.dedup import (deduplicate, exact_hash, find_leakage,
                              normalised_hash, signature_of)
from lekoy.data.langid import detect, matches, niqqud_ratio, script_profile
from lekoy.data.pii import (redact, scan, valid_dni, valid_israeli_id,
                            valid_luhn)
from lekoy.data.pipeline import check_integrity, split_records, text_of
from lekoy.data.quality import score_conversation, score_document

# Long enough to clear the 300-character floor below which near-duplicate
# detection is skipped: a MinHash estimate over a handful of 5-grams is noise,
# so short documents are compared exactly and not approximately.
HEBREW = ("מתמטיקה היא תחום דעת העוסק במושגים כגון כמות, מבנה, מרחב ושינוי. "
          "היא התפתחה מתוך הצורך לספור, למדוד ולתאר צורות. מתמטיקאים מחפשים "
          "תבניות ומנסחים השערות חדשות, ומיישבים את אמיתותן באמצעות הוכחות "
          "הנובעות מאקסיומות והגדרות שנבחרו כראוי. ענפי המתמטיקה המרכזיים "
          "כוללים אלגברה, גאומטריה, אנליזה ותורת המספרים, ולכל אחד מהם שיטות "
          "מחקר ומושגי יסוד משלו. המתמטיקה משמשת כשפה של המדעים המדויקים.")
ENGLISH = ("Mathematics is an area of knowledge that includes the topics of "
           "numbers, formulas, shapes and the spaces in which they are "
           "contained. It grew out of the need to count and to measure, and "
           "modern mathematics is built on proof from chosen axioms.")
SPANISH = ("Las matemáticas son un área del conocimiento que incluye números, "
           "fórmulas, figuras y los espacios en que están contenidas. Nacieron "
           "de la necesidad de contar y medir, y hoy se construyen sobre "
           "demostraciones a partir de axiomas elegidos.")


# --- language identification ------------------------------------------------

@pytest.mark.parametrize("text,expected", [
    (HEBREW, "he"), (ENGLISH, "en"), (SPANISH, "es"),
    ("שָׁלוֹם עֲלֵיכֶם וּבְרוּכִים הַבָּאִים אֶל בֵּית הַמִּדְרָשׁ", "he"),
])
def test_detects_the_three_languages(text, expected):
    code, confidence = detect(text)
    assert code == expected and confidence > 0.5


def test_code_switching_is_its_own_verdict():
    code, _ = detect("תכתוב לי function בפייתון שמקבלת list ומחזירה את הסכום")
    assert code == "mixed"


def test_mixed_counts_as_hebrew_for_filtering():
    """Hebrew with English technical terms is Hebrew. Rejecting it would strip
    exactly the code-switched data the brief asks RV5 to handle."""
    assert matches("ה-API הזה לא עובד, צריך לבדוק את ה-logs של השרת", "hebrew")


@pytest.mark.parametrize("text,script", [
    ("ਇਹ ਪੰਜਾਬੀ ਵਿੱਚ ਇੱਕ ਵਾਕ ਹੈ ਜੋ ਲੰਬਾ ਹੈ ਅਤੇ ਇਸ ਵਿੱਚ ਸ਼ਬਦ ਹਨ", "gurmukhi"),
    ("مرحبا كيف حالك اليوم أتمنى أن تكون بخير وأن يكون كل شيء جيد", "arabic"),
    ("Это предложение на русском языке и оно достаточно длинное", "cyrillic"),
])
def test_foreign_scripts_are_rejected(text, script):
    """The Punjabi case is not hypothetical: HPLT's heb_Hebr shard contains
    Punjabi documents, found while checking tokenizer round-trips."""
    code, _ = detect(text)
    assert code == f"other:{script}"
    assert not matches(text, "hebrew")


def test_short_latin_text_is_unknown_not_english():
    assert detect("LEKOY RV5")[0] == "unknown"
    assert detect("Pertenezco a la familia de modelos LEKOY.")[0] == "es"


def test_niqqud_is_measured_separately_from_language():
    assert niqqud_ratio("שָׁלוֹם עֲלֵיכֶם") > 0.3
    assert niqqud_ratio("שלום עליכם") == 0.0


def test_script_profile_counts_letters_only():
    profile = script_profile("שלום 12345 !!! world")
    assert profile["hebrew"] + profile["latin"] == pytest.approx(1.0)


# --- cleaning ---------------------------------------------------------------

def test_boilerplate_is_removed_in_three_languages():
    text = ("אתר זה משתמש בעוגיות כדי לשפר את החוויה.\n"
            + HEBREW + "\nWe use cookies on this site.\n"
            "Utilizamos cookies para mejorar la experiencia.\n"
            "כל הזכויות שמורות")
    cleaned, dropped = strip_boilerplate(text)
    assert dropped == 4
    assert "מתמטיקה" in cleaned and "עוגיות" not in cleaned


def test_navigation_runs_go_but_single_short_lines_stay():
    menu = "דף הבית\nאודות\nמוצרים\nשירותים\nצור קשר\n\n" + HEBREW
    cleaned, dropped = strip_navigation(menu)
    assert dropped >= 5 and "מתמטיקה" in cleaned

    heading = "כותרת\n\n" + HEBREW
    _, dropped_heading = strip_navigation(heading)
    assert dropped_heading == 0


def test_mojibake_round_trip():
    broken = HEBREW.encode("utf-8").decode("latin-1")
    assert looks_mojibake(broken)
    assert repair_encoding(broken) == HEBREW
    assert repair_encoding(HEBREW) == HEBREW      # correct text is left alone


def test_rtl_marks_survive_normalisation():
    """RLM and LRM are Unicode Cf. A naive control-character strip removes
    them and silently breaks the rendering of every mixed-direction sentence."""
    text = "שלום ‎English‎ עולם"
    assert "‎" in normalise(text)


def test_final_letters_are_not_folded():
    assert normalise("ארץ ישראל מים בן") == "ארץ ישראל מים בן"


def test_calculator_annotations_are_stripped():
    result = clean_document("Natalia sold 48/2 = <<48/2=24>>24 clips in May.")
    assert "<<" not in result["text"] and "24 clips" in result["text"]


# --- quality ----------------------------------------------------------------

def test_good_prose_scores_well():
    for text, language in ((HEBREW, "hebrew"), (ENGLISH, "english"),
                           (SPANISH, "spanish")):
        report = score_document(text, language)
        assert report.passed, (language, report.score, report.reasons)


def test_repetition_and_spam_are_caught():
    spam = "קנו עכשיו! קזינו אונליין בונוס! " * 12
    report = score_document(spam, "hebrew")
    assert not report.passed
    assert any("repetitive" in r or "spam" in r for r in report.reasons)


def test_wrong_language_fails_immediately():
    report = score_document(ENGLISH, "hebrew")
    assert report.score == 0.0 and "detected en" in report.reasons[0]


def test_short_answers_are_scored_structurally():
    """'4' is a complete answer to 'how much is 2+2'. The prose scorer would
    give it near-zero entropy and near-zero type-token ratio and fail it."""
    report = score_conversation(
        [{"role": "user", "content": "כמה זה 2+2?"},
         {"role": "assistant", "content": "4"}], "hebrew")
    assert report.passed


@pytest.mark.parametrize("messages,reason", [
    ([{"role": "user", "content": "שאלה"}], "last turn"),
    ([{"role": "user", "content": "שאלה"}, {"role": "assistant", "content": "  "}],
     "empty turn"),
    ([], "no messages"),
])
def test_broken_conversations_are_rejected(messages, reason):
    report = score_conversation(messages)
    assert report.score == 0.0
    assert any(reason in r for r in report.reasons)


# --- PII --------------------------------------------------------------------

def test_israeli_id_check_digit():
    assert valid_israeli_id("123456782")
    assert not valid_israeli_id("123456789")
    assert not valid_israeli_id("000000000")       # placeholder, not an ID


def test_nine_digits_that_are_not_an_id_survive():
    """Nine-digit runs are everywhere in ordinary text. Only the ones that
    pass the check digit are redacted."""
    text = "המוצר מספר 199234567 עלה 100 שקלים."
    redacted, _ = redact(text)
    assert "199234567" in redacted


def test_pii_is_redacted_with_typed_placeholders():
    text = "צרו קשר: yossi@example.co.il או 052-123-4567. ת.ז. 123456782."
    redacted, report = redact(text)
    assert "[EMAIL]" in redacted and "[PHONE]" in redacted and "[ID]" in redacted
    assert set(report.counts) == {"email", "phone", "israeli_id"}
    assert "yossi@example.co.il" not in redacted


def test_luhn_and_dni():
    assert valid_luhn("4111111111111111")
    assert not valid_luhn("4111111111111112")
    assert valid_dni("12345678", "Z")
    assert not valid_dni("12345678", "A")


def test_clean_text_scans_clean():
    assert scan(HEBREW).clean


# --- deduplication ----------------------------------------------------------

def test_exact_and_normalised_hashes():
    assert exact_hash(HEBREW) == exact_hash(HEBREW)
    assert exact_hash(HEBREW) != exact_hash(HEBREW + " ")
    assert normalised_hash(HEBREW) == normalised_hash(HEBREW.replace(".", " . "))
    assert normalised_hash(ENGLISH) == normalised_hash(ENGLISH.upper())


def test_three_passes_each_catch_their_own_case():
    docs = [
        (0, HEBREW),
        (1, HEBREW),                                   # exact
        (2, HEBREW.replace(",", " ,").replace(".", " .")),   # normalised
        (3, "כותרת האתר\n" + HEBREW + "\nכל הזכויות שמורות 2024"),   # near
        (4, SPANISH),                                  # different
    ]
    keep, stats = deduplicate(docs, threshold=0.5)
    assert stats.exact_duplicates == 1
    assert stats.normalised_duplicates == 1
    assert stats.near_duplicates == 1
    assert set(keep) == {0, 4}


def test_minhash_separates_related_from_unrelated():
    near = signature_of(HEBREW).jaccard(signature_of("כותרת\n" + HEBREW))
    unrelated = signature_of(HEBREW).jaccard(signature_of(SPANISH))
    assert near > 0.8 and unrelated < 0.1


def test_leakage_between_train_and_eval_is_found():
    leaks = find_leakage([(1, HEBREW), (2, SPANISH)], [(99, HEBREW)], threshold=0.5)
    assert [l["train_key"] for l in leaks] == [1]
    assert leaks[0]["jaccard"] > 0.9


# --- integrity and splitting ------------------------------------------------

def test_integrity_rejects_what_would_break_tokenization():
    records = [
        {"text": HEBREW},
        {"text": ""},
        {"text": "a\x00b" * 40},
        {"messages": [{"role": "user", "content": "q"}]},
        {"messages": [{"role": "wizard", "content": "x"},
                      {"role": "assistant", "content": "y"}]},
        {"messages": [{"role": "user", "content": "q"},
                      {"role": "assistant", "content": "a"}]},
    ]
    good, report = check_integrity(records)
    assert len(good) == 2
    assert report["problems"]["empty record"] == 1
    assert report["problems"]["null byte"] == 1
    assert report["problems"]["unknown role"] == 1


def test_split_is_deterministic_and_stable_as_the_corpus_grows():
    """Assignment is hashed from the text, so adding documents does not move
    existing ones between train and test — which would invalidate every
    previously reported number."""
    first = [{"text": f"document number {i} " + HEBREW} for i in range(400)]
    a = split_records(first)
    b = split_records(first + [{"text": "a new document " + SPANISH}])
    assert {text_of(r) for r in a["test"]} <= {text_of(r) for r in b["test"]}
    assert {text_of(r) for r in a["train"]} <= {text_of(r) for r in b["train"]}
    assert sum(len(v) for v in a.values()) == 400
    assert 0 < len(a["test"]) < 40


def test_text_of_handles_both_record_shapes():
    assert text_of({"text": "x"}) == "x"
    assert "q" in text_of({"messages": [{"role": "user", "content": "q"}]})
    assert text_of({}) == ""
