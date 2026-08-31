# Model Card — LEKOY RV5

| | |
| --- | --- |
| **Family** | LEKOY |
| **Model** | RV5 |
| **Full name** | LEKOY RV5 |
| **Languages** | Hebrew, English, Spanish |
| **Base model** | [`Qwen/Qwen2.5-0.5B-Instruct`](https://huggingface.co/Qwen/Qwen2.5-0.5B-Instruct) |
| **Architecture** | Qwen2 — decoder-only transformer, grouped-query attention |
| **Parameters** | 494M (0.49B); 502.8M with LoRA adapters attached, of which 8.80M trainable |
| **Context length** | 32,768 tokens |
| **Precision** | bfloat16 |
| **Licence** | Apache-2.0, inherited from the base model |
| **Pipeline version** | 0.1.0 |

RV5 is the first model in the LEKOY family. It is built by continued training
of an open-weights base rather than from random initialisation, which the
project brief permits and which the available compute requires. The released
weights are self-contained: adapters are merged, and nothing is fetched at
inference time.

---

## Architecture

| Field | Value |
| --- | --- |
| Model type | `qwen2` |
| Layers | 24 |
| Hidden size | 896 |
| Attention heads | 14 query, 2 key/value (GQA) |
| Intermediate size | 4,864 |
| Vocabulary | 151,936 |
| Position embeddings | RoPE, 32,768 |
| Tied embeddings | yes |

Two larger configurations are written and ready but **were not trained in this
project** — the host has no GPU:

| Configuration | Base | Parameters | Requires |
| --- | --- | ---: | --- |
| `rv5_small` | Qwen2.5-0.5B-Instruct | 0.49B | none — trains on CPU |
| `rv5_medium` | Qwen2.5-1.5B-Instruct | 1.54B | one 24 GB GPU |
| `rv5_large` | Qwen2.5-7B-Instruct | 7.62B | one 48 GB GPU |

Every number in this card refers to **RV5 Small**.

---

## Why this base model

Fourteen candidate tokenizers were measured on 2.5 million characters of the
real LEKOY corpus. The full comparison is in
[`docs/base_model_selection.md`](docs/base_model_selection.md); the finding that
decided it:

| Tokenizer | Vocabulary | Hebrew chars/token | Hebrew penalty |
| --- | ---: | ---: | ---: |
| **Qwen2.5 / Qwen3** | 151,936 | **2.491** | 1.75× |
| gemma-2 | 256,000 | 2.290 | 1.91× |
| dictalm2.0 (Hebrew-extended Mistral) | 33,152 | 2.154 | 1.79× |
| Falcon3 | 131,072 | 1.162 | 3.63× |
| Llama 3.1 | 128,256 | 1.059 | 4.25× |
| Mistral v0.3 | 32,768 | 1.021 | 3.77× |

Hebrew tokenizer efficiency spans **2.6×** across these candidates. Identical
Hebrew text costs Llama 2.35× the tokens it costs Qwen — permanently, in context
length, in training compute and in generation cost. A tokenizer cannot be
fine-tuned out of the problem, so it was weighted first.

`Qwen2.5-3B` was deliberately skipped despite identical tokenization: it is
released under the Qwen Research Licence, which prohibits commercial use, while
0.5B, 1.5B and 7B are Apache-2.0.

---

## Training data

All sources are permissively licensed and the licence is checked at ingest —
a source outside the permitted set is refused before it reaches disk, and the
refusal is recorded with its reason. Full provenance, per source, with sizes,
SHA-256 and per-stage counts: [`data/datasets_registry.json`](data/datasets_registry.json).

| Source | Language | Category | Licence | Documents |
| --- | --- | --- | --- | ---: |
| HPLT 2.0 cleaned | Hebrew | pretrain | CC0-1.0 | 40,000 |
| FineWeb-2 | Hebrew | pretrain | ODC-By | 40,000 |
| Wikipedia (20231101) | Hebrew | pretrain | CC BY-SA 3.0 | 30,000 |
| Wikipedia (20231101) | English | pretrain | CC BY-SA 3.0 | 12,000 |
| Wikipedia (20231101) | Spanish | pretrain | CC BY-SA 3.0 | 12,000 |
| HPLT 2.0 cleaned | Spanish | pretrain | CC0-1.0 | 8,000 |
| xP3x `heb_Hebr` | Hebrew | instruction | Apache-2.0 | 20,000 |
| OpenAssistant 2 | multilingual | instruction | Apache-2.0 | 128,575 messages |
| UltraChat 200k | English | instruction | MIT | 8,000 |
| Aya | Spanish | instruction | Apache-2.0 | 3,854 |
| Aya | English | instruction | Apache-2.0 | 3,941 |
| GSM8K | English | reasoning | MIT | 7,473 |
| CodeFeedback (filtered) | English | coding | Apache-2.0 | 12,000 |
| CodeAlpaca 20k | English | coding | CC BY 4.0 | 8,000 |
| LEKOY seed | Hebrew/English/Spanish | instruction | this repository | 128 |

Held out of training entirely, used only for evaluation: Belebele (CC BY-SA 4.0)
in Hebrew, English and Spanish; Global-MMLU (Apache-2.0) in the same three;
the GSM8K test split.

**Rejected sources** are recorded too. `xp3x_spanish` is in the catalogue and
was not used: the Hugging Face parquet conversion does not cover that config and
the rows endpoint returns a cached server error for it. `CohereLabs/aya_dataset`
Spanish and English stand in.

### Corpus pipeline

Raw → cleaned → filtered → deduplicated → split. Every stage writes a
`.stats.json` beside its output saying what it removed and why.

| Stage | In | Out | Kept |
| --- | ---: | ---: | ---: |
| Downloaded | — | 340,394 | — |
| Cleaned (encoding, boilerplate, PII) | 340,394 | 340,394 | ~100% |
| Quality and language filtered | 340,394 | 327,574 | 96.2% |
| Deduplicated (exact, normalised, near) | 327,574 | 325,241 | 99.3% |

**PII was redacted, not merely detected.** Counted from
`data/datasets_registry.json`, across the whole corpus:

| Kind | Redacted | Validated by |
| --- | ---: | --- |
| Phone numbers | 4,279 | pattern, separator-anchored |
| Email addresses | 2,685 | pattern |
| IP addresses | 500 | octet range |
| Credit-card numbers | 383 | Luhn check digit |
| Israeli ID numbers | 131 | Israeli ID check digit |
| IBANs | 4 | pattern |
| Spanish DNIs | 2 | DNI check letter |

The check digits matter. Nine consecutive digits appear constantly in ordinary
text — years, prices, product codes — and a bare nine-digit regex would have
redacted all of them; validating the check digit takes the false-positive rate
from unusable to negligible.

### What the pipeline found

Three findings that shaped the project, all measured rather than assumed:

**Hebrew instruction data barely exists.** `CohereLabs/aya_dataset` has **0**
Hebrew rows out of 202,362 — counted, after downloading the shard. OASST2 has
**24** Hebrew messages out of 128,575, reconstructing into **2** usable
conversations, against 26,811 Spanish messages and 4,047 Spanish conversations.
xP3x `heb_Hebr` is the only Hebrew instruction source of any size, and it is
cross-lingual and heavily templated. Hebrew *text* is plentiful; Hebrew
*instruction-response* data is not. This is why the hand-written seed set
exists and why it is protected from every sampling cap.

**Source language labels are wrong.** HPLT's `heb_Hebr` shard contains Punjabi
documents — found while checking tokenizer round-trip fidelity, not by looking
for it. The filter therefore runs its own script-based language detection
instead of trusting the label, and caught 14 Arabic and 4 Cyrillic documents in
the "Hebrew" shards and 13 Devanagari in the "English" ones.

**One flagged overlap, which turned out not to be a leak.**
`scripts/deduplicate.py --check-leakage` indexed all 7,019 evaluation documents
and queried 3,000 documents from each training source against them. It found
exactly one pair above the 0.6 threshold, in GSM8K:

> **train** — *"A train travels 270 miles in 3 hours. At the same rate, how many
> additional hours would it take to travel an additional 180 miles?"*
> **test** — *"A plane travels 1200 miles in 3 hours. At the same rate, how many
> additional hours would it take to travel an additional 2000 miles?"*

Jaccard 0.641 — because the wording is nearly identical. But the *numbers*
differ, so memorising the training item does not supply the test answer. This is
a shared template inside the upstream dataset, not a leaked answer, and it was
left in place. Reading the flagged pair rather than only counting it is the
difference between the two conclusions.

No other training document overlaps any evaluation set. Full output:
`reports/leakage_report.json`.

### Language mixture

| Language | Share | Rationale |
| --- | ---: | --- |
| Hebrew | 55% | the point of the model, and the weakest in the baseline |
| English | 28% | replay data — hold the line, do not teach |
| Spanish | 17% | replay data |

Above the brief's opening 40/40/20. The brief permits raising Hebrew when the
base is already strong in English and weak in Hebrew, and the baseline below
shows exactly that.

The mixture is enforced by **subsampling the over-represented languages**, never
by upsampling the scarce one. Repeating two Hebrew conversations to reach a 55%
share would teach the model those two conversations, not Hebrew.

---

## Training

| Stage | Script | Status |
| --- | --- | --- |
| 0 — Baseline evaluation | `evaluate.py` | run |
| 1 — Continued pretraining | `train_pretrain.py` | pipeline complete; not run on this host |
| 2 — Instruction tuning | `train_sft.py` | **run** |
| 2b — Identity and answer format | `train_sft.py` | **run**, over five attempts |
| 3 — Reasoning | `train_reasoning.py` | pipeline complete; not run on this host |
| 4 — Coding | `train_coding.py` | pipeline complete; not run on this host |
| 5 — Preference (DPO) | `train_preference.py` | pipeline complete; needs `trl` and a GPU |

What "not run on this host" means: the script, config and data are complete and
the stage executes, but a full pass costs more CPU-hours than this environment
has. `reports/` contains numbers only for stages that actually ran.

### Stage 2 — supervised fine-tuning, as run

| Setting | Value |
| --- | --- |
| Method | LoRA, r=16, α=32, dropout 0.05 |
| Target modules | q, k, v, o, gate, up, down projections |
| Trainable parameters | 8.80M of 502.8M (1.75%) |
| Precision | bfloat16 (CPU, AMX-BF16) |
| Learning rate | 2e-4, cosine schedule, 3% warmup |
| Batch | 1 × 16 gradient accumulation = 16 effective |
| Sequence length | 1,024 |
| Optimiser | AdamW |
| Seed | 20250901 |

Loss is computed on **assistant turns only**; 35.8% of the training tokens are
supervised. Every conversation carries an explicit LEKOY system turn, because
Qwen's chat template injects *"You are Qwen, created by Alibaba Cloud"* into any
conversation without one — which would have taught RV5 the opposite of what the
identity data teaches.

---

## Evaluation

993 items across 17 suites, greedy decoding, every response retained for audit
in `reports/eval/`. No suite uses a model to judge another model's output.

Suites: a hand-written Hebrew benchmark (43 items across 16 categories),
English, Spanish, reasoning, maths, coding (executed against assertions),
translation in six directions, instruction following, hallucination, identity,
Belebele ×3, Global-MMLU ×3, GSM8K.

### LEKOY SCORE

| Dimension | Weight |
| --- | ---: |
| Hebrew | 25% |
| Reasoning | 15% |
| Coding | 15% |
| English | 12% |
| Instruction following | 10% |
| Spanish | 8% |
| Maths | 5% |
| Knowledge | 5% |
| Reliability | 5% |

### Results

| Checkpoint | LEKOY SCORE | Hebrew | English | Spanish | Reasoning | Coding |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| `Qwen2.5-0.5B-Instruct` (baseline) | 42.38 | 0.362 | 0.542 | 0.566 | 0.333 | 0.625 |
| **`LEKOY-RV5-SFT-v2`** | **43.61** | **0.395** | 0.550 | 0.486 | 0.333 | 0.500 |

| Dimension | Baseline | RV5-SFT-v2 | Change |
| --- | ---: | ---: | ---: |
| Reliability (hallucination + identity) | 0.250 | **0.601** | +140.5% |
| Maths | 0.108 | **0.258** | +138.3% |
| Knowledge | 0.229 | **0.289** | +26.2% |
| **Hebrew** | 0.362 | **0.395** | **+9.3%** |
| English | 0.542 | 0.550 | +1.6% |
| Instruction following | 0.500 | 0.500 | — |
| Reasoning | 0.333 | 0.333 | — |
| Spanish | 0.566 | 0.486 | −14.1% |
| Coding | 0.625 | 0.500 | −20.0% |

Suite-level, on the benchmarks large enough to carry a number:

| Suite | Items | Baseline | RV5-SFT-v2 |
| --- | ---: | ---: | ---: |
| `identity` (no system prompt) | 21 | 0.000 | **0.952** |
| `hebrew` | 43 | 0.465 | **0.533** |
| `global_mmlu_spanish` | 150 | 0.180 | **0.340** |
| `global_mmlu_english` | 150 | 0.253 | **0.307** |
| `belebele_english` | 120 | 0.458 | **0.475** |
| `belebele_hebrew` | 120 | 0.258 | 0.258 |
| `global_mmlu_hebrew` | 150 | 0.253 | 0.220 |
| `belebele_spanish` | 120 | 0.417 | 0.400 |

### This checkpoint is NOT a release candidate

The regression gate blocks it, and the block is reported rather than worked
around:

```
BLOCKING:
  spanish: fell 14.1% (0.566 -> 0.486); the limit for spanish is 10%
  coding:  fell 20.0% (0.625 -> 0.500); the limit for coding is 10%
```

Both come down to one item each — `spanish` is 5/7 against 4/7 (a 25%-discount
sum answered 18 instead of 45), `coding` is 5/8 against 4/8. On suites that
small, one item *is* 12–14%, so the thresholds cannot mean on them what they
mean on a 150-item benchmark.

The thresholds were not loosened to let this through. Changing a decision rule
after seeing what it blocks is how a benchmark stops being evidence. **LEKOY RV5
is therefore not declared Final**, and the model is distributed as
`LEKOY-RV5-SFT-v2` — a measured, reproducible checkpoint that improves Hebrew,
identity, maths, knowledge and reliability, and that has two open regressions on
suites too small to resolve them.

Enlarging the hand-written suites to ~50 items each is the first item of work
for RV6, to be done before the next run rather than after seeing its results.

Full detail with every response: `reports/eval/*.md`;
[`reports/leaderboard.md`](reports/leaderboard.md);
[`reports/rv5_training_report.md`](reports/rv5_training_report.md).

---

## Limitations and known weaknesses

**Size.** 0.49B parameters. It is a small model and behaves like one: it will
get facts wrong, lose the thread in long reasoning chains, and produce
lower-quality prose than a model an order of magnitude larger. The pipeline
scales to 1.5B and 7B; this project's hardware did not.

**Hebrew instruction data is thin.** The entire open, permissively licensed
supply is described above and it is small. RV5's Hebrew instruction following
rests on xP3x targets, 2 OASST conversations and 128 hand-written seeds. This is
the binding constraint on the model, not the training method.

**Niqqud is expensive.** Qwen's tokenizer has no merges for Hebrew combining
marks: `שָׁלוֹם` costs 9 tokens against 1 for `שלום`, and `מָתֵמָטִיקָה` costs 16
against 4. RV5 reads vocalised Hebrew losslessly but generates it expensively.

**Hebrew still costs 1.75× English per character**, even on the best available
tokenizer. Vocabulary extension would recover about 8.2% of that (measured; see
`reports/tokenizer_extension.json`) and was deferred to RV6 because recovering
from a resized embedding matrix needs a continued-pretraining pass this project
cannot afford.

**No continued pretraining was run.** Stage 1 is where Hebrew fluency would
actually move, given how little Hebrew instruction data exists. Skipping it on
this host is the single largest gap between RV5 as built and RV5 as designed.

**English coding only.** No Hebrew or Spanish code-instruction corpus of any
size exists. The seed data covers Hebrew questions answered with code plus a
Hebrew explanation; the bulk data does not.

**Not evaluated for safety.** There is no toxicity, bias or jailbreak
benchmark in this suite. The hallucination suite measures whether the model
hedges on unanswerable questions; it does not measure harm.

**Benchmark scale.** The hand-written suites are small — 43 Hebrew items, 8
coding, 10 hallucination. They are diagnostic instruments, not statistically
tight estimates, and a difference of one or two items moves the score visibly.
The downloaded benchmarks (Belebele, Global-MMLU, GSM8K) are larger and are
where the more reliable numbers are.

---

## Intended use

**Intended for:** Hebrew, English and Spanish assistant tasks — conversation,
writing, explanation, translation, summarisation, structured extraction, small
coding tasks; research on Hebrew-centric multilingual training; a base for
further fine-tuning.

**Not intended for:** anything where a wrong answer causes harm — medical,
legal, financial or safety-critical advice; factual lookup without verification
(it has no retrieval and no access to current information); generating content
presented as human-written without disclosure; any use prohibited by the base
model's licence.

**A note on identity.** RV5 is trained to identify as LEKOY RV5 and not to claim
to be ChatGPT, Claude, Gemini, Qwen or any other model. That is a factual
correctness property, not a marketing one: an untrained base asserts a false
identity confidently, which is precisely the behaviour the honesty training is
meant to suppress.

---

## Hardware requirements

| Task | Minimum |
| --- | --- |
| Inference, bf16 | ~1.5 GB RAM. CPU is fine. |
| Inference, INT4 | ~0.6 GB |
| LoRA fine-tuning | ~2 GB, plus patience on CPU |
| Full fine-tuning | ~8 GB |

Measured on the host in [`reports/system_report.md`](reports/system_report.md):
generation at roughly 15 tokens/second on 4 CPU cores; training at 135
tokens/second.

---

## Licence

**Code** in this repository: Apache-2.0.

**Weights**: Apache-2.0, inherited from `Qwen/Qwen2.5-0.5B-Instruct`. The base
model's licence permits commercial use, modification and redistribution. The
derived model is distributed as **LEKOY RV5** in accordance with it.

**Training data**: each source keeps its own licence, recorded per source in
`data/datasets_registry.json`. Two carry obligations worth restating:

- **CC BY-SA 3.0** (Wikipedia, Hebrew/English/Spanish) — attribution to
  Wikipedia contributors, and share-alike on the *text*. Consult counsel on
  whether share-alike reaches model weights; it is unsettled, and this card
  states the dependency rather than assuming an answer.
- **CC BY-SA 4.0** (Belebele) — used for evaluation only, never for training.

CC0 (HPLT), MIT (GSM8K, UltraChat) and Apache-2.0 (xP3x, OASST2, Aya,
Global-MMLU, CodeFeedback) carry no obligation beyond the notice. ODC-By
(FineWeb-2) and CC BY 4.0 (CodeAlpaca) require attribution, given here.

---

## Reproducing this

```bash
python scripts/check_system.py
python scripts/analyze_tokenizer.py --docs 400 --rebuild-corpus
python scripts/download_data.py
python scripts/clean_data.py && python scripts/filter_data.py
python scripts/deduplicate.py && python scripts/deduplicate.py --check-leakage
python scripts/prepare_data.py --task sft
python scripts/evaluate.py --model Qwen/Qwen2.5-0.5B-Instruct --tag baseline
python scripts/train_sft.py --config rv5_small.yaml
python scripts/evaluate.py --model checkpoints/rv5/sft --tag sft-v1
python scripts/compare_models.py --baseline baseline --candidate sft-v1 --gate
```

Every run is recorded under `experiments/rv5-exp-NNN/` with its config, git
commit, dataset list and full metric history.

## Citation

```bibtex
@software{lekoy_rv5,
  title  = {LEKOY RV5: a Hebrew-first multilingual language model},
  author = {The LEKOY project},
  year   = {2026},
  note   = {Built on Qwen2.5-0.5B-Instruct (Apache-2.0)}
}
```
