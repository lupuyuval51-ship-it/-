"""Configuration loading, inheritance and CLI overrides."""
from __future__ import annotations

import argparse

import pytest
import yaml

from lekoy.config import (LekoyConfig, add_config_args, config_from_args,
                          load_yaml)


def test_defaults_are_coherent():
    config = LekoyConfig()
    assert config.full_name == "LEKOY RV5"
    assert config.model.name.startswith("Qwen/")
    assert config.training.bf16 and not config.training.fp16


@pytest.mark.parametrize("name", ["rv5_small.yaml", "rv5_medium.yaml", "rv5_large.yaml"])
def test_shipped_configs_load(name):
    config = LekoyConfig.load(name)
    assert config.family == "LEKOY" and config.model_id == "RV5"
    assert config.training.max_seq_length > 0
    assert 0 < config.training.learning_rate < 1


def test_language_mix_sums_to_one():
    for name in ("rv5_small.yaml", "rv5_medium.yaml", "rv5_large.yaml"):
        mix = LekoyConfig.load(name).data.language_mix
        assert abs(sum(mix.values()) - 1.0) < 1e-9, f"{name}: {mix}"
        assert mix["hebrew"] >= max(mix.values()), "Hebrew must lead the mixture"


def test_inheritance_overrides_only_what_it_names():
    small = LekoyConfig.load("rv5_small.yaml")
    medium = LekoyConfig.load("rv5_medium.yaml")
    assert medium.model.name != small.model.name
    assert medium.lora.r > small.lora.r
    # Not restated in rv5_medium.yaml, so it must come through from the parent.
    assert medium.training.seed == small.training.seed
    assert medium.data.language_mix == small.data.language_mix


def test_size_ladder_is_apache_licensed():
    """The 3B is skipped on purpose — see docs/base_model_selection.md."""
    names = {LekoyConfig.load(f"rv5_{s}.yaml").model.name
             for s in ("small", "medium", "large")}
    assert not any("3B" in n for n in names), \
        "Qwen2.5-3B is Qwen Research licensed, not Apache-2.0"


def test_unknown_key_is_rejected(tmp_path):
    path = tmp_path / "bad.yaml"
    path.write_text(yaml.safe_dump({"training": {"lr": 1e-4}}), encoding="utf-8")
    with pytest.raises(ValueError, match="unknown key"):
        LekoyConfig.load(path)


def test_unknown_section_is_rejected(tmp_path):
    path = tmp_path / "bad.yaml"
    path.write_text(yaml.safe_dump({"trainng": {}}), encoding="utf-8")
    with pytest.raises(ValueError, match="unknown top-level"):
        LekoyConfig.load(path)


def test_circular_extends_is_detected(tmp_path):
    (tmp_path / "a.yaml").write_text("extends: b.yaml\n", encoding="utf-8")
    (tmp_path / "b.yaml").write_text("extends: a.yaml\n", encoding="utf-8")
    with pytest.raises(ValueError, match="circular"):
        load_yaml(tmp_path / "a.yaml")


def test_cli_overrides_beat_the_file():
    parser = add_config_args(argparse.ArgumentParser())
    args = parser.parse_args([
        "--config", "rv5_small.yaml", "--learning-rate", "1e-5",
        "--set", "training.bf16=false", "--set", "lora.r=8"])
    config = config_from_args(args)
    assert config.training.learning_rate == 1e-5
    assert config.training.bf16 is False
    assert config.lora.r == 8
    assert config.model.name == LekoyConfig.load("rv5_small.yaml").model.name


def test_round_trip_through_yaml(tmp_path):
    config = LekoyConfig.load("rv5_small.yaml")
    config.save(tmp_path / "out.yaml")
    assert LekoyConfig.load(tmp_path / "out.yaml").to_dict() == config.to_dict()
