# ECK — Deploy NestJS BFF (portal zone)

**Erstatter:** PHP BFF på Simply — se [integrations/simply/proxy/DEPRECATED.md](../integrations/simply/proxy/DEPRECATED.md)

Relateret: [WEBSITE_CMS_INTEGRATION_v0.5.md](../docs/WEBSITE_CMS_INTEGRATION_v0.5.md), [DEPLOY_HETZNER.md](DEPLOY_HETZNER.md)

---

## Hvad kører hvor (v0.5)

| Host | Service | Port |
|------|---------|------|
| `eck.eira-systems.eu` | Caddy → BFF + admin static | 443 |
| `eck…/api/*`, `/auth/*` | `@eck/bff` | 3001 |
| `api.eck.eira-systems.eu` | `@eck/api` | 3000 |
| `*.fp.eira-systems.eu` | `@eck/api` | 3000 |

---

## docker compose (prod)

```bash
./infra/deploy/deploy-prod.sh
# eller:
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

Se [infra/deploy/README.md](../infra/deploy/README.md) og [infra/firewall/ufw-setup.sh](../infra/firewall/ufw-setup.sh).

---

## BFF miljø

```env
PORT=3001
ECK_UPSTREAM_API_URL=http://api:3000
ECK_SERVICE_TOKEN=              # samme som API
ECK_BFF_SIGNING_SECRET=
ECK_BFF_SESSION_SECRET=

ECK_OIDC_ENABLED=true
ECK_OIDC_TENANT_ID=
ECK_OIDC_CLIENT_ID=
ECK_OIDC_CLIENT_SECRET=
ECK_OIDC_REDIRECT_URI=https://eck.eira-systems.eu/auth/callback
ECK_OIDC_POST_LOGOUT_REDIRECT=https://eck.eira-systems.eu/
```

API (Hetzner):

```env
ECK_REQUIRE_USER_CONTEXT=true
ECK_REQUIRE_BFF_SIGNATURE=true
ECK_API_BFF_ONLY=true
# api.eck:443 — firewall: afvis offentlig browser; tillad kun BFF/container-net
# Se infra/firewall/README.md
```

---

## Admin build

```bash
VITE_ECK_AUTH_MODE=proxy pnpm --filter @eck/admin build
# Upload dist → /srv/admin on Hetzner (or mount in Caddy container)
```

---

## Caddy

Brug [caddy/Caddyfile.hetzner-portal](caddy/Caddyfile.hetzner-portal).

---

## Verifikation

```bash
curl -s https://eck.eira-systems.eu/health          # eck-bff
curl -s https://eck.eira-systems.eu/api/health      # eck-api (via BFF — kræver session hvis OIDC)
curl -s https://api.eck.eira-systems.eu/health      # kun fra BFF-host / intern
```

---

## Lokal dev

```bash
pnpm dev:api     # :3000
pnpm dev:bff     # :3001
pnpm dev:admin   # :5173 — proxy /api + /auth → BFF
```

---

## Rollback

Hvis BFF fejler før DNS-skift: Simply PHP BFF kan genaktiveres midlertidigt (deprecated).
