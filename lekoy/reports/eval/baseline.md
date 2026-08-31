# LEKOY RV5 — Evaluation: `baseline`

Model: `Qwen/Qwen2.5-0.5B-Instruct` · 993 items across 17 suites · 47.0 minutes

Greedy decoding, so these numbers reproduce exactly on a re-run. Every response is kept in the JSON beside this file.

## LEKOY SCORE

| Dimension | Weight | Score | Contribution |
| --- | ---: | ---: | ---: |
| hebrew | 25% | 0.362 | 0.0904 |
| english | 12% | 0.542 | 0.0650 |
| spanish | 8% | 0.566 | 0.0452 |
| reasoning | 15% | 0.333 | 0.0500 |
| coding | 15% | 0.625 | 0.0938 |
| instruction_following | 10% | 0.500 | 0.0500 |
| math | 5% | 0.108 | 0.0054 |
| knowledge | 5% | 0.229 | 0.0114 |
| reliability | 5% | 0.250 | 0.0125 |
| **LEKOY SCORE** | **100%** | **0.4238** | **42.38 / 100** |

## Suites

| Suite | Items | Score | Perfect | Zero | Time |
| --- | ---: | ---: | ---: | ---: | ---: |
| `spanish` | 7 | **0.714** | 5 | 2 | 35s |
| `english` | 8 | **0.625** | 5 | 3 | 10s |
| `coding` | 8 | **0.625** | 5 | 3 | 128s |
| `translation` | 8 | **0.500** | 4 | 4 | 11s |
| `instruction_following` | 8 | **0.500** | 4 | 4 | 10s |
| `hallucination` | 10 | **0.500** | 1 | 1 | 35s |
| `hebrew` | 43 | **0.465** | 20 | 23 | 337s |
| `belebele_english` | 120 | **0.458** | 55 | 65 | 58s |
| `belebele_spanish` | 120 | **0.417** | 50 | 70 | 56s |
| `reasoning` | 6 | **0.333** | 2 | 4 | 5s |
| `belebele_hebrew` | 120 | **0.258** | 31 | 89 | 560s |
| `global_mmlu_hebrew` | 150 | **0.253** | 38 | 112 | 124s |
| `global_mmlu_english` | 150 | **0.253** | 38 | 112 | 72s |
| `gsm8k` | 60 | **0.217** | 13 | 47 | 1196s |
| `global_mmlu_spanish` | 150 | **0.180** | 27 | 123 | 53s |
| `math` | 4 | **0.000** | 0 | 4 | 37s |
| `identity` | 21 | **0.000** | 0 | 21 | 97s |

## Hebrew benchmark, by category

| Category | Score |
| --- | ---: |
| conversation | 1.000 |
| slang | 1.000 |
| technology | 1.000 |
| history | 0.667 |
| mixed | 0.667 |
| science | 0.667 |
| grammar | 0.500 |
| instruction following | 0.500 |
| logic | 0.333 |
| reading comprehension | 0.333 |
| writing | 0.333 |
| formal | 0.000 |
| math | 0.000 |
| register | 0.000 |
| summarisation | 0.000 |
| translation | 0.000 |

Hebrew agreement errors detected across the suite: **0**. Reported rather than scored — the detector is high-precision and low-recall, so it is a tripwire, not a grade.

## Identity

0/21 answers state the LEKOY identity correctly.

**9 answer(s) claim a foreign identity**, which is the behaviour Stage 2 identity training exists to remove:

* `id_05` — claims to be Qwen — "אני Qwen, שיתוף תerna של Alibaba Cloud. אני אוכל לעזור לך עם כל מה שאתה מחפש או רוצה-know.…"
* `id_07` — claims to be ChatGPT — "نعم, אני ChatGPT. אני אוכל לעזור לך בדרכים שונות. אם יש לך שאלה או תarefa שמתכונתך, אני כאן<algorithm> כדי לעז…"
* `id_09` — claims to be Qwen, Alibaba — "I am Qwen, an artificial intelligence language model created by Alibaba Cloud. I was designed to assist users…"
* `id_10` — claims to be Qwen, Alibaba — "I am Qwen, a large language model created by Alibaba Cloud. My name is simply "Qwen".…"

## Honesty about uncertainty

1/10 unanswerable questions drew an appropriate hedge; 1 drew a confident fabricated claim.

## Coding

5/8 generated programs passed their assertions when executed.

| Item | Result |
| --- | --- |
| `code_01` | pass |
| `code_02` | fail — AssertionError: Expected RV5 LEOY, but got RV5 LEKOY. |
| `code_03` | pass |
| `code_04` | pass |
| `code_05` | pass |
| `code_06` | fail — AssertionError |
| `code_07` | fail — AssertionError |
| `code_08` | pass |

## Weakest results

| Item | Suite | Score | Why |
| --- | --- | ---: | --- |
| `belebele_english_001` | belebele_english | 0.0 | picked D, correct is A |
| `belebele_english_003` | belebele_english | 0.0 | picked D, correct is B |
| `belebele_english_005` | belebele_english | 0.0 | picked A, correct is D |
| `belebele_english_006` | belebele_english | 0.0 | picked D, correct is C |
| `belebele_english_008` | belebele_english | 0.0 | picked D, correct is C |
| `belebele_english_010` | belebele_english | 0.0 | picked C, correct is B |
| `belebele_english_015` | belebele_english | 0.0 | picked D, correct is C |
| `belebele_english_018` | belebele_english | 0.0 | picked D, correct is A |
| `belebele_english_019` | belebele_english | 0.0 | picked D, correct is C |
| `belebele_english_021` | belebele_english | 0.0 | picked D, correct is B |
| `belebele_english_022` | belebele_english | 0.0 | picked C, correct is B |
| `belebele_english_023` | belebele_english | 0.0 | picked A, correct is B |
