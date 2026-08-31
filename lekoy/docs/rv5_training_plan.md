# LEKOY RV5 — Training Plan

Fifteen phases, from a bare machine to a released model. Each says what it
does, what it produces, what proves it worked, and what stops it.

Every phase is a script in this repository. Where a phase cannot be executed on
this project's hardware, that is said in the phase itself along with what would
be needed — the pipeline is complete either way, and the constraint is on scale,
not on the design.

---

## Phase 0 — Hardware analysis

```bash
python scripts/check_system.py
python scripts/estimate_training.py --config rv5_small.yaml --tokens 5M
```

**Produces** `reports/system_report.md`, `reports/system_report.json`.

**Found on this machine:** 4 Xeon cores, 15 GB RAM, no swap, no GPU, ~28 GB of
free disk, Python 3.11, torch 2.13 CPU. The CPU carries AMX-BF16 and
AVX512-BF16, and a measured **3,278 GFLOP/s** on a bf16 matmul — which is the
single fact that makes CPU training of a small model tolerable here rather than
hopeless.

**What that permits:** LoRA on a 0.5B model in bfloat16. Not QLoRA at any size
(bitsandbytes is CUDA-only), and not full fine-tuning of anything larger than
0.5B. `rv5_small` is the default configuration for this reason.

**Stop condition:** if `estimate_training.py` says a run needs more memory than
the host has, the training scripts refuse to start it. `--no-memory-check`
overrides that; the machine has no swap, so an OOM is a kill rather than a
slowdown.

---

## Phase 1 — Base model research

```bash
python scripts/analyze_tokenizer.py --docs 400 --rebuild-corpus
```

**Produces** `reports/tokenizer_report.md`, `docs/base_model_selection.md`.

Fourteen candidate tokenizers measured on 774,490 characters of real Hebrew,
879,227 of English and 834,999 of Spanish, drawn from the actual corpus.

**The decisive finding:** Hebrew tokenizer efficiency spans **2.6×** across the
candidates, and that gap dwarfs every other difference. Qwen encodes Hebrew at
2.491 characters per token; Llama 3.1 manages 1.059. The same Hebrew text costs
Llama 2.35× the tokens — permanently, in context, in training compute and in
generation cost — and no amount of fine-tuning changes it.

**Selected:** `Qwen/Qwen2.5-Instruct`, Apache-2.0, at 0.5B / 1.5B / 7B. The 3B
is skipped because it is released under the Qwen Research Licence, which
prohibits commercial use.

---

## Phase 2 — Baseline evaluation

```bash
python scripts/evaluate.py --model Qwen/Qwen2.5-0.5B-Instruct --tag baseline
```

**Produces** `reports/eval/baseline.md`, `reports/eval/baseline.json`,
`reports/leaderboard.md`.

Runs before anything is trained, because every later claim is a comparison
against this. 993 items across 17 suites.

**One measurement-validity fix belongs here**, because getting it wrong would
have invalidated the whole identity story. The identity suite runs with **no
system prompt**. The LEKOY system prompt opens with "You are LEKOY RV5", so
with it in context an untrained Qwen base answers "אני LEKOY RV5" and scores a
perfect 1.000 — by reading its own name out of the prompt it was just handed.
Without the prompt the same checkpoint says "Qwen" and scores 0.000. Identity
training puts the name in the weights; measuring it with the answer in the
context measures nothing.

---

## Phase 3 — Dataset preparation

```bash
python scripts/download_data.py
python scripts/clean_data.py
python scripts/filter_data.py
python scripts/deduplicate.py
python scripts/deduplicate.py --check-leakage
python scripts/prepare_data.py --task all
python scripts/tokenize_data.py --task all --report
```

**Produces** `data/datasets_registry.json`, the corpus under `data/`, and
`reports/data_preparation.json`.

Sources are permissively licensed and checked at ingest: CC0 (HPLT), ODC-By
(FineWeb-2), Apache-2.0 (xP3x, OASST2, Aya, Global-MMLU, CodeFeedback),
CC BY-SA (Wikipedia, Belebele), MIT (GSM8K, UltraChat), CC BY (CodeAlpaca). A
source whose licence is not on the permitted list is refused at download and
the refusal is recorded, so "we considered this and did not use it, for this
reason" has an answer.

**Three findings from this phase shaped everything after it.**

*Hebrew instruction data barely exists.* Aya has **0** Hebrew rows out of
202,362. OASST2 has **24** Hebrew messages out of 128,575, which reconstruct
into **2** usable conversations — against 26,811 Spanish messages and 4,047
Spanish conversations. xP3x heb_Hebr is the only source of any size, and it is
cross-lingual and heavily templated. Hebrew *text* is plentiful; Hebrew
*instruction-response* data is not. This is why Phase 4 carries unusual weight
and why `src/lekoy/data/seed.py` exists.

*Source language labels are wrong.* HPLT's `heb_Hebr` shard contains Punjabi.
Found while checking tokenizer round-trips, not by looking for it. Every
document is therefore language-checked by script analysis rather than trusted,
and `mixed` is a verdict rather than a rejection — Hebrew-with-English is a
register RV5 must handle.

*A flat quality floor discards benchmarks.* A 200-character minimum is right
for web prose and wrong for a Global-MMLU question, which is 80 characters and
not low quality — it was throwing away 961 of 1,000 Hebrew items. The floor is
per-category, and evaluation sets pass through the filter unjudged.

**Stop condition:** `--check-leakage` must find no overlap between the training
mixture and the evaluation sets. A Belebele passage in the training data turns
the Hebrew reading-comprehension score into a memorisation test.

---

## Phase 4 — Hebrew continued pretraining

```bash
python scripts/train_pretrain.py --config rv5_small.yaml
```

**Produces** `checkpoints/rv5/continued_pretraining`.

Causal language modelling over the Hebrew-weighted mixture, packed so no
compute goes to padding. This is where Hebrew actually moves: the scarcity of
Hebrew instruction data means fluency has to come from raw text, and the
instruction stages then teach the model to *use* it rather than to acquire it.

Two settings differ from every other stage, both deliberate. The learning rate
is capped at 5e-5 — continued pretraining at the SFT rate is how a model
forgets everything else it knew. And the LoRA adapters are joined by
`embed_tokens` and `lm_head` in `modules_to_save`, because moving a token
distribution is not something adapters on the projections can express: a Hebrew
token whose embedding is poor stays poor.

---

## Phase 5 — Multilingual continued pretraining

Same script, English and Spanish replay data mixed in at the configured ratio.
The mixture is enforced by **subsampling the over-represented languages**, never
by upsampling the scarce one: repeating 2 Hebrew conversations to reach a 55%
Hebrew share would teach the model those 2 conversations, not Hebrew.

The mixture is 55/28/17 rather than the brief's opening 40/40/20. The brief
permits this explicitly when the base is already strong in English and weak in
Hebrew, and the Phase 2 baseline shows exactly that.

---

## Phase 6 — Instruction tuning

```bash
python scripts/prepare_data.py --task sft
python scripts/train_sft.py --config rv5_small.yaml
```

**Produces** `checkpoints/rv5/sft` — `LEKOY-RV5-SFT-v1`.

Loss is computed on the assistant turns only. Training on prompt tokens teaches
the model to generate user turns, and it then does: it is the usual cause of a
fine-tune that answers a question and immediately invents the next one.

**Every conversation gets an explicit LEKOY system turn**, and this is not
cosmetic. Qwen's chat template injects its own default system prompt — *"You
are Qwen, created by Alibaba Cloud"* — into any conversation that lacks one.
OASST and xP3x conversations have none. Left alone, every one of those training
examples would have taught RV5 that it is Qwen, while the identity seed data
tried to teach the opposite.

The seed data is added back **after** the language mixture is applied. It is 128
records against thousands and would otherwise be subsampled to nearly nothing —
and it is the only source for identity, register control and honest
uncertainty, behaviours with no fallback if they are cut.

---

## Phase 7 — Reasoning training

```bash
python scripts/prepare_data.py --task reasoning
python scripts/train_reasoning.py --set model.name=checkpoints/rv5/sft
```

GSM8K with its `<<48/2=24>>` calculator annotations stripped: RV5 should learn
the arithmetic, not the markup. Following the brief, the data teaches the model
to reach a correct and clearly stated answer rather than to perform a long
visible scratchpad — which is also why Qwen3 was passed over as a base, its
template emitting `<think>` blocks by construction.

---

## Phase 8 — Coding training

```bash
python scripts/prepare_data.py --task coding
python scripts/train_coding.py --set model.name=checkpoints/rv5/reasoning
```

CodeFeedback and CodeAlpaca, covering Python, JavaScript, TypeScript, Java, C,
C++, C#, Go, Rust and SQL. All English, because no Hebrew or Spanish
code-instruction corpus of any size exists — less limiting than it sounds, since
code is language-neutral and the seed data covers the case the brief actually
asks for: a Hebrew question answered with code plus a Hebrew explanation.

Scored by **executing** the generated programs against assertions in a
subprocess with a timeout. "Looks right" is not a measurement.

---

## Phase 9 — Preference optimisation

```bash
python scripts/prepare_data.py --task preference
python scripts/train_preference.py --set model.name=checkpoints/rv5/coding
```

18,452 preference pairs reconstructed from OASST2's ranked sibling replies —
human judgement, not a model grading itself. Requires `trl`, which needs a GPU
host in practice.

---

## Phase 10 — Regression testing

```bash
python scripts/evaluate.py --model checkpoints/rv5/sft --tag sft-v1
python scripts/compare_models.py --baseline baseline --candidate sft-v1 --gate
```

**The gate that decides promotion.** Regression is measured relative, not
absolute: 0.80 → 0.72 and 0.20 → 0.12 are the same 0.08 drop, and the second is
a 40% loss. Hebrew's threshold is tightest at 5% because Hebrew is the point;
reliability's is 3% and carries an absolute floor of 0.30, because a model that
starts hallucinating is worse than useless whatever else improved.

The brief's named failure case — Hebrew +15%, English −30% — is blocked, and
there is a test asserting it stays blocked.

---

## Phase 11 — Final evaluation

Full suite, every dimension, no `--limit`. A LEKOY SCORE computed over a subset
records its own coverage and is not comparable to a full run; the score object
carries that number so a partial result cannot be quietly compared to a
complete one.

---

## Phase 12 — Quantization

```bash
python scripts/export.py --checkpoint checkpoints/rv5/sft --out release/LEKOY-RV5-SFT-v1 --verify
python scripts/quantize.py --model release/LEKOY-RV5-SFT-v1 --format bf16 fp16 --verify
python scripts/quantize.py --model release/LEKOY-RV5-SFT-v1 --format gguf --gguf-type q4_k_m
```

Export merges the LoRA adapters and reloads the result to prove it loads. Every
quantized build is reloaded and asked a question, because quantization is
exactly where a model breaks silently.

`scripts/quantize.py --list` reports which formats this host can actually
produce and why the others cannot, rather than failing halfway through.

---

## Phase 13 — Release candidate

Promoted only when the Phase 10 gate passes. Named `LEKOY-RV5-RC1`.

---

## Phase 14 — LEKOY RV5 Final

Not declared until all of: Hebrew, English and Spanish evaluation; reasoning,
coding, translation and instruction benchmarks; the regression check; an
inference test; an API test; and a reload-from-disk test. `scripts/export.py
--verify` covers the last three.

---

## Version names

| Stage | Name |
| --- | --- |
| Base model, unmodified | `LEKOY-RV5-Base` |
| After Phase 4–5 | `LEKOY-RV5-Pretrain-v1` |
| After Phase 6 | `LEKOY-RV5-SFT-v1` |
| After Phase 7 | `LEKOY-RV5-Reasoning-v1` |
| After Phase 8 | `LEKOY-RV5-Code-v1` |
| After Phase 9 | `LEKOY-RV5-Aligned-v1` |
| Passed Phase 10 | `LEKOY-RV5-RC1` |
| Passed Phase 14 | `LEKOY-RV5-Final` |

---

## What RV6 inherits

Everything except the weights. The data pipeline, registry, evaluation suites,
LEKOY SCORE, regression gate, experiment tracking, API, web chat, export and
quantization tooling are all keyed on a config rather than on RV5's base model.
A new generation is `configs/rv6_small.yaml` and a re-run, not a fork.

Three things RV6 should revisit first, all recorded with their evidence:

1. **Vocabulary extension.** `dicta-il/dictalm2.0-instruct` takes the Mistral
   tokenizer from 1.021 to 2.154 Hebrew characters per token with only 384
   added entries. Extension works. It was not done for RV5 because recovering
   from a resized embedding matrix needs continued pretraining at a scale this
   project does not have — and doing it badly is worse than not doing it.
   `scripts/extend_tokenizer.py` implements the procedure for when it does.
2. **Niqqud.** Qwen is the worst finalist on vocalised Hebrew: `שָׁלוֹם` costs 9
   tokens against 1 unvocalised. Accepted for RV5 because RV5 needs to *read*
   niqqud correctly, which it does losslessly, rather than generate it cheaply.
3. **A larger base.** `dictalm2.0` at 7.25B is the right base for a
   Hebrew-focused project with GPUs, and is out of reach here purely on
   hardware.
