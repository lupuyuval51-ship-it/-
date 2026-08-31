# LEKOY RV5 — Evaluation: `rv5-v1`

Model: `checkpoints/rv5/identity` · 993 items across 17 suites · 26.6 minutes

Greedy decoding, so these numbers reproduce exactly on a re-run. Every response is kept in the JSON beside this file.

## LEKOY SCORE

| Dimension | Weight | Score | Contribution |
| --- | ---: | ---: | ---: |
| hebrew | 25% | 0.337 | 0.0842 |
| english | 12% | 0.537 | 0.0645 |
| spanish | 8% | 0.527 | 0.0422 |
| reasoning | 15% | 0.167 | 0.0250 |
| coding | 15% | 0.375 | 0.0562 |
| instruction_following | 10% | 0.625 | 0.0625 |
| math | 5% | 0.317 | 0.0158 |
| knowledge | 5% | 0.153 | 0.0077 |
| reliability | 5% | 0.529 | 0.0264 |
| **LEKOY SCORE** | **100%** | **0.3846** | **38.46 / 100** |

## Suites

| Suite | Items | Score | Perfect | Zero | Time |
| --- | ---: | ---: | ---: | ---: | ---: |
| `identity` | 21 | **0.857** | 18 | 3 | 54s |
| `english` | 8 | **0.625** | 5 | 3 | 13s |
| `instruction_following` | 8 | **0.625** | 5 | 3 | 13s |
| `spanish` | 7 | **0.571** | 4 | 3 | 34s |
| `hebrew` | 43 | **0.507** | 21 | 21 | 132s |
| `translation` | 8 | **0.500** | 4 | 4 | 12s |
| `belebele_spanish` | 120 | **0.483** | 58 | 62 | 88s |
| `belebele_english` | 120 | **0.450** | 54 | 66 | 95s |
| `gsm8k` | 60 | **0.383** | 23 | 37 | 415s |
| `coding` | 8 | **0.375** | 3 | 5 | 55s |
| `math` | 4 | **0.250** | 1 | 3 | 19s |
| `global_mmlu_spanish` | 150 | **0.240** | 36 | 114 | 98s |
| `hallucination` | 10 | **0.200** | 1 | 7 | 66s |
| `reasoning` | 6 | **0.167** | 1 | 5 | 7s |
| `belebele_hebrew` | 120 | **0.167** | 20 | 100 | 164s |
| `global_mmlu_english` | 150 | **0.167** | 25 | 125 | 124s |
| `global_mmlu_hebrew` | 150 | **0.053** | 8 | 142 | 205s |

## Hebrew benchmark, by category

| Category | Score |
| --- | ---: |
| conversation | 1.000 |
| register | 1.000 |
| slang | 1.000 |
| technology | 1.000 |
| history | 0.667 |
| science | 0.667 |
| writing | 0.667 |
| mixed | 0.600 |
| grammar | 0.500 |
| translation | 0.500 |
| logic | 0.333 |
| instruction following | 0.250 |
| math | 0.250 |
| formal | 0.000 |
| reading comprehension | 0.000 |
| summarisation | 0.000 |

Hebrew agreement errors detected across the suite: **0**. Reported rather than scored — the detector is high-precision and low-recall, so it is a tripwire, not a grade.

## Identity

18/21 answers state the LEKOY identity correctly.

## Honesty about uncertainty

1/10 unanswerable questions drew an appropriate hedge; 7 drew a confident fabricated claim.

## Coding

3/8 generated programs passed their assertions when executed.

| Item | Result |
| --- | --- |
| `code_01` | pass |
| `code_02` | pass |
| `code_03` | fail — IndentationError: expected an indented block after 'for' statement on line 5 |
| `code_04` | pass |
| `code_05` | fail — AssertionError |
| `code_06` | fail — IndentationError: expected an indented block after 'if' statement on line 3 |
| `code_07` | fail — IndentationError: expected an indented block after 'if' statement on line 2 |
| `code_08` | fail — IndentationError: expected an indented block after 'for' statement on line 9 |

## Weakest results

| Item | Suite | Score | Why |
| --- | --- | ---: | --- |
| `belebele_english_001` | belebele_english | 0.0 | picked B, correct is A |
| `belebele_english_003` | belebele_english | 0.0 | picked nothing, correct is B |
| `belebele_english_004` | belebele_english | 0.0 | picked B, correct is C |
| `belebele_english_005` | belebele_english | 0.0 | picked A, correct is D |
| `belebele_english_006` | belebele_english | 0.0 | picked D, correct is C |
| `belebele_english_009` | belebele_english | 0.0 | picked nothing, correct is D |
| `belebele_english_012` | belebele_english | 0.0 | picked nothing, correct is C |
| `belebele_english_014` | belebele_english | 0.0 | picked nothing, correct is B |
| `belebele_english_017` | belebele_english | 0.0 | picked nothing, correct is C |
| `belebele_english_018` | belebele_english | 0.0 | picked nothing, correct is A |
| `belebele_english_021` | belebele_english | 0.0 | picked D, correct is B |
| `belebele_english_022` | belebele_english | 0.0 | picked C, correct is B |
