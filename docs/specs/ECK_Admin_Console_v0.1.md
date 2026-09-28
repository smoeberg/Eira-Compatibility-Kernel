# ECK Admin Console — Spec v0.1

**Status:** Normativ for commit 3–4  
**Dato:** 29. juni 2026  
**URL:** `https://eck.eira-systems.eu`  
**Relateret:** [PRODUCT_OVERVIEW_v0.2.md](../PRODUCT_OVERVIEW_v0.2.md), [ECK_Fingerprinting_Architecture_v0.1.md](ECK_Fingerprinting_Architecture_v0.1.md)

---

## Formål

Webbaseret admin hvor kommune-IT **selv** starter fingerprint, kopierer proxy-URL til fagsystem — **uden DNS-ændring** i kommunen.

---

## Arkitektur

```
Browser → eck.eira-systems.eu (SPA)
              ↓ HTTPS + session (Entra OIDC)
         NestJS API (eksisterende apps/api — udvides)
              ↓
         PostgreSQL (tenants, runs, reports)
              
Fagsystem → {slug}.fp.eira-systems.eu (Envoy)
              ↓ log + passthrough
         legacy_base_url (fra tenant config)
```

| Del | Teknologi | Repo (plan) |
|-----|-----------|-------------|
| Admin SPA | React + Vite (eller Next.js static) | `apps/admin` |
| API | NestJS (udvid `apps/api`) | `apps/api` |
| Proxy | Envoy dynamic config per tenant | `infra/envoy` |
| Auth | Entra OIDC (IT-bruger) via **BFF** — se [ECK_BFF_Identity_v0.1.md](ECK_BFF_Identity_v0.1.md) |

---

## API-endpoints (admin — ud over eksisterende internal)

| Metode | Sti | Auth | Formål |
|--------|-----|------|--------|
| GET | `/api/v1/me` | Session | Current user |
| POST | `/api/v1/tenants` | Eira staff | Opret tenant (onboarding) |
| GET | `/api/v1/tenants/:id` | Tenant member | Tenant-detaljer |
| PATCH | `/api/v1/tenants/:id` | Tenant admin | Opdater legacy_base_url |
| POST | `/api/v1/tenants/:id/runs` | Tenant admin | Start fingerprint |
| GET | `/api/v1/tenants/:id/runs` | Tenant member | List runs |
| GET | `/api/v1/runs/:id` | Tenant member | Status |
| GET | `/api/v1/runs/:id/report` | Tenant member | Rapport JSON/PDF |
| GET | `/api/v1/runs/:id/setup` | Tenant member | Copy-paste blok (proxy URL m.m.) |

Internal ingest (Envoy → analysis) forbliver på `/internal/fingerprint/*` med API key.

---

## Setup-output (GET `/runs/:id/setup`)

```json
{
  "proxyUrl": "https://hvidovre.fp.eira-systems.eu",
  "legacyUrl": "https://graph.microsoft.com",
  "runId": "...",
  "endsAt": "2026-07-13T00:00:00.000Z",
  "instructions": [
    "Log ind i fagsystemets integrations/administration",
    "Find feltet API endpoint / Base URL",
    "Erstat nuværende URL med proxyUrl",
    "Gem — ingen ændring i kommunens DNS er nødvendig"
  ]
}
```

---

## MVP-skærme (prioritet)

1. Login  
2. Dashboard (aktiv run + historik)  
3. Wizard: legacy URL → start run → **vis setup**  
4. Rapport-visning (score + kategorier)  
5. PDF export (kan være commit 4)

**Ikke i admin MVP:** Self-service tenant signup, billing, V1 migrering, brugeradmin beyond IT.

---

## Tenant provisioning (backend)

Ved oprettelse af tenant `slug=hvidovre`:

1. DB: `tenants` row  
2. Envoy: route cluster `legacy_hvidovre` → `legacy_base_url`  
3. DNS: `hvidovre.fp.eira-systems.eu` (wildcard dækker)  
4. Returnér setup-URLs til admin

---

## Auth

| Rolle | Kan |
|-------|-----|
| `tenant_admin` | Start/stop run, se rapport, ændre legacy URL |
| `tenant_viewer` | Se status og rapport |
| `eira_staff` | Opret tenant, support |

Fase 1 kan bruge invitation token + API key; Entra OIDC i fase 1.1.

---

## Deploy (Hetzner)

| Service | Domæne | Port |
|---------|--------|------|
| Admin SPA | `eck.eira-systems.eu` | 443 (Caddy/nginx) |
| API | `api.eck.eira-systems.eu` eller path `/api` | 3000 |
| Proxy | `*.fp.eira-systems.eu` | 443 Envoy |

---

*Implementering: `apps/admin` + tenant module i API — efter commit 2.*
