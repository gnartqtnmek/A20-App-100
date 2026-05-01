#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import re
from pathlib import Path


API_EXPORT_RE = re.compile(r"export function (\w+)\([^)]*\)\s*\{")
API_PATH_RE = re.compile(r"['\"](/api/v1/[^'\"]+)['\"]")
IMPORT_RE = re.compile(r"import\s*\{([^}]+)\}\s*from\s*['\"]@/lib/api['\"]", re.MULTILINE)


def parse_api_exports(api_file: Path) -> dict[str, list[str]]:
    lines = api_file.read_text(encoding="utf-8").splitlines()
    mapping: dict[str, list[str]] = {}
    current_name: str | None = None
    buffer: list[str] = []
    brace_depth = 0

    for line in lines:
        if current_name is None:
            match = API_EXPORT_RE.search(line)
            if not match:
                continue
            current_name = match.group(1)
            buffer = [line]
            brace_depth = line.count("{") - line.count("}")
            continue

        buffer.append(line)
        brace_depth += line.count("{") - line.count("}")
        if brace_depth <= 0:
            block = "\n".join(buffer)
            mapping[current_name] = sorted(set(API_PATH_RE.findall(block)))
            current_name = None
            buffer = []

    return mapping


def parse_ui_imports(root: Path) -> dict[str, list[str]]:
    usage: dict[str, list[str]] = {}
    for tsx_file in root.rglob("*.tsx"):
        if "node_modules" in tsx_file.parts:
            continue
        text = tsx_file.read_text(encoding="utf-8")
        for match in IMPORT_RE.finditer(text):
            imported_names = [item.strip() for item in match.group(1).split(",") if item.strip()]
            for name in imported_names:
                usage.setdefault(name, []).append(str(tsx_file))
    return usage


def main() -> int:
    parser = argparse.ArgumentParser(description="Check UI -> API helper mapping.")
    parser.add_argument("--repo-root", default=".", help="Repository root")
    parser.add_argument("--json", action="store_true", help="Print JSON output")
    args = parser.parse_args()

    repo_root = Path(args.repo_root).resolve()
    api_file = repo_root / "apps" / "web" / "lib" / "api.ts"
    ui_root = repo_root / "apps" / "web"

    exports = parse_api_exports(api_file)
    usage = parse_ui_imports(ui_root)

    used_mapping = {
        name: {
            "paths": exports.get(name, []),
            "used_by": usage.get(name, []),
        }
        for name in sorted(usage.keys())
    }
    unused_exports = sorted(name for name in exports.keys() if name not in usage)

    report = {
        "used_helpers": used_mapping,
        "unused_export_count": len(unused_exports),
        "unused_exports": unused_exports,
    }

    if args.json:
        print(json.dumps(report, indent=2))
        return 0

    print("UI -> API helper mapping")
    print(f"- used helper count: {len(used_mapping)}")
    print(f"- unused export count: {len(unused_exports)}")
    print("")

    for helper, details in used_mapping.items():
        paths = ", ".join(details["paths"]) if details["paths"] else "(dynamic/no static /api/v1 path)"
        print(f"{helper}: {paths}")

    if unused_exports:
        print("\nUnused exports:")
        for name in unused_exports:
            print(f"- {name}")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
