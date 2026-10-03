.PHONY: setup dev-agent dev-web test lint typecheck build gen-api check

setup:
	cd services/agent && uv sync
	cd apps/web && pnpm install

dev-agent:
	cd services/agent && uv run frontier-agent

dev-web:
	cd apps/web && pnpm dev

test:
	cd services/agent && uv run pytest -q

lint:
	cd services/agent && uv run ruff check . && uv run ruff format --check .
	cd apps/web && pnpm lint

typecheck:
	cd services/agent && uv run mypy
	cd apps/web && pnpm typecheck

build:
	cd apps/web && pnpm build

# Regenerate the agent OpenAPI contract and the web TypeScript types.
gen-api:
	cd services/agent && uv run python -m frontier_agent.export_openapi ../../apps/web/openapi/agent.json
	cd apps/web && pnpm gen:api

check: lint typecheck test build
