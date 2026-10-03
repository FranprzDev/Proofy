from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_prefix="", extra="ignore")

    # "<provider>:<model>", resuelto por langchain init_chat_model.
    llm_model: str = "google_genai:gemini-2.5-flash"
    llm_temperature: float = 0.0
    # Topes de costo: configurables por env.
    llm_max_retries: int = 2
    llm_max_tokens: int = 4096
    graph_recursion_limit: int = 25
    checkpointer: str = "memory"
    log_level: str = "INFO"
    # Next.js -> Python. Vacío = endpoints protegidos rechazan todo (falla cerrada).
    agent_api_key: str = ""
    # Secret HMAC del webhook de la GitHub App.
    github_webhook_secret: str = ""


@lru_cache
def get_settings() -> Settings:
    return Settings()
