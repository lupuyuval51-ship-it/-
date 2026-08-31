"""Identity: the name, the prompts, and detecting a foreign claim."""
from __future__ import annotations

import pytest

from lekoy import FAMILY, FULL_NAME, MODEL
from lekoy.identity import (FOREIGN_IDENTITIES, IDENTITY_QA,
                            claims_foreign_identity, system_prompt)


def test_names():
    assert FAMILY == "LEKOY" and MODEL == "RV5" and FULL_NAME == "LEKOY RV5"


@pytest.mark.parametrize("language", ["he", "en", "es"])
def test_system_prompt_states_the_identity(language):
    prompt = system_prompt(language)
    assert FULL_NAME in prompt and FAMILY in prompt
    assert len(prompt) > 200
    assert not claims_foreign_identity(prompt)


def test_unknown_language_falls_back_to_hebrew():
    assert system_prompt("fr") == system_prompt("he")


@pytest.mark.parametrize("text", [
    "I am ChatGPT, a language model by OpenAI.",
    "אני מודל בשם Claude",
    "Soy un modelo Gemini de Google.",
    "My name is Qwen.",
    "I'm an AI assistant developed by Anthropic.",
])
def test_first_person_claims_are_caught(text):
    assert claims_foreign_identity(text), text


@pytest.mark.parametrize("text", [
    "No, I am not ChatGPT. I am LEKOY RV5.",
    "לא, אני לא Claude — אני LEKOY RV5.",
    "Qwen2.5 is a strong open-weights model.",
    "The base model for LEKOY RV5 is Qwen2.5-0.5B-Instruct.",
    "Gemini and GPT-4 are both proprietary.",
])
def test_mentions_and_denials_are_not_claims(text):
    assert claims_foreign_identity(text) == [], text


def test_identity_questions_cover_three_languages():
    languages = {lang for lang, _, _ in IDENTITY_QA}
    assert languages == {"he", "en", "es"}
    assert len(IDENTITY_QA) >= 15


def test_every_identity_question_has_a_checkable_answer():
    for lang, question, acceptable in IDENTITY_QA:
        assert question.strip()
        assert acceptable and all(a.strip() for a in acceptable)
        assert any(a in (FULL_NAME, FAMILY, MODEL) for a in acceptable)


def test_foreign_identity_list_covers_the_named_models():
    for name in ("ChatGPT", "Claude", "Gemini", "Grok", "OpenAI", "Qwen"):
        assert name in FOREIGN_IDENTITIES
