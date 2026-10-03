from typing import Any

from langchain_core.messages import BaseMessage


def message_text(msg: BaseMessage | str | list[Any] | None) -> str:
    """Plain text of a chat message, whatever its content shape.

    Handles `str` content and block content (`[{"type": "text", "text": ...}, ...]`, as
    returned by Gemini/Anthropic); non-text blocks (thinking, tool_use...) are ignored.
    """
    content: Any = msg.content if isinstance(msg, BaseMessage) else msg
    if content is None:
        return ""
    if isinstance(content, str):
        return content
    parts: list[str] = []
    for block in content:
        if isinstance(block, str):
            parts.append(block)
        elif isinstance(block, dict) and block.get("type") == "text":
            text = block.get("text")
            if isinstance(text, str):
                parts.append(text)
    return "".join(parts)
