# ECK — NestJS BFF (anbefalet portal-gateway)

**Erstatter:** PHP BFF på Simply (`integrations/simply/proxy/` — deprecated).

---

## Formål

| Route | Handler |
|-------|---------|
| `/auth/*` | OIDC login, callback, logout, session |
| `/api/*` | Proxy → NestJS API med service token + HMAC + brugerheaders |
| `/health` | BFF healthcheck |

Kører på **Hetzner** bag `eck.eira-systems.eu` (Caddy). Same-origin med React admin.

---

## Monorepo

```
apps/bff/              NestJS BFF (:3001)
packages/bff-core/     Delt signatur + token-rotation (API + BFF)
apps/api/              Data API (:3000) — accepterer kun BFF + internal
apps/admin/            React SPA (statisk via Caddy)
```

---

## Miljøvariabler

```env
PORT=3001
ECK_UPSTREAM_API_URL=http://api:3000
ECK_SERVICE_TOKEN=           # deles med API
ECK_BFF_SIGNING_SECRET=      # HMAC — separat anbefales
ECK_BFF_SESSION_SECRET=      # express-session

# OIDC (Entra)
ECK_OIDC_ENABLED=true
ECK_OIDC_TENANT_ID=
ECK_OIDC_CLIENT_ID=
ECK_OIDC_CLIENT_SECRET=
ECK_OIDC_REDIRECT_URI=https://eck.eira-systems.eu/auth/callback
ECK_OIDC_POST_LOGOUT_REDIRECT=https://eck.eira-systems.eu/
```

---

## Lokal dev

```bash
pnpm install
pnpm dev:bff    # :3001
pnpm dev:api    # :3000
pnpm dev:admin  # :5173 — proxy'er /api og /auth til BFF
```

Admin `.env`: `VITE_ECK_AUTH_MODE=proxy`

---

## Deploy (Hetzner)

Se [infra/DEPLOY_BFF.md](../../infra/DEPLOY_BFF.md) og [WEBSITE_CMS_INTEGRATION_v0.5.md](../../docs/WEBSITE_CMS_INTEGRATION_v0.5.md).

---

## Kontrakt (uændret fra PHP)

Dual-token, HMAC-signatur, token-rotation — se [ECK_BFF_Identity_v0.1.md](../../docs/specs/ECK_BFF_Identity_v0.1.md).

PHP-implementeringen bevares midlertidigt som reference; **ny deploy skal bruge NestJS BFF**.
