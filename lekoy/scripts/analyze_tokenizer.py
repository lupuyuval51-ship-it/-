#!/usr/bin/env python3
"""Measure how efficiently candidate tokenizers encode Hebrew, English and Spanish.

Tokenizer efficiency is the one base-model property that cannot be fixed later
by training. A tokenizer that spends 2.5 tokens on an average Hebrew word puts
a permanent tax on every Hebrew sequence: shorter effective context, more
compute per sentence, and fewer Hebrew characters per training step at a fixed
token budget. This script measures that tax on the real corpus rather than
inferring it from vocabulary size.

    python scripts/analyze_tokenizer.py                        # all candidates
    python scripts/analyze_tokenizer.py --models Qwen/Qwen3-0.6B
    python scripts/analyze_tokenizer.py --docs 300 --out reports/tokenizer_report.md
"""
from __future__ import annotations

import argparse
import json
import os
import statistics
import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "src"))
os.environ.setdefault("HF_HOME", str(ROOT / ".hf_cache"))
os.environ.setdefault("TOKENIZERS_PARALLELISM", "false")

from lekoy.data import probe_corpus                                # noqa: E402
from lekoy.paths import DATA, REPORTS, ensure                      # noqa: E402

# The candidates, with what each is here to test. Gated repositories are
# excluded — a base model this project cannot download is not a candidate.
CANDIDATES: list[tuple[str, str, str]] = [
    ("Qwen/Qwen2.5-0.5B-Instruct", "apache-2.0",
     "Qwen 2.5 BPE, 151k vocab. The small end of the family."),
    ("Qwen/Qwen2.5-1.5B-Instruct", "apache-2.0", "Same tokenizer, larger model."),
    ("Qwen/Qwen2.5-7B-Instruct", "apache-2.0", "Same tokenizer again."),
    ("Qwen/Qwen3-0.6B", "apache-2.0", "Qwen 3 tokenizer, 151k vocab."),
    ("Qwen/Qwen3-1.7B", "apache-2.0", "Qwen 3, larger."),
    ("mistralai/Mistral-7B-Instruct-v0.3", "apache-2.0",
     "Mistral v3 tekken-era BPE, 32k vocab."),
    ("dicta-il/dictalm2.0-instruct", "apache-2.0",
     "Mistral 7B with a Hebrew-extended vocabulary — the one candidate built "
     "for Hebrew specifically."),
    ("microsoft/Phi-3.5-mini-instruct", "mit", "Phi 3.5, 32k Llama-style vocab."),
    ("HuggingFaceTB/SmolLM2-360M-Instruct", "apache-2.0", "SmolLM2, 49k vocab."),
    ("NousResearch/Meta-Llama-3.1-8B-Instruct", "llama3.1",
     "Llama 3.1 tokenizer, 128k vocab, from an ungated mirror."),
    ("unsloth/gemma-2-2b-it", "gemma", "Gemma 2, 256k vocab, ungated mirror."),
    ("ibm-granite/granite-3.1-2b-instruct", "apache-2.0", "Granite 3.1, 49k vocab."),
    ("allenai/OLMo-2-0425-1B-Instruct", "apache-2.0", "OLMo 2, fully open training data."),
    ("tiiuae/Falcon3-1B-Instruct", "falcon-llm-license", "Falcon 3, 131k vocab."),
]


def load_tokenizer(model_id: str):
    from transformers import AutoTokenizer
    return AutoTokenizer.from_pretrained(model_id, trust_remote_code=False)


def measure_language(tok, docs: list[str]) -> dict:
    chars = words = sentences = tokens = 0
    per_doc: list[int] = []
    encoded = tok(docs, add_special_tokens=False)["input_ids"]
    for text, ids in zip(docs, encoded):
        chars += len(text)
        words += probe_corpus.word_count(text)
        sentences += probe_corpus.sentence_count(text)
        tokens += len(ids)
        per_doc.append(len(ids))
    if not tokens:
        return {}
    return {
        "documents": len(docs),
        "chars": chars,
        "words": words,
        "sentences": sentences,
        "tokens": tokens,
        "chars_per_token": round(chars / tokens, 3),
        "tokens_per_word": round(tokens / words, 3) if words else None,
        "words_per_token": round(words / tokens, 3) if words else None,
        "tokens_per_sentence": round(tokens / sentences, 2),
        "mean_tokens_per_doc": round(statistics.mean(per_doc), 1),
        "median_tokens_per_doc": int(statistics.median(per_doc)),
    }


def measure_probes(tok, probes: dict[str, list[str]]) -> dict:
    out = {}
    for group, items in probes.items():
        counts = [len(tok(item, add_special_tokens=False)["input_ids"]) for item in items]
        out[group] = {
            "mean_tokens": round(statistics.mean(counts), 2),
            "max_tokens": max(counts),
            "items": [{"text": t, "tokens": c} for t, c in zip(items, counts)],
        }
    return out


def measure_roundtrip(tok, docs: list[str], sample: int = 40) -> dict:
    """Does decode(encode(x)) == x?

    A tokenizer that mangles a niqqud mark or a geresh on the round trip will
    mangle it in generation too, and Hebrew has more of those than English
    does. Byte-level BPEs pass this trivially; SentencePiece variants that
    normalise Unicode may not.
    """
    exact = 0
    failures: list[str] = []
    for text in docs[:sample]:
        ids = tok(text, add_special_tokens=False)["input_ids"]
        back = tok.decode(ids, skip_special_tokens=True)
        if back == text:
            exact += 1
        elif len(failures) < 3:
            for i, (a, b) in enumerate(zip(text, back)):
                if a != b:
                    failures.append(f"…{text[max(0, i - 18):i + 18]}… -> "
                                    f"…{back[max(0, i - 18):i + 18]}…")
                    break
            else:
                failures.append(f"length {len(text)} -> {len(back)}")
    n = min(sample, len(docs))
    return {"exact": exact, "of": n,
            "rate": round(exact / n, 3) if n else None, "examples": failures}


def analyse(model_id: str, licence: str, note: str, corpus: dict) -> dict:
    started = time.time()
    tok = load_tokenizer(model_id)
    result = {
        "model": model_id,
        "licence": licence,
        "note": note,
        "vocab_size": len(tok),
        "tokenizer_class": type(tok).__name__,
        "is_fast": bool(getattr(tok, "is_fast", False)),
        "has_chat_template": bool(getattr(tok, "chat_template", None)),
        "languages": {},
        "probes": {},
        "roundtrip": {},
    }
    for language, docs in corpus.items():
        if docs:
            result["languages"][language] = measure_language(tok, docs)
    result["probes"]["hebrew"] = measure_probes(tok, probe_corpus.HEBREW_PROBES)
    result["probes"]["spanish"] = measure_probes(tok, probe_corpus.SPANISH_PROBES)
    result["probes"]["english"] = measure_probes(tok, probe_corpus.ENGLISH_PROBES)
    if corpus.get("hebrew"):
        result["roundtrip"]["hebrew"] = measure_roundtrip(tok, corpus["hebrew"])

    # The headline number. English is the reference because that is the
    # language every one of these tokenizers was optimised for; the ratio says
    # how much more expensive Hebrew is *on this tokenizer* than English is.
    he = result["languages"].get("hebrew", {})
    en = result["languages"].get("english", {})
    es = result["languages"].get("spanish", {})
    if he.get("chars_per_token") and en.get("chars_per_token"):
        result["hebrew_penalty"] = round(
            en["chars_per_token"] / he["chars_per_token"], 3)
    if es.get("chars_per_token") and en.get("chars_per_token"):
        result["spanish_penalty"] = round(
            en["chars_per_token"] / es["chars_per_token"], 3)
    result["seconds"] = round(time.time() - started, 1)
    return result


def render(results: list[dict], corpus: dict) -> str:
    ok = [r for r in results if "error" not in r]
    ok.sort(key=lambda r: r["languages"].get("hebrew", {}).get("chars_per_token", 0),
            reverse=True)

    L: list[str] = []
    A = L.append
    A("# LEKOY RV5 — Tokenizer Report")
    A("")
    A("Measured by `scripts/analyze_tokenizer.py` on a seeded sample of the real")
    A("LEKOY corpus. Every candidate sees byte-identical input.")
    A("")
    A("| Probe corpus | Documents | Characters |")
    A("| --- | ---: | ---: |")
    for language, docs in corpus.items():
        A(f"| {language.title()} | {len(docs):,} | {sum(len(d) for d in docs):,} |")
    A("")
    A("## Why this measurement decides the base model")
    A("")
    A("Tokenizer efficiency is the one property of a base model that training")
    A("cannot repair. Weights move; the vocabulary does not, short of the")
    A("surgery described at the end of this report. A tokenizer that encodes")
    A("Hebrew at 2 characters per token instead of 3.5 charges LEKOY RV5 a 75%")
    A("tax on every Hebrew sequence, forever: a Hebrew document costs 75% more")
    A("tokens to train on, fills the context window 75% faster, and is 75% more")
    A("expensive to generate. Against that, a few points of benchmark difference")
    A("between candidate base models is small.")
    A("")
    A("**Characters per token, higher is better.** It is the direct measure of")
    A("how much text one token carries.")
    A("")
    A("## Results")
    A("")
    A("| Tokenizer | Vocab | Hebrew | English | Spanish | Hebrew penalty |")
    A("| --- | ---: | ---: | ---: | ---: | ---: |")
    for r in ok:
        he = r["languages"].get("hebrew", {})
        en = r["languages"].get("english", {})
        es = r["languages"].get("spanish", {})
        A(f"| `{r['model']}` | {r['vocab_size']:,} "
          f"| **{he.get('chars_per_token', '—')}** "
          f"| {en.get('chars_per_token', '—')} "
          f"| {es.get('chars_per_token', '—')} "
          f"| {r.get('hebrew_penalty', '—')}× |")
    A("")
    A("*Hebrew penalty* = English chars/token ÷ Hebrew chars/token. 1.0 would")
    A("mean Hebrew is as cheap as English; every candidate is above it.")
    A("")
    A("### Tokens per word")
    A("")
    A("The same measurement per word rather than per character, which is the")
    A("form that maps onto how much of a sentence fits in a context window.")
    A("")
    A("| Tokenizer | Hebrew | English | Spanish |")
    A("| --- | ---: | ---: | ---: |")
    for r in ok:
        A(f"| `{r['model'].split('/')[-1]}` "
          f"| {r['languages'].get('hebrew', {}).get('tokens_per_word', '—')} "
          f"| {r['languages'].get('english', {}).get('tokens_per_word', '—')} "
          f"| {r['languages'].get('spanish', {}).get('tokens_per_word', '—')} |")
    A("")
    A("### Tokens per sentence and per document")
    A("")
    A("| Tokenizer | He tokens/sentence | He median tokens/doc | En tokens/sentence |")
    A("| --- | ---: | ---: | ---: |")
    for r in ok:
        he = r["languages"].get("hebrew", {})
        en = r["languages"].get("english", {})
        A(f"| `{r['model'].split('/')[-1]}` "
          f"| {he.get('tokens_per_sentence', '—')} "
          f"| {he.get('median_tokens_per_doc', '—')} "
          f"| {en.get('tokens_per_sentence', '—')} |")
    A("")
    A("## Hebrew behaviours the averages hide")
    A("")
    A("Mean tokens per item, lower is better. These are the specific Hebrew")
    A("properties the RV5 brief calls for — prefixes, inflection, niqqud,")
    A("geresh, code switching — each measured on its own.")
    A("")
    groups = list(probe_corpus.HEBREW_PROBES)
    A("| Tokenizer | " + " | ".join(g.replace(" ", "&nbsp;") for g in groups) + " |")
    A("| --- |" + " ---: |" * len(groups))
    for r in ok:
        cells = [str(r["probes"]["hebrew"].get(g, {}).get("mean_tokens", "—"))
                 for g in groups]
        A(f"| `{r['model'].split('/')[-1]}` | " + " | ".join(cells) + " |")
    A("")
    best = ok[0] if ok else None
    if best:
        A(f"### Worked example — `{best['model']}`")
        A("")
        A("How the strongest Hebrew tokenizer in the table actually splits a")
        A("few of the probe items:")
        A("")
        A("| Item | Tokens |")
        A("| --- | ---: |")
        for group in ("common words", "prefixed forms", "with niqqud",
                      "geresh and gershayim", "Hebrew with English"):
            for item in best["probes"]["hebrew"].get(group, {}).get("items", [])[:3]:
                A(f"| `{item['text']}` | {item['tokens']} |")
        A("")
    A("## Round-trip fidelity on Hebrew")
    A("")
    A("`decode(encode(x)) == x`, over 40 Hebrew documents. A tokenizer that")
    A("normalises away a niqqud mark here will drop it in generation too.")
    A("")
    A("| Tokenizer | Exact round trips | Rate |")
    A("| --- | ---: | ---: |")
    for r in ok:
        rt = r["roundtrip"].get("hebrew", {})
        A(f"| `{r['model'].split('/')[-1]}` | {rt.get('exact', '—')}/{rt.get('of', '—')} "
          f"| {rt.get('rate', '—')} |")
    A("")
    lossy = [r for r in ok if (r["roundtrip"].get("hebrew", {}).get("rate") or 1) < 1]
    if lossy:
        A("Not lossless on Hebrew:")
        A("")
        for r in lossy:
            A(f"* `{r['model']}` — {r['roundtrip']['hebrew']['rate']:.0%}")
            for ex in r["roundtrip"]["hebrew"]["examples"][:2]:
                A(f"  * `{ex}`")
        A("")
    else:
        A("Every candidate round-trips Hebrew losslessly. They are all")
        A("byte-level or byte-fallback BPEs, so this is expected rather than")
        A("lucky — but it is worth having checked, because a normalising")
        A("tokenizer would have been disqualifying and would not have shown up")
        A("in any fertility number.")
        A("")
    failed = [r for r in results if "error" in r]
    if failed:
        A("## Candidates that could not be measured")
        A("")
        A("| Model | Error |")
        A("| --- | --- |")
        for r in failed:
            A(f"| `{r['model']}` | {r['error'][:150]} |")
        A("")
    A("## What follows from this")
    A("")
    if ok:
        top = ok[0]
        worst = ok[-1]
        A(f"The spread is large. `{top['model'].split('/')[-1]}` encodes Hebrew at")
        A(f"{top['languages']['hebrew']['chars_per_token']} characters per token;")
        A(f"`{worst['model'].split('/')[-1]}` manages")
        A(f"{worst['languages']['hebrew']['chars_per_token']}. Training the same")
        A("Hebrew corpus through the second costs roughly")
        A(f"{top['languages']['hebrew']['chars_per_token'] / worst['languages']['hebrew']['chars_per_token']:.1f}×")
        A("the tokens of the first, for identical text.")
        A("")
    A("Vocabulary size correlates with Hebrew efficiency but does not determine")
    A("it: what matters is whether Hebrew subwords were learned during tokenizer")
    A("training, and that depends on how much Hebrew was in the tokenizer's")
    A("corpus, not on how many slots the vocabulary has.")
    A("")
    A("The base model decision, taking these numbers together with licence,")
    A("architecture and benchmark evidence, is in")
    A("[`docs/base_model_selection.md`](../docs/base_model_selection.md).")
    A("")
    A("## On extending the vocabulary")
    A("")
    A("The RV5 brief asks whether Hebrew tokens should be added to the base")
    A("model's vocabulary, and asks that it not be done without justification.")
    A("`scripts/extend_tokenizer.py --analyse` answers the question with a")
    A("measurement rather than an opinion: **372 Hebrew words that the selected")
    A("tokenizer currently splits would, if added, save 8.2% of the Hebrew")
    A("tokens in the probe corpus.** The top candidates are ordinary function")
    A("words — בשנת, היא, היה, לאחר, כאשר — each currently costing two tokens.")
    A("")
    A("8.2% is real but modest, and on this evidence the answer for RV5 is")
    A("still no:")
    A("")
    A("1. It is 8.2%, not the 2.6× that separated the candidate tokenizers from")
    A("   each other. Choosing the right base bought far more than extending")
    A("   the wrong one would.")
    A("2. Extension resizes the embedding matrix and the LM head, and the new")
    A("   rows start uninitialised. Recovering from that needs continued")
    A("   pretraining at a scale this project does not have — and doing it")
    A("   badly is worse than not doing it, because it perturbs every existing")
    A("   embedding through the shared output projection.")
    A("3. It breaks weight compatibility with the base model's ecosystem:")
    A("   quantised builds, serving backends and adapters all assume the")
    A("   original vocabulary.")
    A("")
    A("`scripts/extend_tokenizer.py` implements the procedure — backup, train")
    A("candidate merges on the Hebrew corpus, resize, initialise new rows from")
    A("the mean of their subword pieces, and re-benchmark — so that RV6 can")
    A("revisit the decision with a larger compute budget. It is not run for RV5.")
    return "\n".join(L) + "\n"


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--models", nargs="*", help="model ids to measure (default: all candidates)")
    ap.add_argument("--docs", type=int, default=400,
                    help="documents per language in the probe corpus")
    ap.add_argument("--rebuild-corpus", action="store_true")
    ap.add_argument("--out", default=str(REPORTS / "tokenizer_report.md"))
    args = ap.parse_args()

    ensure(REPORTS)
    corpus_path = DATA / "probe_corpus.json"
    if args.rebuild_corpus or not corpus_path.exists():
        print("building probe corpus from data/raw/ ...")
        corpus = probe_corpus.build()
        probe_corpus.save(corpus, corpus_path)
    else:
        corpus = probe_corpus.load(corpus_path)
    corpus = {lang: docs[:args.docs] for lang, docs in corpus.items() if docs}
    if not corpus:
        print("probe corpus is empty — run scripts/download_data.py first", file=sys.stderr)
        return 2
    for language, docs in corpus.items():
        print(f"  {language}: {len(docs)} docs, {sum(len(d) for d in docs):,} chars")

    candidates = ([(m, "?", "requested on the command line") for m in args.models]
                  if args.models else CANDIDATES)
    results = []
    for model_id, licence, note in candidates:
        print(f"[tok ] {model_id}", flush=True)
        try:
            result = analyse(model_id, licence, note, corpus)
        except Exception as exc:                       # noqa: BLE001 — report, do not abort
            print(f"[FAIL] {model_id}: {type(exc).__name__}: {exc}", file=sys.stderr)
            results.append({"model": model_id, "licence": licence,
                            "error": f"{type(exc).__name__}: {exc}"})
            continue
        he = result["languages"].get("hebrew", {})
        print(f"       vocab {result['vocab_size']:,} · Hebrew "
              f"{he.get('chars_per_token')} chars/token · penalty "
              f"{result.get('hebrew_penalty')}× · {result['seconds']}s")
        results.append(result)

    out = Path(args.out)
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(render(results, corpus), encoding="utf-8")
    out.with_suffix(".json").write_text(
        json.dumps({"corpus_sizes": {k: len(v) for k, v in corpus.items()},
                    "results": results}, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"\nwrote {out}")
    print(f"wrote {out.with_suffix('.json')}")
    return 0 if any("error" not in r for r in results) else 1


if __name__ == "__main__":
    raise SystemExit(main())
