"""LEKOY — a family of multilingual language models.

RV5 is the first model in the family. Everything in this package is written to
outlive it: the data pipeline, the evaluation suite, the scoring metric and the
serving stack are keyed on a config, not on RV5's particular base model, so
RV6 reuses them by adding a config rather than a fork.
"""

__all__ = ["FAMILY", "MODEL", "FULL_NAME", "__version__"]

FAMILY = "LEKOY"
MODEL = "RV5"
FULL_NAME = f"{FAMILY} {MODEL}"

__version__ = "0.1.0"
