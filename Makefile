# LMS + AI Agent — developer convenience targets.
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
	@echo "  Backend:   http://localhost:8000/docs"
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
# Backend
# ---------------------------------------------------------------------------
.PHONY: backend-shell
backend-shell: ## Bash shell inside the backend container.
	$(COMPOSE) exec backend bash

.PHONY: backend-test
backend-test: ## Run pytest inside the backend container.
	$(COMPOSE) exec backend pytest

.PHONY: backend-lint
backend-lint: ## Lint backend with ruff.
	$(COMPOSE) exec backend ruff check app tests

# ---------------------------------------------------------------------------
# Agent
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
format: ## Format Python code (ruff).
	@command -v ruff >/dev/null || pip install ruff
	ruff format backend agent

.PHONY: clean
clean: ## Remove __pycache__, .pytest_cache.
	find . -type d -name __pycache__ -prune -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name .pytest_cache -prune -exec rm -rf {} + 2>/dev/null || true
