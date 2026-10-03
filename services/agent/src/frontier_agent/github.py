"""Contrato del evento `workflow_run` de la GitHub App (solo los campos usados)."""

from pydantic import BaseModel, ConfigDict


class WorkflowRun(BaseModel):
    model_config = ConfigDict(extra="ignore")

    id: int
    name: str | None = None
    head_sha: str  # SHA exacto: identifica la revisión evaluada
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
