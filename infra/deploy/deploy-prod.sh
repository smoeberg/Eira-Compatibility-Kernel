#!/usr/bin/env bash
# Deploy ECK production stack on Hetzner
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

if [[ ! -f .env ]]; then
  echo "Missing .env — copy from .env.example and configure secrets."
  exit 1
fi

echo "==> Pull latest images / build"
docker compose -f docker-compose.yml -f docker-compose.prod.yml build api bff admin

echo "==> Run database migrations (if psql available on host)"
if command -v psql >/dev/null 2>&1 && [[ -n "${DATABASE_URL:-}" ]]; then
  for f in apps/api/drizzle/0000_init.sql \
           apps/api/drizzle/0001_tenants.sql \
           apps/api/drizzle/0002_report_run_unique.sql \
           apps/api/drizzle/0003_audit_log.sql; do
    echo "Applying $f"
    psql "$DATABASE_URL" -f "$f"
  done
else
  echo "Skip migrations — set DATABASE_URL and install psql, or run manually."
fi

echo "==> Start stack"
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d

echo "==> Wait for health"
sleep 5
docker compose -f docker-compose.yml -f docker-compose.prod.yml ps

echo ""
echo "Verify (from server):"
echo "  docker compose -f docker-compose.yml -f docker-compose.prod.yml exec bff wget -qO- http://127.0.0.1:3001/ready"
echo "  docker compose -f docker-compose.yml -f docker-compose.prod.yml exec api wget -qO- http://127.0.0.1:3000/ready"
