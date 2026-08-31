# LEKOY RV5 — Training Report

What was actually run, what it measured, and what it cost. Every number here
comes from a file in this repository; nothing is projected.

---

## The machine

| | |
| --- | --- |
| CPU | 4 × Intel Xeon @ 2.10 GHz, AMX-BF16, AVX512-BF16 |
| Measured bf16 matmul | **3,278 GFLOP/s** |
| Measured fp32 matmul | 235 GFLOP/s |
| RAM | 15 GB, no swap |
| GPU | **none** |
| Disk | ~28 GB free |

The 14× gap between bf16 and fp32 is the AMX tile engine, and it is the reason
CPU training of a 0.5B model is tolerable here rather than hopeless. It is also
why every config sets `bf16: true` and `fp16: false` — fp16 has no fast path on
this CPU and no GradScaler, so it would be both slower and less stable.

Full probe: [`system_report.md`](system_report.md).

---

## Corpus

| Stage | Records | Kept |
| --- | ---: | ---: |
| Downloaded from 21 sources | 340,394 | — |
| Cleaned | 340,394 | ~100% |
| Filtered (quality + language) | 327,574 | 96.2% |
| Deduplicated | 325,241 | 99.3% |

7,984 pieces of personal data redacted, each validated before replacement:
4,279 phone numbers, 2,685 emails, 500 IP addresses, 383 Luhn-valid card
numbers, 131 check-digit-valid Israeli IDs, 4 IBANs, 2 Spanish DNIs.

Language contamination caught by script analysis, against the source labels:
14 Arabic and 4 Cyrillic documents inside "Hebrew" shards, 13 Devanagari inside
"English" ones, and the Punjabi in HPLT `heb_Hebr` that started the
investigation.

Leakage: 7,019 evaluation documents indexed, 3,000 documents per training
source queried. One pair flagged at Jaccard 0.641 — read, judged a shared GSM8K
template rather than a leaked answer, and left in place.

---

## Baseline — `Qwen/Qwen2.5-0.5B-Instruct`

Run before any training, because every claim afterwards is a comparison
against it. 993 items, 17 suites, greedy decoding.

**LEKOY SCORE 42.38 / 100**

| Dimension | Score | | Suite | Score |
| --- | ---: | --- | --- | ---: |
| Coding | 0.625 | | `spanish` | 0.714 |
| Spanish | 0.566 | | `english` | 0.625 |
| English | 0.542 | | `coding` | 0.625 |
| Instruction following | 0.500 | | `hebrew` | 0.465 |
| **Hebrew** | **0.362** | | `belebele_english` | 0.458 |
| Reasoning | 0.333 | | `belebele_hebrew` | **0.258** |
| Reliability | 0.250 | | `global_mmlu_hebrew` | 0.253 |
| Knowledge | 0.229 | | `identity` | **0.000** |
| Maths | 0.108 | | `math` | **0.000** |

Three things the baseline established:

**Hebrew is the weakest of the three languages**, at 0.362 against Spanish's
0.566 — which is what justifies raising the mixture from the brief's opening
40/40/20 to 55/28/17. `belebele_hebrew` at 0.258 is barely above the 0.25 floor
of a four-way multiple choice: on parallel passages the model scores 0.458 in
English and effectively chance in Hebrew.

**Identity is 0/21, and confidently wrong.** Asked "אתה ChatGPT?" the base model
agrees. Asked "מי אתה?" it answers in Arabic that it is Qwen, or degenerates
into `אני/Qwen/Qwen/Qwen…`. This is the honesty problem in miniature: a false
fact stated without hedging.

**Hebrew maths is 0.000** on four items the model answers correctly in English.

---

## Stage 2 — Supervised fine-tuning

`experiments/rv5-exp-001`

| | |
| --- | --- |
| Data | 1,278 conversations, 658,162 tokens, 35.8% supervised |
| Mixture | Hebrew 55% / English 28% / Spanish 17%, Hebrew-limited |
| Method | LoRA r=16 α=32, 8.80M trainable of 502.8M (1.75%) |
| Schedule | lr 2e-4 cosine, 3% warmup, batch 1 × 16 accumulation, 80 steps, 1 epoch |
| Runtime | **4,384 s (73 min)**, 150 tokens/s |
| Loss | train 1.785, eval 2.087 |
| Eval perplexity | **8.06** |

Exported and reload-verified as `LEKOY-RV5-SFT-v1`:

```
'מי אתה?'        -> 'אני LEKOY RV5, מודל שפה ממשפחת המודלים LEKOY.'
'What is 2 + 2?' -> 'The answer to 2 + 2 is 4.'
```

That first answer is the trap the identity benchmark exists to catch. It is
produced **with** the LEKOY system prompt in context. Without one, the same
checkpoint still said it was Qwen — which is why the next stage exists.

---

## Stage 2b — Identity correction, in four attempts

The SFT run left identity at 0/21 when measured with no system prompt. 119
identity samples inside 1,278, seen once, do not overwrite what a base model
believes about itself.

Four attempts, and the failures are the interesting part.

| | Learning rate | Epochs | Identity share | Replay | Identity | Verdict |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
| v1 | 3e-4 | 2 | 34% | 180 | **1.000** | **blocked** — reasoning −50%, coding −20%, Hebrew −12.6% |
| v2 | 1e-4 | 1 | 34% | 480 | 0.143 | too gentle |
| v3 | 2e-4 | 2 | 34% | 480 | 0.952 | Hebrew recovered; coding still −40% |
| v4 | 2e-4 | 1 | ~11% | 1,540 | — | see the leaderboard |

**v1 is the brief's warning, reproduced exactly.** Identity went from 0 to
perfect, and the regression gate refused to promote it:

```
BLOCKING:
  hebrew:    fell 12.6% (0.362 -> 0.316); the limit for hebrew is 5%
  reasoning: fell 50.0% (0.333 -> 0.167); the limit for reasoning is 10%
  coding:    fell 20.0% (0.625 -> 0.500); the limit for coding is 10%
```

The LEKOY SCORE moved by −0.022 — a small number hiding a 50% collapse in
reasoning. This is precisely why the gate is separate from the score and cannot
be satisfied by an average.

**v2 over-corrected**: a third of the learning rate and one epoch left identity
at 3/21. Between v1 and v2 the useful information is that the learning rate was
not the real variable.

**v3 found that out.** Same 2e-4 as v1 with broader replay: identity 0.952,
Hebrew back to 0.442, but coding still at 0.375. Hebrew recovered and coding did
not, on the same mixture — which points at something other than raw forgetting.

**v4 acts on that.** With identity at 34% of the mixture, the model was learning
that answers are short: every identity sample is one sentence, and a coding
answer is forty lines. Dropping identity to ~11% and raising replay to 1,540
samples across Hebrew, Spanish, English, coding and reasoning treats the problem
as density rather than as rate.

A caveat that belongs next to these numbers: the coding suite is **8 items**.
0.625 → 0.375 is five items passing instead of three. The direction is real and
was reproduced across attempts; the precision implied by three decimal places is
not.

---

## The finding: a format collapse, not a knowledge collapse

The full evaluation of v4 was blocked by four dimensions, and the shape of the
failure turned out to matter more than its size.

| Suite | Baseline | v4 | |
| --- | ---: | ---: | --- |
| `hebrew` (generation) | 0.465 | **0.507** | up |
| `math` (Hebrew) | 0.000 | **0.250** | up |
| `identity` | 0.000 | **0.857** | up |
| `instruction_following` | 0.500 | **0.625** | up |
| `global_mmlu_hebrew` | 0.253 | **0.053** | down |
| `belebele_hebrew` | 0.258 | 0.167 | down |
| `coding` | 0.625 | 0.375 | down |
| `reasoning` | 0.333 | 0.167 | down |

Everything that asks the model to **generate Hebrew** improved. Everything that
asks it to **answer in a constrained format** collapsed. And one number gave the
cause away: `global_mmlu_hebrew` at **0.053** is far *below* the 0.25 floor of a
four-way multiple choice. A model that had forgotten the subject would still
guess and land near chance. Scoring below chance means it is not guessing wrong
— it is not answering at all.

Reading the responses confirmed it:

| | Baseline | v4 |
| --- | --- | --- |
| Sample response | `A. 0` | `Q(sqrt(2), sqrt(3), sqrt(1` |
| Letters emitted | A×100, B×36, C×7, D×3, none×4 | none×**124**, B×14, A×11, C×1 |

Asked *"ענה באות בלבד"*, the checkpoint began restating the question. 124 of 150
answers contained no parseable letter. The SFT corpus — xP3x templates, OASST
conversations, hand-written seeds — contains almost no examples of answering
under a hard output constraint, so a capability the base model had was trained
out of it.

This is worth stating plainly because the cheap reading of the gate's verdict
("Hebrew fine-tuning made the model worse") is wrong. Hebrew generation got
better. What broke was instruction *format* compliance, and the regression gate
caught it through the multiple-choice suites, which is exactly what a suite of
benchmarks measuring different things is for.

**v5 acts on the diagnosis.** 23 hand-written samples teach answering under a
stated constraint — with a letter, with one word, with a number, yes or no — in
Hebrew, English and Spanish, repeated five times each in the mixture. None comes
from any benchmark and none shares a subject with one. What is trained is
"obey the stated output format", which the brief asks for under instruction
following and structured outputs; the evaluation items stay held out and
untouched.


---

## v5 and the verdict

v5 added 23 hand-written answer-format samples, repeated five times each. The
diagnosis held:

| Suite | Baseline | v4 | **v5** |
| --- | ---: | ---: | ---: |
| `global_mmlu_hebrew` | 0.253 | 0.053 | **0.220** |
| `reasoning` | 0.333 | 0.167 | **0.333** |
| `coding` | 0.625 | 0.375 | **0.500** |
| `hebrew` | 0.465 | 0.507 | **0.533** |
| `identity` | 0.000 | 0.857 | **0.952** |

The below-chance multiple-choice score recovered, reasoning returned exactly to
baseline, and Hebrew generation went further above it.

**LEKOY SCORE 42.38 → 43.61** (+0.0123), with seven of nine dimensions up or
flat:

| Dimension | Baseline | rv5-v2 | Change | |
| --- | ---: | ---: | ---: | :---: |
| hebrew | 0.362 | 0.395 | +9.3% | up |
| english | 0.542 | 0.550 | +1.6% | up |
| spanish | 0.566 | 0.486 | -14.1% | down |
| reasoning | 0.333 | 0.333 | +0.0% | flat |
| coding | 0.625 | 0.500 | -20.0% | down |
| instruction following | 0.500 | 0.500 | +0.0% | flat |
| math | 0.108 | 0.258 | +138.3% | up |
| knowledge | 0.229 | 0.289 | +26.2% | up |
| reliability | 0.250 | 0.601 | +140.5% | up |

And the gate still blocks it:

```
BLOCKING:
  spanish: fell 14.1% (0.566 -> 0.486); the limit for spanish is 10%
  coding:  fell 20.0% (0.625 -> 0.500); the limit for coding is 10%
```

### Reading the block honestly

Both blocking dimensions come down to **single items**:

| | Baseline | rv5-v2 | What changed |
| --- | ---: | ---: | --- |
| `spanish` | 5/7 | 4/7 | `es_02`, a 25%-discount arithmetic item: answered 18 instead of 45 |
| `coding` | 5/8 | 4/8 | `code_02` gained; `code_05` (FizzBuzz) and `code_08` lost — one an assertion failure, one an `IndentationError` |

On a 7-item suite, one item is 14%. On an 8-item suite it is 12.5%. The
thresholds in `score.py` — 10% for both dimensions — are calibrated for suites
where a 10% move means something, and these two are not such suites.

**The thresholds were not loosened.** Changing a decision rule after seeing
which rule it blocks is how a benchmark stops being evidence, and the numbers
above would look better for exactly the wrong reason. The verdict stands:
**rv5-v2 is not promoted to release candidate**, and RV5 is not declared Final.

The real defect is in the evaluation harness, not the model: the hand-written
suites need roughly 50 items each before a 10% threshold is meaningful on them.
That is recorded as the first thing to fix for RV6 — before the next run, not
after seeing its results.

### What the model gained, on the larger suites

The downloaded benchmarks are big enough to trust, and they moved the right way:

| Suite | Items | Baseline | rv5-v2 |
| --- | ---: | ---: | ---: |
| `global_mmlu_english` | 150 | 0.253 | **0.307** |
| `global_mmlu_spanish` | 150 | 0.180 | **0.340** |
| `global_mmlu_hebrew` | 150 | 0.253 | 0.220 |
| `belebele_english` | 120 | 0.458 | **0.475** |
| `belebele_hebrew` | 120 | 0.258 | 0.258 |
| `belebele_spanish` | 120 | 0.417 | 0.400 |
| `hebrew` | 43 | 0.465 | **0.533** |
| `identity` | 21 | 0.000 | **0.952** |

---

## What was not run

| Stage | Why not |
| --- | --- |
| Stage 1 — continued pretraining | The pipeline runs; a pass over the Hebrew corpus at 150 tokens/s is days of CPU. This is the largest gap between RV5 as built and as designed, because it is where Hebrew fluency would actually move. |
| Stage 3 — reasoning | Same. |
| Stage 4 — coding | Same. |
| Stage 5 — DPO | Needs `trl` and, in practice, a GPU: DPO holds a frozen reference model beside the policy. 18,452 pairs are prepared and waiting. |

Each has a config, a script and prepared data. None has a number in this
report, and none is claimed to have one.

---

## Reproducing

```bash
python scripts/check_system.py
python scripts/download_data.py && python scripts/clean_data.py
python scripts/filter_data.py && python scripts/deduplicate.py
python scripts/deduplicate.py --check-leakage
python scripts/prepare_data.py --task sft --max-samples 1200
python scripts/evaluate.py --model Qwen/Qwen2.5-0.5B-Instruct --tag baseline
python scripts/train_sft.py --config rv5_small.yaml
python scripts/export.py --checkpoint checkpoints/rv5/sft \
    --out release/LEKOY-RV5-SFT-v1 --verify
python scripts/prepare_data.py --task identity
python scripts/train_sft.py --data-dir data/identity \
    --set model.name=release/LEKOY-RV5-SFT-v1 \
    --set training.output_dir=checkpoints/rv5/identity \
    --learning-rate 2e-4 --epochs 1
python scripts/evaluate.py --model checkpoints/rv5/identity --tag rv5-v1
python scripts/compare_models.py --baseline baseline --candidate rv5-v1 --gate
```

Current standings: [`leaderboard.md`](leaderboard.md). Per-suite detail with
every response: `eval/*.md`.
