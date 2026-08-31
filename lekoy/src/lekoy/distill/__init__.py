"""Distillation: building LEKOY's training data from a faculty of open models.

RV5's evaluation says the student is data-limited, not capacity-limited. The
Hebrew instruction corpus it needs does not exist — Aya has zero Hebrew rows,
OASST2 has two usable Hebrew conversations — and no amount of further training
on 1,278 samples produces one. So the corpus is generated, by a hundred
open-weight teachers, and every generated sample is verified before it is kept.

    licences.py   which teachers may legally train LEKOY, and under what terms
    teachers.py   the curated faculty: roles, notes, tiers
    registry.py   data/teachers_registry.json, built from the live hub
    prompts.py    the questions, and how each one's answers will be judged
    generate.py   running one teacher over the prompt set, resumably
    verify.py     execution, consensus, language and format checks
    mixture.py    verified responses -> a deduplicated, leakage-checked corpus
    plan.py       what a run would cost, before anyone starts it
"""
from __future__ import annotations

from .licences import CONDITIONAL, PERMITTED, REFUSED, classify
from .plan import plan_run
from .registry import TEACHERS_REGISTRY, build, filter_teachers, load, save, select
from .teachers import CANDIDATES, CODE, HEBREW, ROLES, Teacher

__all__ = ["CONDITIONAL", "PERMITTED", "REFUSED", "classify", "plan_run",
           "TEACHERS_REGISTRY", "build", "filter_teachers", "load", "save",
           "select", "CANDIDATES", "CODE", "HEBREW", "ROLES", "Teacher"]
