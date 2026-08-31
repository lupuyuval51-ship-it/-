"""Experiment tracking: what was run, on what, with what result.

Every training run gets an id (`rv5-exp-001`) and a directory under
`experiments/` holding its config, its git commit, the datasets it read, its
metrics and the checkpoint it produced. The point is not bookkeeping for its
own sake — it is that six runs in, "which config produced the checkpoint that
scored 0.41 on Hebrew" has to have an answer, and reconstructing it from shell
history does not work.

Deliberately a directory of JSON rather than a tracking service: this has to
work on a machine with no GPU and no network, and a run must not fail because
a tracking backend is unreachable.
"""
from __future__ import annotations

import json
import platform
import re
import subprocess
from dataclasses import asdict, dataclass, field
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from ..paths import EXPERIMENTS

ID_RE = re.compile(r"^rv5-exp-(\d{3,})$")


def _now() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


def git_commit() -> str | None:
    try:
        out = subprocess.run(["git", "rev-parse", "HEAD"], capture_output=True,
                             text=True, timeout=10, cwd=str(EXPERIMENTS.parent))
    except (OSError, subprocess.SubprocessError):
        return None
    if out.returncode:
        return None
    commit = out.stdout.strip()
    dirty = subprocess.run(["git", "status", "--porcelain"], capture_output=True,
                           text=True, timeout=10, cwd=str(EXPERIMENTS.parent))
    return commit + ("-dirty" if dirty.stdout.strip() else "")


def next_id(root: Path | None = None) -> str:
    root = root or EXPERIMENTS
    root.mkdir(parents=True, exist_ok=True)
    highest = 0
    for entry in root.iterdir():
        m = ID_RE.match(entry.name)
        if m:
            highest = max(highest, int(m.group(1)))
    return f"rv5-exp-{highest + 1:03d}"


@dataclass
class Experiment:
    id: str
    stage: str                              # pretrain | sft | reasoning | coding | preference
    config_name: str
    base_model: str
    output_dir: str
    started_at: str = field(default_factory=_now)
    finished_at: str | None = None
    status: str = "running"                 # running | completed | failed | interrupted
    git_commit: str | None = field(default_factory=git_commit)
    host: dict = field(default_factory=lambda: {
        "platform": platform.platform(), "python": platform.python_version()})
    config: dict = field(default_factory=dict)
    datasets: list[dict] = field(default_factory=list)
    metrics: dict = field(default_factory=dict)
    benchmark: dict = field(default_factory=dict)
    checkpoint: str | None = None
    notes: str = ""
    error: str | None = None

    @property
    def path(self) -> Path:
        return EXPERIMENTS / self.id

    def save(self) -> None:
        self.path.mkdir(parents=True, exist_ok=True)
        (self.path / "experiment.json").write_text(
            json.dumps(asdict(self), indent=2, ensure_ascii=False), encoding="utf-8")

    @classmethod
    def load(cls, experiment_id: str) -> "Experiment":
        path = EXPERIMENTS / experiment_id / "experiment.json"
        if not path.exists():
            raise FileNotFoundError(f"no such experiment: {experiment_id}")
        return cls(**json.loads(path.read_text(encoding="utf-8")))

    @classmethod
    def start(cls, stage: str, config, datasets: list[dict] | None = None,
              notes: str = "") -> "Experiment":
        exp = cls(
            id=next_id(), stage=stage, config_name=config.name,
            base_model=config.model.name, output_dir=config.training.output_dir,
            config=config.to_dict(), datasets=datasets or [], notes=notes)
        exp.save()
        return exp

    def log(self, **metrics: Any) -> None:
        """Append a metric record. The full history is kept, not just the last
        value — a loss curve is the thing you actually need when a run goes
        wrong, and the final number tells you nothing about how it got there."""
        history = self.metrics.setdefault("history", [])
        history.append({"at": _now(), **metrics})
        for key, value in metrics.items():
            if isinstance(value, (int, float)):
                self.metrics[f"last_{key}"] = value
        self.save()

    def finish(self, status: str = "completed", checkpoint: str | None = None,
               error: str | None = None) -> None:
        self.status = status
        self.finished_at = _now()
        if checkpoint:
            self.checkpoint = checkpoint
        if error:
            self.error = error
        self.save()

    def record_benchmark(self, results: dict) -> None:
        self.benchmark = results
        self.save()


def all_experiments() -> list[Experiment]:
    if not EXPERIMENTS.exists():
        return []
    out = []
    for entry in sorted(EXPERIMENTS.iterdir()):
        if ID_RE.match(entry.name) and (entry / "experiment.json").exists():
            try:
                out.append(Experiment.load(entry.name))
            except (json.JSONDecodeError, TypeError):
                continue
    return out
