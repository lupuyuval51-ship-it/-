"""Metrics, suites, the LEKOY SCORE and the regression gate."""
from __future__ import annotations

import pytest

from lekoy.evaluation import tasks
from lekoy.evaluation.hebrew_benchmark import ITEMS, by_category
from lekoy.evaluation.metrics import (contains, exact_match, extract_choice,
                                      extract_number, fabricated_specific_claim,
                                      format_compliance,
                                      hebrew_agreement_errors, language_match,
                                      numeric_match, token_f1,
                                      uncertainty_expressed)
from lekoy.evaluation.runner import extract_code, run_code_item, score_item
from lekoy.evaluation.score import (ABSOLUTE_FLOORS, DIMENSION_SUITES,
                                    REGRESSION_THRESHOLDS, WEIGHTS, compute,
                                    leaderboard, regression_check,
                                    validate_weights)


# --- metrics ----------------------------------------------------------------

@pytest.mark.parametrize("response,expected", [
    ("B", "B"),
    ("The answer is B, because unlike C it is entropy that never decreases.", "B"),
    ("(c)", "C"),
    ("תשובה ב", "B"),
    ("2", "B"),
    ("D. Perpetual motion", "D"),
    ("nothing useful here", None),
])
def test_choice_extraction(response, expected):
    assert extract_choice(response, 4) == expected


def test_choice_takes_the_first_marker_not_the_last():
    """"B, because unlike C..." has answered B. A last-match rule scores it C."""
    assert extract_choice("B, because unlike C this one is right", 4) == "B"


@pytest.mark.parametrize("text,expected", [
    ("#### 72", 72.0),
    ("So the total is 1,250 shekels.", 1250.0),
    ("The answer is 3.5", 3.5),
    ("no numbers", None),
])
def test_number_extraction(text, expected):
    assert extract_number(text) == expected


def test_numeric_match_ignores_the_working():
    assert numeric_match("48 in April plus 24 in May, so 72 clips.", "#### 72") == 1.0
    assert numeric_match("so 71 clips", "#### 72") == 0.0


def test_language_match_scores_the_reply_not_the_prompt():
    assert language_match("שלום, מה שלומך היום?", "hebrew") == 1.0
    assert language_match("Hello, how are you today?", "hebrew") == 0.0
    assert language_match("ה-API הזה עובד מצוין", "hebrew") == 0.8   # code switching
    assert language_match("4", "hebrew") == 0.5                      # too short to tell


def test_exact_contains_and_f1():
    assert exact_match("The Answer.", "the answer") == 1.0
    assert contains("I think the answer is Madrid, in Spain.", "Madrid") == 1.0
    assert 0 < token_f1("a red car", "a blue car") < 1


def test_hebrew_agreement_detector_is_precise():
    assert hebrew_agreement_errors("שלושה בנות הלכו הביתה") 
    assert hebrew_agreement_errors("היא כתב מכתב ארוך")
    assert hebrew_agreement_errors("שלוש בנים שיחקו")
    assert hebrew_agreement_errors("שלוש בנות הלכו הביתה. היא כתבה מכתב.") == []
    assert hebrew_agreement_errors("שלושה בנים שיחקו בחצר") == []


def test_format_compliance_checks_the_stated_constraint():
    ok, failures = format_compliance('{"name": "דנה", "age": 34}',
                                     {"json": True, "json_keys": ["name", "age"]})
    assert ok == 1.0 and not failures

    ok, failures = format_compliance("```json\n{\"a\": 1}\n```",
                                     {"json": True, "json_keys": ["a"]})
    assert ok == 1.0, "a fenced JSON block is still JSON"

    ok, failures = format_compliance("one two three four five",
                                     {"max_words": 3})
    assert ok == 0.0 and "more than 3 words" in failures[0]

    ok, failures = format_compliance("**bold**", {"no_markdown": True})
    assert ok == 0.0


def test_must_contain_any_accepts_alternatives():
    """A translation may legitimately pick any of several valid words."""
    ok, _ = format_compliance("The train arrives in twenty minutes.",
                              {"must_contain_any": ["train", "railway"]})
    assert ok == 1.0
    ok, _ = format_compliance("The bus arrives soon.",
                              {"must_contain_any": ["train", "railway"]})
    assert ok == 0.0


def test_uncertainty_and_fabrication_are_opposites():
    hedged = "אני לא יודע, אין לי גישה לנתונים בזמן אמת."
    fabricated = "שער הדולר אתמול היה 3.71 שקלים."
    assert uncertainty_expressed(hedged)
    assert not fabricated_specific_claim(hedged)
    assert not uncertainty_expressed(fabricated)
    assert fabricated_specific_claim(fabricated)


# --- the Hebrew benchmark ---------------------------------------------------

def test_hebrew_benchmark_is_well_formed():
    seen = set()
    for item in ITEMS:
        assert item["id"] not in seen, f"duplicate id {item['id']}"
        seen.add(item["id"])
        assert item["prompt"].strip()
        assert item["scorer"] in {"exact", "contains", "numeric", "choice",
                                  "format", "language"}
        if item["scorer"] == "choice":
            assert item["correct"] in "ABCD"
        elif item["scorer"] == "format":
            assert item["requirement"]
        elif item["scorer"] == "language":
            assert item["expected_language"]
        else:
            assert item["answer"]


def test_hebrew_benchmark_covers_the_brief():
    """The brief names these categories specifically."""
    required = {"reading_comprehension", "grammar", "writing", "conversation",
                "summarisation", "logic", "math", "science", "history",
                "technology", "translation", "slang", "formal", "mixed",
                "instruction_following"}
    assert required <= set(by_category())


def test_hebrew_benchmark_answers_are_actually_in_hebrew():
    from lekoy.data.langid import detect
    for item in ITEMS:
        code, _ = detect(item["prompt"])
        assert code in ("he", "mixed", "unknown"), (item["id"], code)


# --- suites -----------------------------------------------------------------

def test_all_suites_load_and_are_well_formed():
    suites = tasks.load()
    assert len(suites) >= 15
    for name, items in suites.items():
        assert items, name
        for item in items:
            assert item["id"] and item["prompt"] and item["scorer"]


def test_identity_suite_suppresses_the_system_prompt():
    """With the LEKOY system prompt in context an untrained base reads its own
    name off the prompt and scores a perfect 1.000. Measured: 1.000 with,
    0.000 without."""
    for item in tasks.identity():
        assert item["system_prompt"] is None, item["id"]


def test_translation_covers_all_six_directions():
    languages = {item["requirement"]["language"] for item in tasks.translation()}
    assert languages == {"hebrew", "english", "spanish"}
    assert len(tasks.translation()) >= 6


def test_unknown_suite_is_an_error():
    with pytest.raises(KeyError, match="unknown suite"):
        tasks.load(["not_a_suite"])


# --- code execution ---------------------------------------------------------

def test_generated_code_is_scored_by_running_it():
    item = {"id": "t", "scorer": "code", "entry": "add_numbers",
            "tests": ["assert add_numbers(2, 3) == 5", "assert add_numbers(-1, 1) == 0"]}
    good = "```python\ndef add_numbers(a, b):\n    return a + b\n```"
    bad = "```python\ndef add_numbers(a, b):\n    return a - b\n```"
    assert run_code_item(good, item)[0] == 1.0
    assert run_code_item(bad, item)[0] == 0.0
    assert run_code_item("just some prose", item)[0] == 0.0


def test_infinite_loop_is_killed_not_waited_on():
    item = {"id": "t", "scorer": "code", "entry": "f", "tests": ["assert f()"]}
    score, detail = run_code_item("```python\ndef f():\n    while True: pass\n```",
                                  item, timeout=3)
    assert score == 0.0 and "timed out" in detail


def test_code_without_fences_still_counts():
    """A model that emits bare code has answered the coding question. Failing
    it there would conflate coding with instruction following, which the suite
    measures separately."""
    assert "def f" in extract_code("def f():\n    return 1")


# --- scoring ----------------------------------------------------------------

def test_weights_sum_to_one():
    validate_weights()
    assert abs(sum(WEIGHTS.values()) - 1.0) < 1e-9
    assert WEIGHTS["hebrew"] == 0.25
    assert WEIGHTS["hebrew"] > WEIGHTS["english"] > WEIGHTS["spanish"]


def test_every_dimension_has_suites_and_a_threshold():
    assert set(DIMENSION_SUITES) == set(WEIGHTS)
    assert set(REGRESSION_THRESHOLDS) == set(WEIGHTS)


def test_partial_runs_renormalise_rather_than_scoring_zero():
    score = compute({"hebrew": 0.5})
    assert score.total == 0.5
    assert score.coverage < 1.0
    assert "coding" in score.missing


def test_multiple_suites_per_dimension_average():
    score = compute({"hebrew": 0.4, "belebele_hebrew": 0.6})
    assert score.dimensions["hebrew"] == pytest.approx(0.5)


# A plausible mid-training checkpoint. Reliability sits above its absolute
# floor on purpose: these tests are about relative regression, and a baseline
# that already trips the floor would make every verdict fail for that reason
# instead of the one under test.
BASE = {"hebrew": 0.30, "english": 0.60, "spanish": 0.50, "reasoning": 0.20,
        "coding": 0.30, "instruction_following": 0.44, "math": 0.20,
        "global_mmlu_hebrew": 0.30, "hallucination": 0.50, "identity": 0.40}


def test_a_balanced_improvement_passes():
    better = dict(BASE, hebrew=0.42, identity=0.95, instruction_following=0.50)
    verdict = regression_check(compute(BASE), compute(better))
    assert verdict.passed and verdict.score_delta > 0
    assert "hebrew" in verdict.improvements


def test_the_brief_s_named_failure_case_is_blocked():
    """Hebrew +15%, English −30%: the brief calls this out by name as a
    checkpoint that must not be promoted."""
    traded = dict(BASE, hebrew=0.345, english=0.42)
    verdict = regression_check(compute(BASE), compute(traded))
    assert not verdict.passed
    assert "english" in verdict.blocking
    assert "hebrew" in verdict.improvements


def test_relative_not_absolute_regression():
    """0.80 -> 0.74 and 0.20 -> 0.14 are the same absolute drop of 0.06. The
    first is a 7.5% loss and tolerable; the second is 30% and is not."""
    high = regression_check(compute(dict(BASE, coding=0.80)),
                            compute(dict(BASE, coding=0.74)))
    low = regression_check(compute(dict(BASE, coding=0.20)),
                           compute(dict(BASE, coding=0.14)))
    assert high.passed, high.summary()
    assert not low.passed and "coding" in low.blocking


def test_reliability_has_an_absolute_floor():
    assert "reliability" in ABSOLUTE_FLOORS
    below = dict(BASE, hallucination=0.05, identity=0.05)
    verdict = regression_check(compute(BASE), compute(below))
    assert not verdict.passed and "reliability" in verdict.blocking


def test_dropping_a_dimension_from_the_comparison_is_blocked():
    partial = {k: v for k, v in BASE.items() if k != "coding"}
    verdict = regression_check(compute(BASE), compute(partial))
    assert not verdict.passed and "coding" in verdict.blocking


def test_leaderboard_ranks_by_score():
    table = leaderboard([
        {"name": "a", "lekoy_score": 0.31, "dimensions": {"hebrew": 0.3}},
        {"name": "b", "lekoy_score": 0.44, "dimensions": {"hebrew": 0.5}},
    ])
    assert table.index("`b`") < table.index("`a`")


def test_score_item_dispatches_every_scorer():
    cases = [
        ({"id": "1", "scorer": "choice", "correct": "B", "num_options": 4}, "B", 1.0),
        ({"id": "2", "scorer": "numeric", "answer": "72"}, "the total is 72", 1.0),
        ({"id": "3", "scorer": "contains", "answer": "Madrid"}, "It is Madrid.", 1.0),
        ({"id": "4", "scorer": "format", "requirement": {"max_words": 3}}, "one two", 1.0),
        ({"id": "5", "scorer": "language", "expected_language": "hebrew"},
         "שלום לך, מה שלומך היום?", 1.0),
        ({"id": "6", "scorer": "uncertainty"}, "אני לא יודע.", 1.0),
        ({"id": "7", "scorer": "identity", "acceptable": ["LEKOY RV5"]},
         "I am LEKOY RV5.", 1.0),
        ({"id": "8", "scorer": "identity", "acceptable": ["LEKOY RV5"]},
         "I am Qwen, created by Alibaba Cloud.", 0.0),
    ]
    for item, response, expected in cases:
        assert score_item(item, response)["score"] == expected, item["id"]


def test_unknown_scorer_raises():
    with pytest.raises(ValueError, match="unknown scorer"):
        score_item({"id": "x", "scorer": "vibes"}, "anything")
