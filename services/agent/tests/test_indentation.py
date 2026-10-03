from frontier_agent.graphs.cicd.indentation import check_indentation


def msgs(path: str, content: str) -> list[str]:
    return [f.message for f in check_indentation(path, content)]


def test_clean_python() -> None:
    assert msgs("a.py", "def f():\n    return 1\n") == []


def test_python_bad_unit() -> None:
    assert any("multiple of 4" in m for m in msgs("a.py", "def f():\n  return 1\n"))


def test_ts_unit_is_two() -> None:
    assert msgs("a.ts", "if (a) {\n  b();\n}\n") == []
    assert any("multiple of 2" in m for m in msgs("a.ts", "if (a) {\n   b();\n}\n"))


def test_tabs_and_mixed() -> None:
    assert any("Tab" in m for m in msgs("a.py", "if x:\n\treturn\n"))
    assert any("Mixed" in m for m in msgs("a.py", "if x:\n \t return\n"))


def test_trailing_whitespace_and_final_newline() -> None:
    found = msgs("a.py", "x = 1 \ny = 2")
    assert "Trailing whitespace." in found
    assert "Missing final newline." in found


def test_unknown_extension_and_docstring_ignored() -> None:
    assert msgs("a.md", "  x\t\n") == []
    assert msgs("a.py", 'def f():\n    """\n      odd\n    """\n') == []


def test_jsdoc_continuation_allowed() -> None:
    assert msgs("a.ts", "/**\n * doc\n */\n") == []
