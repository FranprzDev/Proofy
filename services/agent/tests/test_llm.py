from langchain_core.messages import AIMessage

from frontier_agent.llm import message_text
from frontier_agent.llm.fake import make_fake_chat_model, make_fake_tool_model, tool_call_message


def test_fake_model_determinista() -> None:
    assert make_fake_chat_model("hola").invoke("x").content == "hola"


def test_message_text_str_and_blocks() -> None:
    assert message_text(AIMessage(content="hi")) == "hi"
    blocks: list[str | dict[str, str]] = [
        {"type": "thinking", "thinking": "hmm"},
        {"type": "text", "text": "a"},
        "b",
        {"type": "text", "text": "c"},
    ]
    assert message_text(AIMessage(content=blocks)) == "abc"
    assert message_text(None) == ""
    assert message_text([{"type": "text", "text": "x"}]) == "x"


def test_fake_tool_model_replays_then_stops() -> None:
    model = make_fake_tool_model(tool_call_message(("finish", {})))
    bound = model.bind_tools([])
    first = bound.invoke("x")
    assert isinstance(first, AIMessage) and first.tool_calls[0]["name"] == "finish"
    second = bound.invoke("y")
    assert isinstance(second, AIMessage) and not second.tool_calls
    assert len(model.seen) == 2
