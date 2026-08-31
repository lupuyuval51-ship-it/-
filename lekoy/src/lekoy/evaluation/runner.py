"""Running an evaluation suite against a checkpoint.

Generation is the slow part and this project has 4 CPU cores, so the runner is
built around not wasting any of it: multiple-choice items get 8 new tokens
because the answer is one letter, open-ended items get the configured budget,
and everything is greedy so that a re-run reproduces the number exactly.

Coding items are scored by executing the generated code in a subprocess with a
timeout and a clean environment. That is the only honest way to score code —
"looks right" is not a measurement — and the subprocess is what keeps a
generated `while True` from taking the evaluation with it.
"""
from __future__ import annotations

import json
import re
import subprocess
import sys
import tempfile
import time
from pathlib import Path

from ..identity import claims_foreign_identity
from . import metrics

# Per-scorer generation budgets. A multiple-choice answer is one letter; giving
# it 320 tokens means paying 320 tokens for a model that rambles before
# answering, over 660 items.
MAX_NEW_TOKENS = {
    "choice": 12,
    "numeric": 320,
    "exact": 48,
    "contains": 64,
    "format": 320,
    "language": 256,
    "uncertainty": 200,
    "identity": 120,
    "code": 420,
}

CODE_BLOCK_RE = re.compile(r"```(?:python|py)?\s*\n(.*?)```", re.DOTALL)

# Sentinel: an item that does not mention system_prompt inherits the
# evaluator's, while an item that sets it to None suppresses it.
_INHERIT = object()


def extract_code(text: str) -> str:
    """Get the Python out of a response.

    Preferring a fenced block, then falling back to the whole response if it
    parses as Python. A model that emits bare code without fences has still
    answered the question, and failing it on formatting would conflate coding
    ability with instruction following — which the suite measures separately.
    """
    blocks = CODE_BLOCK_RE.findall(text)
    if blocks:
        return max(blocks, key=len)
    stripped = text.strip()
    if stripped.startswith(("def ", "import ", "from ", "class ")):
        return stripped
    # A def anywhere in the response, taken to the end.
    m = re.search(r"^(?:def |class |import |from )", text, re.MULTILINE)
    return text[m.start():] if m else ""


def run_code_item(response: str, item: dict, timeout: int = 10) -> tuple[float, str]:
    """Execute generated code against the item's assertions."""
    code = extract_code(response)
    if not code.strip():
        return 0.0, "no code block in the response"
    entry = item.get("entry")
    if entry and f"def {entry}" not in code:
        return 0.0, f"does not define {entry}()"

    harness = code + "\n\n" + "\n".join(item.get("tests", [])) + "\nprint('PASS')\n"
    with tempfile.TemporaryDirectory() as tmp:
        script = Path(tmp) / "candidate.py"
        script.write_text(harness, encoding="utf-8")
        try:
            proc = subprocess.run(
                [sys.executable, "-I", str(script)], capture_output=True,
                text=True, timeout=timeout, cwd=tmp)
        except subprocess.TimeoutExpired:
            return 0.0, f"timed out after {timeout}s"
        except OSError as exc:
            return 0.0, f"could not run: {exc}"
    if proc.returncode == 0 and "PASS" in proc.stdout:
        return 1.0, "all assertions passed"
    error = (proc.stderr or proc.stdout or "").strip().splitlines()
    return 0.0, error[-1][:160] if error else f"exit code {proc.returncode}"


def score_item(item: dict, response: str) -> dict:
    """Score one response. Returns the score plus why it got it."""
    scorer = item["scorer"]
    detail = ""
    score = 0.0

    if scorer == "choice":
        picked = metrics.extract_choice(response, item.get("num_options", 4))
        score = float(picked == item["correct"])
        detail = f"picked {picked or 'nothing'}, correct is {item['correct']}"
    elif scorer == "numeric":
        score = metrics.numeric_match(response, item["answer"])
        detail = (f"got {metrics.extract_number(response)}, "
                  f"want {metrics.extract_number(item['answer'])}")
    elif scorer == "exact":
        score = metrics.exact_match(response, item["answer"])
    elif scorer == "contains":
        score = metrics.contains(response, item["answer"])
        if score and item.get("must_avoid"):
            for banned in item["must_avoid"]:
                if banned in response:
                    score, detail = 0.0, f"contains the excluded form {banned!r}"
                    break
        if not detail:
            detail = f"looking for {item['answer']!r}"
    elif scorer == "format":
        score, failures = metrics.format_compliance(response, item["requirement"])
        detail = "; ".join(failures) if failures else "meets the requirement"
    elif scorer == "language":
        score = metrics.language_match(response, item["expected_language"])
        detail = f"expected {item['expected_language']}"
    elif scorer == "uncertainty":
        hedged = metrics.uncertainty_expressed(response)
        fabricated = metrics.fabricated_specific_claim(response)
        score = 1.0 if hedged else (0.0 if fabricated else 0.5)
        detail = ("hedged appropriately" if hedged else
                  "confident specific claim" if fabricated else
                  "neither hedged nor obviously fabricated")
    elif scorer == "identity":
        foreign = claims_foreign_identity(response)
        matched = any(a.casefold() in response.casefold()
                      for a in item.get("acceptable", []))
        if foreign:
            score, detail = 0.0, f"claims to be {', '.join(foreign)}"
        elif matched:
            score, detail = 1.0, "identifies correctly"
        else:
            score, detail = 0.0, "does not state the LEKOY identity"
    elif scorer == "code":
        score, detail = run_code_item(response, item)
    else:
        raise ValueError(f"unknown scorer {scorer!r} on item {item['id']}")

    # Hebrew agreement errors are reported alongside every Hebrew item rather
    # than folded into its score: the detector is high-precision and
    # low-recall, so it is a signal worth surfacing and not a fair penalty.
    extra = {}
    if item.get("suite") == "hebrew" or item.get("expected_language") == "hebrew":
        errors = metrics.hebrew_agreement_errors(response)
        if errors:
            extra["agreement_errors"] = errors

    return {"id": item["id"], "suite": item.get("suite"), "score": score,
            "detail": detail, "response": response[:600], **extra}


class Evaluator:
    """Loads a model once and answers many prompts with it."""

    def __init__(self, model, tokenizer, system_prompt: str | None = None,
                 max_new_tokens: int = 320, temperature: float = 0.0):
        self.model = model
        self.tokenizer = tokenizer
        self.system_prompt = system_prompt
        self.default_max_new_tokens = max_new_tokens
        self.temperature = temperature
        self.model.eval()

    def generate(self, prompt: str, max_new_tokens: int | None = None,
                 system_prompt: str | None = _INHERIT) -> str:
        import torch

        if system_prompt is _INHERIT:
            system_prompt = self.system_prompt
        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": prompt})
        text = self.tokenizer.apply_chat_template(
            messages, tokenize=False, add_generation_prompt=True)
        inputs = self.tokenizer(text, return_tensors="pt")
        inputs = {k: v.to(self.model.device) for k, v in inputs.items()}

        kwargs = dict(
            max_new_tokens=max_new_tokens or self.default_max_new_tokens,
            pad_token_id=self.tokenizer.pad_token_id or self.tokenizer.eos_token_id,
        )
        if self.temperature > 0:
            kwargs.update(do_sample=True, temperature=self.temperature, top_p=0.9)
        else:
            kwargs.update(do_sample=False)

        with torch.no_grad():
            output = self.model.generate(**inputs, **kwargs)
        generated = output[0][inputs["input_ids"].shape[1]:]
        return self.tokenizer.decode(generated, skip_special_tokens=True).strip()

    def run_suite(self, name: str, items: list[dict], *, progress: bool = True,
                  limit: int | None = None) -> dict:
        if limit:
            items = items[:limit]
        results, started = [], time.time()
        for index, item in enumerate(items, 1):
            budget = MAX_NEW_TOKENS.get(item["scorer"], self.default_max_new_tokens)
            budget = min(budget, self.default_max_new_tokens) \
                if item["scorer"] not in ("choice",) else budget
            # An item may override the system prompt, including to None.
            override = item.get("system_prompt", _INHERIT)
            try:
                response = self.generate(item["prompt"], budget, override)
            except Exception as exc:                       # noqa: BLE001
                results.append({"id": item["id"], "suite": name, "score": 0.0,
                                "detail": f"generation failed: "
                                          f"{type(exc).__name__}: {exc}",
                                "response": ""})
                continue
            results.append(score_item(item, response))
            if progress and (index % 10 == 0 or index == len(items)):
                mean = sum(r["score"] for r in results) / len(results)
                rate = index / max(time.time() - started, 1e-6)
                print(f"    {name}: {index}/{len(items)} · running mean "
                      f"{mean:.3f} · {rate:.2f} items/s", flush=True)

        elapsed = time.time() - started
        scores = [r["score"] for r in results]
        summary = {
            "suite": name,
            "items": len(results),
            "score": round(sum(scores) / len(scores), 4) if scores else 0.0,
            "seconds": round(elapsed, 1),
            "perfect": sum(1 for s in scores if s >= 1.0),
            "zero": sum(1 for s in scores if s <= 0.0),
            "results": results,
        }
        agreement = sum(len(r.get("agreement_errors", [])) for r in results)
        if agreement:
            summary["hebrew_agreement_errors"] = agreement
        by_category: dict[str, list[float]] = {}
        for item, result in zip(items, results):
            if item.get("category"):
                by_category.setdefault(item["category"], []).append(result["score"])
        if by_category:
            summary["by_category"] = {
                k: round(sum(v) / len(v), 4) for k, v in sorted(by_category.items())}
        return summary
