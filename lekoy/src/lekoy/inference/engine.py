"""Loading LEKOY RV5 and generating from it.

One class behind which the model may be a hub id, a merged checkpoint, a LoRA
adapter over a base, or — where the host has the backend — a vLLM or llama.cpp
runtime. Everything above this layer (the CLI chat, the API server, the
evaluation runner) talks to `InferenceEngine` and does not know which.

There is no path in this file that calls out to a hosted model. LEKOY RV5
generates from weights this project controls, which is the central requirement
of the brief, and the backend registry below is the whole set of ways it can do
that.
"""
from __future__ import annotations

import json
import os
import threading
import time
from dataclasses import dataclass, field
from pathlib import Path
from typing import Iterator

from ..identity import system_prompt as default_system_prompt


@dataclass
class GenerationSettings:
    temperature: float = 0.7
    top_p: float = 0.9
    top_k: int = 50
    repetition_penalty: float = 1.05
    max_new_tokens: int = 1024
    stop: list[str] = field(default_factory=list)
    seed: int | None = None

    def sampling(self) -> bool:
        return self.temperature > 0

    @classmethod
    def from_config(cls, config) -> "GenerationSettings":
        g = config.generation
        return cls(temperature=g.temperature, top_p=g.top_p, top_k=g.top_k,
                   repetition_penalty=g.repetition_penalty,
                   max_new_tokens=g.max_new_tokens)


def detect_backend(model_path: str) -> str:
    """Pick a runtime. transformers always works; the others are opportunistic."""
    if model_path.endswith(".gguf") or Path(model_path).is_dir() and \
            list(Path(model_path).glob("*.gguf")):
        try:
            import llama_cpp                                        # noqa: F401
            return "llama_cpp"
        except ImportError:
            pass
    if os.environ.get("LEKOY_BACKEND") == "vllm":
        try:
            import vllm                                             # noqa: F401
            return "vllm"
        except ImportError:
            pass
    return "transformers"


class InferenceEngine:
    """LEKOY RV5, loaded and ready to answer."""

    def __init__(self, model_path: str, *, base_model: str | None = None,
                 dtype: str = "bfloat16", device: str | None = None,
                 backend: str | None = None, trust_remote_code: bool = False):
        self.model_path = model_path
        self.backend = backend or detect_backend(model_path)
        self.dtype = dtype
        self.trust_remote_code = trust_remote_code
        self.loaded_at: float | None = None
        self.metadata: dict = {}
        self._lock = threading.Lock()
        self._load(base_model, device)

    # --- loading -----------------------------------------------------------

    def _load(self, base_model: str | None, device: str | None) -> None:
        started = time.time()
        if self.backend == "llama_cpp":
            self._load_llama_cpp()
        elif self.backend == "vllm":
            self._load_vllm()
        else:
            self._load_transformers(base_model, device)
        self.loaded_at = time.time()
        self.metadata["load_seconds"] = round(self.loaded_at - started, 2)
        self.metadata["backend"] = self.backend
        manifest = Path(self.model_path) / "lekoy_run.json"
        if manifest.exists():
            try:
                run = json.loads(manifest.read_text(encoding="utf-8"))
                self.metadata["stage"] = run.get("stage")
                self.metadata["experiment"] = run.get("experiment_id")
                self.metadata["base_model"] = run.get("base_model")
            except json.JSONDecodeError:
                pass

    def _load_transformers(self, base_model: str | None, device: str | None) -> None:
        import torch
        from transformers import AutoModelForCausalLM, AutoTokenizer

        dtype = {"bfloat16": torch.bfloat16, "float16": torch.float16,
                 "float32": torch.float32}.get(self.dtype, torch.bfloat16)
        adapter = Path(self.model_path) / "adapter_config.json"

        if adapter.exists():
            from peft import PeftModel
            config = json.loads(adapter.read_text(encoding="utf-8"))
            base = base_model or config.get("base_model_name_or_path")
            if not base:
                raise ValueError(
                    f"{self.model_path} is a LoRA adapter but names no base "
                    "model; pass --base-model")
            model = AutoModelForCausalLM.from_pretrained(
                base, dtype=dtype, trust_remote_code=self.trust_remote_code)
            model = PeftModel.from_pretrained(model, self.model_path)
            # Merging costs a few seconds once and removes the adapter's
            # per-layer overhead from every subsequent token.
            model = model.merge_and_unload()
            tokenizer_source = (self.model_path
                                if (Path(self.model_path) / "tokenizer.json").exists()
                                else base)
            self.metadata["adapter"] = self.model_path
            self.metadata["base_model"] = base
        else:
            model = AutoModelForCausalLM.from_pretrained(
                self.model_path, dtype=dtype,
                trust_remote_code=self.trust_remote_code)
            tokenizer_source = self.model_path

        self.tokenizer = AutoTokenizer.from_pretrained(
            tokenizer_source, trust_remote_code=self.trust_remote_code)
        if self.tokenizer.pad_token is None:
            self.tokenizer.pad_token = self.tokenizer.eos_token
        if device:
            model = model.to(device)
        model.config.use_cache = True
        model.eval()
        self.model = model
        self.metadata.update({
            "parameters": sum(p.numel() for p in model.parameters()),
            "dtype": str(dtype), "device": str(next(model.parameters()).device),
            "context_length": getattr(model.config, "max_position_embeddings", None),
            "vocab_size": len(self.tokenizer),
        })

    def _load_vllm(self) -> None:
        from vllm import LLM
        self.model = LLM(model=self.model_path, dtype=self.dtype,
                         trust_remote_code=self.trust_remote_code)
        self.tokenizer = self.model.get_tokenizer()
        self.metadata["vocab_size"] = len(self.tokenizer)

    def _load_llama_cpp(self) -> None:
        from llama_cpp import Llama
        path = self.model_path
        if Path(path).is_dir():
            path = str(sorted(Path(path).glob("*.gguf"))[0])
        self.model = Llama(model_path=path, n_ctx=8192, verbose=False)
        self.tokenizer = None
        self.metadata["gguf"] = path

    # --- prompting ---------------------------------------------------------

    def build_prompt(self, messages: list[dict], add_system: bool = True,
                     language: str = "he") -> str:
        messages = list(messages)
        if add_system and not any(m["role"] == "system" for m in messages):
            messages.insert(0, {"role": "system",
                                "content": default_system_prompt(language)})
        if self.tokenizer is None:                    # llama.cpp path
            rendered = []
            for message in messages:
                rendered.append(f"<|im_start|>{message['role']}\n"
                                f"{message['content']}<|im_end|>")
            return "\n".join(rendered) + "\n<|im_start|>assistant\n"
        return self.tokenizer.apply_chat_template(
            messages, tokenize=False, add_generation_prompt=True)

    # --- generation --------------------------------------------------------

    def generate(self, messages: list[dict],
                 settings: GenerationSettings | None = None,
                 add_system: bool = True) -> dict:
        chunks = list(self.stream(messages, settings, add_system))
        text = "".join(c["text"] for c in chunks)
        last = chunks[-1] if chunks else {}
        return {"text": text.strip(),
                "prompt_tokens": last.get("prompt_tokens", 0),
                "completion_tokens": last.get("completion_tokens", len(chunks)),
                "finish_reason": last.get("finish_reason", "stop")}

    def stream(self, messages: list[dict],
               settings: GenerationSettings | None = None,
               add_system: bool = True) -> Iterator[dict]:
        """Yield {"text", ...} as tokens arrive.

        Streaming is the primitive and `generate` is built on it, rather than
        the other way round: a CPU generating at fifteen tokens a second makes
        a non-streaming interface feel broken, and there is no version of this
        project where streaming is optional.
        """
        settings = settings or GenerationSettings()
        with self._lock:            # a single model, potentially many requests
            if self.backend == "llama_cpp":
                yield from self._stream_llama_cpp(messages, settings, add_system)
            elif self.backend == "vllm":
                yield from self._stream_vllm(messages, settings, add_system)
            else:
                yield from self._stream_transformers(messages, settings, add_system)

    def _stream_transformers(self, messages, settings, add_system):
        import torch
        from transformers import TextIteratorStreamer

        prompt = self.build_prompt(messages, add_system)
        inputs = self.tokenizer(prompt, return_tensors="pt")
        inputs = {k: v.to(self.model.device) for k, v in inputs.items()}
        prompt_tokens = int(inputs["input_ids"].shape[1])

        if settings.seed is not None:
            torch.manual_seed(settings.seed)

        streamer = TextIteratorStreamer(
            self.tokenizer, skip_prompt=True, skip_special_tokens=True)
        kwargs = dict(
            **inputs, streamer=streamer,
            max_new_tokens=settings.max_new_tokens,
            repetition_penalty=settings.repetition_penalty,
            pad_token_id=self.tokenizer.pad_token_id or self.tokenizer.eos_token_id,
        )
        if settings.sampling():
            kwargs.update(do_sample=True, temperature=settings.temperature,
                          top_p=settings.top_p, top_k=settings.top_k)
        else:
            kwargs.update(do_sample=False)

        error: list[BaseException] = []

        def run() -> None:
            try:
                with torch.no_grad():
                    self.model.generate(**kwargs)
            except BaseException as exc:                        # noqa: BLE001
                error.append(exc)
                streamer.end()

        thread = threading.Thread(target=run, daemon=True)
        thread.start()

        produced = 0
        emitted = ""
        finish = "stop"
        for piece in streamer:
            if not piece:
                continue
            produced += 1
            emitted += piece
            # Stop sequences are checked on the accumulated text, not on each
            # chunk: a stop string almost always straddles a token boundary.
            hit = next((s for s in settings.stop if s and s in emitted), None)
            if hit:
                keep = emitted[:emitted.index(hit)]
                tail = keep[len(emitted) - len(piece):] if len(keep) > len(emitted) - len(piece) else ""
                if tail:
                    yield {"text": tail, "prompt_tokens": prompt_tokens,
                           "completion_tokens": produced}
                finish = "stop_sequence"
                break
            yield {"text": piece, "prompt_tokens": prompt_tokens,
                   "completion_tokens": produced}
        thread.join(timeout=1.0)
        if error:
            raise error[0]

        # `produced` counts streamer chunks, and the streamer emits text when it
        # has a decodable piece — which is usually but not always one token. It
        # is the right number to show progress with mid-stream; it is the wrong
        # number to report as usage. Re-encoding the finished text costs one
        # cheap tokenizer call and gives the real count.
        completion_tokens = (len(self.tokenizer(emitted, add_special_tokens=False)
                                 ["input_ids"]) if emitted else 0)
        if completion_tokens >= settings.max_new_tokens:
            finish = "length"
        yield {"text": "", "prompt_tokens": prompt_tokens,
               "completion_tokens": completion_tokens, "finish_reason": finish,
               "done": True}

    def _stream_vllm(self, messages, settings, add_system):
        from vllm import SamplingParams
        prompt = self.build_prompt(messages, add_system)
        params = SamplingParams(
            temperature=settings.temperature, top_p=settings.top_p,
            top_k=settings.top_k if settings.sampling() else -1,
            repetition_penalty=settings.repetition_penalty,
            max_tokens=settings.max_new_tokens, stop=settings.stop or None)
        outputs = self.model.generate([prompt], params)
        text = outputs[0].outputs[0].text
        yield {"text": text, "prompt_tokens": len(outputs[0].prompt_token_ids),
               "completion_tokens": len(outputs[0].outputs[0].token_ids),
               "finish_reason": outputs[0].outputs[0].finish_reason, "done": True}

    def _stream_llama_cpp(self, messages, settings, add_system):
        prompt = self.build_prompt(messages, add_system)
        stream = self.model(
            prompt, max_tokens=settings.max_new_tokens,
            temperature=settings.temperature, top_p=settings.top_p,
            top_k=settings.top_k, repeat_penalty=settings.repetition_penalty,
            stop=settings.stop or ["<|im_end|>"], stream=True)
        produced = 0
        for chunk in stream:
            piece = chunk["choices"][0]["text"]
            produced += 1
            yield {"text": piece, "prompt_tokens": 0, "completion_tokens": produced}
        yield {"text": "", "prompt_tokens": 0, "completion_tokens": produced,
               "finish_reason": "stop", "done": True}

    def count_tokens(self, text: str) -> int:
        if self.tokenizer is None:
            return len(self.model.tokenize(text.encode("utf-8")))
        return len(self.tokenizer(text, add_special_tokens=False)["input_ids"])

    def info(self) -> dict:
        return {"model_path": self.model_path, **self.metadata}
