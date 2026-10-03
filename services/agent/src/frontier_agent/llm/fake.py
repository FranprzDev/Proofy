from collections.abc import Sequence
from typing import Any

from langchain_core.callbacks import CallbackManagerForLLMRun
from langchain_core.language_models import BaseChatModel
from langchain_core.language_models.fake_chat_models import FakeListChatModel
from langchain_core.messages import AIMessage, BaseMessage
from langchain_core.outputs import ChatGeneration, ChatResult
from langchain_core.runnables import Runnable
from pydantic import Field


def make_fake_chat_model(*responses: str) -> FakeListChatModel:
    """Deterministic, network-free model for tests and evals."""
    return FakeListChatModel(responses=list(responses) or ["ok"])


class FakeToolCallingModel(BaseChatModel):
    """Replays scripted `AIMessage`s in order; `bind_tools` is a no-op.

    Once the script is exhausted it answers an empty message without tool calls, which ends
    any tool-calling loop. `seen` records the messages received on each call.
    """

    script: list[AIMessage] = Field(default_factory=list)
    seen: list[list[BaseMessage]] = Field(default_factory=list)
    index: int = 0

    @property
    def _llm_type(self) -> str:
        return "fake-tool-calling"

    def _generate(
        self,
        messages: list[BaseMessage],
        stop: list[str] | None = None,
        run_manager: CallbackManagerForLLMRun | None = None,
        **kwargs: Any,
    ) -> ChatResult:
        self.seen.append(list(messages))
        if self.index < len(self.script):
            msg = self.script[self.index]
            self.index += 1
        else:
            msg = AIMessage(content="")
        return ChatResult(generations=[ChatGeneration(message=msg)])

    def bind_tools(self, tools: Sequence[Any], **kwargs: Any) -> Runnable[Any, AIMessage]:
        return self


def tool_call_message(*calls: tuple[str, dict[str, Any]], content: str = "") -> AIMessage:
    """One AIMessage requesting the given `(tool_name, args)` calls."""
    return AIMessage(
        content=content,
        tool_calls=[
            {"name": name, "args": args, "id": f"call_{i}_{name}", "type": "tool_call"}
            for i, (name, args) in enumerate(calls)
        ],
    )


def make_fake_tool_model(*messages: AIMessage) -> FakeToolCallingModel:
    """Network-free tool-calling chat model that replays `messages` (see `tool_call_message`)."""
    return FakeToolCallingModel(script=list(messages))
