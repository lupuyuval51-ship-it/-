"""A local OpenAI-compatible API in front of LEKOY RV5.

The schema is OpenAI's because every client already speaks it. The *inference*
is entirely local: there is no code path in this file, or in anything it
imports, that sends a request to OpenAI or to any other hosted model. Every
token is produced by the weights loaded at startup. That is the point of the
compatibility — reusing a client library, not reusing someone else's model.

    GET  /health
    GET  /v1/models
    POST /v1/chat/completions      (streaming and non-streaming)
    POST /v1/completions           (legacy text completion)
    POST /v1/tokenize              (LEKOY extension: count tokens)
"""
from __future__ import annotations

import json
import time
import uuid
from typing import Any, Iterator, Literal

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse, StreamingResponse
from pydantic import BaseModel, Field

from .. import FAMILY, FULL_NAME, MODEL, __version__
from ..identity import system_prompt
from ..inference.engine import GenerationSettings, InferenceEngine

MODEL_ID = "lekoy-rv5"
MODEL_ALIASES = {MODEL_ID, "LEKOY-RV5", "lekoy_rv5", "rv5", FULL_NAME}


class ChatMessage(BaseModel):
    role: Literal["system", "user", "assistant"]
    content: str


class ChatRequest(BaseModel):
    model: str = MODEL_ID
    messages: list[ChatMessage]
    temperature: float = Field(0.7, ge=0.0, le=2.0)
    top_p: float = Field(0.9, gt=0.0, le=1.0)
    top_k: int = Field(50, ge=0)
    max_tokens: int | None = Field(None, gt=0, le=32768)
    stream: bool = False
    stop: list[str] | str | None = None
    repetition_penalty: float = Field(1.05, ge=0.5, le=2.0)
    seed: int | None = None
    # OpenAI clients send these; accept and ignore rather than 422.
    presence_penalty: float | None = None
    frequency_penalty: float | None = None
    n: int | None = None
    user: str | None = None


class CompletionRequest(BaseModel):
    model: str = MODEL_ID
    prompt: str | list[str]
    temperature: float = Field(0.7, ge=0.0, le=2.0)
    top_p: float = Field(0.9, gt=0.0, le=1.0)
    max_tokens: int | None = Field(None, gt=0, le=32768)
    stream: bool = False
    stop: list[str] | str | None = None
    seed: int | None = None


class TokenizeRequest(BaseModel):
    text: str
    model: str = MODEL_ID


def create_app(engine: InferenceEngine, *, default_max_tokens: int = 1024,
               allow_origins: list[str] | None = None,
               web_dir=None) -> FastAPI:
    app = FastAPI(
        title=f"{FULL_NAME} API",
        version=__version__,
        description=(
            f"Local inference API for {FULL_NAME}. OpenAI-compatible schema; "
            "all generation happens on locally held weights."),
    )
    app.add_middleware(
        CORSMiddleware,
        allow_origins=allow_origins or ["*"],
        allow_methods=["GET", "POST", "OPTIONS"],
        allow_headers=["*"],
    )
    app.state.engine = engine
    app.state.started = time.time()
    app.state.requests = 0
    app.state.tokens_generated = 0

    def settings_from(request: ChatRequest | CompletionRequest) -> GenerationSettings:
        stop = request.stop
        if isinstance(stop, str):
            stop = [stop]
        return GenerationSettings(
            temperature=request.temperature,
            top_p=request.top_p,
            top_k=getattr(request, "top_k", 50),
            repetition_penalty=getattr(request, "repetition_penalty", 1.05),
            max_new_tokens=request.max_tokens or default_max_tokens,
            stop=stop or [],
            seed=request.seed)

    def check_model(name: str) -> None:
        if name not in MODEL_ALIASES:
            raise HTTPException(
                status_code=404,
                detail=(f"model {name!r} is not served here. This endpoint "
                        f"serves {MODEL_ID} only — it does not proxy to any "
                        "other provider."))

    # --- endpoints ---------------------------------------------------------

    @app.get("/health")
    def health() -> dict:
        info = engine.info()
        return {
            "status": "ok",
            "family": FAMILY,
            "model": MODEL,
            "full_name": FULL_NAME,
            "version": __version__,
            "backend": info.get("backend"),
            "device": info.get("device"),
            "parameters": info.get("parameters"),
            "context_length": info.get("context_length"),
            "uptime_seconds": round(time.time() - app.state.started, 1),
            "requests_served": app.state.requests,
            "tokens_generated": app.state.tokens_generated,
        }

    @app.get("/v1/models")
    def models() -> dict:
        info = engine.info()
        return {"object": "list", "data": [{
            "id": MODEL_ID,
            "object": "model",
            "created": int(app.state.started),
            "owned_by": FAMILY.lower(),
            "permission": [],
            "root": MODEL_ID,
            "lekoy": {
                "family": FAMILY, "model": MODEL, "full_name": FULL_NAME,
                "parameters": info.get("parameters"),
                "context_length": info.get("context_length"),
                "base_model": info.get("base_model"),
                "stage": info.get("stage"),
                "languages": ["he", "en", "es"],
            },
        }]}

    @app.post("/v1/chat/completions")
    def chat_completions(request: ChatRequest, raw: Request):
        check_model(request.model)
        app.state.requests += 1
        messages = [m.model_dump() for m in request.messages]
        if not messages:
            raise HTTPException(400, "messages must not be empty")
        if not any(m["role"] == "system" for m in messages):
            messages.insert(0, {"role": "system", "content": system_prompt("he")})

        settings = settings_from(request)
        completion_id = f"chatcmpl-{uuid.uuid4().hex[:24]}"
        created = int(time.time())

        if not request.stream:
            result = engine.generate(messages, settings, add_system=False)
            app.state.tokens_generated += result["completion_tokens"]
            return {
                "id": completion_id, "object": "chat.completion",
                "created": created, "model": MODEL_ID,
                "choices": [{
                    "index": 0,
                    "message": {"role": "assistant", "content": result["text"]},
                    "finish_reason": result["finish_reason"],
                }],
                "usage": {
                    "prompt_tokens": result["prompt_tokens"],
                    "completion_tokens": result["completion_tokens"],
                    "total_tokens": result["prompt_tokens"] + result["completion_tokens"],
                },
            }

        def events() -> Iterator[str]:
            def frame(delta: dict, finish: str | None = None) -> str:
                return "data: " + json.dumps({
                    "id": completion_id, "object": "chat.completion.chunk",
                    "created": created, "model": MODEL_ID,
                    "choices": [{"index": 0, "delta": delta,
                                 "finish_reason": finish}],
                }, ensure_ascii=False) + "\n\n"

            yield frame({"role": "assistant", "content": ""})
            produced = 0
            finish = "stop"
            try:
                for chunk in engine.stream(messages, settings, add_system=False):
                    if chunk.get("text"):
                        yield frame({"content": chunk["text"]})
                    produced = chunk.get("completion_tokens", produced)
                    if chunk.get("done"):
                        finish = chunk.get("finish_reason", "stop")
            except Exception as exc:                            # noqa: BLE001
                # The response has already begun, so an HTTP error code is no
                # longer available. Send the failure inside the stream, which
                # is what an SSE client can actually act on.
                yield "data: " + json.dumps(
                    {"error": {"message": str(exc)[:300],
                               "type": type(exc).__name__}}) + "\n\n"
                yield "data: [DONE]\n\n"
                return
            app.state.tokens_generated += produced
            yield frame({}, finish)
            yield "data: [DONE]\n\n"

        return StreamingResponse(events(), media_type="text/event-stream",
                                 headers={"Cache-Control": "no-cache",
                                          "X-Accel-Buffering": "no"})

    @app.post("/v1/completions")
    def completions(request: CompletionRequest):
        check_model(request.model)
        app.state.requests += 1
        prompt = request.prompt if isinstance(request.prompt, str) else request.prompt[0]
        settings = settings_from(request)
        messages = [{"role": "user", "content": prompt}]
        result = engine.generate(messages, settings, add_system=True)
        app.state.tokens_generated += result["completion_tokens"]
        return {
            "id": f"cmpl-{uuid.uuid4().hex[:24]}", "object": "text_completion",
            "created": int(time.time()), "model": MODEL_ID,
            "choices": [{"index": 0, "text": result["text"], "logprobs": None,
                         "finish_reason": result["finish_reason"]}],
            "usage": {
                "prompt_tokens": result["prompt_tokens"],
                "completion_tokens": result["completion_tokens"],
                "total_tokens": result["prompt_tokens"] + result["completion_tokens"],
            },
        }

    @app.post("/v1/tokenize")
    def tokenize(request: TokenizeRequest) -> dict:
        """How many tokens is this? Not in OpenAI's schema, but Hebrew costs
        1.75× English on this tokenizer and a client planning a context budget
        needs to be able to ask."""
        return {"model": MODEL_ID, "characters": len(request.text),
                "tokens": engine.count_tokens(request.text),
                "chars_per_token": round(
                    len(request.text) / max(engine.count_tokens(request.text), 1), 3)}

    if web_dir is not None:
        from fastapi.staticfiles import StaticFiles
        from pathlib import Path
        web_dir = Path(web_dir)
        if web_dir.exists():
            app.mount("/app", StaticFiles(directory=str(web_dir), html=True),
                      name="web")

            @app.get("/", response_class=HTMLResponse)
            def index() -> Any:
                return HTMLResponse(
                    '<meta http-equiv="refresh" content="0; url=/app/">')

    return app
