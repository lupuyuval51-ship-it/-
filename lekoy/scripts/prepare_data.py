#!/usr/bin/env python3
"""Assemble training sets from the filtered corpus.

    python scripts/prepare_data.py --task sft
    python scripts/prepare_data.py --task pretrain --max-samples 20000
    python scripts/prepare_data.py --task preference
    python scripts/prepare_data.py --task all

Reads `data/deduplicated/` (falling back to `data/filtered/`), applies the
config's language mixture, runs the integrity check, splits deterministically
and writes to `data/instruction/`, `data/reasoning/` or `data/preference/`.

The language mixture is enforced by *subsampling the over-represented
languages*, not by upsampling the scarce one. Repeating 2 Hebrew conversations
to reach a 55% Hebrew share would teach the model those 2 conversations, not
Hebrew.
"""
from __future__ import annotations

import argparse
import json
import random
import sys
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "src"))

from lekoy.config import LekoyConfig                                     # noqa: E402
from lekoy.data import seed as seed_data                                 # noqa: E402
from lekoy.data.langid import detect                                     # noqa: E402
from lekoy.data.oasst import conversations, preference_pairs             # noqa: E402
from lekoy.data.pipeline import (check_integrity, read_jsonl,            # noqa: E402
                                 split_records, text_of, write_jsonl)
from lekoy.paths import (CODING, DEDUPLICATED, FILTERED, INSTRUCTION,    # noqa: E402
                         PREFERENCE, RAW, REASONING, ROOT as PROOT)

LANG_OF_CODE = {"he": "hebrew", "en": "english", "es": "spanish"}

# Which filtered sources feed which task.
TASK_SOURCES = {
    "sft": ["xp3x_hebrew", "aya_spanish", "aya_english", "ultrachat_english"],
    "reasoning": ["gsm8k"],
    "coding": ["codefeedback", "codealpaca"],
    "pretrain": ["hplt2_hebrew", "fineweb2_hebrew", "wikipedia_hebrew",
                 "wikipedia_english", "wikipedia_spanish", "hplt2_spanish"],
}


def source_file(name: str) -> Path | None:
    """Prefer the deduplicated copy; fall back to filtered, then cleaned."""
    for base in (DEDUPLICATED, FILTERED):
        for candidate in base.rglob(f"{name}.jsonl"):
            return candidate
    return None


def load_source(name: str, limit: int | None = None) -> list[dict]:
    path = source_file(name)
    if path is None:
        print(f"  [miss] {name}: not found in data/deduplicated/ or data/filtered/",
              file=sys.stderr)
        return []
    records = []
    for record in read_jsonl(path):
        records.append(record)
        if limit and len(records) >= limit:
            break
    return records


def language_of(record: dict) -> str:
    """The record's language, verified rather than taken on trust.

    For instruction data the language that matters is the *answer's* — a
    cross-lingual xP3x row with a Romanian prompt and a Hebrew target is Hebrew
    training signal, and labelling it Romanian would exclude it from the Hebrew
    mixture it belongs in.
    """
    declared = record.get("language")
    if declared in ("hebrew", "english", "spanish"):
        return declared
    if "messages" in record:
        answers = [m["content"] for m in record["messages"] if m["role"] == "assistant"]
        text = "\n".join(answers) or text_of(record)
    else:
        text = text_of(record)
    code, _ = detect(text)
    if code == "mixed":
        return "hebrew"
    return LANG_OF_CODE.get(code, "other")


def apply_mixture(records: list[dict], mix: dict[str, float], rng: random.Random,
                  ) -> tuple[list[dict], dict]:
    """Subsample so the language proportions match `mix` as closely as possible.

    The scarcest language relative to its target sets the total size. If Hebrew
    is 55% of the target and there are 2,000 Hebrew records, the whole set is
    capped at 2,000/0.55 ≈ 3,636 — English and Spanish are cut to fit rather
    than Hebrew being repeated to catch up.
    """
    buckets: dict[str, list[dict]] = {}
    for record in records:
        buckets.setdefault(language_of(record), []).append(record)
    for bucket in buckets.values():
        rng.shuffle(bucket)

    wanted = {k: v for k, v in mix.items() if v > 0}
    limits = [len(buckets.get(lang, [])) / share for lang, share in wanted.items()
              if buckets.get(lang)]
    if not limits:
        return records, {"note": "no records matched the mixture languages"}
    total = int(min(limits))

    out: list[dict] = []
    achieved: dict[str, int] = {}
    for lang, share in wanted.items():
        take = min(int(total * share), len(buckets.get(lang, [])))
        out.extend(buckets.get(lang, [])[:take])
        achieved[lang] = take
    rng.shuffle(out)

    report = {
        "target_mix": wanted,
        "available": {k: len(v) for k, v in sorted(buckets.items())},
        "selected": achieved,
        "achieved_mix": {k: round(v / len(out), 4) for k, v in achieved.items()} if out else {},
        "total": len(out),
        "limiting_language": min(wanted, key=lambda l: len(buckets.get(l, [])) / wanted[l]
                                 if buckets.get(l) else float("inf")),
    }
    return out, report


def to_chat(record: dict) -> dict | None:
    """Reduce any record to `{messages: [...]}`, dropping what cannot be."""
    if "messages" in record:
        messages = [m for m in record["messages"] if m.get("content", "").strip()]
        if len(messages) >= 2:
            return {"messages": messages,
                    "source": record.get("source"),
                    "language": record.get("language"),
                    "quality_score": record.get("quality_score")}
        return None
    return None


def build_sft(config: LekoyConfig, args) -> dict:
    rng = random.Random(config.data.shuffle_seed)
    pool: list[dict] = []
    provenance: Counter = Counter()

    for name in TASK_SOURCES["sft"]:
        records = load_source(name, args.per_source_limit)
        chats = [c for c in (to_chat(r) for r in records) if c]
        print(f"  {name:22s} {len(records):7,d} records -> {len(chats):7,d} chats")
        pool.extend(chats)
        provenance[name] += len(chats)

    # OASST conversations are rebuilt from the raw message forest: the flat
    # cleaned copy has no parent pointers left to walk.
    oasst_raw = RAW / "oasst2.jsonl"
    if oasst_raw.exists():
        messages = list(read_jsonl(oasst_raw))
        convs = conversations(messages, languages={"he", "es", "en"})
        for conv in convs:
            pool.append({"messages": conv["messages"], "source": "oasst2",
                         "language": LANG_OF_CODE.get(conv["language"], "other")})
        provenance["oasst2"] += len(convs)
        by_lang = Counter(c["language"] for c in convs)
        print(f"  {'oasst2':22s} {len(messages):7,d} messages -> "
              f"{len(convs):7,d} conversations {dict(by_lang)}")

    seeds = seed_data.build()
    for sample in seeds:
        pool.append({"messages": sample["messages"], "source": "lekoy_seed",
                     "language": LANG_OF_CODE.get(sample["language"], "other"),
                     "category": sample["category"]})
    provenance["lekoy_seed"] += len(seeds)
    print(f"  {'lekoy_seed':22s} {len(seeds):7,d} hand-written samples")

    mixed, mix_report = apply_mixture(pool, config.data.language_mix, rng)
    print(f"\n  mixture: {mix_report['achieved_mix']} "
          f"(limited by {mix_report['limiting_language']})")

    # Seed samples are added back after mixing rather than being subject to it.
    # They are 128 records against thousands and would be subsampled to
    # near-nothing, and they are the only source for identity and register —
    # behaviours with no fallback if they are cut.
    # The cap is applied to the corpus data only, before the seed samples are
    # put back. Capping afterwards would cut the seeds proportionally — at
    # --max-samples 3000 out of 36,000 that leaves about ten of them — and the
    # seeds are the only source for identity, register and honest uncertainty.
    # There is no fallback for those behaviours if they are thinned out.
    mixed = [r for r in mixed if r.get("source") != "lekoy_seed"]
    if args.max_samples:
        mixed = mixed[:args.max_samples]
    corpus_count = len(mixed)
    seed_records = [r for r in pool if r.get("source") == "lekoy_seed"]
    mixed.extend(seed_records)
    rng.shuffle(mixed)
    print(f"  {corpus_count:,} corpus samples + {len(seed_records)} seed samples "
          "(seeds are never subject to the cap)")
    good, integrity = check_integrity(mixed)
    print(f"  integrity: {integrity['ok']:,}/{integrity['checked']:,} ok "
          f"{integrity['problems'] or ''}")

    splits = split_records(good, validation=args.validation, test=args.test,
                           seed=config.data.shuffle_seed)
    written = {}
    for split, records in splits.items():
        out = INSTRUCTION / f"{split}.jsonl"
        written[split] = write_jsonl(out, records)
        print(f"  {split:11s} {written[split]:7,d} -> {out.relative_to(PROOT)}")

    return {"task": "sft", "counts": written, "mixture": mix_report,
            "integrity": {k: v for k, v in integrity.items() if k != "examples"},
            "provenance": dict(provenance),
            "languages": dict(Counter(language_of(r) for r in good))}


def build_reasoning(config: LekoyConfig, args) -> dict:
    records = load_source("gsm8k", args.per_source_limit)
    chats = [c for c in (to_chat(r) for r in records) if c]
    print(f"  gsm8k {len(records):,} -> {len(chats):,} chats")
    good, integrity = check_integrity(chats)
    splits = split_records(good, validation=args.validation, test=args.test,
                           seed=config.data.shuffle_seed)
    written = {}
    for split, recs in splits.items():
        out = REASONING / f"{split}.jsonl"
        written[split] = write_jsonl(out, recs)
        print(f"  {split:11s} {written[split]:7,d} -> {out.relative_to(PROOT)}")
    return {"task": "reasoning", "counts": written,
            "integrity": {k: v for k, v in integrity.items() if k != "examples"}}


def build_coding(config: LekoyConfig, args) -> dict:
    """Code instruction data, plus the seed samples that answer in Hebrew.

    The corpus is entirely English — no Hebrew or Spanish code-instruction set
    of any size exists. That matters less than it sounds, because code itself
    is language-neutral; what the brief actually asks for is a Hebrew question
    answered with working code and a Hebrew explanation, and those come from
    the hand-written seed data rather than from any corpus.
    """
    pool: list[dict] = []
    provenance: Counter = Counter()
    for name in TASK_SOURCES["coding"]:
        records = load_source(name, args.per_source_limit)
        chats = [c for c in (to_chat(r) for r in records) if c]
        print(f"  {name:22s} {len(records):7,d} records -> {len(chats):7,d} chats")
        pool.extend(chats)
        provenance[name] += len(chats)

    seeds = [s for s in seed_data.build()
             if s["category"] in ("code_switching", "structured")]
    for sample in seeds:
        pool.append({"messages": sample["messages"], "source": "lekoy_seed",
                     "language": LANG_OF_CODE.get(sample["language"], "other"),
                     "category": sample["category"]})
    provenance["lekoy_seed"] += len(seeds)
    print(f"  {'lekoy_seed':22s} {len(seeds):7,d} Hebrew-explained coding samples")

    rng = random.Random(config.data.shuffle_seed)
    rng.shuffle(pool)
    if args.max_samples:
        pool = pool[:args.max_samples]
    good, integrity = check_integrity(pool)
    print(f"  integrity: {integrity['ok']:,}/{integrity['checked']:,} ok "
          f"{integrity['problems'] or ''}")

    splits = split_records(good, validation=args.validation, test=args.test,
                           seed=config.data.shuffle_seed)
    written = {}
    for split, recs in splits.items():
        out = CODING / f"{split}.jsonl"
        written[split] = write_jsonl(out, recs)
        print(f"  {split:11s} {written[split]:7,d} -> {out.relative_to(PROOT)}")
    return {"task": "coding", "counts": written,
            "provenance": dict(provenance),
            "integrity": {k: v for k, v in integrity.items() if k != "examples"}}


def build_pretrain(config: LekoyConfig, args) -> dict:
    rng = random.Random(config.data.shuffle_seed)
    pool: list[dict] = []
    for name in TASK_SOURCES["pretrain"]:
        records = load_source(name, args.per_source_limit)
        for record in records:
            if record.get("text", "").strip():
                pool.append({"text": record["text"], "source": name,
                             "language": record.get("language"),
                             "quality_score": record.get("quality_score")})
        print(f"  {name:22s} {len(records):7,d} documents")
    mixed, mix_report = apply_mixture(pool, config.data.language_mix, rng)
    print(f"\n  mixture: {mix_report['achieved_mix']} "
          f"(limited by {mix_report['limiting_language']})")
    if args.max_samples:
        mixed = mixed[:args.max_samples]
    good, integrity = check_integrity(mixed)
    splits = split_records(good, validation=args.validation, test=args.test,
                           seed=config.data.shuffle_seed)
    written = {}
    for split, recs in splits.items():
        out = ROOT / "data" / "pretrain" / f"{split}.jsonl"
        written[split] = write_jsonl(out, recs)
        print(f"  {split:11s} {written[split]:7,d} -> {out.relative_to(PROOT)}")
    return {"task": "pretrain", "counts": written, "mixture": mix_report,
            "integrity": {k: v for k, v in integrity.items() if k != "examples"}}


def build_preference(config: LekoyConfig, args) -> dict:
    oasst_raw = RAW / "oasst2.jsonl"
    if not oasst_raw.exists():
        print("  oasst2 raw data missing; nothing to build", file=sys.stderr)
        return {"task": "preference", "counts": {}}
    messages = list(read_jsonl(oasst_raw))
    pairs = preference_pairs(messages, languages={"he", "es", "en"})
    by_lang = Counter(p["language"] for p in pairs)
    print(f"  oasst2 {len(messages):,} messages -> {len(pairs):,} ranked pairs {dict(by_lang)}")

    records = [{
        "prompt": p["prompt"], "chosen": p["chosen"], "rejected": p["rejected"],
        "language": LANG_OF_CODE.get(p["language"], "other"),
        "rank_gap": p["rank_gap"], "source": "oasst2",
    } for p in pairs]
    if args.max_samples:
        records = records[:args.max_samples]
    splits = split_records(records, validation=args.validation, test=args.test,
                           seed=config.data.shuffle_seed)
    written = {}
    for split, recs in splits.items():
        out = PREFERENCE / f"{split}.jsonl"
        written[split] = write_jsonl(out, recs)
        print(f"  {split:11s} {written[split]:7,d} -> {out.relative_to(PROOT)}")
    return {"task": "preference", "counts": written,
            "languages": {k: v for k, v in by_lang.items()}}


def build_identity(config: LekoyConfig, args) -> dict:
    """A small, identity-heavy set for the corrective pass after SFT.

    The first SFT run left identity at 0/21: 119 identity samples in 1,278,
    each seen once, do not overwrite a base model's built-in self-description.
    This set turns the dial the other way — identity repeated hard, half the
    samples with no system prompt at all (so the name must come from the
    weights, not the context), padded with enough ordinary conversation to
    keep the model from collapsing into a one-answer parrot.
    """
    rng = random.Random(config.data.shuffle_seed)
    seeds = seed_data.build(repeat_identity=6)
    # The answer-format samples are repeated as hard as identity: the
    # capability they restore was measured at 124 of 150 responses failing to
    # emit a parseable answer, which is a total loss rather than a degradation.
    seeds += [s for s in seed_data.mc_format_samples() for _ in range(5)]
    pool: list[dict] = []
    for index, sample in enumerate(seeds):
        record = {"messages": sample["messages"], "source": "lekoy_seed",
                  "language": LANG_OF_CODE.get(sample["language"], "other"),
                  "category": sample["category"]}
        if sample["category"] == "identity" and index % 2 == 0:
            record["no_system"] = True
            record["messages"] = [m for m in record["messages"]
                                  if m["role"] != "system"]
        pool.append(record)
    identity_count = sum(1 for r in pool if r.get("category") == "identity")

    # The replay mix. The first version of this pass used 180 stabilisers
    # from three instruction sources and lr 3e-4, and the regression gate
    # blocked the result: identity went 0 -> 1.0 but reasoning fell 50%,
    # coding 20% and Hebrew 12.6% — catastrophic forgetting, exactly as the
    # brief warns. The fix is replay across every dimension that regressed:
    # Hebrew instruction data, coding and reasoning join the mix, and the
    # training run drops to lr 1e-4 for a single epoch.
    # Replay volume per source. Tuned against the regression gate over three
    # attempts, which is worth recording because the failures were informative:
    #
    #   v1  lr 3e-4, 2 epochs, 180 replay   identity 0 -> 1.00, but reasoning
    #                                       -50%, coding -20%, Hebrew -12.6%
    #   v2  lr 1e-4, 1 epoch,  480 replay   identity only 3/21 — too gentle
    #   v3  lr 2e-4, 2 epochs, 480 replay   identity 0.95, Hebrew recovered,
    #                                       but coding still -40%
    #
    # v3's remaining problem was density, not learning rate: identity was 34%
    # of the mixture, so the model learned to answer briefly and lost the
    # habit of writing long code. Identity repetition drops from 10 to 6 and
    # replay rises to 220 per source, putting identity at ~11%.
    stabiliser = 0
    for name in ("xp3x_hebrew", "aya_spanish", "aya_english",
                 "ultrachat_english", "codefeedback", "codealpaca", "gsm8k"):
        records = load_source(name, 220)
        for chat in (to_chat(r) for r in records):
            if chat:
                pool.append(chat)
                stabiliser += 1
    rng.shuffle(pool)
    print(f"  {identity_count} identity samples (half with no system prompt) "
          f"+ {len(pool) - identity_count - stabiliser} other seeds "
          f"+ {stabiliser} stabiliser chats = {len(pool)}")

    good, integrity = check_integrity(pool)
    splits = split_records(good, validation=args.validation, test=0.0,
                           seed=config.data.shuffle_seed)
    written = {}
    out_dir = ROOT / "data" / "identity"
    for split, recs in splits.items():
        if not recs:
            continue
        out = out_dir / f"{split}.jsonl"
        written[split] = write_jsonl(out, recs)
        print(f"  {split:11s} {written[split]:7,d} -> {out.relative_to(PROOT)}")
    return {"task": "identity", "counts": written,
            "identity_samples": identity_count,
            "integrity": {k: v for k, v in integrity.items() if k != "examples"}}


BUILDERS = {"sft": build_sft, "reasoning": build_reasoning, "identity": build_identity,
            "coding": build_coding, "pretrain": build_pretrain,
            "preference": build_preference}


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--task", default="sft",
                    choices=[*BUILDERS, "all"])
    ap.add_argument("--config", default="rv5_small.yaml")
    ap.add_argument("--max-samples", type=int)
    ap.add_argument("--per-source-limit", type=int,
                    help="cap records read from each source, for a fast dry run")
    ap.add_argument("--validation", type=float, default=0.02)
    ap.add_argument("--test", type=float, default=0.02)
    args = ap.parse_args()

    config = LekoyConfig.load(args.config)
    tasks = list(BUILDERS) if args.task == "all" else [args.task]
    summaries = []
    for task in tasks:
        print(f"\n=== {task} ===")
        summaries.append(BUILDERS[task](config, args))

    report = ROOT / "reports" / "data_preparation.json"
    report.parent.mkdir(parents=True, exist_ok=True)
    existing = {}
    if report.exists():
        try:
            existing = json.loads(report.read_text(encoding="utf-8"))
        except json.JSONDecodeError:
            existing = {}
    for summary in summaries:
        existing[summary["task"]] = summary
    report.write_text(json.dumps(existing, indent=2, ensure_ascii=False),
                      encoding="utf-8")
    print(f"\nwrote {report.relative_to(PROOT)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
