import hashlib
import hmac
import json

from fastapi.testclient import TestClient

from frontier_agent.api.app import create_app
from frontier_agent.config import Settings, get_settings

REF = {"milestone_id": "m", "contract_version": "v", "revision": "a"}
KEY = "k-test"
SECRET = "s-test"


def make_client() -> TestClient:
    app = create_app()
    app.dependency_overrides[get_settings] = lambda: Settings(
        agent_api_key=KEY, github_webhook_secret=SECRET
    )
    return TestClient(app)


client = make_client()
H = {"X-API-Key": KEY}


def test_health() -> None:
    assert client.get("/health").json() == {"status": "ok"}


def test_requires_api_key() -> None:
    assert client.post("/cicd/invoke", json={"expected": REF}).status_code == 401
    bad = {"X-API-Key": "x"}
    assert client.post("/cicd/invoke", json={"expected": REF}, headers=bad).status_code == 401


def test_unconfigured_api_key_fails_closed() -> None:
    app = create_app()
    app.dependency_overrides[get_settings] = lambda: Settings(agent_api_key="")
    r = TestClient(app).post("/cicd/invoke", json={"expected": REF}, headers=H)
    assert r.status_code == 503


def test_cicd_invoke() -> None:
    r = client.post("/cicd/invoke", json={"expected": REF}, headers=H)
    assert r.status_code == 200 and r.json()["verdict"] == "inconclusive"


def test_cicd_stream_sse() -> None:
    r = client.post("/cicd/stream", json={"expected": REF}, headers=H)
    assert "event: update" in r.text and "event: done" in r.text


def test_openapi_exposes_contracts() -> None:
    assert "CicdState" in client.get("/openapi.json").json()["components"]["schemas"]


def _signed(body: bytes, secret: str = SECRET) -> dict[str, str]:
    sig = "sha256=" + hmac.new(secret.encode(), body, hashlib.sha256).hexdigest()
    return {"X-Hub-Signature-256": sig, "X-GitHub-Event": "workflow_run"}


def test_webhook_valid_signature() -> None:
    body = json.dumps(
        {
            "action": "completed",
            "workflow_run": {"id": 1, "head_sha": "abc123", "status": "completed"},
            "repository": {"full_name": "o/r"},
        }
    ).encode()
    r = client.post("/webhooks/github", content=body, headers=_signed(body))
    assert r.status_code == 202 and r.json()["head_sha"] == "abc123"


def test_webhook_invalid_signature() -> None:
    body = b"{}"
    r = client.post("/webhooks/github", content=body, headers=_signed(body, "other"))
    assert r.status_code == 401
