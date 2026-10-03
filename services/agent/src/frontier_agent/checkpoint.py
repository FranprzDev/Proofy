from typing import Any

from langgraph.checkpoint.base import BaseCheckpointSaver
from langgraph.checkpoint.memory import MemorySaver

from frontier_agent.config import Settings, get_settings


def make_checkpointer(settings: Settings | None = None) -> BaseCheckpointSaver[Any]:
    """Single factory: switch to Postgres/SQLite here once persistence is needed."""
    s = settings or get_settings()
    if s.checkpointer == "memory":
        return MemorySaver()
    raise ValueError(f"checkpointer not supported yet: {s.checkpointer}")
