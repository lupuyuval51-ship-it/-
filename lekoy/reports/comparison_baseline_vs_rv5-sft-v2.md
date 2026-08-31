# LEKOY RV5 — Model Comparison

Candidate `rv5-sft-v2` against baseline `baseline`.

## Verdict

**rv5-sft-v2 fails the regression check and must not be promoted.** 3 dimension(s) fell further than their threshold allows.

```
Improved: reliability +160.0%, instruction_following +25.0%, english +1.6%, spanish +1.5%
Regressed: reasoning −50.0%, coding −20.0%, hebrew −12.6%, math −7.7%, knowledge −5.8%
LEKOY SCORE change: -0.0220

BLOCKING:
  hebrew: fell 12.6% (0.362 -> 0.316); the limit for hebrew is 5%
  reasoning: fell 50.0% (0.333 -> 0.167); the limit for reasoning is 10%
  coding: fell 20.0% (0.625 -> 0.500); the limit for coding is 10%
```

## Dimensions

| Dimension | `baseline` | `rv5-sft-v2` | Change | Threshold | |
| --- | ---: | ---: | ---: | ---: | :---: |
| coding | 0.625 | 0.500 | -20.0% | −10% | blocked |
| english | 0.542 | 0.550 | +1.6% | −10% | up |
| hebrew | 0.362 | 0.316 | -12.6% | −5% | blocked |
| instruction_following | 0.500 | 0.625 | +25.0% | −8% | up |
| knowledge | 0.229 | 0.216 | -5.8% | −10% | down |
| math | 0.108 | 0.100 | -7.7% | −12% | down |
| reasoning | 0.333 | 0.167 | -50.0% | −10% | blocked |
| reliability | 0.250 | 0.650 | +160.0% | −3% | up |
| spanish | 0.566 | 0.574 | +1.5% | −10% | up |

## Suites

| Suite | `baseline` | `rv5-sft-v2` |
| --- | ---: | ---: |
| `belebele_english` | 0.458 | **0.475** |
| `belebele_hebrew` | **0.258** | 0.200 |
| `belebele_spanish` | 0.417 | **0.433** |
| `coding` | **0.625** | 0.500 |
| `english` | **0.625** | **0.625** |
| `global_mmlu_english` | 0.253 | **0.267** |
| `global_mmlu_hebrew` | **0.253** | 0.180 |
| `global_mmlu_spanish` | 0.180 | **0.200** |
| `gsm8k` | **0.217** | 0.200 |
| `hallucination` | **0.500** | 0.300 |
| `hebrew` | **0.465** | 0.433 |
| `identity` | 0.000 | **1.000** |
| `instruction_following` | 0.500 | **0.625** |
| `math` | **0.000** | **0.000** |
| `reasoning` | **0.333** | 0.167 |
| `spanish` | **0.714** | **0.714** |
| `translation` | **0.500** | 0.375 |

## Why this is blocked

* **hebrew** — fell 12.6% (0.362 -> 0.316); the limit for hebrew is 5%
* **reasoning** — fell 50.0% (0.333 -> 0.167); the limit for reasoning is 10%
* **coding** — fell 20.0% (0.625 -> 0.500); the limit for coding is 10%

A checkpoint that improves one dimension while destroying several others is not an improvement, whatever the total says. The thresholds are in `src/lekoy/evaluation/score.py` and are meant to be argued with — but changed deliberately, not per-run.

## Wins and losses by suite

**6 suite(s) improved, 8 regressed.**

| Improved | Before | After | Change |
| --- | ---: | ---: | ---: |
| `identity` | 0.000 | 1.000 | +1.000 |
| `instruction_following` | 0.500 | 0.625 | +0.125 |
| `global_mmlu_spanish` | 0.180 | 0.200 | +0.020 |
| `belebele_english` | 0.458 | 0.475 | +0.017 |
| `belebele_spanish` | 0.417 | 0.433 | +0.017 |
| `global_mmlu_english` | 0.253 | 0.267 | +0.013 |

| Regressed | Before | After | Change |
| --- | ---: | ---: | ---: |
| `hallucination` | 0.500 | 0.300 | -0.200 |
| `reasoning` | 0.333 | 0.167 | -0.167 |
| `coding` | 0.625 | 0.500 | -0.125 |
| `translation` | 0.500 | 0.375 | -0.125 |
| `global_mmlu_hebrew` | 0.253 | 0.180 | -0.073 |
| `belebele_hebrew` | 0.258 | 0.200 | -0.058 |
| `hebrew` | 0.465 | 0.433 | -0.033 |
| `gsm8k` | 0.217 | 0.200 | -0.017 |

