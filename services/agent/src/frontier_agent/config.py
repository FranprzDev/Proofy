from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_prefix="", extra="ignore")

    # "<provider>:<model>", resolved by langchain init_chat_model.
    llm_model: str = "google_genai:gemini-2.5-flash"
    llm_temperature: float = 0.0
    # Cost caps: configurable via env.
    llm_max_retries: int = 2
    llm_max_tokens: int = 4096
    graph_recursion_limit: int = 25
    checkpointer: str = "memory"
    log_level: str = "INFO"
    # Next.js -> Python. Empty = protected endpoints reject everything (fail closed).
    agent_api_key: str = ""
    # HMAC secret for the GitHub App webhook.
    github_webhook_secret: str = ""


@lru_cache
def get_settings() -> Settings:
    return Settings()
