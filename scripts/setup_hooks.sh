#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
HOOKS_DIR="$ROOT_DIR/.git/hooks"
HOOK_PATH="$HOOKS_DIR/pre-push"

if [[ ! -d "$HOOKS_DIR" ]]; then
  echo "Git hooks directory not found: $HOOKS_DIR"
  exit 1
fi

cat > "$HOOK_PATH" <<'EOF'
#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(git rev-parse --show-toplevel)"
LOG_FILE="$ROOT_DIR/.ai-log/session.jsonl"

if [[ -z "${AI_LOG_SERVER:-}" || -z "${AI_LOG_API_KEY:-}" ]]; then
  exit 0
fi

if [[ ! -f "$LOG_FILE" ]]; then
  exit 0
fi

curl -sS -X POST "${AI_LOG_SERVER}" \
  -H "Authorization: Bearer ${AI_LOG_API_KEY}" \
  -H "Content-Type: application/x-ndjson" \
  --data-binary "@${LOG_FILE}" >/dev/null || true
EOF

chmod +x "$HOOK_PATH"
echo "Installed pre-push hook at $HOOK_PATH"
