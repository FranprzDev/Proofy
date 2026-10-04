from typing import Any

from langchain.chat_models import init_chat_model
from langchain_core.language_models import BaseChatModel

from frontier_agent.config import Settings, get_settings


def get_chat_model(settings: Settings | None = None) -> BaseChatModel:
    """Provider-agnostic chat model: switching provider means changing LLM_MODEL."""
    s = settings or get_settings()
    extra: dict[str, Any] = {}
    if s.google_api_key and s.llm_model.startswith("google_genai:"):
        extra["google_api_key"] = s.google_api_key
    model: BaseChatModel = init_chat_model(
        s.llm_model,
        temperature=s.llm_temperature,
        max_tokens=s.llm_max_tokens,
        max_retries=s.llm_max_retries,
        **extra,
    )
    return model
