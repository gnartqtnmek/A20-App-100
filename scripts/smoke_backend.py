#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import sys
import urllib.error
import urllib.request
from dataclasses import dataclass


DEMO_PASSWORD = "Brainio@123"


@dataclass(frozen=True)
class DemoRole:
    role: str
    email: str
    probe_path: str


DEMO_ROLES: tuple[DemoRole, ...] = (
    DemoRole("student", "student@brainio.edu", "/api/v1/student/courses"),
    DemoRole("lecturer", "lecturer@brainio.edu", "/api/v1/lecturer/sections"),
    DemoRole("admin", "admin@brainio.edu", "/api/v1/users?page=1&limit=5"),
    DemoRole("academic_staff", "staff@brainio.edu", "/api/v1/academic/sections?page=1&limit=5"),
    DemoRole("advisor", "advisor@brainio.edu", "/api/v1/advisor/students"),
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


def main() -> int:
    parser = argparse.ArgumentParser(description="Smoke test login + basic role endpoints.")
    parser.add_argument("--base-url", default="http://127.0.0.1:8000", help="API base URL")
    args = parser.parse_args()

    base_url = args.base_url.rstrip("/")
    failures: list[str] = []

    health_status, _ = request_json("GET", f"{base_url}/health")
    if health_status != 200:
        print(f"[FAIL] health check returned {health_status}")
        return 1
    print("[OK] health")

    for role in DEMO_ROLES:
        login_status, login_payload = request_json(
            "POST",
            f"{base_url}/api/v1/auth/login",
            payload={"email": role.email, "password": DEMO_PASSWORD},
        )
        if login_status != 200:
            failures.append(f"{role.role}: login returned {login_status}")
            print(f"[FAIL] {role.role} login ({login_status})")
            continue
        token = login_payload.get("access_token")
        if not token:
            failures.append(f"{role.role}: missing access token")
            print(f"[FAIL] {role.role} missing access token")
            continue

        me_status, me_payload = request_json("GET", f"{base_url}/api/v1/auth/me", token=token)
        if me_status != 200 or me_payload.get("role") != role.role:
            failures.append(f"{role.role}: /auth/me returned {me_status} role={me_payload.get('role')}")
            print(f"[FAIL] {role.role} /auth/me ({me_status})")
            continue

        probe_status, _ = request_json("GET", f"{base_url}{role.probe_path}", token=token)
        if probe_status != 200:
            failures.append(f"{role.role}: probe {role.probe_path} returned {probe_status}")
            print(f"[FAIL] {role.role} probe {role.probe_path} ({probe_status})")
            continue

        print(f"[OK] {role.role} login + me + probe")

    if failures:
        print("\nSmoke backend failures:")
        for item in failures:
            print(f"- {item}")
        return 1

    print("\nSmoke backend passed for all 5 roles.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
