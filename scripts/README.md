## Scripts

- `smoke_backend.py`: login + `/auth/me` + role probe for all 5 roles.
- `smoke_rbac.py`: cross-role RBAC checks (401/403/200).
- `check_ui_api_mapping.py`: static mapping between UI imports and API helper endpoints.

Examples:

```bash
python scripts/smoke_backend.py --base-url http://127.0.0.1:8000
python scripts/smoke_rbac.py --base-url http://127.0.0.1:8000
python scripts/check_ui_api_mapping.py --repo-root .
```
