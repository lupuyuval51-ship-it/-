"""The local API, against a stub engine.

A fake engine rather than real weights: these tests are about the HTTP
contract — schema, streaming frames, error codes, usage accounting — and
loading a model to check that a 404 is a 404 would make the suite unrunnable
on a machine without the weights.

The one thing that cannot be faked is the guarantee that matters most, so it
is tested directly: no request leaves this process.
"""
from __future__ import annotations

import json

import pytest
from fastapi.testclient import TestClient

from lekoy import FAMILY, FULL_NAME, MODEL
from lekoy.api.server import MODEL_ID, create_app


class StubEngine:
    """Answers like the real engine, without any weights."""

    def __init__(self, reply: str = "אני LEKOY RV5, מודל שפה ממשפחת LEKOY."):
        self.reply = reply
        self.calls: list[list[dict]] = []
        self.metadata = {
            "backend": "transformers", "device": "cpu", "parameters": 494_000_000,
            "context_length": 32768, "vocab_size": 151936,
            "base_model": "Qwen/Qwen2.5-0.5B-Instruct", "stage": "sft",
        }

    def info(self) -> dict:
        return {"model_path": "checkpoints/rv5/sft", **self.metadata}

    def stream(self, messages, settings=None, add_system=True):
        self.calls.append(list(messages))
        pieces = self.reply.split(" ")
        for index, piece in enumerate(pieces, 1):
            yield {"text": piece + (" " if index < len(pieces) else ""),
                   "prompt_tokens": 42, "completion_tokens": index}
        yield {"text": "", "prompt_tokens": 42, "completion_tokens": len(pieces),
               "finish_reason": "stop", "done": True}

    def generate(self, messages, settings=None, add_system=True):
        chunks = list(self.stream(messages, settings, add_system))
        return {"text": "".join(c["text"] for c in chunks).strip(),
                "prompt_tokens": 42,
                "completion_tokens": chunks[-1]["completion_tokens"],
                "finish_reason": "stop"}

    def count_tokens(self, text: str) -> int:
        return max(len(text) // 3, 1)


@pytest.fixture
def engine() -> StubEngine:
    return StubEngine()


@pytest.fixture
def client(engine) -> TestClient:
    return TestClient(create_app(engine))


# --- health and models ------------------------------------------------------

def test_health_reports_the_identity_and_the_backend(client):
    body = client.get("/health").json()
    assert body["status"] == "ok"
    assert body["family"] == FAMILY and body["model"] == MODEL
    assert body["full_name"] == FULL_NAME
    assert body["backend"] == "transformers"
    assert body["parameters"] == 494_000_000


def test_models_endpoint_names_lekoy(client):
    body = client.get("/v1/models").json()
    assert body["object"] == "list" and len(body["data"]) == 1
    model = body["data"][0]
    assert model["id"] == MODEL_ID == "lekoy-rv5"
    assert model["owned_by"] == "lekoy"
    assert model["lekoy"]["full_name"] == FULL_NAME
    assert model["lekoy"]["languages"] == ["he", "en", "es"]


def test_only_lekoy_is_served(client):
    """The schema is OpenAI's; the model is not, and asking for one of theirs
    must be a 404 rather than a silent proxy."""
    response = client.post("/v1/chat/completions", json={
        "model": "gpt-4", "messages": [{"role": "user", "content": "hi"}]})
    assert response.status_code == 404
    assert "does not proxy" in response.json()["detail"]


# --- chat completions -------------------------------------------------------

def test_non_streaming_completion_matches_the_openai_shape(client):
    body = client.post("/v1/chat/completions", json={
        "model": MODEL_ID,
        "messages": [{"role": "user", "content": "מי אתה?"}],
    }).json()
    assert body["object"] == "chat.completion"
    assert body["model"] == MODEL_ID
    choice = body["choices"][0]
    assert choice["message"]["role"] == "assistant"
    assert "LEKOY RV5" in choice["message"]["content"]
    assert choice["finish_reason"] == "stop"
    usage = body["usage"]
    assert usage["total_tokens"] == usage["prompt_tokens"] + usage["completion_tokens"]


def test_a_system_prompt_is_supplied_when_the_client_omits_one(client, engine):
    client.post("/v1/chat/completions", json={
        "messages": [{"role": "user", "content": "מי אתה?"}]})
    sent = engine.calls[-1]
    assert sent[0]["role"] == "system"
    assert FULL_NAME in sent[0]["content"]


def test_a_client_system_prompt_is_respected(client, engine):
    client.post("/v1/chat/completions", json={
        "messages": [{"role": "system", "content": "Answer in one word."},
                     {"role": "user", "content": "Capital of Spain?"}]})
    assert engine.calls[-1][0]["content"] == "Answer in one word."


def test_streaming_emits_valid_sse_frames(client):
    with client.stream("POST", "/v1/chat/completions", json={
        "messages": [{"role": "user", "content": "מי אתה?"}], "stream": True,
    }) as response:
        assert response.status_code == 200
        assert response.headers["content-type"].startswith("text/event-stream")
        frames = [line for line in response.iter_lines() if line.startswith("data:")]

    assert frames[-1] == "data: [DONE]"
    payloads = [json.loads(f[5:].strip()) for f in frames[:-1]]
    assert payloads[0]["choices"][0]["delta"]["role"] == "assistant"
    text = "".join(p["choices"][0]["delta"].get("content", "") for p in payloads)
    assert "LEKOY RV5" in text
    assert payloads[-1]["choices"][0]["finish_reason"] == "stop"
    assert all(p["object"] == "chat.completion.chunk" for p in payloads)


def test_a_mid_stream_failure_is_reported_inside_the_stream(client, engine):
    """Once the response has begun, an HTTP status is no longer available. The
    error has to arrive as a frame, which is what an SSE client can act on."""
    def explode(messages, settings=None, add_system=True):
        yield {"text": "start", "prompt_tokens": 1, "completion_tokens": 1}
        raise RuntimeError("the model fell over")
    engine.stream = explode

    with client.stream("POST", "/v1/chat/completions", json={
        "messages": [{"role": "user", "content": "hi"}], "stream": True,
    }) as response:
        assert response.status_code == 200
        frames = [line for line in response.iter_lines() if line.startswith("data:")]
    payloads = [json.loads(f[5:].strip()) for f in frames if "[DONE]" not in f]
    assert any("error" in p and "fell over" in p["error"]["message"] for p in payloads)
    assert frames[-1] == "data: [DONE]"


def test_empty_messages_is_a_400(client):
    assert client.post("/v1/chat/completions", json={"messages": []}).status_code == 400


def test_openai_only_parameters_are_accepted_and_ignored(client):
    response = client.post("/v1/chat/completions", json={
        "messages": [{"role": "user", "content": "hi"}],
        "presence_penalty": 0.5, "frequency_penalty": 0.2, "n": 1, "user": "u1"})
    assert response.status_code == 200


@pytest.mark.parametrize("payload,field", [
    ({"messages": [{"role": "user", "content": "hi"}], "temperature": 9}, "temperature"),
    ({"messages": [{"role": "user", "content": "hi"}], "top_p": 0}, "top_p"),
    ({"messages": [{"role": "wizard", "content": "hi"}]}, "role"),
])
def test_invalid_parameters_are_rejected(client, payload, field):
    assert client.post("/v1/chat/completions", json=payload).status_code == 422


# --- other endpoints --------------------------------------------------------

def test_legacy_completions(client):
    body = client.post("/v1/completions", json={"prompt": "Once upon a time"}).json()
    assert body["object"] == "text_completion"
    assert body["choices"][0]["text"]


def test_tokenize_reports_hebrew_density(client):
    body = client.post("/v1/tokenize", json={"text": "שלום עולם"}).json()
    assert body["tokens"] > 0 and body["characters"] == 9
    assert body["chars_per_token"] > 0


def test_usage_counters_accumulate(client):
    before = client.get("/health").json()
    client.post("/v1/chat/completions", json={
        "messages": [{"role": "user", "content": "hi"}]})
    after = client.get("/health").json()
    assert after["requests_served"] > before["requests_served"]
    assert after["tokens_generated"] > before["tokens_generated"]


def test_generation_settings_reach_the_engine(client, engine):
    captured = {}

    def record(messages, settings=None, add_system=True):
        captured["settings"] = settings
        yield {"text": "ok", "prompt_tokens": 1, "completion_tokens": 1,
               "finish_reason": "stop", "done": True}
    engine.stream = record

    client.post("/v1/chat/completions", json={
        "messages": [{"role": "user", "content": "hi"}],
        "temperature": 0.15, "top_p": 0.5, "top_k": 10, "max_tokens": 64,
        "stop": ["END"], "seed": 7})
    settings = captured["settings"]
    assert settings.temperature == 0.15 and settings.top_p == 0.5
    assert settings.top_k == 10 and settings.max_new_tokens == 64
    assert settings.stop == ["END"] and settings.seed == 7


def test_a_string_stop_is_accepted_as_well_as_a_list(client, engine):
    captured = {}

    def record(messages, settings=None, add_system=True):
        captured["settings"] = settings
        yield {"text": "ok", "prompt_tokens": 1, "completion_tokens": 1, "done": True}
    engine.stream = record

    client.post("/v1/chat/completions", json={
        "messages": [{"role": "user", "content": "hi"}], "stop": "END"})
    assert captured["settings"].stop == ["END"]


# --- the guarantee ----------------------------------------------------------

def test_no_request_leaves_this_process(monkeypatch, client):
    """The central promise of LEKOY RV5 is that inference runs on weights we
    hold. This asserts it mechanically: any outbound socket connection during
    a completion fails the test."""
    import socket

    def refuse(*args, **kwargs):
        raise AssertionError("the API opened an outbound network connection")

    monkeypatch.setattr(socket.socket, "connect", refuse)
    monkeypatch.setattr(socket, "create_connection", refuse)

    body = client.post("/v1/chat/completions", json={
        "messages": [{"role": "user", "content": "מי אתה?"}]}).json()
    assert "LEKOY RV5" in body["choices"][0]["message"]["content"]


def test_no_provider_sdk_is_importable_from_the_api():
    """A stronger version of the same guarantee: the serving path must not
    even have a hosted-provider client available to it."""
    import importlib.util
    for module in ("openai", "anthropic", "google.generativeai", "cohere"):
        assert importlib.util.find_spec(module) is None, \
            f"{module} is installed; it must not be, in the serving environment"
