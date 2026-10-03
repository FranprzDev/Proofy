from frontier_agent.llm.fake import make_fake_chat_model


def test_fake_model_determinista() -> None:
    assert make_fake_chat_model("hola").invoke("x").content == "hola"
