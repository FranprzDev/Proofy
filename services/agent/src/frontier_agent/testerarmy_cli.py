"""Thin wrapper over the real TesterArmy `e2e` CLI (subprocess, timeout, cwd = project dir).

Tools call `run_e2e_cli` / `read_report` through this module so tests can monkeypatch them.
"""

import json
import subprocess
from dataclasses import dataclass
from pathlib import Path
from typing import Any

TIMEOUT_RETURNCODE = 124
NOT_FOUND_RETURNCODE = 127


@dataclass(frozen=True)
class CliResult:
    returncode: int
    stdout: str
    stderr: str


def run_e2e_cli(args: list[str], cwd: str, timeout_s: int) -> CliResult:
    """Run `npx e2e <args>` in `cwd`. Never raises: failures map to a non-zero returncode."""
    try:
        proc = subprocess.run(  # noqa: S603
            ["npx", "e2e", *args],  # noqa: S607
            cwd=cwd,
            capture_output=True,
            text=True,
            timeout=timeout_s,
            check=False,
        )
    except FileNotFoundError:
        return CliResult(NOT_FOUND_RETURNCODE, "", "`npx` was not found on PATH.")
    except subprocess.TimeoutExpired:
        return CliResult(TIMEOUT_RETURNCODE, "", f"`e2e {args[0]}` timed out after {timeout_s}s.")
    except OSError as exc:
        return CliResult(NOT_FOUND_RETURNCODE, "", str(exc))
    return CliResult(proc.returncode, proc.stdout, proc.stderr)


def read_report(cwd: str) -> dict[str, Any] | None:
    """`<cwd>/.e2e/report.json` as a dict, or None when missing/unreadable."""
    path = Path(cwd) / ".e2e" / "report.json"
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, ValueError):
        return None
    return data if isinstance(data, dict) else None
