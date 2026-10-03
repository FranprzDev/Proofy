from typing import Any

from langgraph.checkpoint.base import BaseCheckpointSaver
from langgraph.checkpoint.memory import MemorySaver

from frontier_agent.config import Settings, get_settings


def make_checkpointer(settings: Settings | None = None) -> BaseCheckpointSaver[Any]:
    """Fábrica única: aquí se cambia a Postgres/SQLite cuando haya persistencia."""
    s = settings or get_settings()
    if s.checkpointer == "memory":
        return MemorySaver()
    raise ValueError(f"checkpointer no soportado todavía: {s.checkpointer}")
