# LEKOY

**LEKOY** is a family of multilingual language models. **RV5** is the first
model in it — Hebrew-first, with English and Spanish alongside.

The full name is **LEKOY RV5**.

This repository is the whole system that produces it: data pipeline, training
pipeline, evaluation suite, scoring metric, inference engine, local API, web
chat, quantization and export. Not a wrapper. Nothing here calls a hosted model
at inference time; every token comes from weights this project holds.

---

## Table of contents

1. [What is LEKOY](#1-what-is-lekoy)
2. [What is RV5](#2-what-is-rv5)
3. [Installation](#3-installation)
4. [Hardware requirements](#4-hardware-requirements)
5. [Base model](#5-base-model)
6. [Dataset preparation](#6-dataset-preparation)
7. [Distillation from a teacher faculty](#7-distillation-from-a-teacher-faculty)
8. [Training](#8-training)
9. [Continued pretraining](#9-continued-pretraining)
10. [Instruction tuning](#10-instruction-tuning)
11. [Reasoning](#11-reasoning)
12. [Coding](#12-coding)
13. [Preference training](#13-preference-training)
14. [Evaluation](#14-evaluation)
15. [Chat](#15-chat)
16. [API](#16-api)
17. [Web UI](#17-web-ui)
18. [Quantization](#18-quantization)
19. [Export](#19-export)
20. [Resume training](#20-resume-training)
21. [Future LEKOY models](#21-future-lekoy-models)

---

## 1. What is LEKOY

LEKOY is the model **family**. It is the name that stays fixed while the models
under it change: RV5 today, and RV6, RV7, LEKOY Mini, LEKOY Code, LEKOY
Reasoning or LEKOY Vision later.

Everything in this repository that is not the weights themselves is built to
outlive any single model. The data pipeline, evaluation suites, LEKOY SCORE,
regression gate, experiment tracking, API, web chat and export tooling are keyed
on a config file, not on RV5's particular base model. A new generation is a new
config and a re-run, not a fork.

## 2. What is RV5

RV5 is the first model in the LEKOY family, in three sizes:

| Configuration | Parameters | Trains on | Status |
| --- | ---: | --- | --- |
| `rv5_small` | 0.49B | CPU, LoRA bf16 | the default; what this project runs |
| `rv5_medium` | 1.54B | one 24 GB GPU, QLoRA | written and ready, not run here |
| `rv5_large` | 7.62B | one 48 GB GPU, QLoRA | written and ready, not run here |

Three languages, deliberately weighted:

- **Hebrew** — the point of the model. Natural Hebrew, not translated-sounding
  Hebrew: gender and number agreement, prefixes and the construct state, slang
  where it fits and formal register where it does not, code-switching with
  English, RTL, geresh and gershayim.
- **English** — held steady rather than taught. The base model is already
  strong here and the job is not to lose it.
- **Spanish** — both peninsular and Latin American, preserving whichever
  variety the user writes in.

**On honesty about what is finished.** This repository contains a complete,
working pipeline and real measurements from it. The hardware it runs on has no
GPU (`reports/system_report.md`), so what is trained here is the 0.5B
configuration. The Medium and Large configs are written for GPU hosts and have
not been run; anything in `reports/` that gives a number for RV5 refers to
Small, and says so.

## 3. Installation

```bash
git clone <this repository>
cd lekoy

python -m venv .venv
source .venv/bin/activate

# Install torch first, from the CPU index. The default index pulls the CUDA
# runtime — about 3 GB of libraries a CPU host cannot use.
pip install torch --index-url https://download.pytorch.org/whl/cpu
pip install -r requirements.txt
```

On a GPU host:

```bash
pip install torch --index-url https://download.pytorch.org/whl/cu124
pip install -r requirements.txt -r requirements-gpu.txt
pip install flash-attn --no-build-isolation      # optional; compiles, needs nvcc
```

Then check what the machine can actually do:

```bash
python scripts/check_system.py
```

This writes `reports/system_report.md` — CPU, RAM, GPU, VRAM, storage, CUDA,
supported precisions, measured matmul throughput, and which model sizes can be
run, LoRA-tuned or fully fine-tuned on this host.

## 4. Hardware requirements

| You want to | Minimum |
| --- | --- |
| Chat with RV5 Small | 4 GB RAM. No GPU needed. |
| Train RV5 Small (LoRA) | 8 GB RAM, 4 cores. Slow on CPU but it finishes. |
| Train RV5 Medium (QLoRA) | One 24 GB GPU — A10, L4, 3090, 4090. |
| Train RV5 Large (QLoRA) | One 48 GB GPU, or 2× 24 GB with DeepSpeed ZeRO-3. |
| Full fine-tune 7B | 8× A100 80 GB. Out of scope for this project. |

Project a specific run before starting it:

```bash
python scripts/estimate_training.py --config rv5_small.yaml --tokens 5M
python scripts/estimate_training.py --params 7B --tokens 2B --gpu a100-80 --gpus 8
python scripts/estimate_training.py --list-gpus
```

The CPU figures come from the matmul benchmark measured on your machine by
`check_system.py`, not from a vendor sheet.

## 5. Base model

**`Qwen/Qwen2.5-Instruct`, Apache-2.0.** Selected by measurement, not
reputation — see [`docs/base_model_selection.md`](docs/base_model_selection.md)
and [`reports/tokenizer_report.md`](reports/tokenizer_report.md).

Fourteen candidate tokenizers were measured on 2.5 million characters of the
real corpus. The finding that decided it:

| Tokenizer | Hebrew chars/token | Hebrew penalty vs English |
| --- | ---: | ---: |
| **Qwen2.5 / Qwen3** | **2.491** | 1.75× |
| gemma-2 | 2.290 | 1.91× |
| dictalm2.0 (Hebrew-extended Mistral) | 2.154 | 1.79× |
| Llama 3.1 | 1.059 | 4.25× |
| Mistral v0.3 | 1.021 | 3.77× |

Hebrew tokenizer efficiency spans **2.6×** across these candidates, and that gap
dwarfs every other difference between them. `שלום` is one token on Qwen and four
on Mistral. A code-switched sentence like `Explain לי איך לבנות את זה` is 7.67
tokens on Qwen and 20.33 on Mistral — the Hebrew half spelled out almost
character by character.

Unlike weights, a tokenizer cannot be fine-tuned out of the problem. It is the
one base-model property training does not touch, so it was weighted first.

## 6. Dataset preparation

```bash
python scripts/download_data.py --list      # the catalogue and its licences
python scripts/download_data.py             # fetch it
python scripts/clean_data.py                # encoding, boilerplate, PII
python scripts/filter_data.py               # quality and language
python scripts/deduplicate.py               # exact, normalised, near
python scripts/deduplicate.py --check-leakage
python scripts/prepare_data.py --task all
python scripts/tokenize_data.py --task all --report
```

Every stage writes a `.stats.json` beside its output saying what it removed and
why — a pipeline that reports only "kept 61%" is unusable when the number looks
wrong, because the next question is always which signal fired.

**Licensing is enforced at ingest.** A source whose licence is not on the
permitted list is refused before it reaches disk, and the refusal is recorded in
`data/datasets_registry.json` with its reason. Sources used: CC0 (HPLT), ODC-By
(FineWeb-2), Apache-2.0 (xP3x, OASST2, Aya, Global-MMLU, CodeFeedback),
CC BY-SA (Wikipedia, Belebele), MIT (GSM8K, UltraChat), CC BY (CodeAlpaca).

**Three things this pipeline found, which shaped the project:**

*Hebrew instruction data barely exists.* Aya: **0** Hebrew rows out of 202,362.
OASST2: **24** Hebrew messages out of 128,575, reconstructing into **2** usable
conversations — against 4,047 Spanish ones. Hebrew *text* is plentiful; Hebrew
*instruction-response* data is not. This is why Stage 1 continued pretraining
carries unusual weight, and why `src/lekoy/data/seed.py` is written by hand.

*Source language labels are wrong.* HPLT's `heb_Hebr` shard contains Punjabi
documents. Every document is language-checked by script analysis rather than
trusted — and `mixed` is a verdict, not a rejection, because Hebrew-with-English
is a register RV5 must handle.

*A flat quality floor discards benchmarks.* A 200-character minimum is right for
web prose and wrong for an 80-character exam question; it was throwing away 961
of 1,000 Hebrew Global-MMLU items. The floor is per-category now.

## 7. Distillation from a teacher faculty

The pipeline above collects the Hebrew data that exists. This one generates the
Hebrew data that does not.

The measurement behind it is in section 6: Aya has **0** Hebrew rows, OASST2
reconstructs into **2** usable Hebrew conversations. RV5 Small was trained on
1,278 conversations because that is what could be assembled, and its Hebrew
output shows it — `reports/eval/rv5-v2.json` contains
`עבודה היא דרך לitura וליצירת אמנות`, which is not a model that needs more
epochs. So the corpus is generated by models that already have the capability
RV5 lacks, and every generated sample is verified before it is kept.

```bash
python scripts/build_teachers.py            # build data/teachers_registry.json
python scripts/distill.py --list            # who is on the faculty
python scripts/distill.py --plan --gpu h100 --bits 4
python scripts/distill.py --role code --max-vram 24 --bits 4
python scripts/distill.py --build-mixture --out data/distill/sft.jsonl
python scripts/train_sft.py --data-dir data/distill
```

**One hundred teachers, 43 of them code specialists.** The full table with every
licence and parameter count is [`reports/teacher_faculty.md`](reports/teacher_faculty.md);
the reasoning is in [`docs/teacher_distillation.md`](docs/teacher_distillation.md).

The code weighting is deliberate, and it is not the student's weakness ranking —
Hebrew is worse. Code is weighted because code is the one dimension where a
generated sample can be **checked**: a Python function passes its assertions or
it does not, and `distill/verify.py` runs them in a subprocess. That makes the
code half of the corpus scalable without a human reading any of it. Hebrew
output is verified by consensus and a language check, and then it still has to
be sampled and read, which is why there are 7 Hebrew teachers rather than 40.

**The licence gate is stricter here than at section 6**, because distillation
asks a question a dataset licence never does: may this model's *outputs* be used
to train another model?

| | |
| --- | --- |
| Apache-2.0, MIT, BSD | permitted — silent on outputs |
| **Llama 2, Llama 3.0** | **refused** — §1.b.v forbids using outputs "to improve any other large language model" |
| Llama 3.1 / 3.2 / 3.3 | conditional — permitted, but the resulting model's name must **begin with "Llama"** |
| Gemma, DeepSeek, OpenRAIL-M | conditional — use restrictions propagate downstream |
| CC BY-NC, MNPL, `*-research` | refused — non-commercial or research-only |
| anything unreadable | refused — needs a human read, never assumed |

Three findings came out of applying it to 140 candidates:

- **The whole Code Llama family is unusable.** CodeLlama 7B/13B/34B/70B, Phind's
  fine-tune, the WizardCoder Python models and Magicoder-S-CL all carry the
  Llama 2 licence, whose §1.b.v prohibits precisely this. Meta removed the
  clause in 3.1 and did not do so retroactively. Eight strong code teachers are
  refused on this ground alone.
- **A Llama 3.1+ teacher renames the release.** One sample from one such teacher
  and the checkpoint must ship as `Llama-LEKOY-RV6`. `--unconditional-only`
  avoids it, at the cost of 31 teachers.
- **Family licences are not uniform.** `Qwen2.5-Coder-3B-Instruct` is
  research-only while every other size in its line is Apache-2.0. Every licence
  is therefore read from the hub per model at build time, never inherited.

All 40 refusals are recorded in the registry with their reason, on the same
principle as the dataset registry: an absence is not an answer.

**Verification** is what makes a hundred teachers better than one — and it is
not averaging, which would just give you the average model. It is disagreement.
`execute` runs the assertions; `consensus` accepts an answer several teachers
reached independently, and rejects one they agreed on that contradicts a known
answer; `language` catches the Latin-inside-a-Hebrew-word failure directly
rather than through a script ratio, while still passing `השתמשתי בספריית pandas`
because code-switching is a register RV5 must keep; `format` enforces a stated
output constraint, the capability v4 lost.

The mixture keeps **one sample per prompt** — forty correct answers is one
sample, not forty — and prefers the **shortest** verified one, because v4's
corpus taught the model that answers are long restatements of the question and
`global_mmlu_hebrew` fell to 0.053, below the 0.25 chance floor. Samples are
deduplicated, then checked for leakage against `eval/` separately, because a
distilled corpus is the easiest way in the world to leak an evaluation set back
into training.

**Cost**, projected from memory bandwidth rather than FLOPs, since decode is
bandwidth-bound: the whole faculty over 5,000 prompts is about **22 hours and
$90 on one H100 at int4**, or 58 hours on an RTX 4090. It is not an expensive
idea. It has not been run here because this host has no GPU at all — the
registry, the gate, all four verifiers, the mixture builder and the planner are
written and tested; no teacher has been executed and no number in this section
describes a trained checkpoint.

## 8. Training

Five stages, each a script, each resumable, each recorded as an experiment:

```bash
python scripts/train_pretrain.py     # Stage 1 — continued pretraining
python scripts/train_sft.py          # Stage 2 — instruction tuning
python scripts/train_reasoning.py    # Stage 3 — reasoning
python scripts/train_coding.py       # Stage 4 — coding
python scripts/train_preference.py   # Stage 5 — DPO
```

Every training parameter is in the config and overridable from the command line:

```bash
python scripts/train_sft.py --learning-rate 1e-4 --batch-size 2 --max-seq-length 512
python scripts/train_sft.py --set training.gradient_checkpointing=true --set lora.r=32
```

Before allocating anything, each script predicts peak memory and refuses a run
it expects to fail. If a run does hit an OOM, it does not print a traceback and
stop — it prints the specific flags to change, ordered by cost to the result:

```
out of memory during training.

Try, in this order:
  1. --batch-size 1 --gradient-accumulation 32   (same effective batch, half the memory)
  2. --set training.gradient_checkpointing=true  (~30% slower, large saving)
  3. --max-seq-length 512                        (last resort; changes what the model sees)
```

Checkpoints are never silently overwritten. An occupied output directory is an
error naming all three ways out: `--resume-from-checkpoint`, `--new-experiment`
(writes to `<dir>-002`), or `--overwrite`.

The full plan, phase by phase, is
[`docs/rv5_training_plan.md`](docs/rv5_training_plan.md).

## 9. Continued pretraining

```bash
python scripts/prepare_data.py --task pretrain
python scripts/train_pretrain.py --config rv5_small.yaml
```

Causal language modelling on the Hebrew-weighted corpus, sequences packed so no
compute goes to padding. Two settings differ from every other stage:

- The learning rate is capped at 5e-5. Continued pretraining at an SFT rate is
  how a model forgets everything else it knew.
- LoRA is joined by `embed_tokens` and `lm_head` in `modules_to_save`. Moving a
  token distribution is not something adapters on the projections can express —
  a Hebrew token with a poor embedding stays poor.

## 10. Instruction tuning

```bash
python scripts/prepare_data.py --task sft
python scripts/train_sft.py --config rv5_small.yaml
```

Chat format:

```json
{"messages": [
  {"role": "system",    "content": "..."},
  {"role": "user",      "content": "..."},
  {"role": "assistant", "content": "..."}
]}
```

**Loss is computed on the assistant turns only.** Training on prompt tokens
teaches the model to generate user turns, and it then does — the usual cause of
a fine-tune that answers a question and immediately invents the next one.

**Every conversation gets an explicit LEKOY system turn**, which is not
cosmetic: Qwen's chat template injects *"You are Qwen, created by Alibaba
Cloud"* into any conversation lacking one, and OASST and xP3x conversations lack
one. Left alone, every such example would have taught RV5 that it is Qwen.

## 11. Reasoning

```bash
python scripts/prepare_data.py --task reasoning
python scripts/train_reasoning.py --set model.name=checkpoints/rv5/sft
```

GSM8K with its `<<48/2=24>>` calculator annotations stripped: the model should
learn the arithmetic, not the markup. The data teaches it to reach a correct,
clearly stated answer rather than to perform a long visible scratchpad.

## 12. Coding

```bash
python scripts/prepare_data.py --task coding
python scripts/train_coding.py --set model.name=checkpoints/rv5/reasoning
```

Python, JavaScript, TypeScript, Java, C, C++, C#, Go, Rust, SQL, HTML and CSS,
from CodeFeedback and CodeAlpaca. Scored by **running** the generated programs
against assertions in a subprocess with a timeout — "looks right" is not a
measurement.

## 13. Preference training

```bash
python scripts/prepare_data.py --task preference
python scripts/train_preference.py --set model.name=checkpoints/rv5/coding
```

18,452 DPO pairs reconstructed from OASST2's ranked sibling replies: human
judgement, not a model grading itself. Needs `trl`, and in practice a GPU — DPO
holds a frozen reference copy of the policy alongside the policy.

## 14. Evaluation

```bash
python scripts/evaluate.py --model Qwen/Qwen2.5-0.5B-Instruct --tag baseline
python scripts/evaluate.py --model checkpoints/rv5/sft --tag sft-v1
python scripts/compare_models.py --baseline baseline --candidate sft-v1 --gate
```

993 items across 17 suites: a hand-written Hebrew benchmark, English, Spanish,
reasoning, maths, coding, translation in six directions, instruction following,
hallucination, identity, Belebele ×3, Global-MMLU ×3 and GSM8K.

Greedy decoding, so the numbers reproduce on a re-run. Every response is kept in
the JSON beside the report, so any score can be audited.

### LEKOY SCORE

One number per checkpoint, weighted as the brief specifies:

| Dimension | Weight | | Dimension | Weight |
| --- | ---: | --- | --- | ---: |
| Hebrew | 25% | | Instruction following | 10% |
| Reasoning | 15% | | Maths | 5% |
| Coding | 15% | | Knowledge | 5% |
| English | 12% | | Reliability | 5% |
| Spanish | 8% | | | |

A LEKOY SCORE computed over a partial run records its own coverage and is not
comparable to a full one.

### Regression protection

The score is a summary; the gate is what decides promotion, and it cannot be
satisfied by an average. Regression is measured **relative**: 0.80 → 0.72 and
0.20 → 0.12 are the same absolute drop, and the second is a 40% loss. Hebrew's
threshold is tightest at 5%; reliability's is 3% and carries an absolute floor
of 0.30.

A checkpoint that gains 15% Hebrew and loses 30% English is blocked. There is a
test asserting it stays blocked.

## 15. Chat

```bash
python scripts/chat.py                                  # newest checkpoint
python scripts/chat.py --model checkpoints/rv5/sft
python scripts/chat.py --temperature 0.2 --language en
python scripts/chat.py --prompt "מה זה אלגוריתם?"        # one answer, then exit
```

Tokens stream as they are produced. In-session commands: `/new`, `/system`,
`/temp`, `/tokens`, `/save`, `/info`, `/help`, `/exit`.

## 16. API

```bash
python scripts/serve.py
python scripts/serve.py --model checkpoints/rv5/sft --port 8080
```

| Endpoint | |
| --- | --- |
| `GET /health` | status, backend, device, parameters, usage counters |
| `GET /v1/models` | returns `lekoy-rv5` |
| `POST /v1/chat/completions` | streaming and non-streaming |
| `POST /v1/completions` | legacy text completion |
| `POST /v1/tokenize` | token count — Hebrew costs 1.75× English here |

The schema is OpenAI's so existing clients work unchanged:

```python
from openai import OpenAI

client = OpenAI(base_url="http://localhost:8000/v1", api_key="not-needed")
response = client.chat.completions.create(
    model="lekoy-rv5",
    messages=[{"role": "user", "content": "מי אתה?"}],
)
```

**The schema is OpenAI's; the inference is not.** Asking for `gpt-4` returns a
404, not a proxied answer. There is a test that fails if the server opens any
outbound socket while answering, and another asserting no hosted-provider SDK is
importable in the serving environment.

## 17. Web UI

Served at `http://localhost:8000/app` whenever `serve.py` is running.

New chat, conversation history, streaming, stop, regenerate, copy, delete,
dark and light themes, markdown with tables and syntax-highlighted code blocks,
a system-prompt editor, and sliders for temperature, top-p, top-k, repetition
penalty and max tokens.

No build step and no dependencies — no CDN is contacted, which matters for a
model whose point is that it runs locally. Conversations are stored in the
browser and never leave it. The layout is RTL by default with code blocks forced
LTR, because a Hebrew page is RTL and code is not.

## 18. Quantization

```bash
python scripts/quantize.py --list                 # what this host can produce
python scripts/quantize.py --model release/LEKOY-RV5-SFT-v1 --format bf16 fp16 --verify
python scripts/quantize.py --model release/LEKOY-RV5-SFT-v1 --format int8 int4   # CUDA
python scripts/quantize.py --model release/LEKOY-RV5-SFT-v1 --format gguf --gguf-type q4_k_m
```

`--list` reports which formats are available here and why the others are not,
rather than failing halfway through. Every output is reloaded and asked a
question with `--verify`, because quantization is exactly where a model breaks
silently.

GGUF needs a llama.cpp checkout; set `LLAMA_CPP_DIR` or pass `--llama-cpp-dir`.

## 19. Export

```bash
python scripts/export.py --checkpoint checkpoints/rv5/sft \
    --out release/LEKOY-RV5-SFT-v1 --verify
```

Merges LoRA adapters into the base weights, copies the tokenizer, writes a
manifest and a README, and with `--verify` reloads the result from disk and
generates from it — the only proof that an export worked.

Release names follow the stage: `LEKOY-RV5-Base`, `-Pretrain-v1`, `-SFT-v1`,
`-Reasoning-v1`, `-Code-v1`, `-Aligned-v1`, `-RC1`, `-Final`.

## 20. Resume training

```bash
python scripts/train_sft.py --resume-from-checkpoint auto
python scripts/train_sft.py --resume-from-checkpoint checkpoints/rv5/sft/checkpoint-400
```

`auto` picks the newest checkpoint in the output directory — the form you want
after an interruption, when you do not remember the step number. An interrupt
(Ctrl-C) saves to `<output_dir>/interrupted` before exiting.

Every run is an experiment under `experiments/rv5-exp-NNN/` holding its config,
git commit, datasets, full metric history and resulting checkpoint. The metric
*history* is kept, not just the last value: a loss curve is what you need when a
run goes wrong, and the final number says nothing about how it got there.

## 21. Future LEKOY models

Everything but the weights is reusable. To start RV6:

```bash
cp configs/rv5_small.yaml configs/rv6_small.yaml
# edit the base model and the mixture
python scripts/analyze_tokenizer.py --models <new base>     # re-check the tokenizer
python scripts/prepare_data.py --config rv6_small.yaml --task all
python scripts/train_sft.py --config rv6_small.yaml
python scripts/evaluate.py --model checkpoints/rv6/sft --tag rv6-sft
python scripts/compare_models.py --baseline baseline --candidate rv6-sft
```

The evaluation suites, LEKOY SCORE and regression gate are unchanged, so RV6's
numbers are directly comparable to RV5's — which is the whole point of writing
them down this way.

Three things RV6 should revisit first, with the evidence already gathered:

1. **Vocabulary extension.** `dictalm2.0` takes the Mistral tokenizer from 1.021
   to 2.154 Hebrew chars/token with 384 added entries. Extension works. RV5 did
   not do it because recovering from a resized embedding matrix needs continued
   pretraining at a scale this project does not have.
2. **Niqqud.** Qwen is the worst finalist on vocalised Hebrew — `שָׁלוֹם` costs 9
   tokens against 1 unvocalised. Accepted because RV5 needs to *read* it
   correctly, which it does losslessly, rather than generate it cheaply.
3. **A larger Hebrew-adapted base.** `dictalm2.0-instruct` at 7.25B, Apache-2.0,
   is the right base for a Hebrew-focused project with GPUs.

---

## Repository layout

```
lekoy/
  configs/         rv5_small / medium / large, with inheritance
  data/            corpus, datasets_registry.json and teachers_registry.json —
                   the two audit trails
  docs/            base model selection, training plan, teacher distillation
  eval/            evaluation suites
  checkpoints/     one directory per training stage
  experiments/     rv5-exp-NNN — config, commit, metrics, result
  reports/         system, tokenizer, evaluation, leaderboard, comparisons
  scripts/         every command in this README
  src/lekoy/
    data/          sources, catalogue, clean, langid, quality, pii, dedup, seed
    distill/       licences, teachers, registry, prompts, generate, verify,
                   mixture, plan — the hundred-teacher faculty
    training/      common, dataset, trainer, experiment
    evaluation/    metrics, tasks, runner, score, hebrew_benchmark
    inference/     engine
    api/           OpenAI-compatible server
    web/           the chat UI
  tests/
  MODEL_CARD.md
```

## Tests

```bash
pytest                      # everything
pytest -m "not model"       # skip anything needing weights
```

Covering configuration, identity, cleaning, language identification, quality
scoring, PII, deduplication, leakage, integrity, splitting, metrics, the Hebrew
benchmark, the LEKOY SCORE, the regression gate, code execution, memory
estimation, OOM advice, checkpoint safety, experiment tracking, response
masking, the API contract, and — for the teacher faculty — the licence gate,
faculty selection, all four verifiers, mixture provenance, leakage refusal and
the run planner.

## Licence

Code in this repository: Apache-2.0. The model weights inherit the licence of
the base model — Apache-2.0 for Qwen2.5 at 0.5B, 1.5B and 7B. Training data
licences are recorded per source in `data/datasets_registry.json` and summarised
in [`MODEL_CARD.md`](MODEL_CARD.md).
