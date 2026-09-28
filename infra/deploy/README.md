# ECK — Production deploy (Hetzner)

Quick reference for BFF + firewall + observability.

---

## 1. Prerequisites

- Hetzner server with Docker + Compose v2.24+
- DNS: `eck`, `api.eck`, `*.fp` → server IP
- `.env` configured from `.env.example` (secrets, OIDC, tokens)

---

## 2. Deploy

```bash
chmod +x infra/deploy/deploy-prod.sh infra/firewall/ufw-setup.sh
./infra/deploy/deploy-prod.sh
```

Or manually:

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml build
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

---

## 3. Firewall (host)

```bash
sudo ./infra/firewall/ufw-setup.sh [OPS_VPN_CIDR]
```

Blocks direct access to ports 3000/3001/5432 from internet. Only 80/443 public.

See [firewall/README.md](../firewall/README.md).

---

## 4. Verify

```bash
curl -s https://eck.eira-systems.eu/health
curl -s https://eck.eira-systems.eu/ready

# Must fail from internet:
curl -s --max-time 3 http://YOUR_SERVER_IP:3000/health
```

---

## 5. Logs & alerts

- JSON logs: `docker compose logs -f bff api`
- Metrics: internal scrape `/metrics` — [observability/README.md](../observability/README.md)
- Alerts: [alerts/prometheus-alerts.yml](../alerts/prometheus-alerts.yml)

---

## 6. CI/CD

GitHub Actions: [.github/workflows/ci.yml](../../.github/workflows/ci.yml)

- `pnpm test` + `pnpm build` on every PR
- Docker build for `api`, `bff`, `admin`
- Smoke test: postgres + api + bff health
