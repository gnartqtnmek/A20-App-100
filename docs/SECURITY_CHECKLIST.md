# Brainio LMS Security Checklist

Last updated: 2026-04-29

## Scope

- Frontend dependency hardening (`apps/web`)
- Backend dependency audit (`apps/api`)
- Build and type safety checks
- Remaining vulnerabilities require major upgrade.
- Deferred to Sprint “Next.js 16 Migration”.
- Không dùng npm audit fix --force trong bản demo/staging.

## Frontend Results

## Actions completed

- Upgraded:
  - `next`: `14.2.5` -> `^14.2.35`
  - `eslint-config-next`: `14.2.5` -> `^14.2.35`
  - `postcss`: `8.4.41` -> `^8.5.10`
- Executed:
  - `npm install`
  - `npm audit fix` (no `--force`)
  - `npm run build` (pass)
  - `npx tsc --noEmit` (pass)

## Current risk status (frontend)

- `npm audit` still reports `5 vulnerabilities` (`4 high`, `1 moderate`).
- Remaining fixes require major upgrade:
  - `next -> 16.x`
  - `eslint-config-next -> 16.x`
- Not applied in this sprint to avoid UI/behavior breaking changes.

## Backend pip-audit Permission Fix Attempt

## Step-by-step executed

1. Created local temp/cache folders in repo:
   - `apps/api/.tmp`
   - `apps/api/.pip-audit-cache`
2. Set env vars in shell:
   - `TMP=apps/api/.tmp`
   - `TEMP=apps/api/.tmp`
   - `TMPDIR=apps/api/.tmp`
3. Ran:
   - `pip-audit -r requirements.txt --cache-dir .pip-audit-cache`
4. Fallback ran:
   - `python -m pip_audit -r requirements.txt --cache-dir .pip-audit-cache`

## Outcome

- Both commands still fail with `PermissionError [WinError 5]` during temp virtualenv creation:
  - path pattern: `apps/api/.tmp/tmp*/Include`
- Root cause is host filesystem permission/policy blocking venv temp directory creation, not cache path config.

## Backend CVE status

- No reliable CVE result yet because `pip-audit` cannot complete in this local environment.
- `requirements.txt` has mostly floating ranges (`>=`) and one strict pin:
  - `bcrypt==4.0.1`

## Safe upgrade recommendations (non-breaking first)

1. Keep current FastAPI stack but lock exact tested versions in a new lock file (example `requirements.lock.txt`).
2. Run `pip-audit` in CI/Linux container where temp venv creation is permitted.
3. After audit output is available, apply patch/minor upgrades first; avoid major upgrades unless required.
4. Keep `bcrypt==4.0.1` for now to avoid passlib compatibility regression until tested with newer bcrypt.

## Suggested command for CI container scan

```bash
cd apps/api
python -m venv .venv
. .venv/bin/activate
pip install -r requirements.txt pip-audit
pip-audit -r requirements.txt
```

## Verification Commands

```bash
# frontend
cd apps/web
npm install
npm audit
npm run build
npx tsc --noEmit

# backend
cd apps/api
pip-audit -r requirements.txt --cache-dir .pip-audit-cache
python -m pip_audit -r requirements.txt --cache-dir .pip-audit-cache
```
