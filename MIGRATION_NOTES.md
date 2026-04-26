# Migration Notes — `apps/<service>/` layout

> Read me before pulling and resuming work after the layout refactor.

## What changed

Folders moved into `apps/`:

| Was            | Now                 |
|----------------|---------------------|
| `backend/`     | `apps/lms-api/`     |
| `frontend/`    | `apps/lms-web/`     |
| `agent/`       | `apps/agent-api/`   |
| —              | `apps/agent-web/` (placeholder, team Agent fills) |

`infra/`, `docs/`, `scripts/` stay at the root.

Why: see [`docs/adr/0002-apps-monorepo-layout.md`](./docs/adr/0002-apps-monorepo-layout.md).

## Steps to take after `git pull`

The dev sandbox cannot delete files on the Windows mount, so you need to
do the cleanup locally. Run these from the repo root:

```bash
# 1) Remove the legacy folders (the new copies live under apps/).
git rm -r backend agent frontend
git commit -m "chore: remove legacy folders after apps/* migration"

# 2) Re-install npm deps in the new location (or symlink — see below).
cd apps/lms-web && npm install && cd ../..

# 3) (Recommended) install Python deps in fresh venvs per app.
cd apps/lms-api
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cd ../..

cd apps/agent-api
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cd ../..
```

If you'd rather not reinstall `node_modules`, symlink:

```bash
ln -s ../../frontend/node_modules apps/lms-web/node_modules   # if you keep the old folder around briefly
```

## Updated commands

```bash
# Old              # New
make backend-test  → make api-test
make backend-lint  → make api-lint
make backend-shell → make api-shell
                     make api-migrate     # NEW
                     make web-dev         # NEW
                     make web-build       # NEW
                     make web-lint        # NEW
                     make web-install     # NEW
```

The deprecated `backend-*` aliases are kept until end of Sprint 2.

## Imports & Paths

Inside `apps/lms-api`, imports stay the same (`from app.X` — `app` is
still the package root inside that folder). `pyproject.toml`'s
`pythonpath = ["."]` continues to work because each app is its own
self-contained Python project.

Inside `apps/lms-web`, `tsconfig.json` paths (`@/*` → `src/*`) are
unchanged. `NEXT_PUBLIC_API_BASE_URL` still defaults to
`http://localhost:8000`.

## CI implications (Sprint 2)

When wiring GitHub Actions, prefer `paths-filter` so changes inside
`apps/lms-api/**` don't rebuild `apps/lms-web/**` and vice versa:

```yaml
on:
  push:
    paths:
      - 'apps/lms-api/**'
      - 'infra/**'
```

## Verification done in this commit

* `apps/lms-api`: `pytest tests/` → **16/16 PASS**
* `apps/lms-web`: `tsc --noEmit` clean, `eslint src/` clean
* `infra/docker-compose.yml`: `build.context` and `volumes` updated
* `Makefile`: new `api-*` and `web-*` targets, deprecated aliases kept

## Known follow-ups

1. `apps/agent-api/Dockerfile` `CMD` still references the old CLI entry
   (`python -m agent.agent`) but `apps/agent-api/src/__main__.py` is now
   an HTTP server. Team Agent should reconcile.
2. `ke_hoach_LMS_AI_Agent.docx` mentions `/backend`, `/agent`,
   `/frontend` paths in the Sprint plan. Update in Sprint 2 review.
3. Add CI matrix with `paths-filter`.
