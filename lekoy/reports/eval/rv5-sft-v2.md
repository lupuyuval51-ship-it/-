# LEKOY RV5 — Evaluation: `rv5-sft-v2`

Model: `checkpoints/rv5/identity` · 993 items across 17 suites · 29.7 minutes

Greedy decoding, so these numbers reproduce exactly on a re-run. Every response is kept in the JSON beside this file.

## LEKOY SCORE

| Dimension | Weight | Score | Contribution |
| --- | ---: | ---: | ---: |
| hebrew | 25% | 0.316 | 0.0791 |
| english | 12% | 0.550 | 0.0660 |
| spanish | 8% | 0.574 | 0.0459 |
| reasoning | 15% | 0.167 | 0.0250 |
| coding | 15% | 0.500 | 0.0750 |
| instruction_following | 10% | 0.625 | 0.0625 |
| math | 5% | 0.100 | 0.0050 |
| knowledge | 5% | 0.216 | 0.0108 |
| reliability | 5% | 0.650 | 0.0325 |
| **LEKOY SCORE** | **100%** | **0.4018** | **40.18 / 100** |

## Suites

| Suite | Items | Score | Perfect | Zero | Time |
| --- | ---: | ---: | ---: | ---: | ---: |
| `identity` | 21 | **1.000** | 21 | 0 | 42s |
| `spanish` | 7 | **0.714** | 5 | 2 | 30s |
| `english` | 8 | **0.625** | 5 | 3 | 12s |
| `instruction_following` | 8 | **0.625** | 5 | 3 | 15s |
| `coding` | 8 | **0.500** | 4 | 4 | 72s |
| `belebele_english` | 120 | **0.475** | 57 | 63 | 88s |
| `belebele_spanish` | 120 | **0.433** | 52 | 68 | 88s |
| `hebrew` | 43 | **0.433** | 17 | 24 | 156s |
| `translation` | 8 | **0.375** | 3 | 5 | 11s |
| `hallucination` | 10 | **0.300** | 1 | 5 | 47s |
| `global_mmlu_english` | 150 | **0.267** | 40 | 110 | 97s |
| `belebele_hebrew` | 120 | **0.200** | 24 | 96 | 172s |
| `global_mmlu_spanish` | 150 | **0.200** | 30 | 120 | 95s |
| `gsm8k` | 60 | **0.200** | 12 | 48 | 641s |
| `global_mmlu_hebrew` | 150 | **0.180** | 27 | 123 | 194s |
| `reasoning` | 6 | **0.167** | 1 | 5 | 10s |
| `math` | 4 | **0.000** | 0 | 4 | 12s |

## Hebrew benchmark, by category

| Category | Score |
| --- | ---: |
| conversation | 1.000 |
| register | 1.000 |
| slang | 1.000 |
| mixed | 0.933 |
| technology | 0.900 |
| science | 0.667 |
| translation | 0.500 |
| grammar | 0.333 |
| history | 0.333 |
| logic | 0.333 |
| writing | 0.333 |
| instruction following | 0.250 |
| formal | 0.000 |
| math | 0.000 |
| reading comprehension | 0.000 |
| summarisation | 0.000 |

Hebrew agreement errors detected across the suite: **0**. Reported rather than scored — the detector is high-precision and low-recall, so it is a tripwire, not a grade.

## Identity

21/21 answers state the LEKOY identity correctly.

## Honesty about uncertainty

1/10 unanswerable questions drew an appropriate hedge; 5 drew a confident fabricated claim.

## Coding

4/8 generated programs passed their assertions when executed.

| Item | Result |
| --- | --- |
| `code_01` | pass |
| `code_02` | pass |
| `code_03` | pass |
| `code_04` | pass |
| `code_05` | fail — AssertionError |
| `code_06` | fail — AssertionError: Should include y in output |
| `code_07` | fail — AssertionError |
| `code_08` | fail — AssertionError |

## Weakest results

| Item | Suite | Score | Why |
| --- | --- | ---: | --- |
| `belebele_english_001` | belebele_english | 0.0 | picked B, correct is A |
| `belebele_english_003` | belebele_english | 0.0 | picked A, correct is B |
| `belebele_english_004` | belebele_english | 0.0 | picked B, correct is C |
| `belebele_english_005` | belebele_english | 0.0 | picked A, correct is D |
| `belebele_english_006` | belebele_english | 0.0 | picked D, correct is C |
| `belebele_english_009` | belebele_english | 0.0 | picked A, correct is D |
| `belebele_english_010` | belebele_english | 0.0 | picked C, correct is B |
| `belebele_english_013` | belebele_english | 0.0 | picked A, correct is D |
| `belebele_english_017` | belebele_english | 0.0 | picked nothing, correct is C |
| `belebele_english_022` | belebele_english | 0.0 | picked C, correct is B |
| `belebele_english_026` | belebele_english | 0.0 | picked D, correct is C |
| `belebele_english_027` | belebele_english | 0.0 | picked C, correct is B |
