#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import sys
import urllib.error
import urllib.request
from dataclasses import dataclass


DEMO_PASSWORD = "Brainio@123"

ROLE_EMAIL = {
    "student": "student@brainio.edu",
    "lecturer": "lecturer@brainio.edu",
    "admin": "admin@brainio.edu",
    "academic_staff": "staff@brainio.edu",
    "advisor": "advisor@brainio.edu",
}


@dataclass(frozen=True)
class RbacCase:
    actor_role: str | None
    method: str
    path: str
    expected_status: int
    note: str


RBAC_CASES: tuple[RbacCase, ...] = (
    RbacCase(None, "GET", "/api/v1/auth/me", 401, "anonymous must be unauthorized"),
    RbacCase("student", "GET", "/api/v1/admin/roles", 403, "student cannot read admin roles"),
    RbacCase("lecturer", "GET", "/api/v1/student/courses", 403, "lecturer cannot access student endpoints"),
    RbacCase("advisor", "GET", "/api/v1/academic/sections?page=1&limit=5", 403, "advisor cannot access academic endpoints"),
    RbacCase("academic_staff", "GET", "/api/v1/users?page=1&limit=5", 403, "academic staff cannot use admin user CRUD"),
    RbacCase("admin", "GET", "/api/v1/users?page=1&limit=5", 200, "admin can use user management"),
)


def request_json(method: str, url: str, token: str | None = None, payload: dict | None = None) -> tuple[int, dict]:
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    data = None
    if payload is not None:
        data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(url=url, method=method, headers=headers, data=data)
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            raw = resp.read().decode("utf-8")
            return resp.status, json.loads(raw) if raw else {}
    except urllib.error.HTTPError as exc:
        raw = exc.read().decode("utf-8")
        try:
            body = json.loads(raw) if raw else {}
        except json.JSONDecodeError:
            body = {"raw": raw}
        return exc.code, body


def login(base_url: str, role: str) -> str:
    email = ROLE_EMAIL[role]
    status, payload = request_json(
        "POST",
        f"{base_url}/api/v1/auth/login",
        payload={"email": email, "password": DEMO_PASSWORD},
    )
    if status != 200 or "access_token" not in payload:
        raise RuntimeError(f"Cannot login as {role}, status={status}")
    return payload["access_token"]


def main() -> int:
    parser = argparse.ArgumentParser(description="Cross-role RBAC smoke tests.")
    parser.add_argument("--base-url", default="http://127.0.0.1:8000", help="API base URL")
    args = parser.parse_args()
    base_url = args.base_url.rstrip("/")

    tokens: dict[str, str] = {}
    needed_roles = sorted({case.actor_role for case in RBAC_CASES if case.actor_role})
    for role in needed_roles:
        assert role is not None
        try:
            tokens[role] = login(base_url, role)
        except RuntimeError as exc:
            print(f"[FAIL] {exc}")
            return 1

    failures: list[str] = []
    for case in RBAC_CASES:
        token = tokens.get(case.actor_role) if case.actor_role else None
        status, _ = request_json(case.method, f"{base_url}{case.path}", token=token)
        if status != case.expected_status:
            failures.append(
                f"{case.actor_role or 'anonymous'} {case.method} {case.path}: expected {case.expected_status}, got {status}"
            )
            print(f"[FAIL] {case.note} ({status})")
        else:
            print(f"[OK] {case.note}")

    if failures:
        print("\nRBAC failures:")
        for item in failures:
            print(f"- {item}")
        return 1

    print("\nRBAC smoke passed.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
