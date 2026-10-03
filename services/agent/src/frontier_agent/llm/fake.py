from langchain_core.language_models.fake_chat_models import FakeListChatModel


def make_fake_chat_model(*responses: str) -> FakeListChatModel:
    """Deterministic, network-free model for tests and evals."""
    return FakeListChatModel(responses=list(responses) or ["ok"])
