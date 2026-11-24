# ECK — Deploy (oversigt)

ECK's server-del (API, BFF og admin) kører hos Eira på Hetzner. Den modtager kun godkendte rapportfiler fra kommunerne (ADR-001). Der er ingen proxy, og ingen forbindelse ind til kommunerne.

| Dokument | Indhold |
|----------|---------|
| [DEPLOY_HETZNER.md](DEPLOY_HETZNER.md) | API, database og miljøvariabler |
| [DEPLOY_BFF.md](DEPLOY_BFF.md) | BFF og admin |
| [firewall/README.md](firewall/README.md) | Firewallregler |

## Domæner

| Host | Service |
|------|---------|
| `eck.eira-systems.eu` | Admin og BFF |
| `api.eck.eira-systems.eu` | API (kun BFF og drift) |

## Lokal udvikling

```bash
pnpm install
docker compose up -d postgres
for f in apps/api/drizzle/*.sql; do psql "$DATABASE_URL" -f "$f"; done
cp .env.example .env

pnpm dev:api    # :3000
pnpm dev:admin  # :5173
```

Admin: http://localhost:5173 — API-nøgle fra `ADMIN_API_KEY` i `.env`.
