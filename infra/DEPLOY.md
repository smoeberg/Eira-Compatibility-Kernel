# ECK — Deploy (oversigt)

**To zoner:** Simply (portal) + Hetzner (data).

| Dokument | Zone |
|----------|------|
| **[DEPLOY_SIMPLY.md](DEPLOY_SIMPLY.md)** | `eira-systems.eu`, `eck.*` — WP, admin SPA, API-proxy |
| **[DEPLOY_HETZNER.md](DEPLOY_HETZNER.md)** | `api.eck.*`, `*.fp.*` — API, DB, fingerprint |

Arkitektur: [WEBSITE_CMS_INTEGRATION_v0.4.md](../docs/WEBSITE_CMS_INTEGRATION_v0.4.md)

---

## Domæner (samlet)

| Host | Hosting |
|------|---------|
| `eira-systems.eu` | Simply — marketing |
| `eck.eira-systems.eu` | Simply — admin + BFF |
| `api.eck.eira-systems.eu` | Hetzner — API (IP: kun Simply) |
| `*.fp.eira-systems.eu` | Hetzner — fingerprint proxy |

---

## Legacy: alt på Hetzner (kun dev)

Se [caddy/Caddyfile.prod](caddy/Caddyfile.prod) — inkl. admin SPA. **Ikke** brug i prod med Simply-split.

## Lokal uden Docker

```bash
pnpm install
docker compose up -d postgres
psql $DATABASE_URL -f apps/api/drizzle/0000_init.sql
psql $DATABASE_URL -f apps/api/drizzle/0001_tenants.sql
psql $DATABASE_URL -f apps/api/drizzle/0002_report_run_unique.sql
cp .env.example .env

pnpm dev:api    # :3000
pnpm dev:admin  # :5173
```

Admin: http://localhost:5173 — API key fra `.env` `ADMIN_API_KEY`

Fingerprint proxy (dev): `http://{slug}.fp.localhost:3000` med `Host` header eller hosts-fil.

## IT onboarding (prod)

1. Opret tenant i admin → få `https://{slug}.fp.eira-systems.eu`
2. Start fingerprint (14 dage)
3. Kopiér proxy-URL til fagsystem — **ingen kommunal DNS**
