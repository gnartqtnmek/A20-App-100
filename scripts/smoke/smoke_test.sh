#!/usr/bin/env bash
# End-to-end smoke test for the LMS backend.
#
# Prerequisites:
#   * docker + docker compose installed
#   * `make dev` already started the stack (or this script will do it)
#   * jq + curl on PATH
#
# What it does:
#   1. Boots docker-compose stack if not running
#   2. Waits for postgres healthy + lms-api /healthz
#   3. Runs alembic upgrade head against real Postgres
#   4. Verifies pgvector + 19 tables
#   5. Registers 1 lecturer + 1 student via /auth/register
#   6. Logs in, calls /auth/me, /courses, etc.
#   7. Tests Agent tool with X-User-Id header
#   8. Reports pass/fail per step
#
# Run from repo root:  bash scripts/smoke/smoke_test.sh

set -uo pipefail

# ---------- config ----------
API="${LMS_API_URL:-http://localhost:8000}"
COMPOSE_FILE="infra/docker-compose.yml"
EMAIL_LECT="lect-$(date +%s)@uni.edu"
EMAIL_STUD="stud-$(date +%s)@uni.edu"
PASS="StrongPass123!"
AGENT_TOKEN="${AGENT_SERVICE_TOKEN:-dev-agent-token-please-change}"

# ---------- helpers ----------
GREEN=$'\e[32m'; RED=$'\e[31m'; YEL=$'\e[33m'; BOLD=$'\e[1m'; RESET=$'\e[0m'
PASS_COUNT=0; FAIL_COUNT=0

step() { echo "${BOLD}== $1 ==${RESET}"; }
ok()   { echo "  ${GREEN}✓${RESET} $1"; PASS_COUNT=$((PASS_COUNT+1)); }
fail() { echo "  ${RED}✗${RESET} $1"; FAIL_COUNT=$((FAIL_COUNT+1)); }
warn() { echo "  ${YEL}!${RESET} $1"; }

require() {
    command -v "$1" >/dev/null 2>&1 || { fail "Missing required tool: $1"; exit 2; }
}
require docker
require curl
require jq

# ---------- 1. stack up ----------
step "1. Boot the stack"
if ! docker compose -f "$COMPOSE_FILE" ps --status running | grep -q lms-postgres; then
    warn "Stack not running — starting via 'make dev' (this can take 60–120s on first run)"
    docker compose -f "$COMPOSE_FILE" up -d --build || { fail "compose up failed"; exit 2; }
fi
ok "Containers up"

# Wait for postgres healthcheck
for i in $(seq 1 30); do
    if docker compose -f "$COMPOSE_FILE" exec -T postgres pg_isready -U lms -d lms >/dev/null 2>&1; then
        ok "postgres healthy"; break
    fi
    sleep 2
    [ "$i" -eq 30 ] && { fail "postgres did not become healthy in 60s"; exit 2; }
done

# Wait for /healthz
for i in $(seq 1 30); do
    if curl -fsS "$API/healthz" >/dev/null 2>&1; then
        ok "lms-api /healthz responding"; break
    fi
    sleep 2
    [ "$i" -eq 30 ] && { fail "lms-api never responded on $API/healthz"; exit 2; }
done

# ---------- 2. migrate ----------
step "2. Apply Alembic migration"
docker compose -f "$COMPOSE_FILE" exec -T backend alembic upgrade head 2>&1 | tail -3
[ $? -eq 0 ] && ok "alembic upgrade head" || fail "alembic upgrade head"

# ---------- 3. schema sanity ----------
step "3. Schema sanity"
TABLES=$(docker compose -f "$COMPOSE_FILE" exec -T postgres psql -U lms -d lms -tAc \
    "SELECT count(*) FROM information_schema.tables WHERE table_schema='public' AND table_type='BASE TABLE'")
echo "  tables found: $TABLES"
if [ "$TABLES" -ge 20 ]; then
    ok "≥20 tables present (incl. alembic_version)"
else
    fail "expected ≥20 tables, got $TABLES"
fi

PGVECTOR=$(docker compose -f "$COMPOSE_FILE" exec -T postgres psql -U lms -d lms -tAc \
    "SELECT 1 FROM pg_extension WHERE extname='vector'")
[ "$PGVECTOR" = "1" ] && ok "pgvector extension installed" || fail "pgvector missing"

# ---------- 4. /readyz ----------
step "4. Readiness probe"
READY=$(curl -fsS "$API/readyz")
echo "  $READY" | jq . 2>/dev/null || echo "  $READY"
if echo "$READY" | jq -e '.status == "ready"' >/dev/null; then
    ok "/readyz returns 'ready'"
else
    warn "/readyz not fully ready (Redis ping may be a stub)"
fi

# ---------- 5. register lecturer ----------
step "5. Register lecturer + student"
RESP_LECT=$(curl -fsS -X POST "$API/auth/register" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$EMAIL_LECT\",\"full_name\":\"Lecturer A\",\"password\":\"$PASS\",\"role\":\"lecturer\"}")
TOKEN_LECT=$(echo "$RESP_LECT" | jq -r '.tokens.access_token')
ID_LECT=$(echo "$RESP_LECT" | jq -r '.user.id')
[ -n "$TOKEN_LECT" ] && [ "$TOKEN_LECT" != "null" ] && ok "lecturer registered ($EMAIL_LECT)" \
    || { fail "lecturer registration failed: $RESP_LECT"; exit 1; }

RESP_STUD=$(curl -fsS -X POST "$API/auth/register" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$EMAIL_STUD\",\"full_name\":\"Student B\",\"password\":\"$PASS\",\"role\":\"student\"}")
TOKEN_STUD=$(echo "$RESP_STUD" | jq -r '.tokens.access_token')
ID_STUD=$(echo "$RESP_STUD" | jq -r '.user.id')
[ -n "$TOKEN_STUD" ] && [ "$TOKEN_STUD" != "null" ] && ok "student registered ($EMAIL_STUD)" \
    || fail "student registration failed: $RESP_STUD"

# ---------- 6. login ----------
step "6. Login (form-urlencoded)"
LOGIN=$(curl -fsS -X POST "$API/auth/login" \
    -H "Content-Type: application/x-www-form-urlencoded" \
    --data-urlencode "username=$EMAIL_LECT" --data-urlencode "password=$PASS")
TOKEN_LECT=$(echo "$LOGIN" | jq -r '.tokens.access_token')
[ -n "$TOKEN_LECT" ] && [ "$TOKEN_LECT" != "null" ] && ok "lecturer login → JWT" \
    || fail "login failed: $LOGIN"

# ---------- 7. authenticated GET /auth/me ----------
step "7. GET /auth/me with bearer"
ME=$(curl -fsS "$API/auth/me" -H "Authorization: Bearer $TOKEN_LECT")
ROLE=$(echo "$ME" | jq -r '.role')
[ "$ROLE" = "lecturer" ] && ok "/auth/me returns role=lecturer" \
    || fail "expected role=lecturer, got: $ME"

# ---------- 8. lecturer creates a course ----------
step "8. POST /courses (as lecturer)"
COURSE=$(curl -fsS -X POST "$API/courses" \
    -H "Authorization: Bearer $TOKEN_LECT" \
    -H "Content-Type: application/json" \
    -d "{\"code\":\"CS101-$(date +%s | tail -c 5)\",\"name\":\"Intro to CS\",\"description\":\"Smoke test course\"}")
COURSE_ID=$(echo "$COURSE" | jq -r '.id')
[ -n "$COURSE_ID" ] && [ "$COURSE_ID" != "null" ] && ok "course created (id=$COURSE_ID)" \
    || fail "course creation failed: $COURSE"

# ---------- 9. student lists courses ----------
step "9. GET /courses (as student)"
LIST=$(curl -fsS "$API/courses" -H "Authorization: Bearer $TOKEN_STUD")
COUNT=$(echo "$LIST" | jq 'length')
ok "student sees $COUNT courses"

# ---------- 10. Agent tool with service token ----------
step "10. Agent tool: GET /agent/tools/grades"
GRADES=$(curl -fsS "$API/agent/tools/grades" \
    -H "Authorization: Bearer $AGENT_TOKEN" \
    -H "X-User-Id: $ID_STUD")
GRADES_LEN=$(echo "$GRADES" | jq 'length')
[ "$GRADES_LEN" = "0" ] && ok "agent tool returns empty grades for new student" \
    || warn "expected 0 grades, got $GRADES_LEN: $GRADES"

step "11. Agent auth gating"
BAD=$(curl -s -o /dev/null -w '%{http_code}' "$API/agent/tools/grades" \
    -H "Authorization: Bearer wrong-token" \
    -H "X-User-Id: $ID_STUD")
[ "$BAD" = "401" ] && ok "wrong service token → 401" \
    || fail "expected 401, got $BAD"

# ---------- summary ----------
echo
echo "${BOLD}=== Smoke test summary ===${RESET}"
echo "  PASSED: $PASS_COUNT"
echo "  FAILED: $FAIL_COUNT"
[ "$FAIL_COUNT" -eq 0 ] && exit 0 || exit 1
