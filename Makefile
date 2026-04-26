# LMS + AI Agent — developer convenience targets.
# Monorepo layout (apps/* convention):
#
#   apps/lms-api    — FastAPI backend (LMS REST API)
#   apps/lms-web    — Next.js frontend (student & lecturer UI)
#   apps/agent-api  — AI Agent service (LangGraph + memory)
#   apps/agent-web  — (optional) admin/dev chat UI for the agent
#   infra/          — docker-compose dev stack
#   docs/           — ADRs, integration guides
#
# Run `make help` to see all targets.

SHELL := /bin/bash
COMPOSE := docker compose -f infra/docker-compose.yml --env-file .env

.DEFAULT_GOAL := help

.PHONY: help
help: ## Show this help.
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  \033[36m%-18s\033[0m %s\n", $$1, $$2}' $(MAKEFILE_LIST)

# ---------------------------------------------------------------------------
# Stack lifecycle
# ---------------------------------------------------------------------------
.PHONY: dev
dev: ## Start the full local stack (postgres + redis + minio + backend + agent).
	$(COMPOSE) up -d --build
	@echo ""
	@echo "  LMS API:   http://localhost:8000/docs"
	@echo "  Agent API: http://localhost:8001"
	@echo "  MinIO UI:  http://localhost:9001  (minio / minio12345)"
	@echo "  Postgres:  localhost:5432  (lms / lms / lms)"

.PHONY: up
up: ## Start without rebuilding.
	$(COMPOSE) up -d

.PHONY: down
down: ## Stop and remove containers.
	$(COMPOSE) down

.PHONY: nuke
nuke: ## Stop, remove containers AND volumes (data loss!).
	$(COMPOSE) down -v

.PHONY: logs
logs: ## Tail logs from all services.
	$(COMPOSE) logs -f --tail=100

.PHONY: ps
ps: ## List running containers.
	$(COMPOSE) ps

# ---------------------------------------------------------------------------
# LMS API (apps/lms-api)
# ---------------------------------------------------------------------------
.PHONY: api-shell
api-shell: ## Bash shell inside the lms-api container.
	$(COMPOSE) exec backend bash

.PHONY: api-test
api-test: ## Run pytest inside lms-api.
	$(COMPOSE) exec backend pytest

.PHONY: api-lint
api-lint: ## Lint lms-api with ruff.
	$(COMPOSE) exec backend ruff check app tests

.PHONY: api-migrate
api-migrate: ## Apply DB migrations (alembic upgrade head).
	$(COMPOSE) exec backend alembic upgrade head

.PHONY: api-test-local
api-test-local: ## Run lms-api pytest on host (without docker).
	cd apps/lms-api && PYTHONPATH=. pytest

# ---------------------------------------------------------------------------
# LMS Web (apps/lms-web)
# ---------------------------------------------------------------------------
.PHONY: web-dev
web-dev: ## Start the Next.js dev server (host, with HMR).
	cd apps/lms-web && npm run dev

.PHONY: web-build
web-build: ## Production build of lms-web.
	cd apps/lms-web && npm run build

.PHONY: web-lint
web-lint: ## Lint + typecheck lms-web.
	cd apps/lms-web && npm run lint && npx tsc --noEmit

.PHONY: web-install
web-install: ## Install lms-web npm deps.
	cd apps/lms-web && npm install

# ---------------------------------------------------------------------------
# Agent API (apps/agent-api)
# ---------------------------------------------------------------------------
.PHONY: agent-attach
agent-attach: ## Attach to the interactive agent CLI.
	docker attach lms-agent

.PHONY: agent-shell
agent-shell: ## Bash shell inside the agent container.
	$(COMPOSE) exec agent bash

# ---------------------------------------------------------------------------
# Database / cache helpers
# ---------------------------------------------------------------------------
.PHONY: psql
psql: ## Open a psql shell into the dev database.
	$(COMPOSE) exec postgres psql -U lms -d lms

.PHONY: redis-cli
redis-cli: ## Open a redis-cli shell.
	$(COMPOSE) exec redis redis-cli

.PHONY: db-reset
db-reset: ## Drop and recreate the dev database (destructive!).
	$(COMPOSE) exec postgres psql -U lms -d postgres -c "DROP DATABASE IF EXISTS lms;"
	$(COMPOSE) exec postgres psql -U lms -d postgres -c "CREATE DATABASE lms OWNER lms;"

# ---------------------------------------------------------------------------
# Setup / housekeeping
# ---------------------------------------------------------------------------
.PHONY: setup
setup: ## First-time setup: copy .env, install git hooks.
	@if [ ! -f .env ]; then cp .env.example .env && echo "Created .env — fill in ANTHROPIC_API_KEY"; fi
	@bash scripts/setup_hooks.sh

.PHONY: format
format: ## Format Python code (ruff) across all apps.
	@command -v ruff >/dev/null || pip install ruff
	ruff format apps/lms-api apps/agent-api

.PHONY: clean
clean: ## Remove __pycache__, .pytest_cache.
	find . -type d -name __pycache__ -prune -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name .pytest_cache -prune -exec rm -rf {} + 2>/dev/null || true

# ---------------------------------------------------------------------------
# Backwards-compatible aliases (deprecated, will be removed)
# ---------------------------------------------------------------------------
.PHONY: backend-shell backend-test backend-lint
backend-shell: api-shell ## DEPRECATED: use api-shell
backend-test:  api-test  ## DEPRECATED: use api-test
backend-lint:  api-lint  ## DEPRECATED: use api-lint
