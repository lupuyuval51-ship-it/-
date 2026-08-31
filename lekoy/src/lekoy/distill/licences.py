"""Which teacher models may legally train LEKOY, and under what obligation.

The data pipeline already refuses a corpus whose licence is not permitted
(`data/sources.py`). A teacher model needs the same gate, and a stricter one,
because distillation asks a question a dataset licence never does: *may the
outputs of this model be used to train another model?*

That question splits the field in a way the licence name alone does not:

  * **Apache-2.0 / MIT / BSD** say nothing about outputs, which means nothing
    restricts them. Permitted.
  * **Llama 2 and Llama 3 (3.0)** forbid it outright. Their §1.b.v reads "You
    will not use the Llama Materials or any output or results of the Llama
    Materials to improve any other large language model (excluding [Llama] or
    derivative works thereof)." Distillation is the exact activity prohibited.
  * **Llama 3.1, 3.2 and 3.3** reversed that, and replaced it with a naming
    obligation: §1.b.i requires a model trained on Llama outputs to have a name
    that *begins with* "Llama". A LEKOY checkpoint distilled from Llama 3.1
    would have to ship as `Llama-LEKOY-RV6`, not `LEKOY-RV6`.
  * **Non-commercial licences** (CC BY-NC, the Qwen research licences, MNPL)
    permit the distillation and forbid the release that would follow it.

So the verdict is not a property of the model's quality or its popularity. It
is a property of its licence text, and it is recorded per teacher so that the
answer to "why is CodeLlama not in the mixture" is a sentence, not a shrug.

**This is a reading of published licence text, not legal advice.** Every
`CONDITIONAL` obligation below is reproduced so a human can check it against
the licence itself before a release depends on it.
"""
from __future__ import annotations

from dataclasses import dataclass

PERMITTED = "permitted"
CONDITIONAL = "conditional"
REFUSED = "refused"


@dataclass(frozen=True)
class Verdict:
    """What a licence allows, and the obligation that rides along with it."""
    status: str
    licence: str
    reason: str

    @property
    def usable(self) -> bool:
        return self.status in (PERMITTED, CONDITIONAL)

    @property
    def free(self) -> bool:
        return self.status == PERMITTED


# Licences that say nothing about model outputs, which is what makes them the
# easy case: there is no obligation to carry forward.
_PERMISSIVE = {
    "apache-2.0": "Apache-2.0. No restriction on outputs or on models trained from them.",
    "mit": "MIT. No restriction on outputs or on models trained from them.",
    "bsd": "BSD. No restriction on outputs or on models trained from them.",
    "bsd-2-clause": "BSD-2-Clause. No restriction on outputs or on models trained from them.",
    "bsd-3-clause": "BSD-3-Clause. No restriction on outputs or on models trained from them.",
    "cc0-1.0": "CC0. Dedicated to the public domain.",
    "cc-by-4.0": "CC BY 4.0. Attribution only; recorded in MODEL_CARD.md.",
}

# Licences that permit distillation and attach an obligation to it. The
# obligation is the whole content of the entry: it has to survive into the
# model card and the release licence, or the permission was never used.
_CONDITIONAL = {
    "llama3.1": (
        "Llama 3.1 Community License. Training on outputs is permitted, but "
        "§1.b.i requires the resulting model's name to BEGIN WITH 'Llama' — a "
        "LEKOY release distilled from this teacher must ship as 'Llama-LEKOY-…'. "
        "Attribution 'Built with Llama' is also required."),
    "llama3.2": (
        "Llama 3.2 Community License. Same terms as 3.1: outputs may train "
        "another model, and that model's name must begin with 'Llama'."),
    "llama3.3": (
        "Llama 3.3 Community License. Same terms as 3.1: outputs may train "
        "another model, and that model's name must begin with 'Llama'."),
    "gemma": (
        "Gemma Terms of Use. Outputs may be used to train other models; the "
        "Gemma Prohibited Use Policy must be passed to every downstream "
        "recipient of the resulting model."),
    "deepseek": (
        "DeepSeek License Agreement v1.0. Derivative models and outputs are "
        "permitted; the Attachment A use restrictions must be reproduced in "
        "the downstream licence."),
    "deepseek-license": (
        "DeepSeek License Agreement v1.0. Derivative models and outputs are "
        "permitted; the Attachment A use restrictions must be reproduced in "
        "the downstream licence."),
    "bigcode-openrail-m": (
        "BigCode OpenRAIL-M. Commercial use and derivatives permitted; the "
        "use restrictions in Attachment A must be reproduced in any downstream "
        "licence and imposed on downstream users."),
    "bigscience-openrail-m": (
        "BigScience OpenRAIL-M. As BigCode OpenRAIL-M: derivatives permitted, "
        "use restrictions propagate."),
    "bigscience-bloom-rail-1.0": (
        "BigScience BLOOM RAIL 1.0. Derivatives permitted, use restrictions "
        "propagate."),
    "tongyi-qianwen": (
        "Tongyi Qianwen License. Commercial use permitted below 100M monthly "
        "active users; above that a separate licence from Alibaba is required. "
        "Attribution required."),
    "qwen": (
        "Qwen License. Commercial use permitted below 100M monthly active "
        "users; above that a separate licence is required."),
    "falcon-llm-license": (
        "TII Falcon License 2.0. Permissive, with an Acceptable Use Policy "
        "that must be passed to downstream recipients."),
    "nvidia-open-model-license": (
        "NVIDIA Open Model License. Outputs are the user's, and models may be "
        "trained on them; NVIDIA claims no ownership of derivatives."),
    "jamba-open-model-license": (
        "Jamba Open Model License. Commercial use and derivatives permitted "
        "under AI21's acceptable use terms."),
}

# Licences that forbid the thing this pipeline does. Each reason names the
# clause or the restriction, because "not permitted" without a reason is the
# kind of entry that gets quietly overridden six months later.
_REFUSED = {
    "llama2": (
        "Llama 2 Community License §1.b.v forbids using the model's outputs to "
        "improve any other large language model. Distillation is the prohibited "
        "act, not a grey area — this is the clause Meta removed in 3.1."),
    "llama3": (
        "Llama 3 (3.0) Community License §1.b.v forbids using outputs to "
        "improve any other large language model. Relaxed in 3.1, not in 3.0."),
    "cc-by-nc-4.0": "non-commercial clause",
    "cc-by-nc-sa-4.0": "non-commercial clause",
    "qwen-research": (
        "Qwen Research License: research use only. The distillation would be "
        "permitted; releasing what it produced would not."),
    "tongyi-qianwen-research": (
        "Tongyi Qianwen Research License: research use only, no commercial "
        "release of a derivative."),
    "mnpl": (
        "Mistral Non-Production License. No production or commercial use, "
        "which a released LEKOY checkpoint would be."),
    "exaone": (
        "EXAONE AI Model License (NC). Non-commercial, and its terms restrict "
        "using the model's outputs to develop other models. Needs a human read "
        "before any use, so it is refused by default."),
}

_UNREADABLE = ("licence not machine-readable; needs a human read before use")


def classify(licence: str | None, licence_name: str | None = None) -> Verdict:
    """Decide what a teacher's licence permits.

    `licence_name` is the Hugging Face `license_name` field, which is where the
    real licence hides whenever `license` is the placeholder "other". Qwen2.5-3B
    and Qwen2.5-Coder-3B are the case that matters: they carry `other` +
    `qwen-research`, and are research-only despite every sibling in the family
    being Apache-2.0.
    """
    key = (licence or "").strip().lower()
    name = (licence_name or "").strip().lower()

    # "other" is not a licence; the name beside it is.
    lookup = name if key in ("other", "", "unknown") and name else key

    if lookup in _PERMISSIVE:
        return Verdict(PERMITTED, lookup, _PERMISSIVE[lookup])
    if lookup in _CONDITIONAL:
        return Verdict(CONDITIONAL, lookup, _CONDITIONAL[lookup])
    if lookup in _REFUSED:
        return Verdict(REFUSED, lookup, _REFUSED[lookup])
    if lookup in ("gemma-terms-of-use",):
        return Verdict(CONDITIONAL, "gemma", _CONDITIONAL["gemma"])
    if not lookup:
        return Verdict(REFUSED, "unstated", "the publisher states no licence")
    return Verdict(REFUSED, lookup, f"{_UNREADABLE} (stated as {lookup!r})")


def obligations(verdicts: list[Verdict]) -> list[str]:
    """The distinct obligations a mixture of teachers imposes on the release.

    Called by the model card writer: a checkpoint distilled from twelve
    conditional teachers inherits twelve conditions, and they belong in one
    list rather than scattered across a registry nobody reads.
    """
    seen: dict[str, str] = {}
    for v in verdicts:
        if v.status == CONDITIONAL:
            seen.setdefault(v.licence, v.reason)
    return [f"{lic}: {reason}" for lic, reason in sorted(seen.items())]
