from langchain.chat_models import init_chat_model
from langchain_core.language_models import BaseChatModel

from frontier_agent.config import Settings, get_settings


def get_chat_model(settings: Settings | None = None) -> BaseChatModel:
    """Provider-agnostic chat model: switching provider means changing LLM_MODEL."""
    s = settings or get_settings()
    return init_chat_model(
        s.llm_model,
        temperature=s.llm_temperature,
        max_tokens=s.llm_max_tokens,
        max_retries=s.llm_max_retries,
    )
