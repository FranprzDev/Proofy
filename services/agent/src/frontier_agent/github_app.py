"""GitHub App manifest and manifest-code conversion helpers."""

import json
import logging
import urllib.error
import urllib.request
from typing import Any, cast

from frontier_agent.config import Settings

log = logging.getLogger("frontier_agent")

_GITHUB_API = "https://api.github.com"


def build_manifest(settings: Settings) -> dict[str, Any]:
    """JSON payload for https://github.com/settings/apps/new?manifest_url=..."""
    return {
        "name": settings.github_app_name,
        "url": settings.github_app_homepage_url,
        "description": settings.github_app_description,
        "hook_attributes": {"url": settings.github_app_webhook_url},
        "redirect_url": settings.github_app_callback_url,
        "default_permissions": {
            "actions": "read",
            "contents": "read",
            "metadata": "read",
            "pull_requests": "write",
        },
        "default_events": ["workflow_run", "pull_request"],
        "public": settings.github_app_public,
        "enable_ssl": not settings.github_app_webhook_url.startswith("http://"),
    }


def exchange_code(code: str) -> dict[str, Any]:
    """Convert the temporary GitHub App manifest code into app credentials."""
    request = urllib.request.Request(
        f"{_GITHUB_API}/app-manifests/{code}/conversions",
        data=b"{}",
        method="POST",
        headers={
            "Accept": "application/vnd.github+json",
            "Content-Type": "application/json",
            "X-GitHub-Api-Version": "2022-11-28",
            "User-Agent": "frontier-agent/0.1.0",
        },
    )
    try:
        with urllib.request.urlopen(request, timeout=30) as response:
            return cast(dict[str, Any], json.loads(response.read()))
    except urllib.error.HTTPError as exc:
        log.warning("github.app.exchange_failed", extra={"ctx": {"status": exc.code}})
        raise RuntimeError(f"GitHub App manifest exchange failed: {exc.code} {exc.reason}") from exc
