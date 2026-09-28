#!/usr/bin/env bash
# Hetzner host firewall — BFF-only access to API ports
# Run as root on production server AFTER docker is configured.
#
# Usage: sudo ./infra/firewall/ufw-setup.sh [OPS_SSH_IP/CIDR]
set -euo pipefail

OPS_CIDR="${1:-}"

echo "==> Enabling UFW defaults"
ufw default deny incoming
ufw default allow outgoing

echo "==> Allow SSH (22)"
ufw allow 22/tcp comment 'SSH'

echo "==> Allow HTTP/HTTPS (Caddy)"
ufw allow 80/tcp comment 'HTTP'
ufw allow 443/tcp comment 'HTTPS'

echo "==> Explicitly deny direct API/BFF container ports from internet"
ufw deny 3000/tcp comment 'Block direct API'
ufw deny 3001/tcp comment 'Block direct BFF'
ufw deny 5432/tcp comment 'Block Postgres'
ufw deny 5433/tcp comment 'Block Postgres dev port'

if [[ -n "$OPS_CIDR" ]]; then
  echo "==> Allow ops access from $OPS_CIDR (optional direct health/debug)"
  ufw allow from "$OPS_CIDR" to any port 22 proto tcp comment 'Ops SSH'
fi

echo "==> Enabling UFW"
ufw --force enable
ufw status verbose

echo ""
echo "Done. Verify:"
echo "  curl -s https://eck.eira-systems.eu/health"
echo "  curl -s --max-time 3 http://$(curl -s ifconfig.me):3000/health  # should fail"
