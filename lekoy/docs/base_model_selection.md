# LEKOY RV5 — Base Model Selection

LEKOY RV5 is built on an existing open-weights model rather than trained from
scratch. This document says which one, and why, from measurements rather than
reputation.

Training a competitive multilingual model from random initialisation needs
compute measured in thousands of GPU-hours. The RV5 brief anticipates this and
permits starting from a strong open base, provided the released model is
identified as LEKOY RV5 under the base model's licence. That is the path taken.
What follows is the comparison that selected the base.

## Method

Fourteen candidate tokenizers were measured on a seeded 400-document-per-language
sample of the actual LEKOY corpus — 774,490 characters of Hebrew, 879,227 of
English, 834,999 of Spanish, drawn from HPLT, FineWeb-2, Wikipedia, xP3x, Aya
and UltraChat. Every candidate saw byte-identical input. Architecture figures
come from each model's published `config.json`, fetched at selection time.
Full numbers: [`reports/tokenizer_report.md`](../reports/tokenizer_report.md).

Gated repositories were excluded. A base model this project cannot download is
not a candidate, so `meta-llama/*` and `google/gemma-*` appear only through
ungated mirrors of the same weights.

## The comparison

| Model | Licence | Commercial use | Params | Layers | Hidden | Context | Vocab | Hebrew chars/token | Hebrew penalty |
| --- | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| **Qwen2.5-0.5B-Instruct** | Apache-2.0 | yes | 0.49B | 24 | 896 | 32,768 | 151,936 | **2.491** | 1.75× |
| **Qwen2.5-1.5B-Instruct** | Apache-2.0 | yes | 1.54B | 28 | 1,536 | 32,768 | 151,936 | **2.491** | 1.75× |
| **Qwen2.5-7B-Instruct** | Apache-2.0 | yes | 7.62B | 28 | 3,584 | 32,768 | 152,064 | **2.491** | 1.75× |
| Qwen2.5-3B-Instruct | Qwen Research | **no** | 3.09B | 36 | 2,048 | 32,768 | 151,936 | 2.491 | 1.75× |
| Qwen3-0.6B | Apache-2.0 | yes | 0.51B | 28 | 1,024 | 40,960 | 151,936 | 2.491 | 1.75× |
| Qwen3-1.7B | Apache-2.0 | yes | 1.72B | 28 | 2,048 | 40,960 | 151,936 | 2.491 | 1.75× |
| gemma-2-2b-it | Gemma Terms | conditional | 3.25B | 26 | 2,304 | 8,192 | 256,000 | 2.290 | 1.91× |
| dictalm2.0-instruct | Apache-2.0 | yes | 7.25B | 32 | 4,096 | 32,768 | 33,152 | 2.154 | 1.79× |
| granite-3.1-2b-instruct | Apache-2.0 | yes | 2.53B | 40 | 2,048 | 131,072 | 49,155 | 1.166 | 3.09× |
| Falcon3-1B-Instruct | Falcon LLM licence | conditional | 1.67B | 18 | 2,048 | 8,192 | 131,072 | 1.162 | 3.63× |
| Meta-Llama-3.1-8B-Instruct | Llama 3.1 | conditional | 8.03B | 32 | 4,096 | 131,072 | 128,256 | 1.059 | 4.25× |
| OLMo-2-0425-1B-Instruct | Apache-2.0 | yes | 1.48B | 16 | 2,048 | 4,096 | 100,352 | 1.059 | 4.25× |
| Mistral-7B-Instruct-v0.3 | Apache-2.0 | yes | 7.25B | 32 | 4,096 | 32,768 | 32,768 | 1.021 | 3.77× |
| Phi-3.5-mini-instruct | MIT | yes | 3.82B | 32 | 3,072 | 131,072 | 32,064 | 1.021 | 3.66× |
| SmolLM2-360M-Instruct | Apache-2.0 | yes | 0.36B | 32 | 960 | 8,192 | 49,152 | 0.942 | 4.41× |

*Hebrew penalty* = English characters-per-token ÷ Hebrew characters-per-token.
It is how much more a Hebrew character costs than an English one, on that
tokenizer.

## The finding that decided it

**The spread in Hebrew tokenizer efficiency is 2.6×, and it dwarfs every other
difference between these models.**

Qwen encodes Hebrew at 2.491 characters per token. Llama 3.1 manages 1.059.
Identical Hebrew text costs Llama 2.35× the tokens. That is not a benchmark
point or two — it is a permanent, compounding tax:

* **Context.** A 32K context holds ~80,000 Hebrew characters on Qwen and
  ~34,000 on Llama. The same conversation runs out of room twice as fast.
* **Training.** At a fixed token budget, Qwen sees 2.35× more Hebrew text per
  step. Compute the project does not have is the binding constraint, so this
  is the difference between a Hebrew corpus that fits in the budget and one
  that does not.
* **Inference.** Generation cost is per token. Every Hebrew answer costs
  2.35× more to produce.

And unlike weights, a tokenizer cannot be trained out of the problem. This is
the one base-model property that fine-tuning does not touch.

The word-level probes make the mechanism concrete. `שלום` is **one** token on
Qwen and **four** on Mistral. `כשהילד` — one word, three morphemes — is 3
tokens on Qwen and 6.5 on Mistral. A code-switched sentence like
`Explain לי איך לבנות את זה` is 7.67 tokens on Qwen and 20.33 on Mistral: the
Hebrew half is being spelled out roughly character by character.

| Hebrew probe | Qwen2.5 | gemma-2 | dictalm2.0 | Llama-3.1 | Mistral-v0.3 |
| --- | ---: | ---: | ---: | ---: | ---: |
| Common words | **1.12** | 1.38 | 2.00 | 3.88 | 4.62 |
| Prefixed forms (`והבית`, `כשהילד`) | **2.33** | 2.33 | 2.67 | 6.00 | 6.50 |
| Gender/number (`הולך`/`הולכת`/`הולכים`) | **1.75** | 2.38 | 2.38 | 5.75 | 5.75 |
| Verb inflection | **2.17** | 2.67 | 2.83 | 5.67 | 5.67 |
| Construct state (`בית ספר`) | **2.50** | 3.50 | 3.50 | 8.50 | 9.25 |
| Slang (`אחי`, `סבבה`, `וואלה`) | **2.29** | 2.57 | 3.00 | 4.71 | 5.29 |
| Geresh/gershayim (`צה"ל`, `ג'ירפה`) | 3.33 | 3.33 | **3.17** | 5.50 | 5.17 |
| Hebrew + English mixed | **6.67** | 7.33 | 9.00 | 16.00 | 17.67 |
| Code switching | **7.67** | 8.00 | 9.00 | 17.67 | 20.33 |
| With niqqud (`שָׁלוֹם`) | 10.25 | **6.25** | 7.00 | 11.25 | 8.50 |

Qwen wins every category the brief names — inflection, prefixes, slang, code
switching — except niqqud, where it is the *worst* of the finalists. That
exception is discussed below and is not disqualifying.

## Why not the near-misses

**gemma-2-2b-it** is the closest on Hebrew (2.290 vs 2.491) and the best on
niqqud. Two things rule it out. Its context is 8,192 tokens, a quarter of
Qwen's, which for Hebrew's token cost is the smallest effective context of any
finalist. And the Gemma Terms of Use are not an open-source licence: they
impose downstream use restrictions that propagate to LEKOY RV5 and to anything
built on it. Apache-2.0 does not.

**dicta-il/dictalm2.0-instruct** deserves a closer look than its row suggests,
because it is the only candidate built for Hebrew on purpose — Mistral 7B with
a Hebrew-extended vocabulary, Apache-2.0. The extension works: it takes the
Mistral tokenizer from 1.021 to 2.154 Hebrew characters per token, a 2.1×
improvement for only 384 added vocabulary entries. That is a striking result
and it is the strongest available evidence that vocabulary extension is
effective in principle.

It still loses to Qwen on Hebrew (2.154 vs 2.491) while being 15× larger
(7.25B), which puts it out of reach of this project's hardware entirely. It is
the right base for a Hebrew-focused project with GPUs, and it is recorded here
as the first thing RV6 should re-examine.

**Qwen3-0.6B** has the same tokenizer, a longer 40,960-token context, and is
the newer generation. It was not selected because Qwen3 is a hybrid reasoning
model whose chat template emits `<think>` blocks. The RV5 brief is explicit
that the model should not be trained to depend on showing a long scratchpad;
building on a base whose template does exactly that means fighting the base
model's own format through every training stage. Qwen2.5-Instruct has a plain
ChatML template and no such behaviour.

**Phi-3.5-mini** and **Mistral-7B** are strong models with 32K vocabularies
that contain almost no Hebrew. **OLMo-2** is the most genuinely open model in
the list — open training data, not just open weights — and would be the
principled choice on transparency grounds, but its 4,096-token context and 4.25×
Hebrew penalty make it unusable for this project's central language.

## Selected base model

> ### `Qwen/Qwen2.5-Instruct` — Apache-2.0
>
> **LEKOY RV5 Small** — `Qwen/Qwen2.5-0.5B-Instruct` (0.49B) — the default,
> and the only configuration trainable on this project's hardware.
> **LEKOY RV5 Medium** — `Qwen/Qwen2.5-1.5B-Instruct` (1.54B) — one 24 GB GPU.
> **LEKOY RV5 Large** — `Qwen/Qwen2.5-7B-Instruct` (7.62B) — one 48 GB GPU.

Chosen because:

1. **Best Hebrew tokenizer among permissively licensed candidates**, by a
   margin (2.491 chars/token; next-best Apache-2.0 candidate is 2.154). This is
   the property that cannot be fixed later, so it is weighted first.
2. **Apache-2.0 at 0.5B, 1.5B and 7B.** No use restrictions, no attribution
   burden beyond the notice, no downstream propagation. RV5 can be released and
   used commercially.
3. **32,768-token context** at every size — 4× Gemma's, and on Qwen's
   tokenization worth ~80,000 Hebrew characters.
4. **One tokenizer across all three sizes.** Tokenized datasets, evaluation
   harnesses and the LEKOY SCORE are computed once and are valid for Small,
   Medium and Large alike. Scaling RV5 up is a config change, not a re-run of
   the data pipeline.
5. **Grouped-query attention and a plain ChatML template**, both well supported
   by `transformers`, `peft`, `trl`, vLLM and llama.cpp — the entire serving
   and quantization path in this repository works without patches.

### The 3B is deliberately skipped

`Qwen2.5-3B-Instruct` would be the natural middle size and has identical
tokenization. It is released under the **Qwen Research Licence**, not
Apache-2.0, which prohibits commercial use. LEKOY RV5 Medium therefore uses the
1.5B, which is Apache-2.0. The size ladder is 0.5B → 1.5B → 7B for a licence
reason, and it is worth stating rather than leaving as an odd-looking gap.

## Known weaknesses of this choice

Recorded so that RV6 inherits the analysis rather than rediscovering it.

**Niqqud is expensive.** Qwen is the worst finalist on vocalised Hebrew:
`שָׁלוֹם` costs 9 tokens and `מָתֵמָטִיקָה` costs 16, against 1 and 4 for their
unvocalised forms. Qwen's byte-level BPE has no merges for combining marks, so
each is spelled out byte by byte. Accepted because vocalised Hebrew is rare
outside liturgical, poetic and pedagogical text, and RV5 needs to *read* it
correctly — which it does, losslessly — rather than generate it cheaply. If
RV6 targets vocalised Hebrew, this is the first thing to fix, and dictalm's
result shows a small targeted extension is enough.

**Hebrew is still 1.75× English.** Best available is not parity. Every training
and serving estimate in this repository accounts for it explicitly; see
`scripts/estimate_training.py`.

**Vocabulary extension would recover about 8.2% of that.** Measured, not
guessed: `scripts/extend_tokenizer.py --analyse` finds 372 Hebrew words the
Qwen tokenizer splits which, if added, would save 8.2% of the Hebrew tokens in
the probe corpus — mostly common function words (בשנת, היא, היה, לאחר, כאשר)
that currently cost two tokens each. Real, but an order of magnitude smaller
than the 2.6× that separated the candidate tokenizers, and it costs a
continued-pretraining pass to recover from a resized embedding matrix. Deferred
to RV6 with the analysis recorded in `reports/tokenizer_extension.json`.

**Chinese-heavy pretraining mix.** Qwen2.5's corpus is weighted toward Chinese
and English. Hebrew is present but not emphasised — which is precisely what
Stage 1 continued pretraining exists to address, and why the RV5 plan gives
Hebrew a larger share of the mixture than the initial 40/40/20 split.

**A trailing-space round-trip artefact.** One document in 40 does not
round-trip exactly through Qwen's tokenizer. Investigated: the affected
document is *Punjabi*, not Hebrew — it was mislabelled `heb_Hebr` in the HPLT
shard — and the difference is a single trailing space. Two conclusions, both
acted on: Qwen's Hebrew round-trip is in fact lossless, and the raw corpus
contains language-mislabelled documents, which is why `scripts/filter_data.py`
runs its own script-based language detection instead of trusting the source
label. See `docs/rv5_training_plan.md`, Phase 3.

## Reproducing this

```bash
python scripts/analyze_tokenizer.py --docs 400 --rebuild-corpus
```

Writes `reports/tokenizer_report.md` and the raw measurements beside it as
JSON. Add a candidate by appending to `CANDIDATES` in that script; nothing else
in the pipeline needs to change to evaluate it.
