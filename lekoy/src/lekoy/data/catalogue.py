"""The datasets LEKOY RV5 is allowed to train on, and what each one is for.

Every entry here was checked against the live hub before being written down:
the config exists, the split exists, the column names are the ones named below,
and the licence is the one the publisher states. Nothing is aspirational.

Two findings from that check shaped the Hebrew half of the corpus, and both are
worth stating plainly because they are the central difficulty of the project:

  * **Aya has no Hebrew.** `CohereLabs/aya_dataset` is the obvious first stop
    for human-written multilingual instruction data — 202,362 rows, Apache 2.0,
    65 languages. Hebrew is not one of them. Measured, not assumed: the shard
    was downloaded and counted (3,854 Spanish, 3,944 English, 0 Hebrew).
  * **There is no large open Hebrew instruction set.** Searching the hub for
    Hebrew instruction data returns evaluation traces and speech corpora, not
    instruction pairs. Hebrew *text* is plentiful (HPLT, FineWeb-2, Wikipedia
    are all large and permissive); Hebrew *instruction-response* data is not.

That asymmetry is why the training plan puts unusual weight on Stage 1
continued pretraining for Hebrew, and builds the Hebrew instruction set from
three narrower sources — xP3x targets, OASST's Hebrew conversations, and
hand-written seed data — rather than from one big corpus that does not exist.
"""
from __future__ import annotations

from .sources import DatasetSource

# --- Pretraining: raw text -------------------------------------------------

PRETRAIN: list[DatasetSource] = [
    DatasetSource(
        name="hplt2_hebrew", dataset="HPLT/HPLT2.0_cleaned", config="heb_Hebr",
        split="train", language="hebrew", licence="cc0-1.0", category="pretrain",
        text_field="text", rows=40_000, max_shards=1, min_chars=200,
        notes="Cleaned CommonCrawl/Internet Archive Hebrew. CC0, so no "
              "attribution or share-alike obligation attaches to the weights. "
              "Rows carry per-document quality signals (prob, doc_scores, pii) "
              "which the filter stage reads before its own scoring.",
        extra_fields=["u", "prob", "collection"]),
    DatasetSource(
        name="fineweb2_hebrew", dataset="HuggingFaceFW/fineweb-2", config="heb_Hebr",
        split="train", language="hebrew", licence="odc-by", category="pretrain",
        text_field="text", rows=40_000, max_shards=1, min_chars=200,
        notes="FineWeb-2 Hebrew. Carries language_score, which the filter uses "
              "as a prior alongside our own detector rather than instead of it.",
        extra_fields=["url", "language_score", "minhash_cluster_size"]),
    DatasetSource(
        name="wikipedia_hebrew", dataset="wikimedia/wikipedia", config="20231101.he",
        split="train", language="hebrew", licence="cc-by-sa-3.0", category="pretrain",
        text_field="text", rows=30_000, max_shards=1, min_chars=400,
        notes="Hebrew Wikipedia. Formal, edited, encyclopaedic register — the "
              "counterweight to web text, and the source of most of the "
              "scientific and historical Hebrew vocabulary in the corpus. "
              "CC BY-SA: attribution is recorded in MODEL_CARD.md.",
        extra_fields=["url", "title"]),
    DatasetSource(
        name="wikipedia_english", dataset="wikimedia/wikipedia", config="20231101.en",
        split="train", language="english", licence="cc-by-sa-3.0", category="pretrain",
        text_field="text", rows=12_000, max_shards=1, min_chars=400,
        notes="English replay data. Present to hold English steady during "
              "Hebrew-heavy continued pretraining, not to teach English.",
        extra_fields=["url", "title"]),
    DatasetSource(
        name="wikipedia_spanish", dataset="wikimedia/wikipedia", config="20231101.es",
        split="train", language="spanish", licence="cc-by-sa-3.0", category="pretrain",
        text_field="text", rows=12_000, max_shards=1, min_chars=400,
        notes="Spanish replay data, same role as the English shard.",
        extra_fields=["url", "title"]),
    DatasetSource(
        name="hplt2_spanish", dataset="HPLT/HPLT2.0_cleaned", config="spa_Latn",
        split="train", language="spanish", licence="cc0-1.0", category="pretrain",
        text_field="text", rows=8_000, max_shards=1, min_chars=200,
        notes="Spanish web text, both peninsular and Latin American, which is "
              "what keeps RV5 able to hold a dialect rather than averaging one.",
        extra_fields=["u", "prob"]),
]

# --- Instruction tuning ----------------------------------------------------

INSTRUCTION: list[DatasetSource] = [
    DatasetSource(
        name="xp3x_hebrew", dataset="CohereLabs/xP3x", config="heb_Hebr",
        split="train", language="hebrew", licence="apache-2.0",
        category="instruction", prompt_field="inputs", text_field="targets",
        rows=20_000, max_shards=1,
        notes="xP3x rows whose target side is Hebrew. Cross-lingual by design, "
              "so the prompt is often in another language — the language "
              "detector sorts them at the clean stage and the mixed-language "
              "pairs are kept deliberately as code-switching data.",
        extra_fields=["dataset", "template"]),
    DatasetSource(
        name="xp3x_spanish", dataset="CohereLabs/xP3x", config="spa_Latn",
        split="train", language="spanish", licence="apache-2.0",
        category="instruction", prompt_field="inputs", text_field="targets",
        rows=8_000, max_shards=1, access="rows",
        notes="Same, Spanish side. The hub's parquet conversion of xP3x covers "
              "only some of its 277 configs and spa_Latn is not one of them, so "
              "this source is paged through the rows API instead — slower, but "
              "it is the difference between having Spanish instruction data and "
              "not having it.",
        extra_fields=["dataset", "template"]),
    DatasetSource(
        name="aya_spanish", dataset="CohereLabs/aya_dataset", config="default",
        split="train", language="spanish", licence="apache-2.0",
        category="instruction", prompt_field="inputs", text_field="targets",
        filter_field="language", filter_values=["Spanish"],
        rows=4_000, max_shards=1,
        notes="Human-written, natively Spanish instruction pairs — not "
              "translated from English, which is the property that matters "
              "here. 3,854 rows is what the shard actually holds. Stands in "
              "for xp3x_spanish, whose hub export is unavailable.",
        extra_fields=["language", "annotation_type"]),
    DatasetSource(
        name="aya_english", dataset="CohereLabs/aya_dataset", config="default",
        split="train", language="english", licence="apache-2.0",
        category="instruction", prompt_field="inputs", text_field="targets",
        filter_field="language", filter_values=["English"],
        rows=4_000, max_shards=1,
        notes="English arm of the same human-annotated set, used as replay "
              "data so the English register does not drift toward the "
              "synthetic style of UltraChat alone.",
        extra_fields=["language", "annotation_type"]),
    DatasetSource(
        name="oasst2", dataset="OpenAssistant/oasst2", config="default",
        split="train", language="multi", licence="apache-2.0",
        category="instruction", text_field="text", rows=200_000, max_shards=1,
        notes="Human-written assistant conversations, message-tree shaped. "
              "`build_oasst_conversations` reconstructs threads from "
              "parent_id and keeps the Hebrew, Spanish and English ones. Also "
              "the source of the preference pairs, via sibling `rank`.",
        extra_fields=["message_id", "parent_id", "role", "lang", "rank",
                      "message_tree_id", "deleted", "review_result", "labels"]),
    DatasetSource(
        name="ultrachat_english", dataset="HuggingFaceH4/ultrachat_200k",
        config="default", split="train_sft", language="english", licence="mit",
        category="instruction", messages_field="messages", rows=8_000, max_shards=1,
        notes="Multi-turn English instruction following. Replay data that "
              "keeps English chat quality from drifting during Hebrew SFT."),
]

# --- Reasoning and maths ---------------------------------------------------

REASONING: list[DatasetSource] = [
    DatasetSource(
        name="gsm8k", dataset="openai/gsm8k", config="main", split="train",
        language="english", licence="mit", category="reasoning",
        prompt_field="question", text_field="answer", rows=7_473, max_shards=1,
        notes="Grade-school word problems with worked solutions. The <<..>> "
              "calculator annotations are stripped at the clean stage: RV5 "
              "should learn the reasoning, not the annotation format."),
]

# --- Coding ----------------------------------------------------------------
#
# All-English by necessity: there is no Hebrew or Spanish code-instruction
# corpus of any size. That is less limiting than it sounds — code itself is
# language-neutral, and the seed data in seed.py covers the case the brief
# actually asks for, which is a Hebrew question answered with code plus a
# Hebrew explanation.

CODING: list[DatasetSource] = [
    DatasetSource(
        name="codefeedback", dataset="m-a-p/CodeFeedback-Filtered-Instruction",
        config="default", split="train", language="english", licence="apache-2.0",
        category="coding", prompt_field="query", text_field="answer",
        rows=12_000, max_shards=1,
        notes="Filtered code-instruction pairs across Python, JavaScript, Java, "
              "C++, Go, Rust and SQL, with the language labelled per row so the "
              "mixture can be checked rather than assumed.",
        extra_fields=["lang", "resource"]),
    DatasetSource(
        name="codealpaca", dataset="sahil2801/CodeAlpaca-20k", config="default",
        split="train", language="english", licence="cc-by-4.0", category="coding",
        prompt_field="instruction", text_field="output", rows=8_000, max_shards=1,
        notes="Short, self-contained coding tasks. Shallower than CodeFeedback "
              "and useful for exactly that reason: it covers the one-line "
              "requests that a filtered corpus of long answers under-represents.",
        extra_fields=["input"]),
]


# --- Evaluation ------------------------------------------------------------
#
# Held out of training entirely. `scripts/deduplicate.py --check-leakage`
# asserts that no training document overlaps these, and the check runs before
# every training stage rather than only at the end.

EVALUATION: list[DatasetSource] = [
    DatasetSource(
        name="belebele_hebrew", dataset="facebook/belebele", config="heb_Hebr",
        split="test", language="hebrew", licence="cc-by-sa-4.0",
        category="evaluation", text_field="flores_passage", rows=900, max_shards=1,
        notes="Reading comprehension, 4-way multiple choice, parallel across "
              "122 languages — so the Hebrew and Spanish scores are directly "
              "comparable to the English one on identical passages.",
        extra_fields=["question", "mc_answer1", "mc_answer2", "mc_answer3",
                      "mc_answer4", "correct_answer_num", "link"]),
    DatasetSource(
        name="belebele_english", dataset="facebook/belebele", config="eng_Latn",
        split="test", language="english", licence="cc-by-sa-4.0",
        category="evaluation", text_field="flores_passage", rows=900, max_shards=1,
        notes="English arm of the same parallel benchmark.",
        extra_fields=["question", "mc_answer1", "mc_answer2", "mc_answer3",
                      "mc_answer4", "correct_answer_num", "link"]),
    DatasetSource(
        name="belebele_spanish", dataset="facebook/belebele", config="spa_Latn",
        split="test", language="spanish", licence="cc-by-sa-4.0",
        category="evaluation", text_field="flores_passage", rows=900, max_shards=1,
        notes="Spanish arm of the same parallel benchmark.",
        extra_fields=["question", "mc_answer1", "mc_answer2", "mc_answer3",
                      "mc_answer4", "correct_answer_num", "link"]),
    DatasetSource(
        name="global_mmlu_hebrew", dataset="CohereLabs/Global-MMLU", config="he",
        split="test", language="hebrew", licence="apache-2.0",
        category="evaluation", text_field="question", rows=1_000, max_shards=1,
        notes="MMLU professionally translated into Hebrew, with the culturally "
              "sensitive items labelled. Measures knowledge in Hebrew rather "
              "than Hebrew fluency, which is a different axis and moves "
              "differently under training.",
        extra_fields=["subject", "subject_category", "option_a", "option_b",
                      "option_c", "option_d", "answer", "cultural_sensitivity_label"]),
    DatasetSource(
        name="global_mmlu_spanish", dataset="CohereLabs/Global-MMLU", config="es",
        split="test", language="spanish", licence="apache-2.0",
        category="evaluation", text_field="question", rows=1_000, max_shards=1,
        notes="Spanish arm of Global-MMLU.",
        extra_fields=["subject", "subject_category", "option_a", "option_b",
                      "option_c", "option_d", "answer", "cultural_sensitivity_label"]),
    DatasetSource(
        name="global_mmlu_english", dataset="CohereLabs/Global-MMLU", config="en",
        split="test", language="english", licence="apache-2.0",
        category="evaluation", text_field="question", rows=1_000, max_shards=1,
        notes="English arm of Global-MMLU, the reference point for the "
              "Hebrew and Spanish regressions.",
        extra_fields=["subject", "subject_category", "option_a", "option_b",
                      "option_c", "option_d", "answer", "cultural_sensitivity_label"]),
    DatasetSource(
        name="gsm8k_test", dataset="openai/gsm8k", config="main", split="test",
        language="english", licence="mit", category="evaluation",
        prompt_field="question", text_field="answer", rows=1_319, max_shards=1,
        notes="GSM8K test split, held out from the training split above."),
]

ALL: list[DatasetSource] = (PRETRAIN + INSTRUCTION + REASONING + CODING
                           + EVALUATION)

BY_NAME = {s.name: s for s in ALL}
BY_CATEGORY: dict[str, list[DatasetSource]] = {}
for _s in ALL:
    BY_CATEGORY.setdefault(_s.category, []).append(_s)


def select(names: list[str] | None = None, categories: list[str] | None = None,
           languages: list[str] | None = None) -> list[DatasetSource]:
    """Pick sources by name, category or language; no filter means everything."""
    picked = ALL
    if names:
        unknown = set(names) - set(BY_NAME)
        if unknown:
            raise KeyError(f"unknown dataset(s): {sorted(unknown)}; "
                           f"known: {sorted(BY_NAME)}")
        picked = [BY_NAME[n] for n in names]
    if categories:
        picked = [s for s in picked if s.category in categories]
    if languages:
        picked = [s for s in picked if s.language in languages or s.language == "multi"]
    return picked
