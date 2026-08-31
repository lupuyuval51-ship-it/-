"""The teachers: one hundred models that can generate training data for LEKOY.

RV5 is a 0.49B student. Its evaluation says plainly where it is weak — Hebrew
generation is broken in ways a 1,278-conversation SFT run cannot fix, and the
whole coding dimension rests on eight items. Neither gap closes by training
longer on the same corpus, because the corpus does not exist: Aya has zero
Hebrew rows, OASST2 has two usable Hebrew conversations. What does exist is a
large number of open-weight models that can *write* that data.

So the corpus is generated rather than found, and this table is the faculty.

**Composition.** 100 teachers, of which at least 40 are code specialists. That
weighting is deliberate and it is not the student's current weakness ranking —
Hebrew is. Code is weighted because code is the one dimension where a generated
sample can be *verified* rather than trusted: a Python function either passes
its assertions or it does not, and `distill/verify.py` runs them. A verified
code corpus can be scaled to any size without a human reading it. A Hebrew
corpus cannot, which is why the Hebrew teachers here are few, large, and their
output is sampled for review rather than accepted wholesale.

**Roles.**

  `code`         — writes and repairs programs; output is execution-verified.
  `hebrew`       — Hebrew-specialised or Hebrew-continued-pretrained.
  `multilingual` — strong across Hebrew/English/Spanish; the generalist bench.
  `reasoning`    — long chain-of-thought; used for the reasoning stage.
  `math`         — arithmetic and word problems, where RV5 scores 0.108.
  `general`      — English-centric; present for replay data and format drills.

**Tiers.** A teacher smaller than about 3B is not a teacher for a 0.5B student
in any useful sense — it makes the same mistakes. Such candidates are marked
`tier: peer` and, at the current faculty size of 100, all of them rank below the
cut: the registry records each one as "licence permits it, but the faculty is
capped". Raising `registry.TARGET` admits them, and there is one reason to want
that — a peer-sized model generates *disagreement*, and `verify.py` reads
disagreement as evidence that an item is hard rather than as noise.

Every field that can be measured is measured. Parameter counts and licences in
`data/teachers_registry.json` come from the Hugging Face model API at build
time, not from this file — `scripts/build_teachers.py` refreshes them, and a
model whose licence changed under us shows up as a diff in that registry.
"""
from __future__ import annotations

from dataclasses import dataclass, field
from typing import Iterable

from .licences import Verdict, classify

CODE = "code"
HEBREW = "hebrew"
MULTILINGUAL = "multilingual"
REASONING = "reasoning"
MATH = "math"
GENERAL = "general"

ROLES = (CODE, HEBREW, MULTILINGUAL, REASONING, MATH, GENERAL)


@dataclass
class Teacher:
    """One model that can generate training data, and what it is good for."""
    id: str
    role: str
    note: str
    also: tuple[str, ...] = ()
    licence: str | None = None
    licence_name: str | None = None
    params: int | None = None
    gated: bool = False
    downloads: int = 0
    likes: int = 0
    status: str = "candidate"          # selected | rejected
    reason: str | None = None
    tags: list[str] = field(default_factory=list)

    @property
    def verdict(self) -> Verdict:
        return classify(self.licence, self.licence_name)

    @property
    def billions(self) -> float | None:
        return None if not self.params else round(self.params / 1e9, 2)

    @property
    def tier(self) -> str:
        """How this teacher relates to a 0.49B student.

        `peer` teachers are not much better than RV5 and are used for
        disagreement rather than for answers; `strong` teachers are the ones
        whose output is worth training on directly.
        """
        b = self.billions
        if b is None:
            return "unknown"
        if b < 3:
            return "peer"
        if b < 15:
            return "strong"
        return "frontier"

    def vram_gb(self, bits: int = 16) -> float | None:
        """Weights-only VRAM for generation, before KV cache and activations."""
        if not self.params:
            return None
        return round(self.params * bits / 8 / 1e9 * 1.08, 1)

    def roles(self) -> tuple[str, ...]:
        return (self.role,) + tuple(self.also)


# --- The curated table -----------------------------------------------------
#
# (id, role, also, note). Ids are the canonical ones the hub resolved to at
# build time — `THUDM/codegeex4-all-9b` and `all-hands/openhands-lm-32b-v0.1`
# both redirect, and the redirect target is what is written here so the
# registry does not drift on the next refresh.

CANDIDATES: list[tuple[str, str, tuple[str, ...], str]] = [
    # --- code: Qwen ---------------------------------------------------------
    ("Qwen/Qwen2.5-Coder-32B-Instruct", CODE, (), "The strongest Apache-2.0 code teacher of its generation, and the default for hard items."),
    ("Qwen/Qwen2.5-Coder-14B-Instruct", CODE, (), "The cost/quality knee for bulk generation on one 24 GB GPU."),
    ("Qwen/Qwen2.5-Coder-7B-Instruct", CODE, (), "Same family, fits a 16 GB card in bf16; the bulk workhorse."),
    ("Qwen/Qwen2.5-Coder-1.5B-Instruct", CODE, (), "Peer-tier; used for disagreement signal, not for answers."),
    ("Qwen/Qwen2.5-Coder-0.5B-Instruct", CODE, (), "Exactly the student's size. Its failures mark which items are size-limited rather than data-limited."),
    ("Qwen/Qwen2.5-Coder-14B", CODE, (), "Base, not instruct. Completion-style code data, no chat template."),
    ("Qwen/Qwen2.5-Coder-7B", CODE, (), "Base counterpart for fill-in-the-middle and continuation samples."),
    ("Qwen/Qwen3-Coder-30B-A3B-Instruct", CODE, (), "MoE: 30B of weights, ~3B active, so it generates at small-model speed."),
    ("Qwen/Qwen3-Coder-480B-A35B-Instruct", CODE, (), "Frontier open-weight coder. Out of reach here; listed because the pipeline is host-agnostic."),
    # --- code: DeepSeek -----------------------------------------------------
    ("deepseek-ai/deepseek-coder-33b-instruct", CODE, (), "Strong on multi-file and repository-scale prompts."),
    ("deepseek-ai/deepseek-coder-6.7b-instruct", CODE, (), "The most-used open code model of its size; broad language coverage."),
    ("deepseek-ai/deepseek-coder-1.3b-instruct", CODE, (), "Peer-tier probe for whether an item needs scale at all."),
    ("deepseek-ai/DeepSeek-Coder-V2-Lite-Instruct", CODE, (), "16B MoE, 2.4B active — frontier-family behaviour at workhorse cost."),
    ("deepseek-ai/DeepSeek-Coder-V2-Instruct", CODE, (), "236B MoE. Reference-quality answers for the items every other teacher fails."),
    # --- code: BigCode ------------------------------------------------------
    ("bigcode/starcoder2-15b-instruct-v0.1", CODE, (), "Self-instruct trained with execution filtering — the same discipline this pipeline uses."),
    ("bigcode/starcoder2-15b", CODE, (), "Base. 600+ languages, permissively-licensed training data."),
    ("bigcode/starcoder2-7b", CODE, (), "Mid-size StarCoder2; strong at fill-in-the-middle."),
    ("bigcode/starcoder2-3b", CODE, (), "Smallest StarCoder2 that still beats the student reliably."),
    ("bigcode/octocoder", CODE, (), "Instruction-tuned StarCoder. Older, but its style differs from the Qwen family, which is the point of a bench."),
    ("bigcode/starcoderbase", CODE, (), "The original 15B base. Kept for continuation-style data."),
    ("bigcode/santacoder", CODE, (), "1.1B, Python/Java/JS only. Peer-tier; historical baseline."),
    # --- code: IBM Granite --------------------------------------------------
    ("ibm-granite/granite-34b-code-instruct-8k", CODE, (), "Apache-2.0 with a published data provenance trail — unusual, and useful for an auditable corpus."),
    ("ibm-granite/granite-20b-code-instruct-8k", CODE, (), "Enterprise-code register: SQL, COBOL, shell, config."),
    ("ibm-granite/granite-8b-code-instruct-128k", CODE, (), "128k context, so whole-file prompts fit."),
    ("ibm-granite/granite-3b-code-instruct-128k", CODE, (), "Smallest Granite that is still a genuine teacher."),
    # --- code: Mistral / Google ---------------------------------------------
    ("mistralai/Devstral-Small-2507", CODE, (), "Agentic coding: multi-step edits rather than single functions."),
    ("mistralai/Devstral-Small-2505", CODE, (), "The earlier Devstral. Kept for output diversity against 2507."),
    ("google/codegemma-1.1-7b-it", CODE, (), "Gemma-family code instruct; different tokenizer lineage from Qwen, so different failure modes."),
    ("google/codegemma-7b-it", CODE, (), "The original CodeGemma instruct."),
    ("google/codegemma-2b", CODE, (), "Base, fill-in-the-middle specialist."),
    # --- code: reasoning-over-code ------------------------------------------
    ("agentica-org/DeepCoder-14B-Preview", CODE, (REASONING,), "RL-trained on verified code; reasons before it writes, which is what the coding suite's failures need."),
    ("open-r1/OlympicCoder-32B", CODE, (REASONING,), "Competitive-programming traces. Long solutions with the reasoning kept in."),
    ("open-r1/OlympicCoder-7B", CODE, (REASONING,), "Same corpus at workhorse size."),
    ("nvidia/OpenCodeReasoning-Nemotron-14B", CODE, (REASONING,), "Trained on the OpenCodeReasoning corpus; strong on 'why does this fail' prompts."),
    ("nvidia/OpenCodeReasoning-Nemotron-7B", CODE, (REASONING,), "The 7B of the same line."),
    ("OpenHands/openhands-lm-32b-v0.1", CODE, (), "Trained for software-engineering agents: reads an error, edits, retries."),
    # --- code: the rest ------------------------------------------------------
    ("ByteDance-Seed/Seed-Coder-8B-Instruct", CODE, (), "Model-curated training data; MIT, so no obligation propagates."),
    ("01-ai/Yi-Coder-9B-Chat", CODE, (), "52 languages, 128k context, Apache-2.0."),
    ("01-ai/Yi-Coder-1.5B-Chat", CODE, (), "Peer-tier Yi-Coder."),
    ("m-a-p/OpenCodeInterpreter-DS-6.7B", CODE, (), "Trained with execution feedback in the loop — its data-generation method is this pipeline's."),
    ("ise-uiuc/Magicoder-S-DS-6.7B", CODE, (), "OSS-Instruct: instructions synthesised from real open-source snippets rather than from a model's imagination."),
    ("microsoft/wavecoder-ultra-6.7b", CODE, (), "Four-task code instruction tuning: generation, summarisation, repair, translation."),
    ("uukuguy/speechless-coder-ds-6.7b", CODE, (), "DeepSeek-Coder tuned on merged instruction sets; different mixture, different errors."),
    ("JetBrains/Mellum-4b-base", CODE, (), "Trained for in-IDE completion. Narrow, and the narrowness is why its completions are clean."),
    ("replit/replit-code-v1_5-3b", CODE, (), "30-language completion model, Apache-2.0."),
    ("Salesforce/codet5p-16b", CODE, (), "Encoder-decoder. A structurally different architecture in the bench, which broadens the disagreement signal."),
    ("WizardLMTeam/WizardCoder-15B-V1.0", CODE, (), "Evol-Instruct on StarCoder. The instruction-complexity ladder it was trained on is worth copying."),
    # --- hebrew -------------------------------------------------------------
    ("dicta-il/dictalm2.0-instruct", HEBREW, (MULTILINGUAL,), "The strongest openly-licensed Hebrew instruct model. Mistral continued-pretrained on Hebrew with an extended tokenizer. The single most important teacher here."),
    ("dicta-il/dictalm2.0", HEBREW, (), "The base of the above; used for continued-pretraining-style Hebrew text, not chat."),
    ("dicta-il/dictalm2.0-instruct-AWQ", HEBREW, (), "4-bit AWQ of DictaLM 2.0. The only Hebrew specialist this project's 15 GB CPU host could plausibly run."),
    ("yam-peleg/Hebrew-Mistral-7B", HEBREW, (), "Mistral with a 64k Hebrew-extended vocabulary. Base, so it writes Hebrew prose rather than answers."),
    ("yam-peleg/Hebrew-Mistral-7B-200K", HEBREW, (), "200k context variant; used for long-document Hebrew generation."),
    ("yam-peleg/Hebrew-Gemma-11B-Instruct", HEBREW, (), "Gemma-2 continued on Hebrew, instruction-tuned. Second opinion against DictaLM."),
    ("yam-peleg/Hebrew-Mixtral-8x22B", HEBREW, (), "141B MoE on Hebrew. Far out of local reach; the reference Hebrew teacher when a GPU host exists."),
    # --- multilingual generalists -------------------------------------------
    ("Qwen/Qwen3-235B-A22B-Instruct-2507", MULTILINGUAL, (REASONING,), "The strongest Apache-2.0 multilingual model available. 22B active."),
    ("Qwen/Qwen3-32B", MULTILINGUAL, (REASONING,), "Dense 32B; hybrid thinking mode, so it can produce both terse and reasoned answers from one prompt set."),
    ("Qwen/Qwen3-30B-A3B-Instruct-2507", MULTILINGUAL, (), "3B active — the cheapest way to get 30B-class multilingual output."),
    ("Qwen/Qwen3-14B", MULTILINGUAL, (), "Dense mid-size Qwen3."),
    ("Qwen/Qwen3-8B", MULTILINGUAL, (), "The Qwen3 workhorse; same tokenizer lineage as the student, so its outputs tokenize efficiently in Hebrew."),
    ("Qwen/Qwen3-4B-Instruct-2507", MULTILINGUAL, (), "Small Qwen3 that still clears the student by a wide margin."),
    ("Qwen/Qwen2.5-72B-Instruct", MULTILINGUAL, (), "The largest Qwen2.5 dense. Same family as the student, so its style transfers with least friction."),
    ("Qwen/Qwen2.5-32B-Instruct", MULTILINGUAL, (), "Strong general Qwen2.5."),
    ("Qwen/Qwen2.5-14B-Instruct", MULTILINGUAL, (), "The mid-size Qwen2.5."),
    ("Qwen/Qwen2.5-7B-Instruct", MULTILINGUAL, (), "The direct big sibling of the student's base model."),
    ("Qwen/Qwen2.5-1.5B-Instruct", MULTILINGUAL, (), "Peer-tier; the nearest thing to the student that is still better than it."),
    ("Qwen/Qwen2.5-0.5B-Instruct", MULTILINGUAL, (), "The student's own base model. Not a teacher — a control. Its answers mark the floor."),
    ("mistralai/Mistral-Small-24B-Instruct-2501", MULTILINGUAL, (), "Apache-2.0 24B; strong Spanish, which is the dimension the gate blocked RV5 on."),
    ("mistralai/Mistral-Nemo-Instruct-2407", MULTILINGUAL, (), "12B with the Tekken tokenizer; explicitly multilingual."),
    ("mistralai/Mixtral-8x7B-Instruct-v0.1", MULTILINGUAL, (), "The original open MoE. Still strong in Spanish and French."),
    ("mistralai/Mistral-7B-Instruct-v0.3", MULTILINGUAL, (), "The reference open 7B. Present as a stable, well-understood point of comparison."),
    ("google/gemma-3-27b-it", MULTILINGUAL, (), "140-language coverage, and the best Hebrew of the Gemma line."),
    ("google/gemma-3-12b-it", MULTILINGUAL, (), "Mid-size Gemma 3."),
    ("google/gemma-3-4b-it", MULTILINGUAL, (), "Small Gemma 3; runs on modest hardware and still handles Hebrew."),
    ("google/gemma-2-27b-it", MULTILINGUAL, (), "Gemma 2 flagship. Different pretraining mix from Gemma 3, so a genuine second opinion."),
    ("google/gemma-2-9b-it", MULTILINGUAL, (), "The Gemma 2 workhorse."),
    ("google/gemma-2-2b-it", MULTILINGUAL, (), "Peer-tier Gemma."),
    ("CohereLabs/aya-expanse-32b", MULTILINGUAL, (), "Purpose-built for 23 languages including Hebrew — and CC BY-NC, which is why it cannot be used. Recorded so the refusal is visible."),
    ("CohereLabs/aya-expanse-8b", MULTILINGUAL, (), "The 8B Aya Expanse. Same licence, same refusal."),
    ("CohereLabs/aya-23-8B", MULTILINGUAL, (), "Aya 23. Same licence."),
    ("CohereLabs/aya-101", MULTILINGUAL, (), "101 languages, Apache-2.0 — the one Aya whose licence permits use. mT5-based, so seq2seq rather than chat."),
    ("CohereLabs/c4ai-command-r-v01", MULTILINGUAL, (), "Command-R, 10 languages. CC BY-NC."),
    ("CohereLabs/c4ai-command-r7b-12-2024", MULTILINGUAL, (), "The 7B Command-R. CC BY-NC."),
    ("utter-project/EuroLLM-9B-Instruct", MULTILINGUAL, (), "EU-funded, all 24 EU languages plus Hebrew and Arabic. Strong Spanish."),
    ("tiiuae/Falcon3-7B-Instruct", MULTILINGUAL, (), "Falcon 3; competitive at 7B with a permissive-with-AUP licence."),
    ("ai21labs/AI21-Jamba-Mini-1.6", MULTILINGUAL, (), "Hybrid Mamba/transformer, 256k context. Architecturally unlike everything else here."),
    ("LGAI-EXAONE/EXAONE-3.5-7.8B-Instruct", MULTILINGUAL, (), "Strong bilingual model, non-commercial licence. Recorded and refused."),
    ("bigscience/bloomz-7b1-mt", MULTILINGUAL, (), "The xP3 multitask model. Old, but xP3x is already in RV5's corpus, so its output register matches."),
    ("google/flan-t5-xxl", MULTILINGUAL, (), "11B seq2seq. Not a chat model; useful for short constrained-format answers, which is exactly what v4 lost."),
    # --- reasoning ----------------------------------------------------------
    ("deepseek-ai/DeepSeek-R1-Distill-Qwen-32B", REASONING, (MATH,), "The strongest R1 distillation on a Qwen backbone; MIT."),
    ("deepseek-ai/DeepSeek-R1-Distill-Qwen-14B", REASONING, (MATH,), "The practical R1 distillation for one 24 GB card."),
    ("deepseek-ai/DeepSeek-R1-Distill-Qwen-7B", REASONING, (MATH,), "Same lineage at workhorse size, and the same tokenizer family as the student."),
    ("deepseek-ai/DeepSeek-R1-Distill-Llama-8B", REASONING, (MATH,), "The Llama-backbone R1 distillation. MIT-licensed weights on a Llama base — the licence question here needs a human read before release."),
    ("deepseek-ai/DeepSeek-R1-0528-Qwen3-8B", REASONING, (MATH,), "R1-0528 distilled into Qwen3-8B; the strongest small reasoner of its release."),
    ("Qwen/QwQ-32B", REASONING, (MATH,), "Apache-2.0 long-CoT model that matches much larger ones on reasoning benchmarks."),
    ("microsoft/Phi-4-reasoning-plus", REASONING, (MATH,), "14B trained specifically on reasoning traces; MIT."),
    ("open-thoughts/OpenThinker-7B", REASONING, (), "Open reasoning traces with an open data recipe, which matters for an auditable corpus."),
    ("nvidia/Llama-3.1-Nemotron-70B-Instruct-HF", REASONING, (GENERAL,), "Reward-model-tuned Llama 3.1. Usable, but the Llama naming obligation attaches."),
    ("nvidia/Llama-3.1-Nemotron-Nano-8B-v1", REASONING, (), "8B reasoning model under NVIDIA's open model licence."),
    # --- maths --------------------------------------------------------------
    ("Qwen/Qwen2.5-Math-7B-Instruct", MATH, (), "Chain-of-thought and tool-integrated reasoning. RV5 scores 0.108 on maths; this is the direct remedy."),
    ("Qwen/Qwen2.5-Math-1.5B-Instruct", MATH, (), "Peer-tier maths specialist, still far above the student."),
    ("AI-MO/NuminaMath-7B-TIR", MATH, (), "AIMO-winning tool-integrated reasoning: it writes Python to solve the problem, which `verify.py` can execute."),
    ("nvidia/AceMath-7B-Instruct", MATH, (), "Strong maths instruct model, CC BY-NC. Recorded and refused."),
    # --- general / English ---------------------------------------------------
    ("microsoft/phi-4", GENERAL, (REASONING,), "14B trained largely on synthetic data — the clearest existing evidence that this pipeline's premise works."),
    ("microsoft/Phi-3.5-mini-instruct", GENERAL, (), "3.8B with strong instruction following, which is the dimension RV5 must not lose."),
    ("microsoft/Phi-4-mini-instruct", GENERAL, (), "The 3.8B Phi-4. Good at short constrained answers."),
    ("meta-llama/Llama-3.3-70B-Instruct", GENERAL, (MULTILINGUAL,), "70B-class quality at 3.1-70B cost. Llama naming obligation attaches."),
    ("meta-llama/Llama-3.1-70B-Instruct", GENERAL, (MULTILINGUAL,), "The Llama 3.1 flagship."),
    ("meta-llama/Llama-3.1-8B-Instruct", GENERAL, (MULTILINGUAL,), "The most widely deployed open 8B."),
    ("meta-llama/Llama-3.2-3B-Instruct", GENERAL, (), "Small Llama 3.2."),
    ("meta-llama/Llama-3.2-1B-Instruct", GENERAL, (), "Peer-tier Llama."),
    ("allenai/OLMo-2-1124-7B-Instruct", GENERAL, (), "Fully open: data, code, checkpoints. The only teacher here whose training corpus can itself be audited for leakage against RV5's eval sets."),
    ("ibm-granite/granite-3.3-8b-instruct", GENERAL, (), "Apache-2.0 general Granite with published provenance."),
    ("HuggingFaceTB/SmolLM3-3B", GENERAL, (MULTILINGUAL,), "3B with an open data recipe and six-language support."),
    ("HuggingFaceTB/SmolLM2-1.7B-Instruct", GENERAL, (), "Peer-tier, fully open recipe."),
    ("internlm/internlm2_5-7b-chat", GENERAL, (REASONING,), "Strong 7B chat model; licence needs a human read."),
    ("01-ai/Yi-1.5-9B-Chat", GENERAL, (), "Apache-2.0 9B, strong bilingual EN/ZH."),
    ("teknium/OpenHermes-2.5-Mistral-7B", GENERAL, (CODE,), "The community fine-tune that showed code data improves general reasoning — directly relevant to this mixture's 40% code weighting."),
    ("NousResearch/Hermes-3-Llama-3.1-8B", GENERAL, (), "Hermes 3. Its card states the Llama 3 licence, which forbids output distillation — refused on the publisher's own statement."),
    ("openchat/openchat-3.5-0106", GENERAL, (), "C-RLFT-trained 7B; punches above its size on instruction following."),
    ("HuggingFaceH4/zephyr-7b-beta", GENERAL, (), "The reference DPO fine-tune. Useful for Stage 5 preference pairs, which are prepared but never run."),
    # --- considered and refused ----------------------------------------------
    # These are recorded rather than omitted. "Why is CodeLlama not in the
    # mixture" has an answer, and an absence is not an answer.
    ("codellama/CodeLlama-70b-Instruct-hf", CODE, (), "The largest Code Llama. Llama 2 licence forbids training another model on its outputs."),
    ("codellama/CodeLlama-34b-Instruct-hf", CODE, (), "Long the strongest open code model. Same licence, same refusal."),
    ("codellama/CodeLlama-13b-Instruct-hf", CODE, (), "Same licence."),
    ("codellama/CodeLlama-7b-Instruct-hf", CODE, (), "Same licence."),
    ("Phind/Phind-CodeLlama-34B-v2", CODE, (), "The Code Llama fine-tune that first passed 70% on HumanEval. Inherits the Llama 2 licence."),
    ("ise-uiuc/Magicoder-S-CL-7B", CODE, (), "The Code Llama half of Magicoder; the DeepSeek half is usable, this one is not."),
    ("WizardLMTeam/WizardCoder-Python-34B-V1.0", CODE, (), "Llama 2 base."),
    ("WizardLMTeam/WizardCoder-Python-13B-V1.0", CODE, (), "Llama 2 base."),
    ("mistralai/Codestral-22B-v0.1", CODE, (), "Excellent at 80 languages, released under the Mistral Non-Production Licence."),
    ("Qwen/Qwen2.5-Coder-3B-Instruct", CODE, (), "The one non-Apache size in the Qwen2.5-Coder line: research-only. Worth stating, because assuming the family licence would have been wrong."),
    ("Qwen/Qwen2.5-3B-Instruct", MULTILINGUAL, (), "Same trap as Coder-3B: research licence in an otherwise Apache-2.0 family."),
    ("Qwen/CodeQwen1.5-7B-Chat", CODE, (), "Tongyi Qianwen licence, commercial use permitted below 100M MAU."),
    ("NTQAI/Nxcode-CQ-7B-orpo", CODE, (), "ORPO on CodeQwen1.5; inherits the research licence."),
    ("infly/OpenCoder-8B-Instruct", CODE, (), "Fully reproducible training data — exactly the provenance this project wants. Its licence is not one of the reviewed set, so it needs a human read first."),
    ("infly/OpenCoder-1.5B-Instruct", CODE, (), "Same licence question as the 8B."),
    ("zai-org/codegeex4-all-9b", CODE, (), "Strong multilingual coder; bespoke licence needing a human read."),
    ("stabilityai/stable-code-instruct-3b", CODE, (), "Stability Community licence; revenue-thresholded, needs a human read."),
    ("codefuse-ai/CodeFuse-DeepSeek-33B", CODE, (), "Licence stated only as 'other'."),
    ("m-a-p/OpenCodeInterpreter-CL-7B", CODE, (), "No licence stated by the publisher."),
    ("Artigenz/Artigenz-Coder-DS-6.7B", CODE, (), "DeepSeek-licensed; usable, and kept as a conditional entry."),
]


def role_counts(teachers: Iterable[Teacher]) -> dict[str, int]:
    out = {r: 0 for r in ROLES}
    for t in teachers:
        for r in t.roles():
            if r in out:
                out[r] += 1
    return out
