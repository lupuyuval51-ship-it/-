"""Console entry points, so `lekoy-chat` and `lekoy-serve` work after install.

Thin by design: the scripts in `scripts/` are the real interface and are what
the documentation refers to. These exist so that an installed copy of the
package is usable without the repository checked out beside it.
"""
from __future__ import annotations

import sys
from pathlib import Path

SCRIPTS = Path(__file__).resolve().parents[2] / "scripts"


def _run(name: str) -> int:
    if not (SCRIPTS / f"{name}.py").exists():
        print(f"{name}.py not found at {SCRIPTS}. The console entry points "
              "require the LEKOY repository; run the script directly instead.",
              file=sys.stderr)
        return 2
    sys.path.insert(0, str(SCRIPTS))
    module = __import__(name)
    return module.main()


def chat() -> int:
    return _run("chat")


def serve() -> int:
    return _run("serve")
