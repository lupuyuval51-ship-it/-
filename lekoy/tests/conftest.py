"""Shared fixtures.

Tests are split by what they need. Most need nothing but the source tree and
run in under a second; the few that need model weights or the network are
marked and skipped when those are not available, so `pytest` is always a
useful command rather than one that only works on a configured machine.
"""
from __future__ import annotations

import sys
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "src"))
sys.path.insert(0, str(ROOT / "scripts"))


def pytest_configure(config):
    config.addinivalue_line("markers", "slow: needs model weights or the network")
    config.addinivalue_line("markers", "model: loads a real model")


@pytest.fixture(scope="session")
def repo_root() -> Path:
    return ROOT


@pytest.fixture(scope="session")
def base_model_available() -> bool:
    """Is the base model in the local hub cache?

    Checked by looking for the cache directory rather than by attempting a
    download: a test suite must not pull a gigabyte of weights as a side
    effect of being run.
    """
    import os
    home = Path(os.environ.get("HF_HOME", ROOT / ".hf_cache"))
    return any(home.rglob("models--Qwen--Qwen2.5-0.5B-Instruct"))


@pytest.fixture(scope="session")
def tokenizer(base_model_available):
    if not base_model_available:
        pytest.skip("base model is not in the local cache")
    import os
    os.environ.setdefault("HF_HOME", str(ROOT / ".hf_cache"))
    from transformers import AutoTokenizer
    return AutoTokenizer.from_pretrained("Qwen/Qwen2.5-0.5B-Instruct")


@pytest.fixture
def sample_conversation() -> list[dict]:
    return [
        {"role": "system", "content": "אתה LEKOY RV5."},
        {"role": "user", "content": "מה זה אלגוריתם?"},
        {"role": "assistant", "content": "אלגוריתם הוא סדרה סופית של הוראות "
                                         "מוגדרות היטב לפתרון בעיה."},
    ]
