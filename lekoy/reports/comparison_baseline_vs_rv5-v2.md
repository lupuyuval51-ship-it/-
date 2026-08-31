# LEKOY RV5 — Model Comparison

Candidate `rv5-v2` against baseline `baseline`.

## Verdict

**rv5-v2 fails the regression check and must not be promoted.** 2 dimension(s) fell further than their threshold allows.

```
Improved: reliability +140.5%, math +138.3%, knowledge +26.2%, hebrew +9.3%, english +1.6%
Regressed: coding −20.0%, spanish −14.1%
LEKOY SCORE change: +0.0123

BLOCKING:
  spanish: fell 14.1% (0.566 -> 0.486); the limit for spanish is 10%
  coding: fell 20.0% (0.625 -> 0.500); the limit for coding is 10%
```

## Dimensions

| Dimension | `baseline` | `rv5-v2` | Change | Threshold | |
| --- | ---: | ---: | ---: | ---: | :---: |
| coding | 0.625 | 0.500 | -20.0% | −10% | blocked |
| english | 0.542 | 0.550 | +1.6% | −10% | up |
| hebrew | 0.362 | 0.395 | +9.3% | −5% | up |
| instruction_following | 0.500 | 0.500 | +0.0% | −8% | flat |
| knowledge | 0.229 | 0.289 | +26.2% | −10% | up |
| math | 0.108 | 0.258 | +138.3% | −12% | up |
| reasoning | 0.333 | 0.333 | +0.0% | −10% | flat |
| reliability | 0.250 | 0.601 | +140.5% | −3% | up |
| spanish | 0.566 | 0.486 | -14.1% | −10% | blocked |

## Suites

| Suite | `baseline` | `rv5-v2` |
| --- | ---: | ---: |
| `belebele_english` | 0.458 | **0.475** |
| `belebele_hebrew` | **0.258** | **0.258** |
| `belebele_spanish` | **0.417** | 0.400 |
| `coding` | **0.625** | 0.500 |
| `english` | **0.625** | **0.625** |
| `global_mmlu_english` | 0.253 | **0.307** |
| `global_mmlu_hebrew` | **0.253** | 0.220 |
| `global_mmlu_spanish` | 0.180 | **0.340** |
| `gsm8k` | 0.217 | **0.267** |
| `hallucination` | **0.500** | 0.250 |
| `hebrew` | 0.465 | **0.533** |
| `identity` | 0.000 | **0.952** |
| `instruction_following` | **0.500** | **0.500** |
| `math` | 0.000 | **0.250** |
| `reasoning` | **0.333** | **0.333** |
| `spanish` | **0.714** | 0.571 |
| `translation` | **0.500** | **0.500** |

## Why this is blocked

* **spanish** — fell 14.1% (0.566 -> 0.486); the limit for spanish is 10%
* **coding** — fell 20.0% (0.625 -> 0.500); the limit for coding is 10%

A checkpoint that improves one dimension while destroying several others is not an improvement, whatever the total says. The thresholds are in `src/lekoy/evaluation/score.py` and are meant to be argued with — but changed deliberately, not per-run.

## Wins and losses by suite

**7 suite(s) improved, 5 regressed.**

| Improved | Before | After | Change |
| --- | ---: | ---: | ---: |
| `identity` | 0.000 | 0.952 | +0.952 |
| `math` | 0.000 | 0.250 | +0.250 |
| `global_mmlu_spanish` | 0.180 | 0.340 | +0.160 |
| `hebrew` | 0.465 | 0.533 | +0.067 |
| `global_mmlu_english` | 0.253 | 0.307 | +0.053 |
| `gsm8k` | 0.217 | 0.267 | +0.050 |
| `belebele_english` | 0.458 | 0.475 | +0.017 |

| Regressed | Before | After | Change |
| --- | ---: | ---: | ---: |
| `hallucination` | 0.500 | 0.250 | -0.250 |
| `spanish` | 0.714 | 0.571 | -0.143 |
| `coding` | 0.625 | 0.500 | -0.125 |
| `global_mmlu_hebrew` | 0.253 | 0.220 | -0.033 |
| `belebele_spanish` | 0.417 | 0.400 | -0.017 |

