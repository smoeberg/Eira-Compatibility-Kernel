# Simply — BFF + admin (NOT WordPress)

PHP BFF lives **outside** WordPress. WordPress is only on `eira-systems.eu/public_html`.

## Directory layout

```
public_html/          → eira-systems.eu (WordPress only)
eck/                  → eck.eira-systems.eu React (apps/admin/dist)
proxy/
  public/index.php    → BFF entry
  config/eck-config.php
private/              → secrets (optional)
```

## Deploy

1. Copy `proxy/` to server (e.g. `/home/eira/proxy/`)
2. `cp proxy/config/eck-config.example.php proxy/config/eck-config.php` — fill secrets
3. Build admin: `VITE_ECK_AUTH_MODE=proxy pnpm --filter @eck/admin build` → upload to `eck/`
4. Configure routing: [nginx.conf.example](nginx.conf.example) or [eck-subdomain.htaccess.example](eck-subdomain.htaccess.example)

## Auth evolution

| Version | Doc |
|---------|-----|
| v1 | Service token BFF→API |
| v2 | [ECK_BFF_Identity_v0.1.md](../../docs/specs/ECK_BFF_Identity_v0.1.md) — Entra/Keycloak |
| v3 | Cloudflare Worker |

## Legacy

Root-level `eck-api-proxy.php` is deprecated — use `proxy/public/index.php`.
