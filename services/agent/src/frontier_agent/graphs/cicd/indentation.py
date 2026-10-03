"""Deterministic indentation checker over file contents."""

from pathlib import PurePosixPath

from frontier_agent.graphs.cicd.state import ChangedFile, Finding

INDENT_UNITS = {
    ".py": 4,
    ".ts": 2,
    ".tsx": 2,
    ".js": 2,
    ".jsx": 2,
    ".json": 2,
    ".yml": 2,
    ".yaml": 2,
}


def check_indentation(path: str, content: str) -> list[Finding]:
    unit = INDENT_UNITS.get(PurePosixPath(path).suffix)
    if unit is None:
        return []
    is_py = path.endswith(".py")

    def err(line: int | None, msg: str) -> Finding:
        return Finding(
            source="indentation",
            severity="error",
            blocking=True,
            path=path,
            line=line,
            rule="indent",
            message=msg,
        )

    out: list[Finding] = []
    in_string = False  # inside a Python triple-quoted block
    for n, line in enumerate(content.split("\n"), start=1):
        if line != line.rstrip():
            out.append(err(n, "Trailing whitespace."))
        stripped = line.strip()
        was_in_string = in_string
        if is_py and (line.count('"""') % 2 or line.count("'''") % 2):
            in_string = not in_string
        if not stripped or was_in_string:
            continue
        indent = line[: len(line) - len(line.lstrip())]
        if " " in indent and "\t" in indent:
            out.append(err(n, "Mixed tabs and spaces in indentation."))
        elif "\t" in indent:
            out.append(err(n, "Tab indentation; use spaces."))
        elif len(indent) % unit and not (stripped.startswith("*") and not is_py):
            out.append(err(n, f"Indentation of {len(indent)} is not a multiple of {unit}."))
    if content and not content.endswith("\n"):
        out.append(err(None, "Missing final newline."))
    return out


def check_files(files: list[ChangedFile]) -> list[Finding]:
    out: list[Finding] = []
    for f in files:
        if f.content is not None:
            out.extend(check_indentation(f.path, f.content))
    return out
