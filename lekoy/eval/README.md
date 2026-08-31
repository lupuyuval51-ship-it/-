# LEKOY RV5 — Evaluation Suites

993 items across 17 suites. Written by
`scripts/build_eval.py` from the definitions in
`src/lekoy/evaluation/tasks.py`, which is where the scoring logic lives
and therefore where the items have to live too. These files are a view
for reading and checking; `scripts/evaluate.py` reads the Python.

## Suites

| Suite | Items | Directory | Feeds |
| --- | ---: | --- | --- |
| `global_mmlu_hebrew` | 150 | `hebrew/` | knowledge (5%) |
| `global_mmlu_english` | 150 | `english/` | knowledge (5%) |
| `global_mmlu_spanish` | 150 | `spanish/` | knowledge (5%) |
| `belebele_hebrew` | 120 | `hebrew/` | hebrew (25%) |
| `belebele_english` | 120 | `english/` | english (12%) |
| `belebele_spanish` | 120 | `spanish/` | spanish (8%) |
| `gsm8k` | 60 | `math/` | math (5%) |
| `hebrew` | 43 | `hebrew/` | hebrew (25%) |
| `identity` | 21 | `hallucination/` | reliability (5%) |
| `hallucination` | 10 | `hallucination/` | reliability (5%) |
| `english` | 8 | `english/` | english (12%) |
| `coding` | 8 | `coding/` | coding (15%) |
| `translation` | 8 | `translation/` | — |
| `instruction_following` | 8 | `instruction_following/` | instruction_following (10%) |
| `spanish` | 7 | `spanish/` | spanish (8%) |
| `reasoning` | 6 | `reasoning/` | reasoning (15%) |
| `math` | 4 | `math/` | math (5%) |

## Scorers

Every item is scored deterministically. No suite uses a model to
judge another model's output: an LLM-judge score cannot be
reproduced by someone else, and a benchmark whose numbers cannot
be reproduced is not evidence.

| Scorer | Items | How |
| --- | ---: | --- |
| `choice` | 828 | multiple choice; the letter is extracted from free-form text |
| `numeric` | 70 | the final number in the response must match |
| `format` | 35 | an explicit formatting constraint, checked field by field |
| `identity` | 21 | the response must state the LEKOY identity and must not claim a foreign one |
| `contains` | 16 | the reference string must appear in the response |
| `uncertainty` | 10 | an unanswerable question; hedging passes, a confident specific claim fails |
| `code` | 8 | the generated program is executed against assertions |
| `language` | 5 | the response must be in the language it was asked in |

## Held out of training

`scripts/deduplicate.py --check-leakage` asserts that no training
document overlaps these items, and it runs before every training
stage rather than after. A benchmark passage that is also in the
training mixture turns the benchmark into a memorisation test.

