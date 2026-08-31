#!/usr/bin/env python3
"""Investigate — and, if justified, perform — Hebrew vocabulary extension.

    python scripts/extend_tokenizer.py --analyse                    # is it worth it?
    python scripts/extend_tokenizer.py --train-candidates 2000      # what would we add?
    python scripts/extend_tokenizer.py --apply --new-tokens 512 --out models/rv5-extended

**This is not run for LEKOY RV5.** The brief asks that vocabulary extension not
be done without justification, and `reports/tokenizer_report.md` does not
justify it: Qwen already has the best Hebrew fertility of any permissively
licensed candidate (2.491 chars/token), so extension buys back a fraction of an
already-small gap, while resizing the embedding matrix needs continued
pretraining at a scale this project does not have.

The script exists so RV6 can revisit that with a larger compute budget, and so
the decision rests on numbers rather than on nobody having tried.

`--apply` follows the procedure the brief lays out, in order:

  1. Back up the original tokenizer.
  2. Train candidate merges on the Hebrew corpus and keep the ones that
     actually shorten it.
  3. Resize the embedding matrix and the LM head.
  4. Initialise each new row from the mean of the pieces the token used to be
     split into — never randomly. A random row is noise the model has to
     unlearn, and with tied embeddings that noise reaches the output
     projection too.
  5. Re-measure fertility before and after.

Step 4 is the one that decides whether the result is usable. Controlled
adaptation — a continued-pretraining pass over Hebrew with only the new
embedding rows unfrozen — is required afterwards and is Phase 4 of the training
plan, not part of this script.
"""
from __future__ import annotations

import argparse
import json
import shutil
import sys
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "src"))

from lekoy.config import LekoyConfig                                     # noqa: E402
from lekoy.data import probe_corpus                                      # noqa: E402
from lekoy.paths import DATA, REPORTS                                    # noqa: E402


def measure(tokenizer, corpus: dict[str, list[str]]) -> dict:
    out = {}
    for language, docs in corpus.items():
        if not docs:
            continue
        chars = sum(len(d) for d in docs)
        words = sum(probe_corpus.word_count(d) for d in docs)
        tokens = sum(len(ids) for ids in
                     tokenizer(docs, add_special_tokens=False)["input_ids"])
        out[language] = {
            "chars_per_token": round(chars / tokens, 4),
            "tokens_per_word": round(tokens / words, 4) if words else None,
            "tokens": tokens,
        }
    return out


def candidate_tokens(tokenizer, docs: list[str], count: int,
                     min_frequency: int = 20) -> list[tuple[str, int, int]]:
    """Hebrew words the tokenizer splits, ranked by how much adding them saves.

    Saving is (pieces − 1) × frequency: a word split into four pieces that
    appears a thousand times is worth three thousand tokens, and one split into
    two that appears twice is worth two. Ranking by frequency alone would fill
    the new vocabulary with common words that are already single tokens.
    """
    import re

    words: Counter[str] = Counter()
    for doc in docs:
        words.update(re.findall(r"[֐-׿]{2,}", doc))

    scored = []
    for word, frequency in words.items():
        if frequency < min_frequency:
            continue
        pieces = len(tokenizer(word, add_special_tokens=False)["input_ids"])
        if pieces <= 1:
            continue
        scored.append((word, frequency, (pieces - 1) * frequency))
    scored.sort(key=lambda t: -t[2])
    return scored[:count]


def apply_extension(tokenizer, model, new_tokens: list[str]) -> dict:
    """Add tokens and initialise their embeddings from their old pieces."""
    import torch

    before = len(tokenizer)
    added = tokenizer.add_tokens(new_tokens)
    if not added:
        return {"added": 0, "note": "every candidate was already in the vocabulary"}

    # Capture the old decomposition *before* resizing, or the tokenizer will
    # already produce the new single token and there is nothing to average.
    pieces = {}
    for token in new_tokens:
        ids = tokenizer(token, add_special_tokens=False)["input_ids"]
        if len(ids) > 1:
            pieces[token] = ids

    model.resize_token_embeddings(len(tokenizer))
    embeddings = model.get_input_embeddings().weight.data

    initialised = 0
    with torch.no_grad():
        for token in new_tokens:
            index = tokenizer.convert_tokens_to_ids(token)
            if index is None or index < before:
                continue
            old = pieces.get(token)
            if old:
                embeddings[index] = embeddings[torch.tensor(old)].mean(dim=0)
                initialised += 1
            else:
                # No decomposition available: use the mean of the existing
                # vocabulary, which is far closer to a plausible embedding than
                # a random draw and does not inject noise into the output
                # projection when the embeddings are tied.
                embeddings[index] = embeddings[:before].mean(dim=0)

    head = model.get_output_embeddings()
    if head is not None and not getattr(model.config, "tie_word_embeddings", False):
        with torch.no_grad():
            head.weight.data[before:] = embeddings[before:].clone()

    return {"added": added, "initialised_from_pieces": initialised,
            "vocab_before": before, "vocab_after": len(tokenizer)}


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--config", default="rv5_small.yaml")
    ap.add_argument("--analyse", action="store_true",
                    help="measure the current tokenizer and report whether "
                         "extension is justified")
    ap.add_argument("--train-candidates", type=int, metavar="N",
                    help="propose N Hebrew tokens and report what they would save")
    ap.add_argument("--apply", action="store_true",
                    help="actually extend the vocabulary and write a new model")
    ap.add_argument("--new-tokens", type=int, default=512)
    ap.add_argument("--out", help="destination for the extended model")
    ap.add_argument("--docs", type=int, default=600)
    args = ap.parse_args()

    if not any((args.analyse, args.train_candidates, args.apply)):
        ap.print_help()
        return 0

    from transformers import AutoModelForCausalLM, AutoTokenizer

    config = LekoyConfig.load(args.config)
    tokenizer = AutoTokenizer.from_pretrained(config.model.name)

    corpus_path = DATA / "probe_corpus.json"
    corpus = (probe_corpus.load(corpus_path) if corpus_path.exists()
              else probe_corpus.build())
    corpus = {k: v[:args.docs] for k, v in corpus.items()}
    hebrew = corpus.get("hebrew", [])
    if not hebrew:
        print("no Hebrew probe corpus — run scripts/download_data.py first",
              file=sys.stderr)
        return 2

    report: dict = {"base_model": config.model.name,
                    "vocab_size": len(tokenizer)}
    baseline = measure(tokenizer, corpus)
    report["baseline"] = baseline
    print(f"{config.model.name} · vocab {len(tokenizer):,}")
    for language, stats in baseline.items():
        print(f"  {language:9s} {stats['chars_per_token']:.3f} chars/token · "
              f"{stats['tokens_per_word']} tokens/word")

    if args.analyse or args.train_candidates or args.apply:
        candidates = candidate_tokens(
            tokenizer, hebrew, args.train_candidates or args.new_tokens)
        total_saving = sum(saving for _, _, saving in candidates)
        hebrew_tokens = baseline["hebrew"]["tokens"]
        report["candidates"] = {
            "count": len(candidates),
            "estimated_token_saving": total_saving,
            "estimated_saving_fraction": round(total_saving / hebrew_tokens, 4)
            if hebrew_tokens else None,
            "top": [{"token": t, "frequency": f, "saving": s}
                    for t, f, s in candidates[:25]],
        }
        print(f"\n{len(candidates)} candidate Hebrew tokens")
        print(f"  estimated saving: {total_saving:,} tokens on the probe corpus "
              f"({total_saving / hebrew_tokens:.1%} of its Hebrew tokens)")
        print("\n  token          freq   saving")
        for token, frequency, saving in candidates[:15]:
            print(f"  {token:14s} {frequency:5d}  {saving:6d}")

        print("\nVerdict")
        if total_saving / hebrew_tokens < 0.08:
            print("  Not justified. The saving is small, and resizing the")
            print("  embedding matrix costs a continued-pretraining pass to")
            print("  recover from — which can easily lose more than this gains.")
        else:
            print("  Worth investigating. Run with --apply on a host that can")
            print("  afford the controlled adaptation pass afterwards, and")
            print("  compare benchmarks before and after with")
            print("  scripts/compare_models.py before keeping the result.")

    if args.apply:
        out = Path(args.out or ROOT / "models" / "rv5-extended-tokenizer")
        backup = out.parent / f"{out.name}-original-tokenizer"
        print(f"\n[backup] original tokenizer -> {backup}")
        backup.mkdir(parents=True, exist_ok=True)
        tokenizer.save_pretrained(str(backup))

        print(f"[load  ] {config.model.name}")
        model = AutoModelForCausalLM.from_pretrained(config.model.name)
        tokens = [t for t, _, _ in candidates[:args.new_tokens]]
        result = apply_extension(tokenizer, model, tokens)
        report["extension"] = result
        print(f"[extend] {result}")

        after = measure(tokenizer, corpus)
        report["after"] = after
        print("\n  language   before   after   change")
        for language in after:
            b = baseline[language]["chars_per_token"]
            a = after[language]["chars_per_token"]
            print(f"  {language:9s} {b:6.3f}  {a:6.3f}  {(a - b) / b:+.1%}")

        out.mkdir(parents=True, exist_ok=True)
        model.save_pretrained(str(out), safe_serialization=True)
        tokenizer.save_pretrained(str(out))
        print(f"\n[write ] {out}")
        print("\nThe new embedding rows are initialised, not trained. Run a")
        print("controlled adaptation pass before using this model:")
        print(f"  python scripts/train_pretrain.py --set model.name={out} \\")
        print("      --set lora.modules_to_save='[embed_tokens, lm_head]'")

    path = REPORTS / "tokenizer_extension.json"
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(report, indent=2, ensure_ascii=False),
                    encoding="utf-8")
    print(f"\nwrote {path.relative_to(ROOT)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
