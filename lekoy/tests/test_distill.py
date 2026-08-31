"""The teacher faculty, the licence gate, verification and the mixture build.

Nothing here touches the network or loads a model. The registry on disk is
treated as data — the tests check its shape and its invariants, not the
particular hundred models that happened to clear the gate on the day it was
built, because that set is expected to change when a licence changes.
"""
from __future__ import annotations

import json

import pytest

from lekoy.distill import licences, mixture, plan, registry
from lekoy.distill.generate import completed, load_responses
from lekoy.distill.prompts import (Prompt, read_prompts, seed_prompts,
                                   write_prompts)
from lekoy.distill.registry import CODE_FLOOR, TARGET, select
from lekoy.distill.teachers import CANDIDATES, CODE, Teacher
from lekoy.distill.verify import (hebrew_is_clean, looks_like_refusal,
                                  verify_consensus, verify_execute,
                                  verify_item, verify_language)

WORKING = ("def chunk(items, size):\n"
           "    if size < 1:\n        raise ValueError('size')\n"
           "    return [items[i:i + size] for i in range(0, len(items), size)]")
BROKEN = "def chunk(items, size):\n    return []"


def teacher(model_id="x/y", licence="apache-2.0", params=7_000_000_000, **kw):
    return Teacher(id=model_id, role=kw.pop("role", CODE), note="",
                   licence=licence, params=params, **kw)


# --- licences ---------------------------------------------------------------

def test_permissive_licences_are_unconditional():
    for name in ("apache-2.0", "mit", "bsd-3-clause", "cc0-1.0"):
        verdict = licences.classify(name)
        assert verdict.status == licences.PERMITTED
        assert verdict.usable and verdict.free


def test_llama2_is_refused_because_it_forbids_distillation():
    """The distinction the whole gate exists for."""
    assert licences.classify("llama2").status == licences.REFUSED
    assert licences.classify("llama3").status == licences.REFUSED
    assert licences.classify("llama3.1").status == licences.CONDITIONAL


def test_llama31_carries_the_naming_obligation():
    verdict = licences.classify("llama3.1")
    assert "Llama" in verdict.reason
    assert verdict.usable and not verdict.free


def test_licence_name_beats_the_other_placeholder():
    """Qwen2.5-Coder-3B is research-only inside an Apache-2.0 family."""
    assert licences.classify("other", "qwen-research").status == licences.REFUSED
    assert licences.classify("other", "deepseek").status == licences.CONDITIONAL
    assert licences.classify("apache-2.0", None).status == licences.PERMITTED


def test_unreadable_licence_is_refused_not_assumed():
    assert licences.classify("other").status == licences.REFUSED
    assert licences.classify(None).status == licences.REFUSED
    assert licences.classify("a-licence-nobody-has-read").status == licences.REFUSED


def test_non_commercial_is_refused():
    assert licences.classify("cc-by-nc-4.0").status == licences.REFUSED
    assert licences.classify("other", "mnpl").status == licences.REFUSED


def test_obligations_are_deduplicated():
    verdicts = [licences.classify("llama3.1"), licences.classify("llama3.1"),
                licences.classify("gemma"), licences.classify("mit")]
    obligations = licences.obligations(verdicts)
    assert len(obligations) == 2                       # llama3.1 and gemma, once each


# --- the curated candidate table --------------------------------------------

def test_candidate_ids_are_unique():
    ids = [c[0] for c in CANDIDATES]
    assert len(ids) == len(set(ids))


def test_every_candidate_has_a_note():
    for model_id, _role, _also, note in CANDIDATES:
        assert note.strip(), f"{model_id} has no note"


# --- selection --------------------------------------------------------------

def test_selection_fills_the_code_floor_first():
    pool = ([teacher(f"code/{i}", params=20_000_000_000) for i in range(60)] +
            [teacher(f"gen/{i}", role="general", params=20_000_000_000)
             for i in range(60)])
    chosen, _ = select(pool, target=20, code_floor=15)
    assert len(chosen) == 20
    assert sum(1 for t in chosen if CODE in t.roles()) >= 15


def test_selection_refuses_by_licence_not_by_rank():
    pool = [teacher("bad/one", licence="llama2"),
            teacher("good/one", licence="apache-2.0")]
    chosen, rejected = select(pool, target=10, code_floor=0)
    assert [t.id for t in chosen] == ["good/one"]
    assert rejected[0].id == "bad/one"
    assert "1.b.v" in rejected[0].reason


def test_selection_records_a_reason_for_everything_it_drops():
    pool = [teacher(f"code/{i}", params=7_000_000_000) for i in range(10)]
    _, rejected = select(pool, target=3, code_floor=1)
    assert len(rejected) == 7
    assert all(t.reason for t in rejected)


def test_ranking_prefers_larger_teachers_over_peers():
    pool = [teacher("peer/small", params=1_000_000_000),
            teacher("strong/big", params=30_000_000_000)]
    chosen, _ = select(pool, target=1, code_floor=0)
    assert chosen[0].id == "strong/big"


def test_tier_boundaries():
    assert teacher(params=500_000_000).tier == "peer"
    assert teacher(params=7_000_000_000).tier == "strong"
    assert teacher(params=70_000_000_000).tier == "frontier"
    assert teacher(params=None).tier == "unknown"


def test_vram_scales_with_precision():
    """8B weights: 2 bytes each in bf16, half a byte in int4, plus overhead."""
    t = teacher(params=8_000_000_000)
    assert t.vram_gb(16) == pytest.approx(17.3, abs=0.1)
    assert t.vram_gb(4) == pytest.approx(4.3, abs=0.1)


# --- the built registry -----------------------------------------------------

@pytest.fixture(scope="module")
def built(repo_root):
    path = repo_root / "data" / "teachers_registry.json"
    if not path.exists():
        pytest.skip("registry not built; run scripts/build_teachers.py")
    return json.loads(path.read_text(encoding="utf-8"))


def test_registry_holds_the_target_faculty(built):
    assert built["summary"]["selected"] == TARGET
    assert len(built["teachers"]) == TARGET


def test_registry_meets_the_code_floor(built):
    assert built["summary"]["code_teachers"] >= CODE_FLOOR


def test_no_selected_teacher_has_a_refused_licence(built):
    for entry in built["teachers"]:
        assert entry["licence_verdict"] in (licences.PERMITTED, licences.CONDITIONAL), \
            f"{entry['id']} is selected with verdict {entry['licence_verdict']}"


def test_every_rejection_states_a_reason(built):
    for entry in built["rejected"]:
        assert entry.get("reason"), f"{entry['id']} was rejected without a reason"


def test_conditional_teachers_put_their_obligation_in_the_summary(built):
    conditional = {e["licence_verdict"] for e in built["teachers"]}
    if licences.CONDITIONAL in conditional:
        assert built["release_obligations"]


def test_registry_loads_into_teacher_objects(repo_root):
    path = repo_root / "data" / "teachers_registry.json"
    if not path.exists():
        pytest.skip("registry not built")
    faculty = registry.load(path)
    assert len(faculty) == TARGET
    assert all(t.verdict.usable for t in faculty)


def test_filter_by_vram_excludes_what_will_not_fit(repo_root):
    path = repo_root / "data" / "teachers_registry.json"
    if not path.exists():
        pytest.skip("registry not built")
    faculty = registry.load(path)
    small = registry.filter_teachers(faculty, max_vram_gb=24, bits=4)
    assert small
    assert all(t.vram_gb(4) <= 24 for t in small)
    assert len(small) < len(faculty)


# --- verification -----------------------------------------------------------

def test_execution_accepts_working_code():
    judgement = verify_execute(WORKING, seed_prompts()[0])
    assert judgement.ok and judgement.score == 1.0


def test_execution_rejects_code_that_fails_its_assertions():
    judgement = verify_execute(BROKEN, seed_prompts()[0])
    assert not judgement.ok


def test_execution_rejects_a_response_with_no_code():
    judgement = verify_execute("Sure! Here is how you would do it.", seed_prompts()[0])
    assert not judgement.ok and "no code" in judgement.detail


def test_execution_rejects_the_wrong_function_name():
    judgement = verify_execute("def other(a, b):\n    return []", seed_prompts()[0])
    assert not judgement.ok and "chunk" in judgement.detail


def test_hebrew_check_catches_latin_inside_a_word():
    """RV5's own failure mode, from reports/eval/rv5-v2.json."""
    ok, why = hebrew_is_clean("עבודה היא דרך לitura וליצירת אמנות")
    assert not ok and "latin" in why.lower()


def test_hebrew_check_passes_clean_hebrew():
    ok, _ = hebrew_is_clean("עבודה היא דרך ליצירת ערך ולביטוי אישי בחברה.")
    assert ok


def test_hebrew_check_allows_a_standalone_english_term():
    """Code-switching is a register RV5 must keep, not an error."""
    ok, _ = hebrew_is_clean("השתמשתי בספריית pandas כדי לנתח את הנתונים בקובץ.")
    assert ok


def test_language_verifier_rejects_a_refusal():
    prompt = Prompt(id="p", role="hebrew", language="hebrew",
                    text="?", verify="language")
    assert not verify_language("אני מצטער, לא אוכל לעזור בזה.", prompt).ok


def test_refusal_detection():
    assert looks_like_refusal("I'm sorry, I cannot help with that.")
    assert not looks_like_refusal("Certainly. Here is the answer.")


def test_consensus_needs_a_quorum():
    prompt = Prompt(id="m", role="math", language="hebrew", text="?",
                    verify="consensus", answer="90")
    outcome = verify_consensus({"a": "90", "b": "90"}, prompt, quorum=3)
    assert not outcome.solved and "quorum" in outcome.note


def test_consensus_accepts_the_agreed_answer():
    prompt = Prompt(id="m", role="math", language="hebrew", text="?",
                    verify="consensus", answer="90")
    outcome = verify_consensus(
        {"a": "90", "b": "התשובה היא 90 שקלים", "c": "90", "d": "105"}, prompt)
    assert outcome.solved
    assert {r["teacher"] for r in outcome.accepted} == {"a", "b", "c"}
    assert outcome.rejected[0]["teacher"] == "d"


def test_consensus_refuses_an_agreed_wrong_answer():
    """A faculty can agree and be wrong; a known answer is the only guard."""
    prompt = Prompt(id="m", role="math", language="hebrew", text="?",
                    verify="consensus", answer="90")
    outcome = verify_consensus({"a": "105", "b": "105", "c": "105"}, prompt)
    assert not outcome.solved and "wrong" in outcome.note


def test_verify_item_dispatches_on_the_prompt(monkeypatch):
    code_prompt = seed_prompts()[0]
    outcome = verify_item({"a": WORKING, "b": BROKEN}, code_prompt)
    assert [r["teacher"] for r in outcome.accepted] == ["a"]
    assert outcome.agreement == 0.5


# --- prompts ----------------------------------------------------------------

def test_seed_prompts_cover_every_verification_path():
    assert {p.verify for p in seed_prompts()} == {"execute", "consensus",
                                                  "language", "format"}


def test_prompts_round_trip(tmp_path):
    path = write_prompts(seed_prompts(), tmp_path / "p.jsonl")
    again = read_prompts(path)
    assert [p.id for p in again] == [p.id for p in seed_prompts()]
    assert again[0].tests == seed_prompts()[0].tests


# --- generation bookkeeping -------------------------------------------------

def test_completed_pairs_are_read_back(tmp_path):
    path = tmp_path / "responses.jsonl"
    path.write_text(
        '{"teacher": "a", "prompt_id": "p1", "response": "x"}\n'
        '{"teacher": "b", "prompt_id": "p1", "response": "y"}\n', encoding="utf-8")
    assert completed(path) == {("a", "p1"), ("b", "p1")}


def test_a_truncated_last_line_does_not_break_resume(tmp_path):
    """A run killed mid-write leaves half a line. It must be skipped, not fatal."""
    path = tmp_path / "responses.jsonl"
    path.write_text('{"teacher": "a", "prompt_id": "p1", "response": "x"}\n'
                    '{"teacher": "b", "prompt_i', encoding="utf-8")
    assert completed(path) == {("a", "p1")}


def test_errors_are_not_loaded_as_responses(tmp_path):
    path = tmp_path / "responses.jsonl"
    path.write_text('{"teacher": "a", "prompt_id": "p1", "response": "good"}\n'
                    '{"teacher": "b", "prompt_id": "p1", "error": "OOM"}\n',
                    encoding="utf-8")
    assert load_responses(path) == {"p1": {"a": "good"}}


# --- mixture ----------------------------------------------------------------

def _responses(tmp_path, rows):
    path = tmp_path / "responses.jsonl"
    path.write_text("\n".join(json.dumps(r, ensure_ascii=False) for r in rows),
                    encoding="utf-8")
    return path


def test_mixture_keeps_one_sample_per_prompt(tmp_path):
    """Forty teachers answering correctly is one sample, not forty."""
    prompt = seed_prompts()[0]
    rows = [{"teacher": f"t{i}", "prompt_id": prompt.id, "role": "code",
             "language": "english", "verify": "execute", "response": WORKING}
            for i in range(5)]
    records, stats, _ = mixture.build([prompt], responses_path=_responses(tmp_path, rows),
                                      eval_dir=tmp_path / "no-eval")
    assert len(records) == 1
    assert records[0]["teachers_accepted"] == 5
    assert stats.solved == 1


def test_mixture_prefers_the_shortest_verified_answer(tmp_path):
    prompt = seed_prompts()[0]
    verbose = "Certainly! Here is a thorough solution.\n\n```python\n" + WORKING + "\n```\n"
    rows = [{"teacher": "short", "prompt_id": prompt.id, "role": "code",
             "language": "english", "verify": "execute", "response": WORKING},
            {"teacher": "long", "prompt_id": prompt.id, "role": "code",
             "language": "english", "verify": "execute", "response": verbose}]
    records, _, _ = mixture.build([prompt], responses_path=_responses(tmp_path, rows),
                                  eval_dir=tmp_path / "no-eval")
    assert records[0]["teacher"] == "short"


def test_mixture_drops_a_prompt_no_teacher_solved(tmp_path):
    prompt = seed_prompts()[0]
    rows = [{"teacher": "t1", "prompt_id": prompt.id, "role": "code",
             "language": "english", "verify": "execute", "response": BROKEN}]
    records, stats, _ = mixture.build([prompt], responses_path=_responses(tmp_path, rows),
                                      eval_dir=tmp_path / "no-eval")
    assert records == []
    assert stats.unsolved == 1
    assert stats.rejections


def test_mixture_records_provenance(tmp_path):
    prompt = seed_prompts()[0]
    rows = [{"teacher": "t1", "prompt_id": prompt.id, "role": "code",
             "language": "english", "verify": "execute", "response": WORKING}]
    records, _, _ = mixture.build([prompt], responses_path=_responses(tmp_path, rows),
                                  eval_dir=tmp_path / "no-eval")
    record = records[0]
    assert record["teacher"] == "t1"
    assert record["verified_by"] == "execute"
    assert record["source"] == "distill"
    assert record["messages"][0]["role"] == "user"
    assert record["messages"][-1]["role"] == "assistant"


def test_mixture_refuses_a_sample_that_leaks_an_eval_item(tmp_path):
    """The failure mode a generated corpus is most exposed to."""
    eval_dir = tmp_path / "eval"
    eval_dir.mkdir()
    leaked = ("What is the capital city of Spain and what is the population of "
              "that city according to the most recent official census figures")
    (eval_dir / "suite.jsonl").write_text(
        json.dumps({"question": leaked, "answer": "Madrid"}) + "\n", encoding="utf-8")

    prompt = Prompt(id="leak", role="multilingual", language="english",
                    text=leaked, verify="format", requirement={})
    rows = [{"teacher": "t1", "prompt_id": "leak", "role": "multilingual",
             "language": "english", "verify": "format", "response": leaked}]
    records, stats, _ = mixture.build([prompt],
                                      responses_path=_responses(tmp_path, rows),
                                      eval_dir=eval_dir)
    assert stats.leaked == 1
    assert records == []


def test_language_mix_reports_the_realised_proportions():
    records = [{"language": "hebrew"}] * 3 + [{"language": "english"}]
    assert mixture.language_mix(records)["hebrew"] == 0.75


def test_mixture_writes_the_shape_the_trainer_reads(tmp_path):
    prompt = seed_prompts()[0]
    rows = [{"teacher": "t1", "prompt_id": prompt.id, "role": "code",
             "language": "english", "verify": "execute", "response": WORKING}]
    records, _, _ = mixture.build([prompt], responses_path=_responses(tmp_path, rows),
                                  eval_dir=tmp_path / "no-eval")
    path = mixture.write(records, tmp_path / "sft.jsonl")
    row = json.loads(path.read_text(encoding="utf-8").splitlines()[0])
    assert [m["role"] for m in row["messages"]] == ["user", "assistant"]


# --- planning ---------------------------------------------------------------

def test_plan_skips_a_teacher_that_will_not_fit():
    huge = teacher("big/one", params=480_000_000_000)
    result = plan.plan_teacher(huge, accelerator="a100-80", bits=16, batch=16,
                               prompts=100, tokens_each=400)
    assert not result.fits and "GB" in result.note


def test_quantisation_makes_a_teacher_fit_and_run_faster():
    t = teacher("mid/one", params=30_000_000_000)
    at16 = plan.plan_teacher(t, accelerator="a100-80", bits=16, batch=16,
                             prompts=100, tokens_each=400)
    at4 = plan.plan_teacher(t, accelerator="a100-80", bits=4, batch=16,
                            prompts=100, tokens_each=400)
    assert at4.tokens_per_second > at16.tokens_per_second
    assert at4.hours < at16.hours


def test_plan_totals_only_the_runnable_teachers():
    pool = [teacher("fits/one", params=7_000_000_000),
            teacher("huge/one", params=480_000_000_000)]
    run = plan.plan_run(pool, accelerator="a100-80", bits=16, batch=16,
                        prompts=100_000, tokens_each=400)
    assert len(run.runnable) == 1 and len(run.skipped) == 1
    assert run.hours == pytest.approx(run.runnable[0].hours, abs=0.05)


def test_unknown_accelerator_is_rejected():
    with pytest.raises(ValueError):
        plan.plan_run([], accelerator="tpu-v9")
