"""Contract for the GitHub App `workflow_run` event (only the fields we use)."""

from pydantic import BaseModel, ConfigDict


class WorkflowRun(BaseModel):
    model_config = ConfigDict(extra="ignore")

    id: int
    name: str | None = None
    head_sha: str  # Exact SHA: identifies the evaluated revision
    status: str
    conclusion: str | None = None


class Repository(BaseModel):
    model_config = ConfigDict(extra="ignore")

    full_name: str


class WorkflowRunEvent(BaseModel):
    model_config = ConfigDict(extra="ignore")

    action: str
    workflow_run: WorkflowRun
    repository: Repository
