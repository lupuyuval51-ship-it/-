"""Turning LEKOY JSONL into tensors.

Two dataset shapes, because the stages need different things:

  * `ChatDataset` — conversations, with the loss masked to the assistant turns
    only. Training on the prompt tokens teaches the model to generate user
    turns, which it will then do: it is the standard cause of a fine-tuned
    model that answers a question and then invents the next one.
  * `TextDataset` — plain text for continued pretraining, optionally packed
    into full-length sequences so no compute is spent on padding.

The masking is done by re-rendering the conversation prefix by prefix and
comparing lengths, rather than by searching for the template's role markers in
the token stream. Searching is what breaks when a user message happens to
contain the marker text — and a Hebrew corpus full of code blocks contains all
sorts of things.
"""
from __future__ import annotations

import json
from pathlib import Path

import torch
from torch.utils.data import Dataset

IGNORE_INDEX = -100


def _default_system() -> str:
    from ..identity import system_prompt
    return system_prompt("he")


_DEFAULT_SYSTEM = _default_system()


def read_jsonl(path: str | Path, limit: int | None = None) -> list[dict]:
    records = []
    with Path(path).open(encoding="utf-8") as fh:
        for line in fh:
            line = line.strip()
            if not line:
                continue
            records.append(json.loads(line))
            if limit and len(records) >= limit:
                break
    return records


def _template_ids(tokenizer, messages: list[dict]) -> list[int]:
    """Token ids for a rendered conversation, whatever the tokenizer returns.

    `apply_chat_template(tokenize=True)` returns a plain list on transformers 4
    and a `BatchEncoding` on transformers 5. `len()` of a BatchEncoding is the
    number of *keys* — two — so reading it as a list makes every prefix appear
    to be two tokens long and the response mask comes out empty. That failure
    is silent: training runs, the loss is finite, and the model learns nothing.
    """
    rendered = tokenizer.apply_chat_template(
        messages, tokenize=True, add_generation_prompt=False)
    if hasattr(rendered, "keys"):
        rendered = rendered["input_ids"]
    if rendered and isinstance(rendered[0], (list, tuple)):
        rendered = rendered[0]          # a batch of one
    return list(rendered)


class ChatDataset(Dataset):
    """Conversations, tokenized with the assistant turns as the only targets."""

    def __init__(self, records: list[dict], tokenizer, max_length: int = 1024,
                 mask_prompt: bool = True, system_prompt: str | None = _DEFAULT_SYSTEM):
        self.tokenizer = tokenizer
        self.max_length = max_length
        self.mask_prompt = mask_prompt
        # Every conversation gets a system turn, because the base model's chat
        # template supplies one if we do not — and Qwen's says "You are Qwen,
        # created by Alibaba Cloud". Pass system_prompt=None to opt out.
        self.system_prompt = system_prompt
        self.examples: list[dict] = []
        self.skipped = {"no_assistant_turn": 0, "too_long_after_truncation": 0,
                        "all_masked": 0}
        for record in records:
            example = self._encode(record.get("messages") or [],
                                   inject_system=not record.get("no_system"))
            if example is not None:
                self.examples.append(example)

    def _encode(self, messages: list[dict],
                inject_system: bool = True) -> dict | None:
        if not messages or messages[-1].get("role") != "assistant":
            self.skipped["no_assistant_turn"] += 1
            return None

        # A record may opt out of the injected system turn (`no_system`). The
        # identity data trains half its samples that way on purpose: a model
        # that only ever saw its name inside a system prompt learns to read it
        # from there, and the identity benchmark — which runs with no prompt —
        # showed exactly that failure after the first SFT pass.
        if (inject_system and self.system_prompt
                and not any(m.get("role") == "system" for m in messages)):
            messages = [{"role": "system", "content": self.system_prompt}] + list(messages)

        input_ids: list[int] = []
        labels: list[int] = []
        previous = 0

        for index, message in enumerate(messages):
            prefix = messages[:index + 1]
            # add_generation_prompt is False here: we are rendering the actual
            # turns, not asking the model to continue.
            rendered = _template_ids(self.tokenizer, prefix)
            segment = rendered[previous:]
            previous = len(rendered)
            input_ids.extend(segment)
            if message["role"] == "assistant" or not self.mask_prompt:
                labels.extend(segment)
            else:
                labels.extend([IGNORE_INDEX] * len(segment))

        if len(input_ids) > self.max_length:
            # Truncate from the left: the most recent turns are the ones the
            # answer depends on, and the answer must survive intact or the
            # example teaches nothing.
            input_ids = input_ids[-self.max_length:]
            labels = labels[-self.max_length:]
        if all(l == IGNORE_INDEX for l in labels):
            self.skipped["all_masked"] += 1
            return None
        return {"input_ids": input_ids, "labels": labels}

    def __len__(self) -> int:
        return len(self.examples)

    def __getitem__(self, index: int) -> dict:
        return self.examples[index]

    def stats(self) -> dict:
        lengths = [len(e["input_ids"]) for e in self.examples]
        supervised = [sum(1 for l in e["labels"] if l != IGNORE_INDEX)
                      for e in self.examples]
        if not lengths:
            return {"examples": 0, "skipped": self.skipped}
        return {
            "examples": len(lengths),
            "skipped": self.skipped,
            "tokens_total": sum(lengths),
            "tokens_supervised": sum(supervised),
            "supervised_fraction": round(sum(supervised) / sum(lengths), 4),
            "mean_length": round(sum(lengths) / len(lengths), 1),
            "max_length": max(lengths),
            "at_max_length": sum(1 for l in lengths if l >= self.max_length),
        }


class TextDataset(Dataset):
    """Plain text for causal language modelling, optionally packed.

    Packing concatenates documents and cuts the stream into fixed-length
    blocks. It eliminates padding — which on a corpus with a long tail of short
    web documents is most of the compute — at the cost of some sequences
    spanning a document boundary. For continued pretraining that trade is
    clearly worth taking; for SFT it is not, which is why only this class does it.
    """

    def __init__(self, records: list[dict], tokenizer, max_length: int = 1024,
                 packing: bool = True):
        self.max_length = max_length
        self.examples: list[dict] = []
        eos = tokenizer.eos_token_id

        if packing:
            stream: list[int] = []
            for record in records:
                text = record.get("text") or ""
                if not text.strip():
                    continue
                stream.extend(tokenizer(text, add_special_tokens=False)["input_ids"])
                if eos is not None:
                    stream.append(eos)
                while len(stream) >= max_length:
                    block, stream = stream[:max_length], stream[max_length:]
                    self.examples.append({"input_ids": block, "labels": list(block)})
        else:
            for record in records:
                text = record.get("text") or ""
                if not text.strip():
                    continue
                ids = tokenizer(text, add_special_tokens=False,
                                truncation=True, max_length=max_length)["input_ids"]
                if len(ids) < 16:
                    continue
                self.examples.append({"input_ids": ids, "labels": list(ids)})

    def __len__(self) -> int:
        return len(self.examples)

    def __getitem__(self, index: int) -> dict:
        return self.examples[index]

    def stats(self) -> dict:
        lengths = [len(e["input_ids"]) for e in self.examples]
        if not lengths:
            return {"examples": 0}
        return {"examples": len(lengths), "tokens_total": sum(lengths),
                "mean_length": round(sum(lengths) / len(lengths), 1)}


class Collator:
    """Pad a batch to its own longest sequence, not to max_length.

    Padding to the model maximum wastes most of the compute on a corpus whose
    median example is a third of the cap. Labels pad with IGNORE_INDEX so the
    padding contributes nothing to the loss.
    """

    def __init__(self, tokenizer, pad_to_multiple_of: int = 8):
        self.pad_id = tokenizer.pad_token_id
        if self.pad_id is None:
            self.pad_id = tokenizer.eos_token_id
        self.pad_to_multiple_of = pad_to_multiple_of

    def __call__(self, features: list[dict]) -> dict:
        longest = max(len(f["input_ids"]) for f in features)
        if self.pad_to_multiple_of > 1:
            longest = ((longest + self.pad_to_multiple_of - 1)
                       // self.pad_to_multiple_of * self.pad_to_multiple_of)

        input_ids, labels, attention = [], [], []
        for feature in features:
            ids = list(feature["input_ids"])
            lab = list(feature["labels"])
            pad = longest - len(ids)
            input_ids.append(ids + [self.pad_id] * pad)
            labels.append(lab + [IGNORE_INDEX] * pad)
            attention.append([1] * len(ids) + [0] * pad)
        return {
            "input_ids": torch.tensor(input_ids, dtype=torch.long),
            "labels": torch.tensor(labels, dtype=torch.long),
            "attention_mask": torch.tensor(attention, dtype=torch.long),
        }


def load_chat_dataset(path: str | Path, tokenizer, max_length: int,
                      limit: int | None = None, mask_prompt: bool = True
                      ) -> ChatDataset:
    return ChatDataset(read_jsonl(path, limit), tokenizer, max_length, mask_prompt)


def load_text_dataset(path: str | Path, tokenizer, max_length: int,
                      limit: int | None = None, packing: bool = True) -> TextDataset:
    return TextDataset(read_jsonl(path, limit), tokenizer, max_length, packing)
