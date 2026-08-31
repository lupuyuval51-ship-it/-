# LEKOY RV5 — Evaluation: `rv5-v2`

Model: `checkpoints/rv5/identity` · 993 items across 17 suites · 23.3 minutes

Greedy decoding, so these numbers reproduce exactly on a re-run. Every response is kept in the JSON beside this file.

## LEKOY SCORE

| Dimension | Weight | Score | Contribution |
| --- | ---: | ---: | ---: |
| hebrew | 25% | 0.395 | 0.0989 |
| english | 12% | 0.550 | 0.0660 |
| spanish | 8% | 0.486 | 0.0389 |
| reasoning | 15% | 0.333 | 0.0500 |
| coding | 15% | 0.500 | 0.0750 |
| instruction_following | 10% | 0.500 | 0.0500 |
| math | 5% | 0.258 | 0.0129 |
| knowledge | 5% | 0.289 | 0.0144 |
| reliability | 5% | 0.601 | 0.0301 |
| **LEKOY SCORE** | **100%** | **0.4361** | **43.61 / 100** |

## Suites

| Suite | Items | Score | Perfect | Zero | Time |
| --- | ---: | ---: | ---: | ---: | ---: |
| `identity` | 21 | **0.952** | 20 | 1 | 42s |
| `english` | 8 | **0.625** | 5 | 3 | 14s |
| `spanish` | 7 | **0.571** | 4 | 3 | 18s |
| `hebrew` | 43 | **0.533** | 20 | 19 | 167s |
| `coding` | 8 | **0.500** | 4 | 4 | 31s |
| `translation` | 8 | **0.500** | 4 | 4 | 12s |
| `instruction_following` | 8 | **0.500** | 4 | 4 | 12s |
| `belebele_english` | 120 | **0.475** | 57 | 63 | 84s |
| `belebele_spanish` | 120 | **0.400** | 48 | 72 | 86s |
| `global_mmlu_spanish` | 150 | **0.340** | 51 | 99 | 96s |
| `reasoning` | 6 | **0.333** | 2 | 4 | 5s |
| `global_mmlu_english` | 150 | **0.307** | 46 | 104 | 109s |
| `gsm8k` | 60 | **0.267** | 16 | 44 | 403s |
| `belebele_hebrew` | 120 | **0.258** | 31 | 89 | 92s |
| `math` | 4 | **0.250** | 1 | 3 | 48s |
| `hallucination` | 10 | **0.250** | 1 | 6 | 54s |
| `global_mmlu_hebrew` | 150 | **0.220** | 33 | 117 | 126s |

## Hebrew benchmark, by category

| Category | Score |
| --- | ---: |
| register | 1.000 |
| slang | 1.000 |
| technology | 0.900 |
| history | 0.667 |
| science | 0.667 |
| writing | 0.667 |
| conversation | 0.650 |
| mixed | 0.600 |
| grammar | 0.500 |
| instruction following | 0.500 |
| translation | 0.500 |
| logic | 0.333 |
| reading comprehension | 0.333 |
| math | 0.250 |
| formal | 0.000 |
| summarisation | 0.000 |

Hebrew agreement errors detected across the suite: **0**. Reported rather than scored — the detector is high-precision and low-recall, so it is a tripwire, not a grade.

## Identity

20/21 answers state the LEKOY identity correctly.

## Honesty about uncertainty

1/10 unanswerable questions drew an appropriate hedge; 6 drew a confident fabricated claim.

## Coding

4/8 generated programs passed their assertions when executed.

| Item | Result |
| --- | --- |
| `code_01` | pass |
| `code_02` | pass |
| `code_03` | pass |
| `code_04` | pass |
| `code_05` | fail — AssertionError |
| `code_06` | fail — IndentationError: expected an indented block after 'for' statement on line 8 |
| `code_07` | fail — IndentationError: expected an indented block after 'if' statement on line 2 |
| `code_08` | fail — IndentationError: expected an indented block after 'for' statement on line 9 |

## Weakest results

| Item | Suite | Score | Why |
| --- | --- | ---: | --- |
| `belebele_english_001` | belebele_english | 0.0 | picked C, correct is A |
| `belebele_english_003` | belebele_english | 0.0 | picked C, correct is B |
| `belebele_english_005` | belebele_english | 0.0 | picked A, correct is D |
| `belebele_english_007` | belebele_english | 0.0 | picked C, correct is A |
| `belebele_english_009` | belebele_english | 0.0 | picked C, correct is D |
| `belebele_english_010` | belebele_english | 0.0 | picked C, correct is B |
| `belebele_english_015` | belebele_english | 0.0 | picked D, correct is C |
| `belebele_english_021` | belebele_english | 0.0 | picked D, correct is B |
| `belebele_english_022` | belebele_english | 0.0 | picked C, correct is B |
| `belebele_english_025` | belebele_english | 0.0 | picked C, correct is D |
| `belebele_english_026` | belebele_english | 0.0 | picked D, correct is C |
| `belebele_english_027` | belebele_english | 0.0 | picked C, correct is B |
