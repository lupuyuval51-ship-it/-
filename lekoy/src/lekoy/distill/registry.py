"""`data/teachers_registry.json` — which models train LEKOY, and which may not.

The same contract as `data/datasets_registry.json`: every model considered gets
an entry, a `selected` one carries the facts the pipeline needs, and a
`rejected` one carries the reason it was refused. A model that is simply absent
from the file was never considered, and that is the only thing absence means.

Facts come from the Hugging Face model API at build time — licence, licence
name, parameter count, gating, downloads. Nothing here is typed in by hand
except the role and the note, because a parameter count that was accurate in
March is not evidence in September.
"""
from __future__ import annotations

import json
import math
import urllib.error
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

from ..paths import DATA
from .licences import CONDITIONAL, PERMITTED, obligations
from .teachers import CANDIDATES, CODE, HEBREW, ROLES, Teacher

TEACHERS_REGISTRY = DATA / "teachers_registry.json"

API = ("https://huggingface.co/api/models/{}"
       "?expand[]=safetensors&expand[]=cardData&expand[]=gated"
       "&expand[]=downloads&expand[]=likes&expand[]=tags")
USER_AGENT = "lekoy-teacher-registry/0.1 (+https://huggingface.co/docs/hub/api)"

# The registry is built to a fixed size so that "how many teachers" is a
# decision recorded in one place rather than an accident of how many candidates
# happened to survive the licence gate.
TARGET = 100
CODE_FLOOR = 40


def _now() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


class ProbeError(RuntimeError):
    """The hub could not tell us about a model."""


def probe(model_id: str, timeout: int = 30) -> dict:
    """Ask the hub what this model actually is. No token, public metadata only."""
    request = urllib.request.Request(API.format(model_id),
                                     headers={"User-Agent": USER_AGENT})
    try:
        with urllib.request.urlopen(request, timeout=timeout) as response:
            payload = json.loads(response.read())
    except urllib.error.HTTPError as exc:
        raise ProbeError(f"HTTP {exc.code}") from exc
    except (urllib.error.URLError, TimeoutError, OSError, ValueError) as exc:
        raise ProbeError(str(exc) or type(exc).__name__) from exc

    card = payload.get("cardData") or {}
    safetensors = payload.get("safetensors") or {}
    return {
        # The hub redirects renamed repositories; keep what it resolved to, not
        # what we asked for, or the next refresh re-resolves the same redirect.
        "id": payload.get("id", model_id),
        "licence": card.get("license"),
        "licence_name": card.get("license_name"),
        "params": safetensors.get("total"),
        "gated": bool(payload.get("gated", False)),
        "downloads": payload.get("downloads", 0) or 0,
        "likes": payload.get("likes", 0) or 0,
        "tags": [t for t in (payload.get("tags") or [])
                 if not t.startswith(("region:", "arxiv:", "doi:", "base_model:"))][:12],
    }


def _rank(teacher: Teacher) -> tuple:
    """How much this teacher is worth to a 0.49B student.

    Tier first, because a peer-sized teacher cannot lift the student however
    popular it is. Then an unconditional licence over a conditional one, since
    every conditional teacher adds an obligation to the release. Downloads only
    break ties — popularity is evidence of nothing except popularity, but it is
    a reasonable proxy for "this checkpoint loads and works".
    """
    tier_order = {"frontier": 0, "strong": 1, "unknown": 2, "peer": 3}
    return (tier_order[teacher.tier],
            0 if teacher.verdict.status == PERMITTED else 1,
            -math.log1p(teacher.downloads),
            teacher.id)


def select(teachers: list[Teacher], target: int = TARGET,
           code_floor: int = CODE_FLOOR) -> tuple[list[Teacher], list[Teacher]]:
    """Choose the faculty: `target` teachers, at least `code_floor` of them code.

    The floor is filled first and from the top of the code ranking, so raising
    it never degrades the code half — it only takes slots from the general half.
    Returns (selected, rejected); rejected entries carry the reason.
    """
    usable, rejected = [], []
    for teacher in teachers:
        verdict = teacher.verdict
        if verdict.usable:
            usable.append(teacher)
        else:
            teacher.status = "rejected"
            teacher.reason = verdict.reason
            rejected.append(teacher)

    usable.sort(key=_rank)
    chosen: list[Teacher] = []
    seen: set[str] = set()

    for teacher in usable:
        if len(chosen) >= code_floor:
            break
        if CODE in teacher.roles():
            chosen.append(teacher)
            seen.add(teacher.id)

    for teacher in usable:
        if len(chosen) >= target:
            break
        if teacher.id not in seen:
            chosen.append(teacher)
            seen.add(teacher.id)

    for teacher in chosen:
        teacher.status = "selected"
    for teacher in usable:
        if teacher.id not in seen:
            teacher.status = "rejected"
            teacher.reason = (
                f"licence permits it, but the faculty is capped at {target} and "
                f"{teacher.tier}-tier teachers ranked below the cut")
            rejected.append(teacher)

    chosen.sort(key=_rank)
    return chosen, rejected


def build(progress=None) -> dict:
    """Probe every candidate, apply the licence gate, and choose the faculty."""
    teachers, unreachable = [], []
    for model_id, role, also, note in CANDIDATES:
        try:
            facts = probe(model_id)
        except ProbeError as exc:
            unreachable.append({"id": model_id, "role": role, "note": note,
                                "status": "rejected",
                                "reason": f"not reachable on the hub ({exc})"})
            if progress:
                progress(model_id, f"unreachable: {exc}")
            continue
        teachers.append(Teacher(id=facts["id"], role=role, also=tuple(also), note=note,
                                licence=facts["licence"], licence_name=facts["licence_name"],
                                params=facts["params"], gated=facts["gated"],
                                downloads=facts["downloads"], likes=facts["likes"],
                                tags=facts["tags"]))
        if progress:
            progress(facts["id"], facts["licence"] or "unstated")

    selected, rejected = select(teachers)
    return _payload(selected, rejected, unreachable)


def _entry(teacher: Teacher) -> dict:
    verdict = teacher.verdict
    return {
        "id": teacher.id, "role": teacher.role, "also": list(teacher.also),
        "status": teacher.status, "note": teacher.note,
        "licence": teacher.licence, "licence_name": teacher.licence_name,
        "licence_verdict": verdict.status, "licence_reason": verdict.reason,
        "reason": teacher.reason,
        "params": teacher.params, "billions": teacher.billions,
        "tier": teacher.tier,
        "vram_gb_bf16": teacher.vram_gb(16), "vram_gb_int4": teacher.vram_gb(4),
        "gated": teacher.gated, "downloads": teacher.downloads,
        "likes": teacher.likes, "tags": teacher.tags,
    }


def _payload(selected: list[Teacher], rejected: list[Teacher],
             unreachable: list[dict]) -> dict:
    by_role = {r: sum(1 for t in selected if r in t.roles()) for r in ROLES}
    by_licence: dict[str, int] = {}
    for teacher in selected:
        by_licence[teacher.verdict.licence] = by_licence.get(teacher.verdict.licence, 0) + 1
    return {
        "family": "LEKOY",
        "purpose": "teacher models for distillation into LEKOY students",
        "updated_at": _now(),
        "summary": {
            "candidates": len(selected) + len(rejected) + len(unreachable),
            "selected": len(selected),
            "rejected": len(rejected) + len(unreachable),
            "code_teachers": by_role[CODE],
            "hebrew_teachers": by_role[HEBREW],
            "by_role": by_role,
            "by_tier": {t: sum(1 for x in selected if x.tier == t)
                        for t in ("frontier", "strong", "peer", "unknown")},
            "by_licence": dict(sorted(by_licence.items())),
            "unconditional": sum(1 for t in selected if t.verdict.status == PERMITTED),
            "conditional": sum(1 for t in selected if t.verdict.status == CONDITIONAL),
            "gated": sum(1 for t in selected if t.gated),
            "total_parameters": sum(t.params or 0 for t in selected),
        },
        "release_obligations": obligations([t.verdict for t in selected]),
        "teachers": [_entry(t) for t in selected],
        "rejected": [_entry(t) for t in rejected] + unreachable,
    }


def save(payload: dict, path: Path | None = None) -> Path:
    path = Path(path or TEACHERS_REGISTRY)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n",
                    encoding="utf-8")
    return path


def load(path: Path | None = None) -> list[Teacher]:
    """The selected faculty, as `Teacher` objects."""
    path = Path(path or TEACHERS_REGISTRY)
    if not path.exists():
        raise FileNotFoundError(
            f"{path} does not exist — run scripts/build_teachers.py first")
    payload = json.loads(path.read_text(encoding="utf-8"))
    return [Teacher(id=e["id"], role=e["role"], also=tuple(e.get("also", [])),
                    note=e.get("note", ""), licence=e.get("licence"),
                    licence_name=e.get("licence_name"), params=e.get("params"),
                    gated=e.get("gated", False), downloads=e.get("downloads", 0),
                    likes=e.get("likes", 0), status=e.get("status", "selected"),
                    tags=e.get("tags", []))
            for e in payload.get("teachers", [])]


def filter_teachers(teachers: list[Teacher], role: str | None = None,
                    max_vram_gb: float | None = None, bits: int = 16,
                    unconditional_only: bool = False,
                    include_gated: bool = True) -> list[Teacher]:
    """Narrow the faculty to what this host and this release can actually use."""
    out = list(teachers)
    if role:
        out = [t for t in out if role in t.roles()]
    if unconditional_only:
        out = [t for t in out if t.verdict.status == PERMITTED]
    if not include_gated:
        out = [t for t in out if not t.gated]
    if max_vram_gb is not None:
        out = [t for t in out
               if t.vram_gb(bits) is not None and t.vram_gb(bits) <= max_vram_gb]
    return out
