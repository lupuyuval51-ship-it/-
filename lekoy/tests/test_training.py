"""Training machinery: memory pre-flight, OOM advice, checkpoint safety,
experiment tracking, and the response masking that makes SFT work."""
from __future__ import annotations

import json

import pytest

from lekoy.config import LekoyConfig
from lekoy.training.common import (available_memory_gb, estimate_memory,
                                   is_oom, latest_checkpoint, oom_advice,
                                   prepare_output_dir, resolve_resume)
from lekoy.training.experiment import Experiment, next_id


# --- memory -----------------------------------------------------------------

def test_memory_budget_is_measured():
    budget, device = available_memory_gb()
    assert budget > 0 and device in ("VRAM", "system RAM", "system RAM (assumed)")


def test_small_config_fits_and_large_does_not_pretend_to():
    small = estimate_memory(LekoyConfig.load("rv5_small.yaml"),
                            494_000_000, 8_800_000, 896, 24)
    assert small.fits
    assert small.weights_gb == pytest.approx(0.494 * 2, rel=0.05)
    assert small.optimizer_gb > 0 and small.activations_gb > 0
    assert "weights" in small.describe()


def test_lora_optimizer_state_is_tiny_next_to_full_finetuning():
    config = LekoyConfig.load("rv5_small.yaml")
    lora = estimate_memory(config, 494_000_000, 8_800_000, 896, 24)
    full = estimate_memory(config, 494_000_000, 494_000_000, 896, 24)
    assert full.optimizer_gb > lora.optimizer_gb * 40


def test_gradient_checkpointing_cuts_activation_memory():
    config = LekoyConfig.load("rv5_small.yaml")
    off = estimate_memory(config, 494_000_000, 8_800_000, 896, 24)
    config.training.gradient_checkpointing = True
    on = estimate_memory(config, 494_000_000, 8_800_000, 896, 24)
    assert on.activations_gb < off.activations_gb / 3


def test_8bit_optimizer_is_accounted_for():
    config = LekoyConfig.load("rv5_small.yaml")
    before = estimate_memory(config, 494_000_000, 8_800_000, 896, 24).optimizer_gb
    config.training.optimizer = "adamw_bnb_8bit"
    after = estimate_memory(config, 494_000_000, 8_800_000, 896, 24).optimizer_gb
    assert after < before


# --- OOM handling -----------------------------------------------------------

@pytest.mark.parametrize("message", [
    "CUDA out of memory. Tried to allocate 2.00 GiB",
    "RuntimeError: [enforce fail] ... can't allocate memory",
    "DefaultCPUAllocator: not enough memory: you tried to allocate",
])
def test_oom_is_recognised_by_message(message):
    assert is_oom(RuntimeError(message)) or "not enough memory" in message


def test_oom_recognises_memory_error():
    assert is_oom(MemoryError())
    assert not is_oom(ValueError("something else entirely"))


def test_oom_advice_is_ordered_by_cost_to_the_result():
    config = LekoyConfig.load("rv5_small.yaml")
    config.training.batch_size = 4
    advice = oom_advice(config)
    assert advice, "an OOM must never produce an empty list of next steps"
    joined = "\n".join(advice)
    assert "--batch-size 2" in joined
    assert "gradient_checkpointing" in joined
    # Sequence length is destructive, so it must not be the first suggestion.
    assert advice[0].startswith("--batch-size")
    seq_index = next(i for i, a in enumerate(advice) if "max-seq-length" in a)
    assert seq_index > 0


def test_oom_advice_says_when_4bit_is_unavailable():
    import torch
    config = LekoyConfig.load("rv5_small.yaml")
    advice = "\n".join(oom_advice(config))
    if not torch.cuda.is_available():
        assert "CUDA-only" in advice


# --- checkpoint safety ------------------------------------------------------

def test_an_occupied_output_directory_is_never_silently_reused(tmp_path):
    config = LekoyConfig.load("rv5_small.yaml")
    config.training.output_dir = str(tmp_path / "run")
    prepare_output_dir(config)
    (tmp_path / "run" / "adapter_model.safetensors").write_bytes(b"weights")

    with pytest.raises(FileExistsError) as excinfo:
        prepare_output_dir(config)
    message = str(excinfo.value)
    for hint in ("--resume-from-checkpoint", "--new-experiment", "--overwrite"):
        assert hint in message, "the error must name every way out"


def test_new_experiment_sidesteps_rather_than_overwrites(tmp_path):
    config = LekoyConfig.load("rv5_small.yaml")
    config.training.output_dir = str(tmp_path / "run")
    prepare_output_dir(config)
    (tmp_path / "run" / "adapter_model.safetensors").write_bytes(b"weights")

    out = prepare_output_dir(config, new_experiment=True)
    assert out.name == "run-002"
    assert (tmp_path / "run" / "adapter_model.safetensors").exists()


def test_overwrite_removes_the_old_artefacts(tmp_path):
    config = LekoyConfig.load("rv5_small.yaml")
    config.training.output_dir = str(tmp_path / "run")
    prepare_output_dir(config)
    (tmp_path / "run" / "adapter_model.safetensors").write_bytes(b"weights")
    prepare_output_dir(config, overwrite=True)
    assert not (tmp_path / "run" / "adapter_model.safetensors").exists()


def test_latest_checkpoint_sorts_numerically(tmp_path):
    for step in (5, 100, 20):
        (tmp_path / f"checkpoint-{step}").mkdir()
    assert latest_checkpoint(tmp_path).name == "checkpoint-100"
    assert latest_checkpoint(tmp_path / "nothing") is None


def test_resume_auto_falls_back_to_a_fresh_run(tmp_path):
    config = LekoyConfig.load("rv5_small.yaml")
    config.training.output_dir = str(tmp_path / "empty")
    assert resolve_resume(config, "auto") is None
    (tmp_path / "empty" / "checkpoint-50").mkdir(parents=True)
    assert resolve_resume(config, "auto").endswith("checkpoint-50")


def test_resume_from_a_missing_path_is_an_error():
    config = LekoyConfig.load("rv5_small.yaml")
    with pytest.raises(FileNotFoundError):
        resolve_resume(config, "/nowhere/checkpoint-1")


# --- experiments ------------------------------------------------------------

def test_experiment_ids_increment(tmp_path):
    assert next_id(tmp_path) == "rv5-exp-001"
    (tmp_path / "rv5-exp-001").mkdir()
    (tmp_path / "rv5-exp-007").mkdir()
    (tmp_path / "not-an-experiment").mkdir()
    assert next_id(tmp_path) == "rv5-exp-008"


def test_experiment_keeps_the_whole_metric_history(monkeypatch, tmp_path):
    import lekoy.training.experiment as module
    monkeypatch.setattr(module, "EXPERIMENTS", tmp_path)
    config = LekoyConfig.load("rv5_small.yaml")
    experiment = module.Experiment.start("sft", config, [{"path": "x"}])
    for step, loss in ((10, 2.4), (20, 1.9), (30, 1.5)):
        experiment.log(step=step, loss=loss)
    experiment.finish("completed", checkpoint="checkpoints/rv5/sft")

    saved = json.loads((tmp_path / experiment.id / "experiment.json").read_text())
    assert saved["status"] == "completed"
    assert len(saved["metrics"]["history"]) == 3
    assert saved["metrics"]["last_loss"] == 1.5
    assert saved["config"]["model"]["name"] == config.model.name
    # A loss curve is what you need when a run goes wrong; the final number
    # alone says nothing about how it got there.
    assert [h["loss"] for h in saved["metrics"]["history"]] == [2.4, 1.9, 1.5]


def test_failed_experiment_records_the_error(monkeypatch, tmp_path):
    import lekoy.training.experiment as module
    monkeypatch.setattr(module, "EXPERIMENTS", tmp_path)
    experiment = module.Experiment.start("sft", LekoyConfig.load("rv5_small.yaml"))
    experiment.finish("failed", error="OOM: tried to allocate 2 GiB")
    saved = json.loads((tmp_path / experiment.id / "experiment.json").read_text())
    assert saved["status"] == "failed" and "OOM" in saved["error"]


# --- datasets ---------------------------------------------------------------

@pytest.mark.model
def test_only_assistant_turns_are_supervised(tokenizer, sample_conversation):
    """Training on prompt tokens teaches the model to generate user turns —
    the standard cause of a fine-tune that answers and then invents the next
    question."""
    from lekoy.training.dataset import IGNORE_INDEX, ChatDataset

    dataset = ChatDataset([{"messages": sample_conversation}], tokenizer, 1024)
    assert len(dataset) == 1
    example = dataset[0]
    assert len(example["input_ids"]) == len(example["labels"])

    supervised = [i for i, label in enumerate(example["labels"])
                  if label != IGNORE_INDEX]
    assert supervised, "nothing is being trained on"
    # The supervised span must be the tail — the assistant turn is last.
    assert supervised[-1] == len(example["labels"]) - 1
    assert min(supervised) > 0, "the system turn must be masked"

    answer = tokenizer.decode([example["input_ids"][i] for i in supervised])
    assert "אלגוריתם" in answer
    assert "מה זה אלגוריתם?" not in answer, "the user turn leaked into the labels"

    stats = dataset.stats()
    assert 0 < stats["supervised_fraction"] < 1


@pytest.mark.model
def test_conversations_without_an_assistant_reply_are_dropped(tokenizer):
    from lekoy.training.dataset import ChatDataset
    dataset = ChatDataset(
        [{"messages": [{"role": "user", "content": "שאלה בלי תשובה"}]}],
        tokenizer, 512)
    assert len(dataset) == 0
    assert dataset.skipped["no_assistant_turn"] == 1


@pytest.mark.model
def test_packing_produces_full_length_blocks(tokenizer):
    from lekoy.training.dataset import TextDataset
    records = [{"text": "מתמטיקה היא תחום דעת העוסק במושגים רבים. " * 30}
               for _ in range(6)]
    packed = TextDataset(records, tokenizer, 256, packing=True)
    assert len(packed) > 1
    assert all(len(e["input_ids"]) == 256 for e in packed)


@pytest.mark.model
def test_collator_pads_to_the_batch_not_the_maximum(tokenizer):
    import torch
    from lekoy.training.dataset import IGNORE_INDEX, Collator

    batch = Collator(tokenizer)([
        {"input_ids": [1, 2, 3], "labels": [1, 2, 3]},
        {"input_ids": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
         "labels": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]},
    ])
    assert batch["input_ids"].shape == (2, 16)      # padded to a multiple of 8
    assert batch["attention_mask"][0].sum() == 3
    assert (batch["labels"][0][3:] == IGNORE_INDEX).all()
    assert isinstance(batch["input_ids"], torch.Tensor)
