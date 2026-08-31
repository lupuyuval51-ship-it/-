# LEKOY RV5 — Tokenizer Report

Measured by `scripts/analyze_tokenizer.py` on a seeded sample of the real
LEKOY corpus. Every candidate sees byte-identical input.

| Probe corpus | Documents | Characters |
| --- | ---: | ---: |
| Hebrew | 400 | 774,490 |
| English | 400 | 879,227 |
| Spanish | 400 | 834,999 |

## Why this measurement decides the base model

Tokenizer efficiency is the one property of a base model that training
cannot repair. Weights move; the vocabulary does not, short of the
surgery described at the end of this report. A tokenizer that encodes
Hebrew at 2 characters per token instead of 3.5 charges LEKOY RV5 a 75%
tax on every Hebrew sequence, forever: a Hebrew document costs 75% more
tokens to train on, fills the context window 75% faster, and is 75% more
expensive to generate. Against that, a few points of benchmark difference
between candidate base models is small.

**Characters per token, higher is better.** It is the direct measure of
how much text one token carries.

## Results

| Tokenizer | Vocab | Hebrew | English | Spanish | Hebrew penalty |
| --- | ---: | ---: | ---: | ---: | ---: |
| `Qwen/Qwen2.5-0.5B-Instruct` | 151,665 | **2.491** | 4.347 | 3.52 | 1.745× |
| `Qwen/Qwen2.5-1.5B-Instruct` | 151,665 | **2.491** | 4.347 | 3.52 | 1.745× |
| `Qwen/Qwen2.5-7B-Instruct` | 151,665 | **2.491** | 4.347 | 3.52 | 1.745× |
| `Qwen/Qwen3-0.6B` | 151,669 | **2.491** | 4.347 | 3.52 | 1.745× |
| `Qwen/Qwen3-1.7B` | 151,669 | **2.491** | 4.347 | 3.52 | 1.745× |
| `unsloth/gemma-2-2b-it` | 256,000 | **2.29** | 4.374 | 4.151 | 1.91× |
| `dicta-il/dictalm2.0-instruct` | 33,152 | **2.154** | 3.849 | 3.077 | 1.787× |
| `ibm-granite/granite-3.1-2b-instruct` | 49,155 | **1.166** | 3.605 | 2.882 | 3.092× |
| `tiiuae/Falcon3-1B-Instruct` | 131,072 | **1.162** | 4.219 | 3.701 | 3.631× |
| `NousResearch/Meta-Llama-3.1-8B-Instruct` | 128,256 | **1.059** | 4.504 | 3.584 | 4.253× |
| `allenai/OLMo-2-0425-1B-Instruct` | 100,278 | **1.059** | 4.498 | 3.573 | 4.247× |
| `mistralai/Mistral-7B-Instruct-v0.3` | 32,768 | **1.021** | 3.849 | 3.077 | 3.77× |
| `microsoft/Phi-3.5-mini-instruct` | 32,011 | **1.021** | 3.736 | 3.206 | 3.659× |
| `HuggingFaceTB/SmolLM2-360M-Instruct` | 49,152 | **0.942** | 4.156 | 2.786 | 4.412× |

*Hebrew penalty* = English chars/token ÷ Hebrew chars/token. 1.0 would
mean Hebrew is as cheap as English; every candidate is above it.

### Tokens per word

The same measurement per word rather than per character, which is the
form that maps onto how much of a sentence fits in a context window.

| Tokenizer | Hebrew | English | Spanish |
| --- | ---: | ---: | ---: |
| `Qwen2.5-0.5B-Instruct` | 2.309 | 1.453 | 1.795 |
| `Qwen2.5-1.5B-Instruct` | 2.309 | 1.453 | 1.795 |
| `Qwen2.5-7B-Instruct` | 2.309 | 1.453 | 1.795 |
| `Qwen3-0.6B` | 2.309 | 1.453 | 1.795 |
| `Qwen3-1.7B` | 2.309 | 1.453 | 1.795 |
| `gemma-2-2b-it` | 2.511 | 1.444 | 1.523 |
| `dictalm2.0-instruct` | 2.67 | 1.641 | 2.054 |
| `granite-3.1-2b-instruct` | 4.932 | 1.752 | 2.193 |
| `Falcon3-1B-Instruct` | 4.947 | 1.497 | 1.708 |
| `Meta-Llama-3.1-8B-Instruct` | 5.428 | 1.402 | 1.764 |
| `OLMo-2-0425-1B-Instruct` | 5.432 | 1.405 | 1.769 |
| `Mistral-7B-Instruct-v0.3` | 5.634 | 1.641 | 2.054 |
| `Phi-3.5-mini-instruct` | 5.635 | 1.691 | 1.971 |
| `SmolLM2-360M-Instruct` | 6.106 | 1.52 | 2.268 |

### Tokens per sentence and per document

| Tokenizer | He tokens/sentence | He median tokens/doc | En tokens/sentence |
| --- | ---: | ---: | ---: |
| `Qwen2.5-0.5B-Instruct` | 35.84 | 612 | 22.06 |
| `Qwen2.5-1.5B-Instruct` | 35.84 | 612 | 22.06 |
| `Qwen2.5-7B-Instruct` | 35.84 | 612 | 22.06 |
| `Qwen3-0.6B` | 35.84 | 612 | 22.06 |
| `Qwen3-1.7B` | 35.84 | 612 | 22.06 |
| `gemma-2-2b-it` | 38.98 | 680 | 21.92 |
| `dictalm2.0-instruct` | 41.45 | 718 | 24.91 |
| `granite-3.1-2b-instruct` | 76.56 | 1330 | 26.6 |
| `Falcon3-1B-Instruct` | 76.8 | 1344 | 22.73 |
| `Meta-Llama-3.1-8B-Instruct` | 84.27 | 1486 | 21.29 |
| `OLMo-2-0425-1B-Instruct` | 84.33 | 1486 | 21.32 |
| `Mistral-7B-Instruct-v0.3` | 87.46 | 1542 | 24.91 |
| `Phi-3.5-mini-instruct` | 87.48 | 1543 | 25.67 |
| `SmolLM2-360M-Instruct` | 94.79 | 1680 | 23.07 |

## Hebrew behaviours the averages hide

Mean tokens per item, lower is better. These are the specific Hebrew
properties the RV5 brief calls for — prefixes, inflection, niqqud,
geresh, code switching — each measured on its own.

| Tokenizer | common&nbsp;words | prefixed&nbsp;forms | gender&nbsp;and&nbsp;number | verb&nbsp;inflection | construct&nbsp;state | slang | with&nbsp;niqqud | geresh&nbsp;and&nbsp;gershayim | numbers&nbsp;in&nbsp;Hebrew | loanwords | Hebrew&nbsp;with&nbsp;English | code&nbsp;switching |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| `Qwen2.5-0.5B-Instruct` | 1.12 | 2.33 | 1.75 | 2.17 | 2.5 | 2.29 | 10.25 | 3.33 | 4.2 | 3 | 6.67 | 7.67 |
| `Qwen2.5-1.5B-Instruct` | 1.12 | 2.33 | 1.75 | 2.17 | 2.5 | 2.29 | 10.25 | 3.33 | 4.2 | 3 | 6.67 | 7.67 |
| `Qwen2.5-7B-Instruct` | 1.12 | 2.33 | 1.75 | 2.17 | 2.5 | 2.29 | 10.25 | 3.33 | 4.2 | 3 | 6.67 | 7.67 |
| `Qwen3-0.6B` | 1.12 | 2.33 | 1.75 | 2.17 | 2.5 | 2.29 | 10.25 | 3.33 | 4.2 | 3 | 6.67 | 7.67 |
| `Qwen3-1.7B` | 1.12 | 2.33 | 1.75 | 2.17 | 2.5 | 2.29 | 10.25 | 3.33 | 4.2 | 3 | 6.67 | 7.67 |
| `gemma-2-2b-it` | 1.38 | 2.33 | 2.38 | 2.67 | 3.5 | 2.57 | 6.25 | 3.33 | 4.4 | 3.8 | 7.33 | 8 |
| `dictalm2.0-instruct` | 2 | 2.67 | 2.38 | 2.83 | 3.5 | 3 | 7 | 3.17 | 4.6 | 4 | 9 | 9 |
| `granite-3.1-2b-instruct` | 3.62 | 5.5 | 4.25 | 4.5 | 7.75 | 4.57 | 11 | 4.67 | 5.6 | 9.6 | 14.33 | 17 |
| `Falcon3-1B-Instruct` | 3.5 | 5.33 | 4.38 | 4.5 | 8 | 4.29 | 8 | 4.83 | 5.2 | 8.2 | 15 | 16.67 |
| `Meta-Llama-3.1-8B-Instruct` | 3.88 | 6 | 5.75 | 5.67 | 8.5 | 4.71 | 11.25 | 5.5 | 5 | 10.2 | 16 | 17.67 |
| `OLMo-2-0425-1B-Instruct` | 3.88 | 6 | 5.75 | 5.67 | 8.5 | 4.71 | 11.25 | 5.5 | 5 | 10.2 | 16 | 17.67 |
| `Mistral-7B-Instruct-v0.3` | 4.62 | 6.5 | 5.75 | 5.67 | 9.25 | 5.29 | 8.5 | 5.17 | 6.2 | 9 | 17.67 | 20.33 |
| `Phi-3.5-mini-instruct` | 4.62 | 6.5 | 5.75 | 5.67 | 9.25 | 5.29 | 8.5 | 5.17 | 6.2 | 9 | 17.67 | 20.33 |
| `SmolLM2-360M-Instruct` | 4.38 | 6.33 | 5.75 | 5.67 | 8.75 | 5 | 8.5 | 5.5 | 6 | 10.4 | 19 | 20 |

### Worked example — `Qwen/Qwen2.5-0.5B-Instruct`

How the strongest Hebrew tokenizer in the table actually splits a
few of the probe items:

| Item | Tokens |
| --- | ---: |
| `שלום` | 1 |
| `בית` | 1 |
| `ילד` | 1 |
| `והבית` | 2 |
| `כשהילד` | 3 |
| `מהמחשב` | 2 |
| `שָׁלוֹם` | 9 |
| `מָתֵמָטִיקָה` | 16 |
| `יֶלֶד` | 7 |
| `צה"ל` | 3 |
| `ד"ר` | 3 |
| `ג'ירפה` | 4 |
| `תכתוב לי function בפייתון` | 8 |
| `ה-API הזה לא עובד` | 6 |
| `צריך לעשות deploy למערכת` | 6 |

## Round-trip fidelity on Hebrew

`decode(encode(x)) == x`, over 40 Hebrew documents. A tokenizer that
normalises away a niqqud mark here will drop it in generation too.

| Tokenizer | Exact round trips | Rate |
| --- | ---: | ---: |
| `Qwen2.5-0.5B-Instruct` | 39/40 | 0.975 |
| `Qwen2.5-1.5B-Instruct` | 39/40 | 0.975 |
| `Qwen2.5-7B-Instruct` | 39/40 | 0.975 |
| `Qwen3-0.6B` | 39/40 | 0.975 |
| `Qwen3-1.7B` | 39/40 | 0.975 |
| `gemma-2-2b-it` | 40/40 | 1.0 |
| `dictalm2.0-instruct` | 40/40 | 1.0 |
| `granite-3.1-2b-instruct` | 40/40 | 1.0 |
| `Falcon3-1B-Instruct` | 40/40 | 1.0 |
| `Meta-Llama-3.1-8B-Instruct` | 40/40 | 1.0 |
| `OLMo-2-0425-1B-Instruct` | 40/40 | 1.0 |
| `Mistral-7B-Instruct-v0.3` | 40/40 | 1.0 |
| `Phi-3.5-mini-instruct` | 40/40 | 1.0 |
| `SmolLM2-360M-Instruct` | 40/40 | 1.0 |

Not lossless on Hebrew:

* `Qwen/Qwen2.5-0.5B-Instruct` — 98%
  * `…ੇ ਜੋ ਤੁਸੀਂ ਆਪਣੇ ਰੋਜ਼ਾਨਾ ਦੇ ਰੁਟੀਨ 'ਤੇ … -> …ੇ ਜੋ ਤੁਸੀਂ ਆਪਣੇ ਰੋਜ਼ਾਨਾ ਦੇ ਰੁਟੀਨ 'ਤੇ…`
* `Qwen/Qwen2.5-1.5B-Instruct` — 98%
  * `…ੇ ਜੋ ਤੁਸੀਂ ਆਪਣੇ ਰੋਜ਼ਾਨਾ ਦੇ ਰੁਟੀਨ 'ਤੇ … -> …ੇ ਜੋ ਤੁਸੀਂ ਆਪਣੇ ਰੋਜ਼ਾਨਾ ਦੇ ਰੁਟੀਨ 'ਤੇ…`
* `Qwen/Qwen2.5-7B-Instruct` — 98%
  * `…ੇ ਜੋ ਤੁਸੀਂ ਆਪਣੇ ਰੋਜ਼ਾਨਾ ਦੇ ਰੁਟੀਨ 'ਤੇ … -> …ੇ ਜੋ ਤੁਸੀਂ ਆਪਣੇ ਰੋਜ਼ਾਨਾ ਦੇ ਰੁਟੀਨ 'ਤੇ…`
* `Qwen/Qwen3-0.6B` — 98%
  * `…ੇ ਜੋ ਤੁਸੀਂ ਆਪਣੇ ਰੋਜ਼ਾਨਾ ਦੇ ਰੁਟੀਨ 'ਤੇ … -> …ੇ ਜੋ ਤੁਸੀਂ ਆਪਣੇ ਰੋਜ਼ਾਨਾ ਦੇ ਰੁਟੀਨ 'ਤੇ…`
* `Qwen/Qwen3-1.7B` — 98%
  * `…ੇ ਜੋ ਤੁਸੀਂ ਆਪਣੇ ਰੋਜ਼ਾਨਾ ਦੇ ਰੁਟੀਨ 'ਤੇ … -> …ੇ ਜੋ ਤੁਸੀਂ ਆਪਣੇ ਰੋਜ਼ਾਨਾ ਦੇ ਰੁਟੀਨ 'ਤੇ…`

## What follows from this

The spread is large. `Qwen2.5-0.5B-Instruct` encodes Hebrew at
2.491 characters per token;
`SmolLM2-360M-Instruct` manages
0.942. Training the same
Hebrew corpus through the second costs roughly
2.6×
the tokens of the first, for identical text.

Vocabulary size correlates with Hebrew efficiency but does not determine
it: what matters is whether Hebrew subwords were learned during tokenizer
training, and that depends on how much Hebrew was in the tokenizer's
corpus, not on how many slots the vocabulary has.

The base model decision, taking these numbers together with licence,
architecture and benchmark evidence, is in
[`docs/base_model_selection.md`](../docs/base_model_selection.md).

## On extending the vocabulary

The RV5 brief asks whether Hebrew tokens should be added to the base
model's vocabulary. The measurements above are the justification the
brief requires, and on this evidence the answer for RV5 is no:

1. The selected tokenizer's Hebrew penalty is close to the best
   available among permissively licensed candidates. Extension buys back
   a fraction of an already-small gap.
2. Extension resizes the embedding matrix and the LM head, and the new
   rows start uninitialised. Recovering from that needs continued
   pretraining at a scale this project does not have — and doing it
   badly is worse than not doing it, because it perturbs every existing
   embedding through the shared output projection.
3. It breaks weight compatibility with the base model's ecosystem:
   quantised builds, serving backends and adapters all assume the
   original vocabulary.

`scripts/extend_tokenizer.py` implements the procedure — backup, train
candidate merges on the Hebrew corpus, resize, initialise new rows from
the mean of their subword pieces, and re-benchmark — so that RV6 can
revisit the decision with a larger compute budget. It is not run for RV5.
