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
    # Off = no model: the document agent reports llm_unavailable, the CI/CD agent stays static.
    llm_enabled: bool = False
    graph_recursion_limit: int = 25
    # Max model turns of one tool-calling agent run (document agent).
    agent_max_iterations: int = 40
    # TesterArmy e2e project dir; when set (and `npx` exists) validate_suite runs `npx e2e list`.
    e2e_project_dir: str | None = None
    # dry_run_case executes tests (costs model calls): off unless enabled.
    e2e_allow_run: bool = False
    e2e_cli_timeout_s: int = 300
    checkpointer: str = "memory"
    log_level: str = "INFO"
    # Next.js -> Python. Empty = protected endpoints reject everything (fail closed).
    agent_api_key: str = ""
    # HMAC secret for the GitHub App webhook.
    github_webhook_secret: str = ""


@lru_cache
def get_settings() -> Settings:
    return Settings()
