"""What running the faculty would actually cost, before anyone starts it.

`scripts/estimate_training.py` exists because a training run that is going to
take eleven days should say so before it takes eleven days. A distillation run
needs the same courtesy and needs it more, because the naive version of this
idea — a hundred teachers, all of them, over the whole prompt set — is a very
large number that nobody computes until the bill arrives.

The arithmetic for generation is different from training. Decoding is memory-
bandwidth-bound, not compute-bound: a forward pass over one token reads every
weight once, so tokens per second is roughly *bandwidth / bytes of weights*,
and FLOPs barely enter into it. That is why a 30B MoE with 3B active generates
about as fast as a 3B dense model, and why quantising to 4 bits nearly
quadruples throughput while quadrupling nothing else.

The estimate that comes out of this is deliberately conservative and clearly
approximate. It exists to answer "is this hours or weeks", which is the
question that changes decisions.
"""
from __future__ import annotations

from dataclasses import dataclass

from .teachers import Teacher

# Memory bandwidth, GB/s, from vendor specification sheets, and the fraction a
# real decode loop achieves. The fraction is the honest part: 70% of peak is
# what a well-batched vLLM server gets, and it is not what a naive
# transformers loop gets.
ACCELERATORS = {
    "cpu":     dict(bandwidth_gbs=50,    memory_gb=15,  achieved=0.35),
    "t4":      dict(bandwidth_gbs=320,   memory_gb=16,  achieved=0.60),
    "l4":      dict(bandwidth_gbs=300,   memory_gb=24,  achieved=0.60),
    "a10":     dict(bandwidth_gbs=600,   memory_gb=24,  achieved=0.65),
    "rtx3090": dict(bandwidth_gbs=936,   memory_gb=24,  achieved=0.65),
    "rtx4090": dict(bandwidth_gbs=1008,  memory_gb=24,  achieved=0.65),
    "a100-40": dict(bandwidth_gbs=1555,  memory_gb=40,  achieved=0.70),
    "a100-80": dict(bandwidth_gbs=2039,  memory_gb=80,  achieved=0.70),
    "h100":    dict(bandwidth_gbs=3350,  memory_gb=80,  achieved=0.70),
    "h200":    dict(bandwidth_gbs=4800,  memory_gb=141, achieved=0.70),
}

# Indicative on-demand USD/hour. Prices move; these are here so the estimate
# can say "about $400" rather than nothing, and they are labelled as indicative
# everywhere they surface.
HOURLY_USD = {"cpu": 0.10, "t4": 0.35, "l4": 0.70, "a10": 1.00, "rtx3090": 0.25,
              "rtx4090": 0.40, "a100-40": 1.80, "a100-80": 2.50, "h100": 4.00,
              "h200": 5.50}

# Batching wins a lot in decode because the weights are read once for the whole
# batch. Beyond about 32 concurrent sequences the KV cache starts costing more
# than the batching saves, on the cards this project targets.
BATCH_SPEEDUP = {1: 1.0, 4: 3.2, 8: 5.5, 16: 8.5, 32: 12.0, 64: 15.0}


@dataclass
class TeacherPlan:
    """One teacher's share of the run."""
    teacher: str
    billions: float | None
    bits: int
    weights_gb: float | None
    fits: bool
    tokens_per_second: float | None
    hours: float | None
    usd: float | None
    note: str = ""


@dataclass
class RunPlan:
    accelerator: str
    bits: int
    batch: int
    prompts: int
    tokens_each: int
    teachers: list[TeacherPlan]

    @property
    def runnable(self) -> list[TeacherPlan]:
        return [t for t in self.teachers if t.fits and t.hours is not None]

    @property
    def hours(self) -> float:
        return round(sum(t.hours for t in self.runnable), 1)

    @property
    def usd(self) -> float:
        return round(sum(t.usd for t in self.runnable), 2)

    @property
    def skipped(self) -> list[TeacherPlan]:
        return [t for t in self.teachers if not t.fits or t.hours is None]

    def as_dict(self) -> dict:
        return {
            "accelerator": self.accelerator, "bits": self.bits,
            "batch": self.batch, "prompts": self.prompts,
            "tokens_per_response": self.tokens_each,
            "teachers_planned": len(self.teachers),
            "teachers_runnable": len(self.runnable),
            "teachers_skipped": len(self.skipped),
            "responses": len(self.runnable) * self.prompts,
            "total_hours": self.hours,
            "total_days": round(self.hours / 24, 2),
            "indicative_usd": self.usd,
            "per_teacher": [
                {"teacher": t.teacher, "billions": t.billions,
                 "weights_gb": t.weights_gb, "fits": t.fits,
                 "tokens_per_second": t.tokens_per_second,
                 "hours": t.hours, "usd": t.usd, "note": t.note}
                for t in self.teachers],
        }


def _speedup(batch: int) -> float:
    for size in sorted(BATCH_SPEEDUP, reverse=True):
        if batch >= size:
            return BATCH_SPEEDUP[size]
    return 1.0


def plan_teacher(teacher: Teacher, *, accelerator: str, bits: int, batch: int,
                 prompts: int, tokens_each: int) -> TeacherPlan:
    """Bandwidth-bound decode estimate for one teacher on one accelerator."""
    spec = ACCELERATORS[accelerator]
    weights_gb = teacher.vram_gb(bits)
    if weights_gb is None:
        return TeacherPlan(teacher.id, teacher.billions, bits, None, False,
                           None, None, None,
                           "no parameter count published; cannot estimate")

    # KV cache and activations, roughly. Generous rather than tight, because an
    # estimate that says a run fits and then OOMs is worse than useless.
    needed = weights_gb + 2.0 + 0.25 * batch
    if needed > spec["memory_gb"]:
        return TeacherPlan(teacher.id, teacher.billions, bits, weights_gb, False,
                           None, None, None,
                           f"needs about {needed:.0f} GB, host has {spec['memory_gb']} GB")

    effective_bandwidth = spec["bandwidth_gbs"] * spec["achieved"]
    tokens_per_second = effective_bandwidth / weights_gb * _speedup(batch)
    hours = prompts * tokens_each / tokens_per_second / 3600
    return TeacherPlan(teacher.id, teacher.billions, bits, weights_gb, True,
                       round(tokens_per_second, 1), round(hours, 2),
                       round(hours * HOURLY_USD[accelerator], 2))


def plan_run(teachers: list[Teacher], *, accelerator: str = "a100-80",
             bits: int = 16, batch: int = 16, prompts: int = 5000,
             tokens_each: int = 400) -> RunPlan:
    """Project a whole distillation run over a faculty."""
    if accelerator not in ACCELERATORS:
        raise ValueError(f"unknown accelerator {accelerator!r}; "
                         f"one of {sorted(ACCELERATORS)}")
    return RunPlan(accelerator, bits, batch, prompts, tokens_each,
                   [plan_teacher(t, accelerator=accelerator, bits=bits, batch=batch,
                                 prompts=prompts, tokens_each=tokens_each)
                    for t in teachers])
