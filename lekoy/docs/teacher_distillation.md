# Distillation: a hundred teachers for a 0.49B student

## Why

RV5's own evaluation is the argument for this. The training report records a
0.49B student that improved from 42.38 to 43.61 on LEKOY SCORE, was blocked by
the regression gate on Spanish and coding, and produced Hebrew like this:

```
עבודה היא דרך לitura וליצירת אמנות
```

That is not a model that needs more epochs. It is a model that has never seen
enough correct Hebrew instruction-response text, because — as
`src/lekoy/data/catalogue.py` records from a direct count — that text does not
exist under a permissive licence:

| Source | Hebrew rows |
| --- | ---: |
| `CohereLabs/aya_dataset` | **0** of 202,362 |
| `OpenAssistant/oasst2` | **24** messages → **2** usable conversations |
| `CohereLabs/xP3x` heb_Hebr | 20,000, but templated and cross-lingual |

The corpus RV5 needs cannot be downloaded. It can be generated, by models that
already have the capability RV5 lacks, and then verified.

## Why a hundred, and why forty of them code

**A hundred**, because the useful signal from a bench of teachers is not their
average — averaging a hundred models gives you the average model. It is their
**disagreement**. When nine teachers pass an item's assertions and one fails,
the item is easy and the outlier is wrong. When all hundred fail, the item is
beyond the faculty and belongs in a report rather than in the corpus.
`verify.py` reads that spread; `mixture.py` labels every sample `trivial`,
`moderate`, `hard` or `unsolved` from it.

**Forty of them code** — 43, as built — because code is the one dimension where
a generated sample can be *checked* rather than trusted. A Python function
either passes its assertions or it does not, and `verify.py` runs them in a
subprocess. That makes the code half of the corpus scalable without a human
reading any of it. Hebrew is not checkable that way, which is why there are 7
Hebrew teachers rather than 40: Hebrew output is verified by consensus plus a
language check, and then it has to be sampled and read.

The weighting is therefore not the student's weakness ranking. Hebrew is its
worst dimension. Code is weighted because code is *verifiable*, and a verified
corpus is worth more per sample than an unverified one.

## The licence gate, and the one finding that matters

Distillation asks a question a dataset licence never does: **may the outputs of
this model be used to train another model?** The answer splits the field in a
way the licence name alone does not.

| Licence | Verdict | Why |
| --- | --- | --- |
| Apache-2.0, MIT, BSD | permitted | Silent on outputs, so nothing restricts them |
| **Llama 2, Llama 3.0** | **refused** | §1.b.v forbids using outputs "to improve any other large language model" |
| Llama 3.1 / 3.2 / 3.3 | conditional | Permitted, but §1.b.i requires the resulting model's name to **begin with "Llama"** |
| Gemma | conditional | Permitted; the prohibited-use policy propagates downstream |
| DeepSeek, OpenRAIL-M | conditional | Permitted; use restrictions propagate |
| CC BY-NC, MNPL, `*-research` | refused | Non-commercial, or research-only |
| Anything unreadable | refused | Needs a human read; not assumed |

Three consequences worth stating plainly:

**The entire Code Llama family is unusable.** CodeLlama 7B/13B/34B/70B, Phind's
fine-tune, the WizardCoder Python models and Magicoder-S-CL all inherit the
Llama 2 licence, and its §1.b.v prohibits exactly the activity this pipeline
performs. Meta removed that clause in 3.1; they did not remove it retroactively.
Eight strong code teachers are refused on this basis alone.

**A Llama 3.1+ teacher renames the release.** If any Llama 3.1, 3.2 or 3.3
teacher contributes a sample, the resulting checkpoint must ship as
`Llama-LEKOY-RV6`, not `LEKOY-RV6`. That is a branding decision disguised as a
licence clause, and it should be made deliberately rather than discovered at
release. `--unconditional-only` avoids it entirely, at the cost of 31 teachers.

**Family licences are not uniform.** `Qwen2.5-Coder-3B-Instruct` is
research-only while every other size in the same line is Apache-2.0. Assuming
the family licence would have put a non-commercial model into a commercial
corpus. This is the reason every licence is read from the hub per model, at
build time, rather than inferred.

## The pipeline

```
build_teachers.py   → data/teachers_registry.json   100 teachers + 40 recorded refusals
distill.py --plan   → reports/distill_plan.json     what a run would cost
distill.py          → data/distill/responses.jsonl  one line per (teacher, prompt)
distill.py --build-mixture
                    → data/distill/sft.jsonl        verified, deduplicated, leakage-checked
train_sft.py --data-dir data/distill                the existing Stage 2, unchanged
```

Generation is **teacher-major**: load one model, ask it every question, unload.
Loading a 32B checkpoint costs a minute and 60 GB of I/O, and amortising that
over 5,000 prompts is the difference between a run that finishes and one that
does not. Every response is appended as it is produced and a restart skips what
is on disk, because a hundred teachers is measured in GPU-days and will be
interrupted.

### Verification

Four methods, in descending order of trustworthiness:

| Method | Applies to | What it establishes |
| --- | --- | --- |
| `execute` | code | The assertions pass. This is a fact, not an opinion. |
| `consensus` | maths, short answers | n teachers independently produced the same value, and it matches the known answer where one exists |
| `language` | Hebrew, Spanish | The response is in the language asked for, and is not script soup |
| `format` | constrained outputs | The response obeys the stated constraint |

The Hebrew check is written against RV5's actual failure. Script *ratio* passes
`עבודה היא דרך לitura` — most of it is Hebrew. What condemns it is a Latin run
welded inside a Hebrew word, so that is matched directly. A standalone English
term (`השתמשתי בספריית pandas`) passes, because code-switching is a register
RV5 must keep, not an error to filter out.

### What the mixture does

- **One sample per prompt.** Forty teachers answering correctly is one training
  sample, not forty. Writing all forty would teach the student that this
  particular function is forty times more important than anything else.
- **The shortest verified answer wins.** Not an aesthetic preference: v4 failed
  because its corpus taught the model that answers are long restatements of the
  question, and `global_mmlu_hebrew` fell to 0.053 — below the 0.25 chance floor
  — because it stopped emitting a parseable letter at all.
- **Deduplication, then leakage.** Generated corpora repeat themselves far more
  than scraped ones. Leakage against `eval/` is checked separately and
  afterwards, because a distilled corpus is the easiest way in the world to leak
  an evaluation set back into training: the teacher will cheerfully answer an
  eval question, and its answer will look like excellent training data.
- **Provenance travels.** Every record carries the teacher, the verification
  method, the agreement level and the difficulty band.

## What it costs

Projected by `distill.py --plan`, from memory bandwidth rather than FLOPs —
decode is bandwidth-bound, so tokens/second is roughly *bandwidth ÷ bytes of
weights*. 100 teachers × 5,000 prompts × 400 tokens, one accelerator,
sequential:

| Accelerator | Precision | Teachers that fit | Wall clock | Indicative cost |
| --- | --- | ---: | ---: | ---: |
| H100 80 GB | int4 | 91 / 100 | 22 h | ~$90 |
| RTX 4090 | int4 | 84 / 100 | 58 h | ~$23 |
| A100 80 GB | bf16 | 85 / 100 | 109 h | ~$273 |
| A10 24 GB | int4 | 84 / 100 | 97 h | ~$97 |
| CPU (this host) | int4 | 68 / 100 | 1,215 h | 51 days |

Prices are on-demand list and move; they are here so the estimate can say
"about $90" rather than nothing. The honest reading is that the *whole faculty*
is roughly a day of one H100 — this is not an expensive idea, and the reason it
has not been run here is that this host has no GPU at all.

## What has not been run

No teacher has been executed. This host has no GPU
(`reports/system_report.md`), 15 GB of RAM and 28 GB of disk; the smallest
useful teacher in the faculty does not fit alongside its own KV cache. What
exists and is tested is: the registry built from the live hub, the licence gate,
all four verifiers, the mixture builder with its dedup and leakage checks, the
cost planner, and the CLI. `tests/test_distill.py` covers them with 51 tests
that need neither the network nor a model.

No number in this document describes a trained checkpoint, because there is not
one. The next honest step is a single GPU host and one teacher — `--role code
--limit-teachers 1 --max-vram 24` — to confirm the loop end to end before
spending a day of H100 on it.
