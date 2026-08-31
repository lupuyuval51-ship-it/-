"""LEKOY SCORE — one number for a checkpoint, and the rules for trusting it.

The weights come from the RV5 brief. They encode a judgement: Hebrew is the
point of this model, so it carries a quarter of the score on its own, and
English carries half what Hebrew does despite being the language the base model
is best at. Reasoning and coding are weighted like a second Hebrew between
them, because a model that speaks beautifully and cannot think is not useful.

The score is a summary, not a verdict. `regression_check` is the part that
decides whether a checkpoint may be promoted, and it deliberately cannot be
satisfied by an average: a checkpoint that gains 15 points of Hebrew and loses
30 of English has a better LEKOY SCORE in some weightings and is still a worse
model. That case is named in the brief and is what the thresholds below exist
to catch.
"""
from __future__ import annotations

from dataclasses import dataclass, field

# Suite -> share of the total. Sums to 1.0; `validate_weights` asserts it.
WEIGHTS: dict[str, float] = {
    "hebrew": 0.25,
    "english": 0.12,
    "spanish": 0.08,
    "reasoning": 0.15,
    "coding": 0.15,
    "instruction_following": 0.10,
    "math": 0.05,
    "knowledge": 0.05,
    "reliability": 0.05,
}

# Which evaluation suites feed each scored dimension. A dimension with several
# suites averages them, so adding a Hebrew benchmark does not silently double
# Hebrew's weight.
DIMENSION_SUITES: dict[str, list[str]] = {
    "hebrew": ["hebrew", "belebele_hebrew"],
    "english": ["english", "belebele_english"],
    "spanish": ["spanish", "belebele_spanish"],
    "reasoning": ["reasoning"],
    "coding": ["coding"],
    "instruction_following": ["instruction_following"],
    "math": ["math", "gsm8k"],
    "knowledge": ["global_mmlu_hebrew", "global_mmlu_english", "global_mmlu_spanish"],
    "reliability": ["hallucination", "identity"],
}

# A regression larger than this, in a dimension the checkpoint was not meant to
# improve, blocks promotion. Hebrew's is tighter because Hebrew is the point;
# reliability's is tightest because a model that starts hallucinating is worse
# than useless regardless of what else improved.
REGRESSION_THRESHOLDS: dict[str, float] = {
    "hebrew": 0.05,
    "english": 0.10,
    "spanish": 0.10,
    "reasoning": 0.10,
    "coding": 0.10,
    "instruction_following": 0.08,
    "math": 0.12,
    "knowledge": 0.10,
    "reliability": 0.03,
}

# Below this, promotion is blocked no matter what the total says.
ABSOLUTE_FLOORS: dict[str, float] = {"reliability": 0.30}


def validate_weights() -> None:
    total = sum(WEIGHTS.values())
    if abs(total - 1.0) > 1e-9:
        raise ValueError(f"LEKOY SCORE weights sum to {total}, not 1.0")


validate_weights()


@dataclass
class Score:
    total: float
    dimensions: dict[str, float]
    missing: list[str] = field(default_factory=list)
    coverage: float = 1.0

    def as_dict(self) -> dict:
        return {
            "lekoy_score": round(self.total, 4),
            "lekoy_score_100": round(self.total * 100, 2),
            "dimensions": {k: round(v, 4) for k, v in self.dimensions.items()},
            "weights": WEIGHTS,
            "missing_dimensions": self.missing,
            "coverage": round(self.coverage, 4),
        }

    def table(self) -> str:
        lines = ["| Dimension | Weight | Score | Contribution |",
                 "| --- | ---: | ---: | ---: |"]
        for name, weight in WEIGHTS.items():
            value = self.dimensions.get(name)
            if value is None:
                lines.append(f"| {name} | {weight:.0%} | — | not measured |")
            else:
                lines.append(f"| {name} | {weight:.0%} | {value:.3f} "
                             f"| {value * weight:.4f} |")
        lines.append(f"| **LEKOY SCORE** | **100%** | **{self.total:.4f}** "
                     f"| **{self.total * 100:.2f} / 100** |")
        if self.missing:
            lines.append("")
            lines.append(f"Not measured: {', '.join(self.missing)}. The score is "
                         f"renormalised over the {self.coverage:.0%} of the weight "
                         "that was measured, so it is not comparable to a full run.")
        return "\n".join(lines)


def compute(suite_scores: dict[str, float]) -> Score:
    """Fold per-suite accuracies into the LEKOY SCORE.

    Unmeasured dimensions are dropped and the remaining weights renormalised,
    rather than being scored as zero. A partial run should read as "we measured
    70% of the score and it looks like this", not as a catastrophic failure —
    but the renormalisation is recorded so a partial score cannot be quietly
    compared against a full one.
    """
    dimensions: dict[str, float] = {}
    missing: list[str] = []

    for dimension, suites in DIMENSION_SUITES.items():
        values = [suite_scores[s] for s in suites if s in suite_scores]
        if values:
            dimensions[dimension] = sum(values) / len(values)
        else:
            missing.append(dimension)

    measured_weight = sum(WEIGHTS[d] for d in dimensions)
    if not measured_weight:
        return Score(0.0, {}, list(WEIGHTS), 0.0)
    total = sum(dimensions[d] * WEIGHTS[d] for d in dimensions) / measured_weight
    return Score(total, dimensions, missing, measured_weight)


@dataclass
class RegressionVerdict:
    passed: bool
    improvements: dict[str, float] = field(default_factory=dict)
    regressions: dict[str, float] = field(default_factory=dict)
    blocking: dict[str, str] = field(default_factory=dict)
    score_delta: float = 0.0

    def summary(self) -> str:
        lines = []
        if self.improvements:
            lines.append("Improved: " + ", ".join(
                f"{k} +{v:.1%}" for k, v in sorted(
                    self.improvements.items(), key=lambda kv: -kv[1])))
        if self.regressions:
            lines.append("Regressed: " + ", ".join(
                f"{k} −{v:.1%}" for k, v in sorted(
                    self.regressions.items(), key=lambda kv: -kv[1])))
        lines.append(f"LEKOY SCORE change: {self.score_delta:+.4f}")
        if self.blocking:
            lines.append("")
            lines.append("BLOCKING:")
            lines.extend(f"  {k}: {v}" for k, v in self.blocking.items())
        else:
            lines.append("No blocking regression.")
        return "\n".join(lines)


def regression_check(baseline: Score, candidate: Score,
                     thresholds: dict[str, float] | None = None,
                     ) -> RegressionVerdict:
    """May this checkpoint be promoted to release candidate?

    Relative rather than absolute regression: a dimension falling from 0.80 to
    0.72 is a 10% loss, and the same 0.08 drop from 0.20 to 0.12 is a 40% one.
    The second is much worse and an absolute threshold would treat them alike.
    """
    thresholds = thresholds or REGRESSION_THRESHOLDS
    verdict = RegressionVerdict(True, score_delta=candidate.total - baseline.total)

    for dimension, before in baseline.dimensions.items():
        after = candidate.dimensions.get(dimension)
        if after is None:
            verdict.blocking[dimension] = (
                "measured in the baseline but not in the candidate — a "
                "dimension cannot be dropped from the comparison")
            verdict.passed = False
            continue
        if before <= 0:
            if after > 0:
                verdict.improvements[dimension] = after
            continue
        change = (after - before) / before
        if change > 0.001:
            verdict.improvements[dimension] = change
        elif change < -0.001:
            verdict.regressions[dimension] = -change
            limit = thresholds.get(dimension, 0.10)
            if -change > limit:
                verdict.blocking[dimension] = (
                    f"fell {-change:.1%} ({before:.3f} -> {after:.3f}); the "
                    f"limit for {dimension} is {limit:.0%}")
                verdict.passed = False

    for dimension, floor in ABSOLUTE_FLOORS.items():
        value = candidate.dimensions.get(dimension)
        if value is not None and value < floor:
            verdict.blocking[dimension] = (
                f"{value:.3f} is below the absolute floor of {floor:.2f}")
            verdict.passed = False

    return verdict


def leaderboard(entries: list[dict]) -> str:
    """Rank checkpoints by LEKOY SCORE.

    Sorted best first, with the three dimensions that move most between
    checkpoints shown alongside — a leaderboard of totals alone hides the
    trade that produced each one.
    """
    if not entries:
        return "No scored checkpoints yet."
    ranked = sorted(entries, key=lambda e: -e.get("lekoy_score", 0))
    lines = ["| # | Checkpoint | LEKOY SCORE | Hebrew | English | Spanish | Reasoning | Coding |",
             "| ---: | --- | ---: | ---: | ---: | ---: | ---: | ---: |"]
    for i, entry in enumerate(ranked, 1):
        d = entry.get("dimensions", {})
        def cell(key: str) -> str:
            value = d.get(key)
            return f"{value:.3f}" if value is not None else "—"
        lines.append(
            f"| {i} | `{entry.get('name', '?')}` "
            f"| **{entry.get('lekoy_score', 0) * 100:.2f}** "
            f"| {cell('hebrew')} | {cell('english')} | {cell('spanish')} "
            f"| {cell('reasoning')} | {cell('coding')} |")
    return "\n".join(lines)
