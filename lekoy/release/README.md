# LEKOY RV5 — Release

Two ways to take the model, and the single file is the first one.

## One file — GGUF

`gguf/LEKOY-RV5-q8_0.gguf` is the whole model in one file. No Python, no
`transformers`, no virtual environment: llama.cpp, Ollama, LM Studio and
anything else that reads GGUF will load it directly.

| File | Size | Quality | Measured on 4 CPU cores |
| --- | ---: | --- | --- |
| `gguf/LEKOY-RV5-q8_0.gguf` | 507 MB | near-lossless — **use this one** | 70 tok/s |
| `gguf/LEKOY-RV5-q4_k_m.gguf` | 380 MB | smaller, visibly weaker at 0.5B | 51 tok/s |

q8_0 is the recommended build. At 0.5 billion parameters there is not much
redundancy to quantize away, and 4-bit shows: asked who it is, q8_0 answers
`אני LEKOY RV5, מודל שפה ממשפחת המודלים LEKOY.` and stops, while q4_k_m gives
the same sentence and then rambles.

```bash
llama-cli -m gguf/LEKOY-RV5-q8_0.gguf -cnv \
  -p "אתה LEKOY RV5, מודל שפה ממשפחת המודלים LEKOY."

ollama create lekoy-rv5 -f Modelfile   # FROM ./gguf/LEKOY-RV5-q8_0.gguf
ollama run lekoy-rv5
```

## Open folder — Hugging Face format

`LEKOY-RV5-SFT-v2/` is the same model as a plain directory of files. Not an
archive, nothing to unpack.

```python
from transformers import AutoModelForCausalLM, AutoTokenizer

tokenizer = AutoTokenizer.from_pretrained("release/LEKOY-RV5-SFT-v2")
model = AutoModelForCausalLM.from_pretrained("release/LEKOY-RV5-SFT-v2")
```

```bash
python ../scripts/chat.py  --model release/LEKOY-RV5-SFT-v2
python ../scripts/serve.py --model release/LEKOY-RV5-SFT-v2   # API + web chat
```

The LoRA adapters are merged in. The weights are self-contained and nothing is
fetched at inference time.

## What this checkpoint is

`LEKOY-RV5-SFT-v2` — 494M parameters, built on `Qwen/Qwen2.5-0.5B-Instruct`
(Apache-2.0), instruction-tuned on a Hebrew-weighted mixture, then corrected for
identity and constrained-answer formats.

**It is not a release candidate.** The regression gate blocks it on two
dimensions, and that verdict is reported rather than worked around:

```
BLOCKING:
  spanish: fell 14.1% (0.566 -> 0.486); the limit is 10%
  coding:  fell 20.0% (0.625 -> 0.500); the limit is 10%
```

Both are one item on a 7- and an 8-item suite. The thresholds were not loosened
to let it through — see [`../MODEL_CARD.md`](../MODEL_CARD.md) for why, and
[`../reports/rv5_training_report.md`](../reports/rv5_training_report.md) for the
whole five-attempt sequence.

What it does better than the base model it came from:

| | Base | LEKOY-RV5-SFT-v2 |
| --- | ---: | ---: |
| LEKOY SCORE | 42.38 | **43.61** |
| Knows it is LEKOY RV5, with no system prompt | 0/21 | **20/21** |
| Hebrew benchmark | 0.465 | **0.533** |
| Hebrew maths | 0.000 | **0.250** |
| Global-MMLU Spanish | 0.180 | **0.340** |
| Global-MMLU English | 0.253 | **0.307** |

## Licence

Apache-2.0, inherited from the base model. Training-data provenance and licences
are in [`../data/datasets_registry.json`](../data/datasets_registry.json).
