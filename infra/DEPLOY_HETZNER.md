# ECK — Deploy Hetzner (portal + data zone)

Se: [DEPLOY_BFF.md](DEPLOY_BFF.md), [WEBSITE_CMS_INTEGRATION_v0.5.md](../docs/WEBSITE_CMS_INTEGRATION_v0.5.md)

---

## Hvad kører på Hetzner (v0.5)

| Service | Host | Offentlig? |
|---------|------|------------|
| NestJS BFF | `eck.eira-systems.eu` `/api`, `/auth` | Ja (browser) |
| React admin | `eck.eira-systems.eu` `/` | Ja |
| NestJS API | `api.eck.eira-systems.eu` | **Nej** — kun BFF + drift |
| PostgreSQL | Intern | Nej |
| Fingerprint proxy | `*.fp.eira-systems.eu` | Ja |

---

## Domæner (Hetzner)

| Host | Service |
|------|---------|
| `eck.eira-systems.eu` | Caddy → BFF + admin static |
| `api.eck.eira-systems.eu` | NestJS API `:3000` |
| `*.fp.eira-systems.eu` | NestJS proxy |

---

## Miljøvariabler

```env
DATABASE_URL=postgresql://...
ADMIN_API_KEY=          # deles KUN med Simply proxy — ikke browser
INTERNAL_API_KEY=
ECK_FP_DOMAIN=fp.eira-systems.eu
ECK_PUBLIC_DOMAIN=eira-systems.eu
ECK_PUBLIC_PROTOCOL=https
ECK_ADMIN_HOST=eck.eira-systems.eu
PORT=3000
```

---

## Deploy

1. DNS: `eck`, `api.eck`, `*.fp` → Hetzner
2. `docker compose up -d postgres api bff caddy`
3. Migrationer: `0000`–`0003`
4. Caddy: [Caddyfile.hetzner-portal](caddy/Caddyfile.hetzner-portal)
5. **Firewall** på `api.eck:443`:
   - Afvis offentlig browser-trafik
   - Tillad BFF-container / Hetzner-intern + drift-IP
   - `*.fp:443` — offentlig (fagsystem)

---

## BFF

Se [DEPLOY_BFF.md](DEPLOY_BFF.md) for OIDC, env og verifikation.

---

## Lokal dev

Uændret — se tidligere [DEPLOY.md](DEPLOY.md) intro; admin + API lokalt.
