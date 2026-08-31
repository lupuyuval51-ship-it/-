# LEKOY RV5 — Model Comparison

Candidate `rv5-v1` against baseline `baseline`.

## Verdict

**rv5-v1 fails the regression check and must not be promoted.** 4 dimension(s) fell further than their threshold allows.

```
Improved: math +192.1%, reliability +111.4%, instruction_following +25.0%
Regressed: reasoning −50.0%, coding −40.0%, knowledge −33.0%, hebrew −6.9%, spanish −6.8%, english −0.8%
LEKOY SCORE change: -0.0392

BLOCKING:
  hebrew: fell 6.9% (0.362 -> 0.337); the limit for hebrew is 5%
  reasoning: fell 50.0% (0.333 -> 0.167); the limit for reasoning is 10%
  coding: fell 40.0% (0.625 -> 0.375); the limit for coding is 10%
  knowledge: fell 33.0% (0.229 -> 0.153); the limit for knowledge is 10%
```

## Dimensions

| Dimension | `baseline` | `rv5-v1` | Change | Threshold | |
| --- | ---: | ---: | ---: | ---: | :---: |
| coding | 0.625 | 0.375 | -40.0% | −10% | blocked |
| english | 0.542 | 0.537 | -0.8% | −10% | down |
| hebrew | 0.362 | 0.337 | -6.9% | −5% | blocked |
| instruction_following | 0.500 | 0.625 | +25.0% | −8% | up |
| knowledge | 0.229 | 0.153 | -33.0% | −10% | blocked |
| math | 0.108 | 0.317 | +192.1% | −12% | up |
| reasoning | 0.333 | 0.167 | -50.0% | −10% | blocked |
| reliability | 0.250 | 0.528 | +111.4% | −3% | up |
| spanish | 0.566 | 0.527 | -6.8% | −10% | down |

## Suites

| Suite | `baseline` | `rv5-v1` |
| --- | ---: | ---: |
| `belebele_english` | **0.458** | 0.450 |
| `belebele_hebrew` | **0.258** | 0.167 |
| `belebele_spanish` | 0.417 | **0.483** |
| `coding` | **0.625** | 0.375 |
| `english` | **0.625** | **0.625** |
| `global_mmlu_english` | **0.253** | 0.167 |
| `global_mmlu_hebrew` | **0.253** | 0.053 |
| `global_mmlu_spanish` | 0.180 | **0.240** |
| `gsm8k` | 0.217 | **0.383** |
| `hallucination` | **0.500** | 0.200 |
| `hebrew` | 0.465 | **0.507** |
| `identity` | 0.000 | **0.857** |
| `instruction_following` | 0.500 | **0.625** |
| `math` | 0.000 | **0.250** |
| `reasoning` | **0.333** | 0.167 |
| `spanish` | **0.714** | 0.571 |
| `translation` | **0.500** | **0.500** |

## Why this is blocked

* **hebrew** — fell 6.9% (0.362 -> 0.337); the limit for hebrew is 5%
* **reasoning** — fell 50.0% (0.333 -> 0.167); the limit for reasoning is 10%
* **coding** — fell 40.0% (0.625 -> 0.375); the limit for coding is 10%
* **knowledge** — fell 33.0% (0.229 -> 0.153); the limit for knowledge is 10%

A checkpoint that improves one dimension while destroying several others is not an improvement, whatever the total says. The thresholds are in `src/lekoy/evaluation/score.py` and are meant to be argued with — but changed deliberately, not per-run.

## Wins and losses by suite

**7 suite(s) improved, 8 regressed.**

| Improved | Before | After | Change |
| --- | ---: | ---: | ---: |
| `identity` | 0.000 | 0.857 | +0.857 |
| `math` | 0.000 | 0.250 | +0.250 |
| `gsm8k` | 0.217 | 0.383 | +0.167 |
| `instruction_following` | 0.500 | 0.625 | +0.125 |
| `belebele_spanish` | 0.417 | 0.483 | +0.067 |
| `global_mmlu_spanish` | 0.180 | 0.240 | +0.060 |
| `hebrew` | 0.465 | 0.507 | +0.042 |

| Regressed | Before | After | Change |
| --- | ---: | ---: | ---: |
| `hallucination` | 0.500 | 0.200 | -0.300 |
| `coding` | 0.625 | 0.375 | -0.250 |
| `global_mmlu_hebrew` | 0.253 | 0.053 | -0.200 |
| `reasoning` | 0.333 | 0.167 | -0.167 |
| `spanish` | 0.714 | 0.571 | -0.143 |
| `belebele_hebrew` | 0.258 | 0.167 | -0.092 |
| `global_mmlu_english` | 0.253 | 0.167 | -0.087 |
| `belebele_english` | 0.458 | 0.450 | -0.008 |

