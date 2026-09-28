# ECK — Service-to-service authentication v0.1

**Status:** Normativ  
**Pakke:** `@eck/service-auth`  
**Relateret:** [ECK_BFF_Identity_v0.1.md](ECK_BFF_Identity_v0.1.md), [KEY_ROTATION_v0.1.md](../ops/KEY_ROTATION_v0.1.md)

---

## Princip

Alle interne tjenester autentificerer sig **ensartet** mod API'et:

```
Authorization: Bearer {ECK_SERVICE_TOKEN}
X-ECK-Service-Id: {identity}
```

| Identity | Rolle | Typiske routes |
|----------|-------|----------------|
| `bff` | Portal gateway | `/api/v1/*` (admin) |
| `worker` | Baggrundsjobs | `/internal/*` |
| `scheduler` | Cron (auto-complete) | `/internal/*` |
| `importer` | Dataimport | `/internal/*` |
| `notifier` | E-mail/webhooks | `/internal/*` |
| `api` | API self-call (sjældent) | — |

---

## Hård regel: BFF som eneste browser-adgang

```
Browser → eck.* (BFF) → api.* (API)
```

**Browser må aldrig kalde `api.eck.*` direkte.**

| Lag | Håndhævelse |
|-----|-------------|
| **Netværk** | Firewall: `api.eck:443` kun fra BFF/container-net — se [infra/firewall/README.md](../../infra/firewall/README.md) |
| **Reverse proxy** | Caddy: ingen public route til admin API |
| **Applikation** | `ECK_API_BFF_ONLY=true` — afvis `X-Admin-Api-Key` |
| **Applikation** | Admin routes kræver `X-ECK-Service-Id: bff` |

---

## Token

| Env | Formål |
|-----|--------|
| `ECK_SERVICE_TOKEN` | Platform token (delt) |
| `ECK_SERVICE_TOKEN_PREVIOUS` | Rotation overlap |
| `ECK_SERVICE_TOKEN_{IDENTITY}` | Valgfri per-service token (fx `ECK_SERVICE_TOKEN_WORKER`) |

Per-service token overrider platform token for den identitet.

---

## Kode

```typescript
import { buildServiceAuthHeaders } from "@eck/service-auth";

const headers = buildServiceAuthHeaders("scheduler");
await fetch(`${API_URL}/internal/fingerprint/runs/${id}/complete`, {
  method: "POST",
  headers,
});
```

API guards: `AdminAuthGuard` (kun `bff`), `InternalServiceAuthGuard` (worker, scheduler, …).

---

## Dev vs prod

| Env | Dev | Prod |
|-----|-----|------|
| `ECK_REQUIRE_SERVICE_ID` | default `true` | `true` |
| `ECK_API_BFF_ONLY` | `false` | **`true`** |
| `ADMIN_API_KEY` | OK (direkte API) | **Forbudt** |
| `INTERNAL_API_KEY` | OK (legacy) | Erstat med service token |

---

## Fremtidige tjenester

Nye services (worker, notifier, …) skal:

1. Importere `@eck/service-auth`
2. Sende `buildServiceAuthHeaders("{identity}")`
3. Tilføjes til relevant allowlist i API guards

Ingen nye ad-hoc API keys.
