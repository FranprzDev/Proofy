import hashlib
import hmac
from typing import Annotated

from fastapi import Depends, Header, HTTPException, status

from frontier_agent.config import Settings, get_settings


def require_api_key(
    settings: Annotated[Settings, Depends(get_settings)],
    x_api_key: Annotated[str | None, Header()] = None,
) -> None:
    """API key compartida Next.js -> Python, comparada en tiempo constante."""
    if not settings.agent_api_key:
        raise HTTPException(status.HTTP_503_SERVICE_UNAVAILABLE, "API key no configurada")
    if x_api_key is None or not hmac.compare_digest(
        x_api_key.encode(), settings.agent_api_key.encode()
    ):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "API key inválida")


def verify_github_signature(secret: str, body: bytes, signature: str | None) -> bool:
    """Valida X-Hub-Signature-256 (HMAC SHA-256 del cuerpo crudo)."""
    if not secret or not signature:
        return False
    expected = "sha256=" + hmac.new(secret.encode(), body, hashlib.sha256).hexdigest()
    return hmac.compare_digest(expected, signature)
