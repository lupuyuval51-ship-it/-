"""The inference engine and the shipped web assets."""
from __future__ import annotations

import json
import re
from pathlib import Path

import pytest

from lekoy.inference.engine import (GenerationSettings, InferenceEngine,
                                    detect_backend)
from lekoy.paths import WEB


def test_generation_settings_from_config():
    from lekoy.config import LekoyConfig
    settings = GenerationSettings.from_config(LekoyConfig.load("rv5_small.yaml"))
    assert settings.temperature > 0 and settings.sampling()
    settings.temperature = 0.0
    assert not settings.sampling(), "temperature 0 must mean greedy, not sampling at 0"


def test_backend_detection_defaults_to_transformers(tmp_path):
    assert detect_backend(str(tmp_path)) == "transformers"
    assert detect_backend("Qwen/Qwen2.5-0.5B-Instruct") == "transformers"


def test_gguf_path_only_selects_llama_cpp_when_it_is_installed(tmp_path):
    (tmp_path / "model-q4.gguf").write_bytes(b"stub")
    backend = detect_backend(str(tmp_path))
    try:
        import llama_cpp                                          # noqa: F401
        assert backend == "llama_cpp"
    except ImportError:
        assert backend == "transformers", \
            "a GGUF file must not select a backend that is not installed"


def test_adapter_without_a_named_base_is_a_clear_error(tmp_path):
    (tmp_path / "adapter_config.json").write_text(json.dumps({"r": 16}),
                                                  encoding="utf-8")
    with pytest.raises(ValueError, match="names no base model"):
        InferenceEngine(str(tmp_path))


# --- web assets -------------------------------------------------------------

def test_web_assets_are_present():
    for name in ("index.html", "styles.css", "app.js"):
        assert (WEB / name).exists(), name


def test_web_ui_has_no_external_dependencies():
    """No CDN is contacted. A local model server should not need the network to
    put a chat window in front of itself."""
    html = (WEB / "index.html").read_text(encoding="utf-8")
    js = (WEB / "app.js").read_text(encoding="utf-8")
    css = (WEB / "styles.css").read_text(encoding="utf-8")

    for asset, name in ((html, "index.html"), (css, "styles.css")):
        external = re.findall(r'(?:src|href)="(https?://[^"]+)"', asset)
        assert not external, f"{name} loads {external}"

    # The only URL in the JS is the local API fallback.
    urls = re.findall(r"https?://[^\s'\"]+", js)
    assert all("localhost" in u for u in urls), urls


def test_web_ui_covers_the_required_features():
    html = (WEB / "index.html").read_text(encoding="utf-8")
    js = (WEB / "app.js").read_text(encoding="utf-8")
    for element_id in ("new-chat", "conversations", "input", "send",
                       "toggle-theme", "system-prompt", "temp", "topp",
                       "maxtok", "clear-all"):
        assert f'id="{element_id}"' in html, element_id
    for behaviour in ("renderMarkdown", "highlight", "AbortController",
                      "regenerate", "copy", "localStorage", "stream: true"):
        assert behaviour in js, behaviour


def test_web_ui_escapes_before_inserting():
    """innerHTML is used for rendered markdown, so escaping is not optional."""
    js = (WEB / "app.js").read_text(encoding="utf-8")
    assert "function escapeHtml" in js
    assert "escapeHtml(text)" in js
    # User-supplied message text goes in as textContent, never as innerHTML.
    assert "content.textContent = message.content;" in js


def test_web_ui_is_rtl_with_ltr_code():
    html = (WEB / "index.html").read_text(encoding="utf-8")
    css = (WEB / "styles.css").read_text(encoding="utf-8")
    assert 'dir="rtl"' in html
    assert "direction: ltr" in css, "code blocks must be forced LTR"


def test_both_themes_define_every_token():
    css = (WEB / "styles.css").read_text(encoding="utf-8")
    def tokens(selector: str) -> set[str]:
        block = css.split(selector, 1)[1].split("}", 1)[0]
        return set(re.findall(r"(--[\w-]+):", block))
    dark = tokens('[data-theme="dark"] {')
    light = tokens('[data-theme="light"] {')
    assert dark == light, f"only in one theme: {dark ^ light}"
    assert {"--bg", "--text", "--accent", "--border"} <= dark
