import json

from frontier_agent.graphs.document import TestCase
from frontier_agent.schemas import Priority, TestKind
from frontier_agent.testerarmy import render_suite


def _case(**kw: object) -> TestCase:
    base: dict[str, object] = {
        "id": "TC-001",
        "clause": "c",
        "title": "Login",
        "objective": "o",
        "steps": ["Log in"],
        "expected_results": ["Dashboard shown"],
    }
    return TestCase.model_validate(base | kw)


def test_renders_ui_cases_and_plan() -> None:
    files = render_suite([_case(start_path="/login")], "c1", "v1")
    ts = files["tests/c1.e2e.ts"]
    assert "import { test } from '@e2e-dev/web';" in ts
    assert "credentials" not in ts
    assert 'test("TC-001: Login", async ({ app, agent }) => {' in ts
    assert 'await app.open("/login");' in ts
    assert 'await agent.act("Log in");' in ts
    assert 'await agent.assert("Dashboard shown");' in ts
    assert "Generated" in ts
    plan = json.loads(files["plan.json"])
    assert plan["contract_id"] == "c1" and plan["contract_version"] == "v1"
    assert plan["test_cases"][0]["id"] == "TC-001"
    assert plan["test_cases"][0]["runner"] == "testerarmy"


def test_escapes_quotes_and_newlines() -> None:
    files = render_suite([_case(steps=['Type "hi"\nthen go'], title='It\'s "x"')], "c1", "v1")
    ts = files["tests/c1.e2e.ts"]
    assert 'agent.act("Type \\"hi\\"\\nthen go")' in ts
    assert '"TC-001: It\'s \\"x\\""' in ts


def test_api_cases_only_in_plan() -> None:
    files = render_suite([_case(kind=TestKind.API, priority=Priority.LOW)], "c1", "v1")
    assert list(files) == ["plan.json"]
    case = json.loads(files["plan.json"])["test_cases"][0]
    assert case["runner"] == "manual-api" and case["priority"] == "low"


def test_contract_id_is_sanitized_in_filename() -> None:
    files = render_suite([_case()], "../evil/id", "v1")
    assert "tests/evil-id.e2e.ts" in files


def test_params_and_credentials() -> None:
    case = _case(
        steps=["sign in with {username} and {password}", "add a todo named {title}"],
        test_data={"title": "Milk"},
        credentials_role="member",
    )
    ts = render_suite([case], "c1", "v1")["tests/c1.e2e.ts"]
    assert "import { credentials } from 'e2e';" in ts
    assert 'const cred = credentials.user("member");' in ts
    assert '{ params: { "username": cred.username, "password": cred.password } }' in ts
    assert '{ params: { "title": "Milk" } }' in ts
