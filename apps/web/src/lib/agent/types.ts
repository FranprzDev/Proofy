// Types generated from the FastAPI OpenAPI schema (`pnpm gen:api`). Do not edit schema.d.ts by hand.
import type { components } from "./schema";

type Schemas = components["schemas"];

// Agent 1: document → verbal test cases + TesterArmy e2e suite.
export type DocumentInput = Schemas["DocumentInput"];
export type DocumentState = Schemas["DocumentState"];
export type Ambiguity = Schemas["Ambiguity"];
export type TestCase = Schemas["TestCase"];

// Agent 2: PR review (dynamic E2E evidence + static analysis).
export type CicdInput = Schemas["CicdInput"];
export type CicdState = Schemas["CicdState"];
export type Ref = Schemas["Ref"];
export type PullRequest = Schemas["PullRequest"];
export type ChangedFile = Schemas["ChangedFile"];
export type StaticReports = Schemas["StaticReports"];
export type ScenarioResult = Schemas["ScenarioResult"];
export type Finding = Schemas["Finding"];
